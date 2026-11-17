"""Original kids-song instrumental + SFX for the tooth-brushing short."""
import json
import sys
import wave

import numpy as np

song = json.load(open(sys.argv[1]))
out = sys.argv[2]
SR = 44100
fps = song["fps"]
total = song["durationInFrames"] / fps
buf = np.zeros(int(total * SR) + SR * 2)
rng = np.random.default_rng(3)
E = song["eighth"]
BEAT = 2 * E
BAR = 3 * BEAT
S0 = song["songStart"]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def add(at, sig, gain=1.0):
    i = int(at * SR)
    if i < 0:
        sig = sig[-i:]
        i = 0
    n = min(len(sig), len(buf) - i)
    buf[i:i + n] += gain * sig[:n]


def bell(f, dur=0.9):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.45)
    s += 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.2)
    s += 0.18 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.08)
    return s * np.minimum(t / 0.003, 1)


def lead(f, dur):
    """Soft 'singing' lead: pulse wave with vibrato, filtered."""
    t = tt(dur)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.2, 0, 1)
    ph = np.cumsum(f * vib) / SR
    s = np.where(ph % 1 < 0.4, 1.0, -1.0)
    s = np.convolve(s, np.ones(6) / 6, mode="same")
    env = np.minimum(t / 0.02, 1) * (0.7 + 0.3 * np.exp(-t / 0.1))
    rel = int(0.05 * SR)
    env[-rel:] *= np.linspace(1, 0, rel)
    return s * env


def pluck(f, dur=0.6, bright=0.15):
    n = int(dur * SR)
    N = max(2, int(SR / f))
    prev = rng.uniform(-1, 1, N)
    prev = bright * prev + (1 - bright) * np.convolve(prev, np.ones(4) / 4, mode="same")
    chunks = []
    total_n = 0
    while total_n < n:
        chunks.append(prev)
        total_n += N
        prev = 0.996 * 0.5 * (prev + np.concatenate([[prev[-1]], prev[:-1]]))
    s = np.concatenate(chunks)[:n]
    s = np.convolve(s, np.ones(10) / 10, mode="same")
    t = np.arange(n) / SR
    return s * np.linspace(1, 0.6, n) * np.minimum(t / 0.004, 1)


def tri(f, dur):
    t = tt(dur)
    ph = (f * t) % 1
    return (4 * np.abs(ph - 0.5) - 1) * np.exp(-t / 0.35) * np.minimum(t / 0.005, 1)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def hp(x, k=8):
    return x - np.convolve(x, np.ones(k) / k, mode="same")


def shaker(dur=0.06):
    t = tt(dur)
    return hp(noise(dur), 4) * np.exp(-t / 0.015)


def kick():
    t = tt(0.25)
    f = 110 * np.exp(-t / 0.04) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)


def sob(at):
    for k, (f0, d) in enumerate([(520, 0.16), (470, 0.16), (380, 0.32)]):
        t = tt(d)
        f = f0 * (1 - 0.15 * t / d) * (1 + 0.03 * np.sin(2 * np.pi * 9 * t))
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        env = np.sin(np.pi * np.arange(len(t)) / len(t)) ** 1.5
        add(at + k * 0.19, s * env, 0.12)


def giggle(at, base=900):
    for k in range(5):
        d = 0.06
        t = tt(d)
        f = base * (1 + 0.25 * (k % 2)) * (1 + 0.6 * t / d)
        add(at + k * 0.075, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d), 0.09)


def party_horn(at):
    d = 0.5
    t = tt(d)
    f = 300 + 500 * np.clip(t / 0.15, 0, 1) + 20 * np.sin(2 * np.pi * 18 * t)
    ph = np.cumsum(f) / SR
    s = 2 * (ph % 1) - 1
    s = np.convolve(s, np.ones(5) / 5, mode="same")
    add(at, s * np.minimum(t / 0.02, 1) * np.exp(-np.maximum(t - 0.3, 0) / 0.06), 0.1)


def pop(at):
    d = 0.12
    t = tt(d)
    f = 1400 * np.exp(-t / 0.02) + 200
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03)
    add(at, s, 0.35)
    add(at, hp(noise(0.03), 3) * np.exp(-tt(0.03) / 0.006), 0.15)


def brush(start, end, rate=3.0):
    d = end - start
    t = tt(d)
    n = hp(noise(d), 3)
    mod = 0.35 + 0.65 * np.abs(np.sin(np.pi * rate * t))
    env = np.minimum(t / 0.1, 1) * np.minimum((d - t) / 0.15, 1)
    n = np.convolve(n, np.ones(3) / 3, mode="same")
    add(start, n * mod * env, 0.03)


def sparkle(at, gain=0.12):
    for k, m in enumerate([84, 88, 91, 96, 100]):
        add(at + k * 0.06, bell(hz(m), 0.6), gain)


# ---------------- music ----------------
lines = song["lines"]
rhythm = song["rhythm"]
for li, line in enumerate(lines):
    t0 = S0 + li * song["lineSec"]
    cum = 0
    for j, m in enumerate(line["notes"]):
        at = t0 + cum * E
        last_of_song = li == len(lines) - 1 and j == len(line["notes"]) - 1
        dur = rhythm[j] * E * (4 if last_of_song else 0.9)
        add(at, bell(hz(m), 1.4 if last_of_song else 0.9), 0.22)
        add(at, lead(hz(m), dur), 0.09 if li > 0 else 0.06)
        cum += rhythm[j]

QUAL = {0: [0, 4, 7], 1: [0, 3, 7]}
for b, (root, q) in enumerate(song["chords"]):
    at = S0 + b * BAR
    line = b // 2
    add(at, tri(hz(root - 12), BEAT * 0.95), 0.32)
    for beat in (1, 2):
        for k, iv in enumerate(QUAL[q]):
            add(at + beat * BEAT + k * 0.012, pluck(hz(root + 12 + iv), 0.45), 0.16)
    if line >= 1:  # drums enter with the germs
        add(at, kick(), 0.4)
        for e in range(6):
            add(at + e * E, shaker(), 0.05 if e % 2 else 0.03)

# final C chord + ring
end_at = S0 + 4 * song["lineSec"]
add(end_at, tri(hz(36), 1.6), 0.3)
add(end_at, kick(), 0.4)
for k, m in enumerate([60, 64, 67, 72]):
    add(end_at + k * 0.03, pluck(hz(m), 1.5, 0.3), 0.1)

# ---------------- sfx ----------------
for at in (0.35, 1.3, 2.35):
    sob(at)
s2 = song["scenes"][1] / fps
party_horn(s2)
for k, at in enumerate((s2 + 0.55, s2 + 1.55, s2 + 2.5)):
    giggle(at, 850 + 150 * k)
s3 = song["scenes"][2] / fps
brush(s3 + 0.1, s3 + 2.85)
for f in song["popFrames"]:
    pop(f / fps)
s4 = song["scenes"][3] / fps
sparkle(s4)
sparkle(s4 + 1.0, 0.08)
sparkle(end_at + 0.1, 0.1)

buf = buf[: int(total * SR)]
buf = np.tanh(buf * 1.1)
buf *= 0.89 / np.max(np.abs(buf))
fade = int(0.3 * SR)
buf[-fade:] *= np.linspace(1, 0, fade)
pcm = (buf * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(np.stack([pcm, pcm], axis=1).tobytes())
print("wrote", out, round(len(buf) / SR, 2), "s")
