"""Synthetic child-like singing voice for a song.json (no recordings of real people).

Each syllable is spoken by espeak-ng (Indonesian), then re-synthesised with the WORLD
vocoder: its pitch is locked to the melody note, its length stretched to the note length,
and its formants raised so it sounds like a small child. Output: mono-in-stereo WAV of the
vocal track, aligned to the same timeline as scripts/synth_*.py.

Usage: python3 scripts/sing.py src/<slug>/song.json public/<slug>_vocal.wav
Needs: apt-get install espeak-ng ; pip install pyworld numpy scipy
"""
import json
import subprocess
import sys
import tempfile
import wave

import numpy as np
import pyworld as pw
from scipy.signal import resample_poly

SR = 44100
FORMANT = 1.22  # >1 = smaller vocal tract (child)
OCTAVE = 0  # semitone shift applied to the melody for the voice


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def speak(text):
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        subprocess.run(
            ["espeak-ng", "-v", "id+f4", "-s", "140", "-p", "70", "-w", f.name, text],
            check=True,
        )
        with wave.open(f.name) as w:
            sr = w.getframerate()
            x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    x = resample_poly(x, SR, sr)
    # trim silence
    env = np.abs(x) > 0.01
    if env.any():
        idx = np.where(env)[0]
        x = x[max(0, idx[0] - 200): idx[-1] + 200]
    return x


def clean(s):
    return "".join(c for c in s.lower() if c.isalpha() or c == "-")


def sing_syllable(text, midi, dur, vib_depth=0.012):
    x = speak(text)
    f0, t = pw.harvest(x, SR, f0_floor=70, f0_ceil=600, frame_period=5.0)
    sp = pw.cheaptrick(x, f0, t, SR)
    ap = pw.d4c(x, f0, t, SR)
    n_in = len(f0)
    n_out = max(4, int(dur * 1000 / 5.0))
    voiced = np.where(f0 > 0)[0]
    # keep consonant onset as-is, stretch the voiced (vowel) part to fill the note
    on = voiced[0] if len(voiced) else 0
    on = min(on, n_out // 3)
    rest_in = np.arange(on, n_in)
    idx = np.concatenate([np.arange(on), np.interp(np.linspace(0, 1, n_out - on), np.linspace(0, 1, len(rest_in)), rest_in)])
    idx = np.clip(np.round(idx).astype(int), 0, n_in - 1)
    sp2, ap2 = sp[idx], ap[idx]
    vflag = f0[idx] > 0
    if len(voiced):
        vflag[on:] = True
    tt = np.arange(n_out) * 0.005
    vib = 1 + vib_depth * np.sin(2 * np.pi * 5.5 * tt) * np.clip((tt - 0.15) / 0.2, 0, 1)
    target = hz(midi + OCTAVE) * vib
    # small scoop into the note
    target *= 2 ** (-0.6 * np.exp(-tt / 0.03) / 12)
    f0o = np.where(vflag, target, 0.0)
    # formant shift: warp spectral envelope frequency axis
    bins = sp2.shape[1]
    src = np.clip(np.arange(bins) / FORMANT, 0, bins - 1)
    lo = np.floor(src).astype(int)
    hi = np.minimum(lo + 1, bins - 1)
    fr = src - lo
    sp3 = sp2[:, lo] * (1 - fr) + sp2[:, hi] * fr
    y = pw.synthesize(np.ascontiguousarray(f0o), np.ascontiguousarray(sp3), np.ascontiguousarray(ap2), SR, 5.0)
    n = len(y)
    fade = min(int(0.03 * SR), n // 4)
    if fade > 0:
        y[:fade] *= np.linspace(0, 1, fade)
        y[-fade:] *= np.linspace(1, 0, fade)
    return y


def main():
    song = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    total = song["durationInFrames"] / song["fps"]
    buf = np.zeros(int(total * SR) + SR)
    E = song["eighth"]
    for li, line in enumerate(song["lines"]):
        t0 = song["songStart"] + li * song["lineSec"]
        cum = 0
        for j, (syl, m) in enumerate(zip(line["syll"], line["notes"])):
            r = song["rhythm"][j]
            last = li == len(song["lines"]) - 1 and j == len(line["notes"]) - 1
            dur = r * E * (2.5 if last else 0.95)
            y = sing_syllable(clean(syl), m, dur)
            i = int((t0 + cum * E) * SR)
            buf[i: i + len(y)] += y[: len(buf) - i]
            cum += r
    buf = buf[: int(total * SR)]
    # gentle presence EQ (pre-emphasis) + normalise
    buf = np.append(buf[0], buf[1:] - 0.5 * buf[:-1])
    buf *= 0.9 / (np.max(np.abs(buf)) + 1e-9)
    pcm = (buf * 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.stack([pcm, pcm], axis=1).tobytes())
    print("wrote", out)


if __name__ == "__main__":
    main()
