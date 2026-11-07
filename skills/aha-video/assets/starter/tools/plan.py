"""Step 3c: lay the whole reel on the beat grid.

Every voice line starts on a beat (with at least GAP seconds after the one before), every cut lands on a beat
(a new shot every "beatsPerShot" beats from script.json), the end card starts on a beat after the last line.
Writes public/timeline.json, which src/Narrated.tsx plays. Run again after any change to the voice or the shots.
Run: .venv/bin/python tools/plan.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
GAP = 0.25          # breathing room between lines
END_CARD = 3.4      # seconds
fr = lambda t: round(t * FPS) / FPS

script = json.loads((ROOT / "script.json").read_text())
grid = json.loads((ROOT / "public/beats.json").read_text())
beats = grid["beats"] or [i * 0.5 for i in range(600)]
words = {l["id"]: l for l in json.loads((ROOT / "public/vo/words.json").read_text())}
next_beat = lambda t: next((b for b in beats if b >= t - 1e-3), t)

vo, t, caps = [], 0.2, []
for i, line in enumerate(script["lines"]):
    w = words[line["id"]]["words"]
    b = next_beat(t)
    start = fr(b if i or b - t < 0.6 else t)  # the hook starts at once, never waits for the first beat
    dur = w[-1]["end"] + 0.15
    vo.append({"id": line["id"], "start": start, "dur": round(dur, 3)})
    for x in w:
        caps.append({"text": x["text"], "start": round(start + x["start"], 3), "end": round(start + x["end"], 3), "line": line["id"]})
    t = start + dur + GAP
end_card = fr(next_beat(t + 0.3))
duration = round(end_card + END_CARD, 3)

# cuts on every Nth beat; shots loop if there are fewer shots than cuts
n = int(script.get("beatsPerShot", 4))
cuts = [0.0] + [fr(b) for b in beats[n::n] if b < end_card] + [end_card]
shots = []
for i, (a, b) in enumerate(zip(cuts, cuts[1:])):
    if b - a < 0.4:
        continue
    s = script["shots"][i % len(script["shots"])]
    shots.append({"file": s["file"], "in": s.get("in", 0), "start": a, "end": b, "zoom": [1.0, 1.06] if i % 2 == 0 else [1.08, 1.12]})

# caption phrases: short, break on punctuation, gaps and new lines
groups, g = [], []
for c in caps:
    if g and (c["line"] != g[-1]["line"] or c["start"] - g[-1]["end"] > 0.35 or len(g) >= 4 or len(" ".join(x["text"] for x in g + [c])) > 22):
        groups.append(g); g = []
    g.append(c)
    if re.search(r"[.,?!]$", c["text"]):
        groups.append(g); g = []
if g:
    groups.append(g)
# never leave one word alone on screen: fold it into the phrase before it (same line)
merged = []
for g in groups:
    if len(g) == 1 and merged and merged[-1][-1]["line"] == g[0]["line"] and len(" ".join(x["text"] for x in merged[-1] + g)) <= 30:
        merged[-1] = merged[-1] + g
    else:
        merged.append(g)
groups = merged

out = {"fps": FPS, "duration": duration, "endCard": end_card, "vo": vo, "shots": shots, "groups": groups, "beats": beats, "bpm": grid["bpm"]}
(ROOT / "public/timeline.json").write_text(json.dumps(out, indent=1))
for v in vo:
    print(f"{v['start']:6.2f}  {v['id']:10} {v['dur']:.2f}s")
print(f"{len(shots)} shots, end card at {end_card:.2f}s, total {duration:.2f}s")
