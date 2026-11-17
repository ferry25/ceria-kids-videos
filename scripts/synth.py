"""Synthesize the original chiptune + mechanical clicks from src/song.json."""
import json
import sys
import wave

import numpy as np

song = json.load(open(sys.argv[1]))
out = sys.argv[2]

SR = 44100
fps = song["fps"]
step_s = song["framesPerStep"] / fps
start_s = song["startFrame"] / fps
total_s = song["durationInFrames"] / fps
buf = np.zeros(int(total_s * SR) + SR)
rng = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.004, d=0.08, s=0.55, r=0.05):
    t = np.arange(n) / SR
    e = np.minimum(t / a, 1.0)
    e = e * (s + (1 - s) * np.exp(-np.maximum(t - a, 0) / d))
    rel = int(r * SR)
    if rel < n:
        e[-rel:] *= np.linspace(1, 0, rel)
    return e


def add(at, sig):
    i = int(at * SR)
    buf[i:i + len(sig)] += sig[: max(0, len(buf) - i)]


def square(f, dur, duty=0.25, vib=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fm = f * (1 + (0.004 * np.sin(2 * np.pi * 6 * t) * np.clip(t / 0.15, 0, 1) if vib else 0))
    ph = np.cumsum(fm) / SR
    return np.where((ph % 1) < duty, 1.0, -1.0)


def triangle(f, dur):
    n = int(dur * SR)
    ph = (np.arange(n) / SR * f) % 1
    return 4 * np.abs(ph - 0.5) - 1


def click(strength=1.0):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = np.convolve(noise, np.ones(3) / 3, mode="same")
    tick = noise * np.exp(-t / 0.004)
    thunk = np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.018)
    return strength * (0.35 * tick + 0.5 * thunk)


melody = song["melody"]
scale = song["scaleMidi"]
last = len(melody) - 1
for i, k in enumerate(melody):
    if k < 0:
        continue
    at = start_s + i * step_s
    dur = step_s * (6 if i == last else 0.92)
    f = hz(scale[k])
    sig = square(f, dur) * env(int(dur * SR), r=0.25 if i == last else 0.04)
    sig += 0.25 * square(f * 2, dur, duty=0.5, vib=False) * env(int(dur * SR), d=0.03, s=0.1)
    add(at, 0.16 * sig)
    add(at, 0.5 * click())

# bass: root / fifth / octave pattern, one group per 4 steps
for g, root in enumerate(song["bassRoots"]):
    for j, iv in enumerate([0, 7, 12, 7]):
        at = start_s + (g * 4 + j) * step_s
        dur = step_s * 0.85
        add(at, 0.22 * triangle(hz(root + iv), dur) * env(int(dur * SR), d=0.12, s=0.6))
# final bass note
add(start_s + len(melody) * step_s - step_s, 0.0 * buf[:1])
end_at = start_s + last * step_s
add(end_at, 0.22 * triangle(hz(36), step_s * 5) * env(int(step_s * 5 * SR), d=0.4, s=0.3, r=0.3))

# sparkle arpeggio at the end
for j, m in enumerate([84, 88, 91, 96]):
    d = 0.18
    add(end_at + 0.12 + j * 0.07, 0.07 * square(hz(m), d, duty=0.5, vib=False) * env(int(d * SR), d=0.05, s=0.0))

# soft crank ratchet ticks during the tune
t = start_s
while t < end_at:
    add(t + step_s / 2, 0.08 * click(0.6))
    t += step_s

buf = buf[: int(total_s * SR)]
buf = np.tanh(buf * 1.2)
buf *= 0.89 / np.max(np.abs(buf))
fade = int(0.08 * SR)
buf[-fade:] *= np.linspace(1, 0, fade)
pcm = (buf * 32767).astype(np.int16)
stereo = np.stack([pcm, pcm], axis=1)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("wrote", out, len(buf) / SR, "s")
