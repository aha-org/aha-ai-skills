"""Step 3b: the music's beat grid, so every voice line and every cut can land on a beat.

Reads "music" from script.json (from "musicOffset" seconds), writes public/music.wav (-16 LUFS) and public/beats.json
(every beat, the tempo, and where the track goes full: the drop).
Run: .venv/bin/python tools/beats.py
"""
import json
import os
import subprocess
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FP = ROOT / "node_modules/@remotion/compositor-darwin-arm64"
ENV = {**os.environ, "DYLD_LIBRARY_PATH": str(FP)}
script = json.loads((ROOT / "script.json").read_text())
src = ROOT / script["music"]
off = float(script.get("musicOffset", 0))
(ROOT / "public").mkdir(exist_ok=True)
subprocess.run([str(FP / "ffmpeg"), "-v", "error", "-y", "-ss", str(off), "-i", str(src), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                "-ar", "48000", "-ac", "2", str(ROOT / "public/music.wav")], check=True, env=ENV)

y, sr = librosa.load(ROOT / "public/music.wav", sr=22050, mono=True)
hop = 256
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
tempo, frames = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop)
beats = librosa.frames_to_time(frames, sr=sr, hop_length=hop)
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
t = librosa.times_like(rms, sr=sr, hop_length=hop)
db = 20 * np.log10(rms + 1e-9)
body = np.median(db[t > t[-1] * 0.4])
drop = float(t[np.argmax(db > body - 3)])
drop = float(min(beats, key=lambda b: abs(b - drop))) if len(beats) else drop
out = {"bpm": round(float(np.atleast_1d(tempo)[0]), 2), "beats": [round(float(b), 3) for b in beats], "drop": round(drop, 3), "duration": round(len(y) / sr, 2)}
(ROOT / "public/beats.json").write_text(json.dumps(out))
print(f"{out['bpm']} bpm, {len(beats)} beats, the track goes full at {drop:.2f}s")
