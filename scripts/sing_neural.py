"""Child-like singing vocal from the clear Piper neural voice, locked to the music.

v10 (owner feedback: v9 not in sync, sounded like talking):
- Piper speaks each lyric line and reports its OWN phoneme timings (exact, per sample).
- The line is rebuilt as a song: onset consonants sit just before the beat, the vowel
  starts ON the beat and is held until the next syllable's consonant, the melody note
  changes exactly at each syllable, and speech pauses (commas, spaces) are removed.
- Pitch: each syllable tuned to its note, short glides, a little of the voice's own
  micro-intonation + gentle vibrato on long notes (less robotic).
- Formants raised a little (child-like). Unvoiced consonants copied from the original
  speech so they stay crisp.

Usage: python3 scripts/sing_neural.py src/<slug>/song.json public/<slug>_vocal.wav
Needs: pip install piper-tts onnx pyworld scipy numpy ; Piper Indonesian voice in
$PIPER_VOICE_DIR (see RUNBOOK).
"""
import json
import os
import sys
import wave

import numpy as np
import pyworld as pw
from scipy.signal import resample_poly

SR = 44100
FP = 5.0
FPS = 1000 / FP
FORMANT = 1.18
KEEP_NATURAL = 0.25  # 0 = hard autotune, 1 = untouched speech intonation
LENGTH_SCALE = 1.35  # Piper speaking speed (>1 slower = clearer, less stretching)
PIPER_DIR = os.environ.get("PIPER_VOICE_DIR", "/home/claude/voices/piper-id/vits-piper-id_ID-news_tts-medium")

IPA_VOWELS = set("aeiouəɛɔɪʊæɑɐʌɨ")
SKIP = {"ˈ", "ˌ", "ː"}
PAUSE = {"^", "$", ",", " ", ".", "!", "?", ";", ":", "_"}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def line_words(line):
    words, cur = [], []
    for j, sy in enumerate(line["syll"]):
        cur.append(j)
        if sy != sy.rstrip() or sy.endswith((",", "!", "?", ".")) or j == len(line["syll"]) - 1:
            words.append(cur)
            cur = []
    return [("".join("".join(c for c in line["syll"][j].lower() if c.isalpha()) for j in w), len(w)) for w in words]


def piper_aligned(voice, text):
    """Speak text; return (audio@SR, [(phoneme, start_s, end_s)]) from Piper's own alignments."""
    from piper import SynthesisConfig

    audio, phones, t, sr = [], [], 0.0, 22050
    cfg = SynthesisConfig(length_scale=LENGTH_SCALE, noise_scale=0.45, noise_w_scale=0.5)
    for ch in voice.synthesize(text, cfg, include_alignments=True):
        sr = ch.sample_rate
        audio.append(ch.audio_int16_array.astype(np.float64) / 32768)
        if not ch.phoneme_alignments:
            raise RuntimeError("Piper returned no phoneme alignments (pip install onnx)")
        for al in ch.phoneme_alignments:
            d = float(al.num_samples) / sr
            phones.append((al.phoneme, t, t + d))
            t += d
    x = resample_poly(np.concatenate(audio), SR, sr)
    merged, carry = [], None
    for p, a, b in phones:  # stress marks give their time to the next phoneme
        if p in SKIP:
            carry = a if carry is None else carry
            continue
        start = carry if carry is not None else a
        carry = None
        # affricates c = t+ʃ, j = d+ʒ are ONE consonant in Indonesian
        if merged and ((merged[-1][0] == "t" and p == "ʃ") or (merged[-1][0] == "d" and p == "ʒ")):
            q, a0, _ = merged.pop()
            merged.append((q + p, a0, b))
            continue
        merged.append((p, start, b))
    return x, merged


def syllabify_line(phones, words):
    """Aligned phonemes -> syllables (V.CV / VC.CV). Each: onset [(a,b)], vowel (a,b), coda [(a,b)]."""
    groups, cur = [], []
    for p, a, b in phones:
        if p in PAUSE:
            if cur:
                groups.append(cur)
                cur = []
        else:
            cur.append((p, a, b))
    if cur:
        groups.append(cur)
    if len(groups) != len(words):
        raise ValueError(f"word count mismatch: {len(groups)} spoken vs {len(words)} lyric words")
    out = []
    for g, (w, n) in zip(groups, words):
        names = [p for p, _, _ in g]
        vi = [i for i, p in enumerate(names) if p[0] in IPA_VOWELS]
        while len(vi) > n:
            for k in range(len(vi) - 1):
                if vi[k + 1] == vi[k] + 1:
                    vi.pop(k + 1)
                    break
            else:
                vi.pop()
        if len(vi) != n:
            raise ValueError(f"cannot split {w}: {names} into {n} syllables")
        bounds = [0] + [b - min(b - a - 1, 1) for a, b in zip(vi, vi[1:])] + [len(g)]
        for k in range(n):
            lo, hi, v = bounds[k], bounds[k + 1], vi[k]
            v_end = v + 1
            while v_end < hi and names[v_end][0] in IPA_VOWELS:
                v_end += 1
            out.append({
                "text": "".join(names[lo:hi]),
                "onset": [(a, b) for _, a, b in g[lo:v]],
                "vowel": (g[v][1], g[v_end - 1][2]),
                "coda": [(a, b) for _, a, b in g[v_end:hi]],
            })
    return out


