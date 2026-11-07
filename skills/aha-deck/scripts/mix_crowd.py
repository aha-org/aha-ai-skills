# Mixes v0..v17.wav (from make_crowd_voices.sh) into a 24 s seamless crowd loop. Usage: python3 -I mix_crowd.py <dir> <out.wav>
import sys, wave, array, random, math
C = sys.argv[1]; random.seed(7)
SR = 22050; N = SR * 24
buf = [0.0] * N
def load(p):
    w = wave.open(p); a = array.array('h', w.readframes(w.getnframes())); return [s / 32768 for s in a]
def lowpass(x, cut):
    k = 1 - math.exp(-2 * math.pi * cut / SR); y = 0.0; out = []
    for s in x: y += k * (s - y); out.append(y)
    return out
for i in range(18):
    v = load(f'{C}/v{i}.wav')
    far = i % 3 != 0                      # two thirds of the room is further away: duller and quieter
    src = lowpass(v, 1400 if far else 3800)
    for rep in range(2):
        off = random.randrange(N); g = (0.16 if far else 0.32) * random.uniform(0.7, 1.15)
        for j, s in enumerate(src): buf[(off + j) % N] += s * g
# a little room: a few short echoes, wrapped so the loop stays seamless
dry = buf[:]
for d, g in ((int(SR * .031), .22), (int(SR * .053), .16), (int(SR * .087), .11), (int(SR * .131), .07)):
    for j in range(N): buf[j] += dry[(j - d) % N] * g
peak = max(abs(s) for s in buf); norm = 0.5 / peak
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(array.array('h', (int(max(-1, min(1, s * norm)) * 32767) for s in buf)).tobytes()); w.close()
print('peak', peak)
