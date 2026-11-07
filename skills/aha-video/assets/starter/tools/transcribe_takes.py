"""Step 4a: transcribe the real recordings (voice notes, phone recordings) so they can replace the AI voice.

Put the files in footage/voice_raw/ (m4a, aac, opus, ogg, mp3, wav, mov or mp4 all work; WhatsApp voice notes are fine).
Writes footage/voice_raw/transcripts.json and prints what each one says, so you can match takes to script lines:
in script.json give the line "take": "voice_raw/<file name>".
Run: .venv/bin/python tools/transcribe_takes.py
"""
import json
import os
import subprocess
from pathlib import Path

import librosa
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "footage" / "voice_raw"
FP = ROOT / "node_modules/@remotion/compositor-darwin-arm64"
ENV = {**os.environ, "DYLD_LIBRARY_PATH": str(FP)}
EXT = {".m4a", ".aac", ".opus", ".ogg", ".mp3", ".wav", ".mov", ".mp4", ".caf"}
model = WhisperModel("small", device="cpu", compute_type="int8")
out = {}
for f in sorted(p for p in RAW.iterdir() if p.suffix.lower() in EXT and not p.name.startswith("_")):
    wav = RAW / f"_{f.stem}.wav"
    subprocess.run([str(FP / "ffmpeg"), "-v", "error", "-y", "-i", str(f), "-ac", "1", "-ar", "48000", str(wav)], check=True, env=ENV)
    y, _ = librosa.load(wav, sr=16000)
    segs, _ = model.transcribe(y, word_timestamps=True, language="en", initial_prompt="Aha, Milo, therapy.")
    words = [{"text": w.word.strip(), "start": round(float(w.start), 3), "end": round(float(w.end), 3)} for s in segs for w in s.words]
    out[f.name] = {"wav": wav.name, "duration": round(len(y) / 16000, 2), "text": " ".join(w["text"] for w in words), "words": words}
    print(f"{f.name:42} {out[f.name]['duration']:5.1f}s  {out[f.name]['text']}")
(RAW / "transcripts.json").write_text(json.dumps(out, indent=1))
