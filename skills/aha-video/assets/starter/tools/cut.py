"""Cut an interview into a reel edit.

Usage:  .venv/bin/python tools/cut.py --prep   (once: audio for transcribing, public/source.mp4)
        .venv/bin/python tools/cut.py          (after writing tools/segments.json)

segments.json (source in/out, rough) -> snapped to real speech edges, long pauses squeezed,
every clip rounded to whole frames so picture and voice stay locked.
Writes public/edit.json (clips + caption words on the reel timeline) and public/voice.wav (cleaned voice).
"""
import json
import os
import re
import subprocess
from pathlib import Path

import numpy as np
import noisereduce as nr
import soundfile as sf
from pedalboard import Compressor, HighpassFilter, LowShelfFilter, PeakFilter, Pedalboard

ROOT = Path(__file__).resolve().parent.parent
FP = ROOT / "node_modules/@remotion/compositor-darwin-arm64"  # the ffmpeg that ships with Remotion
ENV = {**os.environ, "DYLD_LIBRARY_PATH": str(FP)}
FPS = 30
SR = 48000
MAX_PAUSE = 0.40  # pauses longer than this get squeezed
KEEP_PAUSE = 0.22  # ...down to this
EDGE = 0.10  # breath kept before/after each segment

import sys
src_mp4 = ROOT / "footage/source.mp4"
src_wav = ROOT / "footage/source48k.wav"
if not src_wav.exists():
    subprocess.run([str(FP / "ffmpeg"), "-v", "error", "-y", "-i", str(src_mp4), "-ac", "1", "-ar", str(SR), str(src_wav)], check=True, env=ENV)
if "--prep" in sys.argv:
    subprocess.run([str(FP / "ffmpeg"), "-v", "error", "-y", "-i", str(src_mp4), "-ac", "1", "-ar", "16000", str(ROOT / "footage/source16k.wav")], check=True, env=ENV)
    pub = ROOT / "public/source.mp4"
    if not pub.exists():
        pub.symlink_to(src_mp4)
    print("ready: now run tools/transcribe.py footage/source16k.wav footage/transcript.json")
    sys.exit(0)
y, _ = sf.read(src_wav)