def _frames(a, b, cap, n):
    fa = int(round(a * FPS))
    fb = max(int(round(b * FPS)), fa + 1)
    fr = list(range(fa, min(fb, n)))
    if len(fr) > cap:  # compress long consonants, never cut them
        fr = [fr[int(round(i))] for i in np.linspace(0, len(fr) - 1, cap)]
    return fr


def refine_plan(x, f0, sylls, n):
    """Piper's alignment gives approximate vowel positions; snap each vowel to the loudest
    voiced run near it in the real audio, and build onsets from the (non-silent) frames
    between vowels. Returns [(onset_frames, (va, vb), coda_frames)]."""
    hop = int(SR * FP / 1000)
    rms = np.array([np.sqrt(np.mean(x[i * hop: i * hop + hop] ** 2) + 1e-12) for i in range(n)])
    en = 20 * np.log10(np.convolve(rms, np.ones(3) / 3, mode="same") + 1e-9)
    silent = en < en.max() - 38
    en_v = np.where(f0 > 0, en, -120.0)
    centers = [((sy["vowel"][0] + sy["vowel"][1]) / 2) * FPS for sy in sylls]
    spans, prev_peak = [], -1
    for k, c in enumerate(centers):
        lo = int((centers[k - 1] + c) / 2) if k else 0
        hi = int((c + centers[k + 1]) / 2) if k + 1 < len(centers) else n
        lo = max(lo, prev_peak + 2, int(c - 24))
        hi = max(min(hi, int(c + 24)), lo + 1)
        pk = lo + int(np.argmax(en_v[lo:hi]))
        thr = en_v[pk] - 7
        va = pk
        while va - 1 > max(prev_peak, 0) and en_v[va - 1] > thr:
            va -= 1
        vb = pk + 1
        while vb < hi and en_v[vb] > thr:
            vb += 1
        spans.append((va, max(vb, va + 2)))
        prev_peak = pk
    plan = []
    for k, (va, vb) in enumerate(spans):
        start = spans[k - 1][1] if k else int(sylls[0]["onset"][0][0] * FPS) if sylls[0]["onset"] else va
        on = [f for f in range(start, va) if not silent[f]]
        if len(on) > 20:  # long consonant clusters: compress, never cut
            on = [on[int(round(i))] for i in np.linspace(0, len(on) - 1, 20)]
        co = []
        if k == len(spans) - 1:
            end = int(sylls[-1]["coda"][-1][1] * FPS) if sylls[-1]["coda"] else vb
            co = [f for f in range(vb, min(end, n)) if not silent[f]][:16]
        plan.append((on, (va, vb), co))
    return plan


