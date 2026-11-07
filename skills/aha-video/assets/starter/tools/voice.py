"""Step 3a: placeholder AI voice + word timings for every line in script.json.

Each line is its own file so the edit can place it on a beat. Lines that already have a real recording
("take") are skipped; tools/real_voice.py makes those.
Free Microsoft voices via edge-tts (needs internet). Change "voice" in script.json, e.g. en-IN-NeerjaExpressiveNeural,
en-IN-PrabhatNeural, en-US-AvaMultilingualNeural, en-GB-SoniaNeural.
Run: .venv/bin/python tools/voice.py
"""
import asyncio
import json
import os
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "vo"
FP = ROOT / "node_modules/@remotion/compositor-darwin-arm64"  # the ffmpeg that ships with Remotion
ENV = {**os.environ, "DYLD_LIBRARY_PATH": str(FP)}


async def make_line(line, voice, rate):
    comm = edge_tts.Communicate(line["text"], voice, rate=line.get("rate", rate), boundary="WordBoundary")
    audio, words = bytearray(), []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":  # offsets are in 100 ns ticks
            words.append({"text": chunk["text"], "start": chunk["offset"] / 1e7, "end": (chunk["offset"] + chunk["duration"]) / 1e7})
    mp3 = OUT / f"{line['id']}.mp3"
    mp3.write_bytes(audio)
    subprocess.run([str(FP / "ffmpeg"), "-v", "error", "-y", "-i", str(mp3), "-af", "loudnorm=I=-16:TP=-1.5:LRA=7",
                    "-ar", "48000", "-c:a", "pcm_s16le", str(mp3.with_suffix(".wav"))], check=True, env=ENV)
    mp3.unlink()
    return {"id": line["id"], "text": line["text"], "words": words}


async def main():
    script = json.loads((ROOT / "script.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    old = {}
    if (OUT / "words.json").exists():
        old = {l["id"]: l for l in json.loads((OUT / "words.json").read_text())}
    out = []
    for l in script["lines"]:
        if l.get("take") and l["id"] in old:
            out.append(old[l["id"]])  # keep the real voice
            continue
        r = await make_line(l, script["voice"], script["rate"])
        out.append(r)
        print(f"{r['id']:10} {r['words'][-1]['end']:5.2f}s  AI")
    (OUT / "words.json").write_text(json.dumps(out, indent=1))


asyncio.run(main())