# speech energy envelope
HOP = int(0.005 * SR)
WIN = int(0.025 * SR)
pad = np.pad(y, (WIN // 2, WIN // 2))
frames = np.lib.stride_tricks.sliding_window_view(pad, WIN)[::HOP]
db = 20 * np.log10(np.sqrt((frames**2).mean(1)) + 1e-9)
floor = np.percentile(db, 12)
THR = floor + 9
speech = db > THR
print(f"noise floor {floor:.1f} dB, speech threshold {THR:.1f} dB")

def idx(t):
    return int(np.clip(round(t / 0.005), 0, len(speech) - 1))

def snap_start(t):
    """walk back out of speech, then forward to the first speech frame."""
    i = idx(t)
    lo = idx(t - 0.4)
    while i > lo and speech[i]:
        i -= 1
    hi = idx(t + 0.6)
    while i < hi and not speech[i]:
        i += 1
    return i * 0.005

def snap_end(t):
    i = idx(t)
    hi = idx(t + 0.45)
    while i < hi and speech[i]:
        i += 1
    lo = idx(t - 0.6)
    while i > lo and not speech[i - 1]:
        i -= 1
    return i * 0.005

def pauses(a, b):
    """silent runs inside [a, b] longer than MAX_PAUSE"""
    out, i, n = [], idx(a), idx(b)
    while i < n:
        if not speech[i]:
            j = i
            while j < n and not speech[j]:
                j += 1
            if (j - i) * 0.005 > MAX_PAUSE:
                out.append((i * 0.005, j * 0.005))
            i = j
        else:
            i += 1
    return out

fr = lambda t: round(t * FPS) / FPS
KEEP_CAPS = {"I", "Aha", "Milo"}  # capitalised words that don't start a new caption phrase; add names and acronyms

# words: prefer the medium-model transcript
tp = ROOT / "footage/transcript_medium.json"
if not tp.exists():
    tp = ROOT / "footage/transcript.json"
words = [w for s in json.load(open(tp)) for w in s["words"]]
print("words from", tp.name)

# words whisper mishears (names, terms): tools/fixes.json, [{"from": "...", "to": "..."}]
FIX = json.load(open(ROOT / "tools/fixes.json"))

segs = json.load(open(ROOT / "tools/segments.json"))
clips, cap_words, t_cursor = [], [], 0.0
for si, s in enumerate(segs):
    # hardIn/hardOut: the edge sits right against another word, so cut exactly there
    a = s["in"] if s.get("hardIn") else snap_start(s["in"]) - EDGE
    b = s["out"] if s.get("hardOut") else snap_end(s["out"]) + EDGE
    parts, cur, seg_clips = [], a, []
    for p0, p1 in pauses(a + EDGE, b - EDGE):
        parts.append((cur, p0 + KEEP_PAUSE / 2))
        cur = p1 - KEEP_PAUSE / 2
    parts.append((cur, b))
    for pi, (p0, p1) in enumerate(parts):
        i0, i1 = fr(p0), fr(p1)
        if i1 - i0 < 2 / FPS:
            continue
        clips.append({"seg": s["id"], "segIndex": si, "part": pi, "in": round(i0, 4), "out": round(i1, 4), "start": round(t_cursor, 4)})
        seg_clips.append((i0, i1, t_cursor))
        t_cursor += i1 - i0
    # words: whisper stretches words over pauses, so a word belongs to the segment if most of
    # its kept audio is inside; its start maps to the first kept moment of it
    for w in words:
        kept = [(max(w["s"], c0), min(w["e"], c1), tl) for c0, c1, tl in seg_clips if min(w["e"], c1) > max(w["s"], c0)]
        if not kept or sum(k1 - k0 for k0, k1, _ in kept) < min(0.3 * (w["e"] - w["s"]), 0.05):
            continue
        k0, _, tl0 = kept[0]
        c0 = next(c for c in seg_clips if c[2] == tl0)[0]
        k1, _, tl1 = kept[-1][1], 0, kept[-1][2]
        c1 = next(c for c in seg_clips if c[2] == tl1)[0]
        cap_words.append({"text": w["t"], "start": round(tl0 + k0 - c0, 3), "end": round(tl1 + k1 - c1, 3), "seg": s["id"]})
    s["real"] = [round(a, 2), round(b, 2)]

# apply text fixes on the joined words of each segment
fixed = []
for sid in dict.fromkeys(w["seg"] for w in cap_words):
    ws = [w for w in cap_words if w["seg"] == sid]
    # merge whisper splits like "self" "-blame"
    merged = []
    for w in ws:
        if merged and w["text"].startswith("-"):
            merged[-1]["text"] += w["text"]
            merged[-1]["end"] = w["end"]
        else:
            merged.append(dict(w))
    text = " ".join(w["text"] for w in merged)
    for f in FIX:
        if f["from"] in text:
            # replace a run of words with new words, spreading their timing
            n_from = len(f["from"].split())
            for k in range(len(merged) - n_from + 1):
                if " ".join(w["text"] for w in merged[k : k + n_from]) == f["from"]:
                    t0, t1 = merged[k]["start"], merged[k + n_from - 1]["end"]
                    new = f["to"].split()
                    step = (t1 - t0) / len(new)
                    merged[k : k + n_from] = [{"text": t, "start": round(t0 + j * step, 3), "end": round(t0 + (j + 1) * step, 3), "seg": sid} for j, t in enumerate(new)]
                    break
    fixed += merged
cap_words = fixed

# caption phrases: short, break on punctuation / gaps / segment change
groups, g = [], []
for w in cap_words:
    starts_sentence = w["text"][:1].isupper() and w["text"].rstrip(",.?!") not in KEEP_CAPS
    if g and (starts_sentence or w["seg"] != g[-1]["seg"] or w["start"] - g[-1]["end"] > 0.35 or len(g) >= 4 or len(" ".join(x["text"] for x in g + [w])) > 22):
        groups.append(g)
        g = []
    g.append(w)
    if re.search(r"[.,?!]$", w["text"]):
        groups.append(g)
        g = []
if g:
    groups.append(g)

duration = t_cursor
edit = {"fps": FPS, "voiceDuration": round(duration, 3), "clips": clips, "groups": [[{k: w[k] for k in ("text", "start", "end")} for w in g] for g in groups], "segments": segs}
(ROOT / "public/edit.json").write_text(json.dumps(edit, indent=1))

# voice: cut with 8 ms fades at every join, clean, -16 LUFS
FADE = int(0.008 * SR)
pieces = []
for c in clips:
    seg = y[int(round(c["in"] * SR)) : int(round(c["out"] * SR))].copy()
    seg[:FADE] *= np.linspace(0, 1, FADE)
    seg[-FADE:] *= np.linspace(1, 0, FADE)
    pieces.append(seg)
voice = np.concatenate(pieces).astype(np.float32)
noise = y[~np.repeat(speech, HOP)[: len(y)]] if (~speech).any() else None
voice = nr.reduce_noise(y=voice, sr=SR, y_noise=noise[: SR * 5] if noise is not None else None, prop_decrease=0.6, stationary=True).astype(np.float32)
board = Pedalboard([HighpassFilter(80), LowShelfFilter(cutoff_frequency_hz=200, gain_db=-1.5), PeakFilter(cutoff_frequency_hz=3200, gain_db=2.0, q=0.9), Compressor(threshold_db=-22, ratio=3, attack_ms=5, release_ms=120)])
voice = board(voice, SR)
tmp = ROOT / "footage/voice_pre.wav"
sf.write(tmp, voice, SR)
subprocess.run([str(FP / "ffmpeg"), "-v", "error", "-y", "-i", str(tmp), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", str(SR), str(ROOT / "public/voice.wav")], check=True, env=ENV)

print(f"{len(clips)} clips, voice {duration:.2f}s")
for s in segs:
    print(f"  {s['id']:10} {s['real']}")
for g in groups:
    print(f"  {g[0]['start']:6.2f}  {' '.join(w['text'] for w in g)}")
