"""v9 vocal: the clear Piper neural voice of v8, now ON the melody and ON the beat.

Per lyric line:
1. Piper speaks the line SLOWER by itself (length_scale tuned) so its natural length is
   close to the musical phrase -> very little time-stretching (keeps diction clear).
2. Vowels are located in the audio (scripts/sing.py find_segments); a gentle piecewise
   time-warp puts each vowel onset exactly on its beat.
3. Pitch: every syllable is tuned to its melody note (soft "autotune"), keeping a part of the
   voice's own micro-intonation so it does not sound robotic; short glides between notes.
4. Formants raised a little (child-like, like v8). Unvoiced consonants are copied from
   the original speech so they stay crisp.

Usage: python3 scripts/sing_neural.py src/<slug>/song.json public/<slug>_vocal.wav
Needs: the same setup as scripts/speak_lines.py + scripts/sing.py (piper-tts, pyworld, espeak-ng, mbrola-id1).
"""
import json
import os
import sys
import tempfile
import wave

import numpy as np
import pyworld as pw
from scipy.signal import resample_poly

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sing  # noqa: E402  (find_segments, split_syllables, pho_list, hz)

SR = 44100
FP = 5.0
FORMANT = 1.18
KEEP_NATURAL = 0.35  # 0 = hard autotune, 1 = untouched speech intonation
PIPER_DIR = os.environ.get("PIPER_VOICE_DIR", "/home/claude/voices/piper-id/vits-piper-id_ID-news_tts-medium")


def piper_line(voice, text, target_s):
    from piper import SynthesisConfig

    length = 1.4
    best = None
    for _ in range(8):
        with tempfile.NamedTemporaryFile(suffix=".wav") as f:
            with wave.open(f.name, "wb") as w:
                voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=length, noise_scale=0.45, noise_w_scale=0.5))
            with wave.open(f.name) as w:
                sr = w.getframerate()
                x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        x = resample_poly(x, SR, sr)
        idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]
        x = x[max(0, idx[0] - 200): idx[-1] + 400]
        dur = len(x) / SR
        best = (x, length)
        if abs(dur - target_s) / target_s < 0.08:
            break
        length *= (target_s / dur) ** 0.9
        length = float(np.clip(length, 0.8, 3.0))
    return best


def line_words(line):
    words, cur = [], []
    for j, sy in enumerate(line["syll"]):
        cur.append(j)
        if sy != sy.rstrip() or sy.endswith((",", "!", "?", ".")) or j == len(line["syll"]) - 1:
            words.append(cur)
            cur = []
    return [("".join("".join(c for c in line["syll"][j].lower() if c.isalpha()) for j in w), len(w)) for w in words]


