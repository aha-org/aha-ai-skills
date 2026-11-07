import json, sys
import librosa
from faster_whisper import WhisperModel
y, _ = librosa.load(sys.argv[1], sr=16000)
m = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "small", device="cpu", compute_type="int8")
segs, _ = m.transcribe(y, word_timestamps=True, language="en", initial_prompt="Aha, therapy, Milo."  # add names and terms the speaker uses)
out = []
for s in segs:
    out.append({"start": round(s.start,2), "end": round(s.end,2), "text": s.text.strip(),
                "words": [{"t": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3)} for w in s.words]})
    print(f"[{s.start:6.1f}-{s.end:6.1f}] {s.text.strip()}", flush=True)
json.dump(out, open(sys.argv[2], "w"), indent=1)
