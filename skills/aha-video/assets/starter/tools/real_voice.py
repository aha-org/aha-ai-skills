"""Step 4b: clean up the real people's recordings and put them in place of the AI voice.

For every line in script.json with a `take`:
  trim dead air -> light noise reduction -> rumble cut, a little less mud,
  a little more presence -> gentle compression -> limiter -> loudness -16 LUFS
  -> public/vo/<id>.wav
and the caption timings come from the transcript of that take (the script's
spelling, his timing). Lines without a take keep the AI placeholder.
Run after voice.py and transcribe_takes.py: .venv/bin/python tools/real_voice.py, then tools/plan.py again.
A line can also have "speed": 1.1 (pitch-safe speed-up for a take that runs long).
"""
import json
import os
import re
import subprocess
from pathlib import Path

import librosa
import noisereduce as nr
import numpy as np
import soundfile as sf
from pedalboard import Compressor, HighpassFilter, Limiter, PeakFilter, Pedalboard, time_stretch

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "footage"  # takes are given as "voice_raw/<file name>"
OUT = ROOT / "public" / "vo"
FP = ROOT / "node_modules/@remotion/compositor-darwin-arm64"  # the ffmpeg that ships with Remotion
ENV = {**os.environ, "DYLD_LIBRARY_PATH": str(FP)}
SR = 48000
LEAD, TAIL = 0.06, 0.15  # air kept before the first word and after the last

chain = Pedalboard([
    HighpassFilter(cutoff_frequency_hz=85),
    PeakFilter(cutoff_frequency_hz=300, gain_db=-2.0, q=1.0),    # less boxy
    PeakFilter(cutoff_frequency_hz=3500, gain_db=2.5, q=0.8),    # clearer words
    Compressor(threshold_db=-24, ratio=3, attack_ms=6, release_ms=90),
    Limiter(threshold_db=-2.0),
])

norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower().replace("7", "seven").replace("1", "one").replace("2", "two"))


def align(script_text, heard):
    """Script words placed on the take's timeline by position in the sentence."""
    chars, times = "", []
    for w in heard:
        n = norm(w["text"])
        for k, c in enumerate(n):
            chars += c
            times.append(w["start"] + (w["end"] - w["start"]) * k / max(1, len(n)))
    total = len(chars)
    out, pos = [], 0
    words = script_text.split()
    lens = [len(norm(w)) for w in words]
    script_total = sum(lens)
    for w, n in zip(words, lens):
        a = int(pos / script_total * total)
        b = int((pos + n) / script_total * total) - 1
        out.append({"text": w.rstrip(",.:;"), "start": times[min(a, total - 1)], "end": times[min(max(b, a), total - 1)] + 0.08})
        pos += n
    return out


def speech_edges(y, guess_on, guess_off):
    """First and last 10ms frame within 30 dB of the loudest, searched near the transcript's edges."""
    hop = int(0.01 * SR)
    db = np.array([20 * np.log10(np.sqrt(np.mean(y[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(y) - hop, hop)])
    lo = max(0, int((guess_on - 0.3) / 0.01))
    hi = min(len(db), int((guess_off + 0.35) / 0.01))
    start = np.where(db[lo:hi] > db.max() - 30)[0] + lo
    # stricter at the end so a trailing breath doesn't count as speech
    end = np.where(db[lo:hi] > db.max() - 22)[0] + lo
    return start[0] * 0.01, (end[-1] + 1) * 0.01


script = json.loads((ROOT / "script.json").read_text())
heard = {f"{d.name}/{k}": v for d in RAW.glob("voice_raw*") if (d / "transcripts.json").exists() for k, v in json.loads((d / "transcripts.json").read_text()).items()}
words = {l["id"]: l for l in json.loads((OUT / "words.json").read_text())}

for line in script["lines"]:
    take = line.get("take")
    if not take:
        continue
    tdir, tname = take.split("/", 1)
    y, _ = librosa.load(RAW / tdir / heard[take]["wav"], sr=SR, mono=True)
    h = heard[take]["words"]
    # where the voice really starts and stops (the transcript's edges run early/late)
    on, off = speech_edges(y, h[0]["start"], h[-1]["end"])
    a = max(0.0, on - LEAD)
    b = min(len(y) / SR, off + TAIL)
    y = y[int(a * SR):int(b * SR)]
    # stretch the transcript's word times onto the real edges
    w0, w1 = h[0]["start"], h[-1]["end"]
    h = [{**w, "start": on + (w["start"] - w0) / (w1 - w0) * (off - on), "end": on + (w["end"] - w0) / (w1 - w0) * (off - on)} for w in h]
    y = nr.reduce_noise(y=y, sr=SR, stationary=True, prop_decrease=0.5)
    y = chain(y.astype(np.float32), SR)
    speed = line.get("speed", 1.0)
    if speed != 1.0:  # pitch-safe speed-up for a take that runs long (e.g. the hook)
        y = time_stretch(y[None, :], SR, stretch_factor=speed)[0]
    fade = int(0.01 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    tmp = OUT / f"_{line['id']}.wav"
    sf.write(tmp, y, SR)
    subprocess.run([str(FP / "ffmpeg"), "-v", "error", "-y", "-i", str(tmp), "-af", "loudnorm=I=-16:TP=-1.5:LRA=7",
                    "-ar", "48000", "-c:a", "pcm_s16le", str(OUT / f"{line['id']}.wav")], check=True, env=ENV)
    tmp.unlink()
    shifted = [{**w, "start": (w["start"] - a) / speed, "end": (w["end"] - a) / speed} for w in h]
    ws = align(line["text"], shifted)
    # final check on the cleaned file: if speech starts later (a breath came first), slide the start in
    yy, _ = librosa.load(OUT / f"{line['id']}.wav", sr=SR)
    real_on, _ = speech_edges(yy, 0.0, len(yy) / SR - 0.6)
    if real_on - ws[0]["start"] > 0.05:
        s0, s1 = ws[0]["start"], ws[-1]["end"]
        k = (s1 - real_on) / (s1 - s0)
        ws = [{**w, "start": real_on + (w["start"] - s0) * k, "end": real_on + (w["end"] - s0) * k} for w in ws]
    words[line["id"]] = {"id": line["id"], "text": line["text"], "words": [{**w, "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in ws]}
    print(f"{line['id']:7} {b - a:5.2f}s  {take}")

order = [l["id"] for l in script["lines"]]
(OUT / "words.json").write_text(json.dumps([words[i] for i in order], indent=1))