def sing_line(voice, line, beat_times, end_time):
    wl = line_words(line)
    text = " ".join(w for w, _ in wl)
    phrase = end_time - beat_times[0]
    x, length = piper_line(voice, text, phrase * 0.92)
    # predicted vowel centres (relative), then locate vowels in the audio
    centers_ms, t_ms = [], 0.0
    for w, n in wl:
        ph = sing.pho_list(w)
        edges = np.concatenate([[0], np.cumsum([d for _, d in ph])])
        for lo, hi, vlo, vhi in sing.split_syllables(ph, n):
            centers_ms.append(t_ms + (edges[vlo] + edges[vhi]) / 2)
        t_ms += edges[-1]
    f0, t = pw.harvest(x, SR, f0_floor=70, f0_ceil=600, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, SR)
    ap = pw.d4c(x, f0, t, SR)
    n = len(f0)
    segs = sing.find_segments(x, f0, [c / FP for c in centers_ms])
    # anchors: source vowel onset (frames) -> output time (frames, relative to line output start)
    lead = max(0.0, min(0.12, segs[0][1] * FP / 1000))  # speech before first vowel
    out0 = beat_times[0] - lead
    src_anchor = [0.0] + [float(va) for _, va, _, _ in segs] + [float(n - 1)]
    dst_anchor = [0.0] + [(bt - out0) * 1000 / FP for bt in beat_times] + [(end_time - out0) * 1000 / FP]
    # keep warp monotonic
    for i in range(1, len(dst_anchor)):
        dst_anchor[i] = max(dst_anchor[i], dst_anchor[i - 1] + 1)
    n_out = int(dst_anchor[-1])
    pos = np.interp(np.arange(n_out), dst_anchor, src_anchor)
    lo_i = np.floor(pos).astype(int)
    hi_i = np.minimum(lo_i + 1, n - 1)
    fr = (pos - lo_i)[:, None]
    sp2 = sp[lo_i] * (1 - fr) + sp[hi_i] * fr
    ap2 = ap[lo_i] * (1 - fr) + ap[hi_i] * fr
    src_f0 = f0[np.round(pos).astype(int)]
    voiced = src_f0 > 0
    # target notes: note k from (beat k - small anticipation) until beat k+1
    tt = np.arange(n_out) * FP / 1000 + out0
    note_hz = np.zeros(n_out)
    for k, bt in enumerate(beat_times):
        nxt = beat_times[k + 1] if k + 1 < len(beat_times) else 1e9
        note_hz[(tt >= bt - 0.04) & (tt < nxt - 0.04)] = sing.hz(line["notes"][k])
    note_hz[tt < beat_times[0] - 0.04] = sing.hz(line["notes"][0])
    lf = np.log(note_hz)
    lf = np.convolve(np.pad(lf, 5, mode="edge"), np.ones(11) / 11, mode="valid")  # ~50 ms glides
    # natural micro-intonation: deviation of speech f0 from its own slow contour
    vf = np.where(voiced, src_f0, np.nan)
    idx = np.arange(n_out)
    filled = np.interp(idx, idx[voiced], vf[voiced]) if voiced.any() else np.ones(n_out)
    slow = np.exp(np.convolve(np.pad(np.log(filled), 15, mode="edge"), np.ones(31) / 31, mode="valid"))
    micro = np.log(filled / slow) * KEEP_NATURAL
    note_start = np.full(n_out, beat_times[0])
    for bt in beat_times:
        note_start[tt >= bt - 0.04] = bt
    vib = 0.007 * np.sin(2 * np.pi * 5.3 * tt) * np.clip((tt - note_start - 0.2) / 0.2, 0, 1)
    f0o = np.where(voiced, np.exp(lf + micro + vib), 0.0)
    bins = sp2.shape[1]
    src = np.clip(np.arange(bins) / FORMANT, 0, bins - 1)
    lb = np.floor(src).astype(int)
    hb = np.minimum(lb + 1, bins - 1)
    fb = src - lb
    sp3 = sp2[:, lb] * (1 - fb) + sp2[:, hb] * fb
    y = pw.synthesize(np.ascontiguousarray(f0o), np.ascontiguousarray(sp3), np.ascontiguousarray(ap2), SR, FP)
    # crisp unvoiced consonants from the original speech
    hop = int(SR * FP / 1000)
    near = np.round(pos).astype(int)
    cons = np.zeros(len(y))
    orig = np.zeros(len(y))
    for i, j in enumerate(near):
        if not voiced[i]:
            seg = x[j * hop: j * hop + hop]
            orig[i * hop: i * hop + len(seg)] = seg
            cons[i * hop: i * hop + hop] = 1.0
    ramp = int(0.012 * SR)
    cons = np.convolve(cons, np.ones(ramp) / ramp, mode="same")[: len(y)]
    y = y * (1 - cons) + 1.3 * orig[: len(y)] * cons
    fade = int(0.03 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    stretch = phrase / (len(x) / SR)
    return y, out0, length, stretch


def main():
    from piper import PiperVoice

    onnx = os.path.join(PIPER_DIR, "id_ID-news_tts-medium.onnx")
    voice = PiperVoice.load(onnx, config_path=onnx + ".json")
    song = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    total = song["durationInFrames"] / song["fps"]
    buf = np.zeros(int(total * SR) + SR)
    E = song["eighth"]
    for li, line in enumerate(song["lines"]):
        t0 = song["songStart"] + li * song["lineSec"]
        beats, cum = [], 0
        for r in song["rhythm"]:
            beats.append(t0 + cum * E)
            cum += r
        last_line = li == len(song["lines"]) - 1
        end = beats[-1] + song["rhythm"][-1] * E * (2.2 if last_line else 0.85)
        y, out0, length, stretch = sing_line(voice, line, beats, end)
        i = int(out0 * SR)
        buf[i: i + len(y)] += y[: len(buf) - i]
        print(f"line {li}: length_scale {length:.2f}, time-stretch x{stretch:.2f}")
    buf = buf[: int(total * SR)]
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
