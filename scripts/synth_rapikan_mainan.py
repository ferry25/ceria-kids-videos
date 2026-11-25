"""Original kids-song instrumental + SFX for the tidy-up-toys short (rapikan mainan)."""
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
rng = np.random.default_rng(53)
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




def rumble(at, dur=0.9):
    """Funny tummy rumble."""
    t = tt(dur)
    f = 70 + 25 * np.sin(2 * np.pi * 3 * t) + 15 * np.sin(2 * np.pi * 7.3 * t)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    s = np.tanh(3 * s) * np.sin(np.pi * t / dur) ** 1.2
    add(at, s, 0.22)


def boing(at, f0=260):
    d = 0.35
    t = tt(d)
    f = f0 * (1 + 0.9 * np.exp(-t / 0.05)) * (1 + 0.08 * np.sin(2 * np.pi * 14 * t))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
    add(at, s, 0.16)


def water(start, end):
    d = end - start
    t = tt(d)
    n = noise(d)
    n = np.convolve(n, np.ones(5) / 5, mode="same")
    n = hp(n, 12)
    gurgle = 0.6 + 0.4 * np.sin(2 * np.pi * 11 * t + 2 * np.sin(2 * np.pi * 1.3 * t))
    env = np.minimum(t / 0.15, 1) * np.minimum((d - t) / 0.2, 1)
    add(start, n * gurgle * env, 0.05)


def blub(at, f0=500):
    d = 0.09
    t = tt(d)
    f = f0 * (1 + 1.2 * t / d)
    add(at, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d), 0.08)

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
        add(at, bell(hz(m), 1.4 if last_of_song else 0.9), 0.1)
        add(at, lead(hz(m), dur), 0.02)
        cum += rhythm[j]

QUAL = {0: [0, 4, 7], 1: [0, 3, 7]}
for b, (root, q) in enumerate(song["chords"]):
    at = S0 + b * BAR
    line = b // 2
    # bass on 1, bouncy root-fifth on 3
    add(at, tri(hz(root - 12), BEAT * 0.95), 0.32)
    add(at + 2 * BEAT, tri(hz(root - 5), BEAT * 0.8), 0.22)
    for e in (2, 3, 4, 5):
        for k, iv in enumerate(QUAL[q]):
            add(at + e * E + k * 0.01, pluck(hz(root + 12 + iv), 0.3), 0.1 if e % 2 else 0.13)
    if line >= 1:
        add(at, kick(), 0.4)
        add(at + 2 * BEAT, kick(), 0.25)
        for e in range(6):
            add(at + e * E, shaker(), 0.05 if e % 2 else 0.03)


end_at = S0 + 4 * song["lineSec"]
add(end_at, tri(hz(41), 1.6), 0.3)
add(end_at, kick(), 0.4)
for k, m in enumerate([65, 69, 72, 77]):
    add(end_at + k * 0.03, pluck(hz(m), 1.5, 0.3), 0.1)


# ---------------- sfx ----------------
def clatter(at):
    """Toys tumbling: a few woody knocks."""
    for k in range(5):
        t = tt(0.08)
        f = 600 + 250 * ((k * 7) % 3)
        add(at + k * 0.07 + 0.01 * (k % 2), np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02), 0.12)
        add(at + k * 0.07, hp(noise(0.03), 3) * np.exp(-tt(0.03) / 0.008), 0.05)


def ouch(at):
    """Cartoon 'step on a block' squeak."""
    d = 0.3
    t = tt(d)
    f = 1200 * (1 - 0.5 * t / d)
    add(at, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d), 0.08)


def swoosh(at, d=0.25):
    t = tt(d)
    n = hp(noise(d), 3) * np.sin(np.pi * t / d) ** 2
    add(at, n, 0.06)


sob(0.9)
sob(2.4)
s2 = song["scenes"][1] / fps
for k in range(3):
    boing(s2 + 0.2 + k * 0.6, 250 + 50 * (k % 2))
clatter(s2 + 0.5)
clatter(s2 + 1.6)
giggle(s2 + 1.0, 950)
ouch(s2 + 2.3)
for f in song["popFrames"]:
    swoosh(f / fps - 0.2)
    pop(f / fps)
s4 = song["scenes"][3] / fps
sparkle(s4)
party_horn(s4 + 0.9)
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