def sing_line(voice, line, beat_times, end_time):
    wl = line_words(line)
    x, phones = piper_aligned(voice, " ".join(w for w, _ in wl))
    sylls = syllabify_line(phones, wl)
    f0, t = pw.harvest(x, SR, f0_floor=70, f0_ceil=600, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, SR)
    ap = pw.d4c(x, f0, t, SR)
    n = len(f0)
    plan = refine_plan(x, f0, sylls, n)
    lead = len(plan[0][0]) / FPS
    out0 = beat_times[0] - lead
    pos, note_of, is_vowel = [], [], []
    for k, (on, (va, vb), co) in enumerate(plan):
        nxt_on = len(plan[k + 1][0]) if k + 1 < len(plan) else 0
        seg_end = beat_times[k + 1] if k + 1 < len(plan) else end_time
        span = int(round((seg_end - beat_times[k]) * FPS)) - nxt_on  # beat_k .. next onset
        n_vowel = max(6, span - len(co))
        u = np.linspace(0, 1, n_vowel)
        # natural attack and release of the vowel, smooth hold of its steady middle
        warp = np.where(u < 0.12, u / 0.12 * 0.25, np.where(u > 0.9, 0.75 + (u - 0.9) / 0.1 * 0.25, 0.25 + (u - 0.12) / 0.78 * 0.5))
        vsrc = va + warp * (vb - 1 - va)
        pos += [float(f) for f in on] + list(vsrc) + [float(f) for f in co]
        note_of += [k] * (len(on) + n_vowel + len(co))
        is_vowel += [False] * len(on) + [True] * n_vowel + [False] * len(co)
    pos = np.clip(np.array(pos), 0, n - 1)
    note_of = np.array(note_of)
    is_vowel = np.array(is_vowel)
    lo_i = np.floor(pos).astype(int)
    hi_i = np.minimum(lo_i + 1, n - 1)
    fr = (pos - lo_i)[:, None]
    sp2 = sp[lo_i] * (1 - fr) + sp[hi_i] * fr
    ap2 = ap[lo_i] * (1 - fr) + ap[hi_i] * fr
    near = np.round(pos).astype(int)
    src_f0 = f0[near]
    voiced = (src_f0 > 0) | is_vowel
    lf = np.log(np.array([hz(line["notes"][k]) for k in note_of]))
    lf = np.convolve(np.pad(lf, 4, mode="edge"), np.ones(9) / 9, mode="valid")  # ~40 ms glides
    idx = np.arange(len(pos))
    ok = src_f0 > 0
    filled = np.interp(idx, idx[ok], src_f0[ok]) if ok.any() else np.ones(len(pos))
    slow = np.exp(np.convolve(np.pad(np.log(filled), 15, mode="edge"), np.ones(31) / 31, mode="valid"))
    micro = np.log(filled / slow) * KEEP_NATURAL
    tt = idx / FPS
    starts = np.r_[0, np.where(np.diff(note_of) != 0)[0] + 1]
    since = tt - tt[starts[np.searchsorted(starts, idx, side="right") - 1]]
    vib = 0.007 * np.sin(2 * np.pi * 5.3 * tt) * np.clip((since - 0.25) / 0.2, 0, 1)
    f0o = np.where(voiced, np.exp(lf + micro + vib), 0.0)
    bins = sp2.shape[1]
    src = np.clip(np.arange(bins) / FORMANT, 0, bins - 1)
    lb = np.floor(src).astype(int)
    hb = np.minimum(lb + 1, bins - 1)
    fb = src - lb
    sp3 = sp2[:, lb] * (1 - fb) + sp2[:, hb] * fb
    y = pw.synthesize(np.ascontiguousarray(f0o), np.ascontiguousarray(sp3), np.ascontiguousarray(ap2), SR, FP)
    hop = int(SR * FP / 1000)
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
    # syllable vowel onsets in absolute time (for verification)
    onsets, i = [], 0
    for k, (on, _, co) in enumerate(plan):
        onsets.append(out0 + (i + len(on)) / FPS)
        i += int((note_of == k).sum())
    return y, out0, [s["text"] for s in sylls], onsets


def main():
    from piper import PiperVoice

    onnx = os.path.join(PIPER_DIR, "id_ID-news_tts-medium.onnx")
    voice = PiperVoice.load(onnx, config_path=onnx + ".json", include_alignments=True)
    song = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    total = song["durationInFrames"] / song["fps"]
    buf = np.zeros(int(total * SR) + SR)
    E = song["eighth"]
    worst = 0.0
    for li, line in enumerate(song["lines"]):
        t0 = song["songStart"] + li * song["lineSec"]
        beats, cum = [], 0
        for r in song["rhythm"]:
            beats.append(t0 + cum * E)
            cum += r
        last_line = li == len(song["lines"]) - 1
        end = beats[-1] + song["rhythm"][-1] * E * (2.2 if last_line else 0.85)
        y, out0, texts, onsets = sing_line(voice, line, beats, end)
        i = int(out0 * SR)
        buf[i: i + len(y)] += y[: len(buf) - i]
        err = max(abs(a - b) for a, b in zip(onsets, beats)) * 1000
        worst = max(worst, err)
        print(f"line {li}: {'-'.join(texts)} | max vowel-to-beat error {err:.0f} ms")
    buf = buf[: int(total * SR)]
    buf *= 0.9 / (np.max(np.abs(buf)) + 1e-9)
    pcm = (buf * 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.stack([pcm, pcm], axis=1).tobytes())
    print(f"wrote {out} (worst vowel-to-beat error {worst:.0f} ms)")


if __name__ == "__main__":
    main()
