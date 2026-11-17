"""Synthetic child-like singing voice for a song.json (no recordings of real people).

v3 (owner-approved timbre of v1 + clearer diction):
- Each lyric WORD is spoken whole by espeak-ng (voice id+f4) so syllables keep natural
  transitions, then cut into the song's syllables using phoneme timings from espeak's
  MBROLA-id1 phoneme list (scaled to the spoken audio).
- WORLD vocoder: consonant frames keep their ORIGINAL length (crisp), only the vowel of
  each syllable is stretched to fill the note; voiced frames are pitched to the melody note;
  formants raised a little so it sounds like a small child.
- Onset consonants are placed just before the beat so the vowel lands on the beat.

Usage: python3 scripts/sing.py src/<slug>/song.json public/<slug>_vocal.wav
Needs: apt-get install -y espeak-ng mbrola mbrola-id1 ; pip install pyworld numpy scipy piper-tts
Voice (natural, preferred): Piper id_ID news_tts from
https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-id_ID-news_tts-medium.tar.bz2
extracted to $PIPER_VOICE_DIR (default /home/claude/voices/piper-id/vits-piper-id_ID-news_tts-medium).
"""
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
import pyworld as pw
from scipy.signal import resample_poly

SR = 44100
FP = 5.0  # WORLD frame period (ms)
FORMANT = 1.10  # child-like but natural
CONS_GAIN = 1.5  # unvoiced consonants spliced from the original speech, a bit louder
BREATH = 0.06
MODE = os.environ.get("SING_MODE", "sing")  # "sing" = pitched to melody, "chant" = rhythmic natural speech  # minimum aperiodicity above 3 kHz (soft breathy, less buzzy)
VOICE = ["espeak-ng", "-v", "id+f4", "-s", "125", "-p", "70"]
VOWELS = {"a", "e", "E", "@", "i", "I", "o", "O", "Q", "u", "U", "V", "A", "a#"}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pho_list(word):
    out = subprocess.run(["espeak-ng", "-v", "mb-id1", "-s", "125", "-q", "--pho", word], capture_output=True, text=True, check=True).stdout
    items = []
    for ln in out.splitlines():
        parts = ln.split()
        if len(parts) >= 2:
            items.append((parts[0], float(parts[1])))
    while items and items[-1][0] == "_":
        items.pop()
    while items and items[0][0] == "_":
        items.pop(0)
    return items


PIPER_DIR = os.environ.get("PIPER_VOICE_DIR", "/home/claude/voices/piper-id/vits-piper-id_ID-news_tts-medium")
_piper = None


def _load_piper():
    global _piper
    if _piper is None:
        onnx = os.path.join(PIPER_DIR, "id_ID-news_tts-medium.onnx")
        if not os.path.exists(onnx):
            _piper = False
        else:
            from piper import PiperVoice

            _piper = PiperVoice.load(onnx, config_path=onnx + ".json")
    return _piper


def speak(word):
    """Speak one word: Piper neural Indonesian voice if installed (natural), else espeak-ng."""
    voice = _load_piper()
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        if voice:
            from piper import SynthesisConfig

            with wave.open(f.name, "wb") as w:
                voice.synthesize_wav(word, w, syn_config=SynthesisConfig(length_scale=1.15, noise_scale=0.5, noise_w_scale=0.6))
        else:
            subprocess.run(VOICE + ["-w", f.name, word], check=True)
        with wave.open(f.name) as w:
            sr = w.getframerate()
            x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    x = resample_poly(x, SR, sr)
    idx = np.where(np.abs(x) > 0.01 * np.max(np.abs(x)) * 3)[0]
    return x[max(0, idx[0] - 200): idx[-1] + 200]


def split_syllables(ph, n):
    """Split phoneme indices into n syllables (Indonesian CV(C)); returns list of (lo, hi, vowel_lo, vowel_hi)."""
    names = [p for p, _ in ph]
    vi = [i for i, p in enumerate(names) if p in VOWELS]
    while len(vi) > n:  # merge adjacent vowels (diphthong) if too many nuclei
        for k in range(len(vi) - 1):
            if vi[k + 1] == vi[k] + 1:
                vi.pop(k + 1)
                break
        else:
            vi.pop()
    if len(vi) < n:
        raise ValueError(f"cannot split {names} into {n} syllables")
    bounds = [0]
    for a, b in zip(vi, vi[1:]):
        cons = b - a - 1
        bounds.append(b - min(cons, 1))  # V.CV and VC.CV
    bounds.append(len(names))
    out = []
    for k in range(n):
        lo, hi = bounds[k], bounds[k + 1]
        v = vi[k]
        v_hi = v + 1
        while v_hi < hi and names[v_hi] in VOWELS:
            v_hi += 1
        out.append((lo, hi, v, v_hi))
    return out


MAX_CONS = 16  # frames (80 ms): consonants longer than this are time-compressed, never cut


def squeeze(frames, n):
    if len(frames) <= n:
        return frames
    return [frames[int(round(i))] for i in np.linspace(0, len(frames) - 1, n)]


def refine(a, va, vb, b, f0, sp):
    """Snap the predicted vowel span to the loudest voiced run inside the syllable."""
    b = max(b, a + 2)
    voiced = f0[a:b] > 0
    pred = voiced[max(va - a, 0): max(vb - a, va - a + 1)]
    if len(pred) and pred.mean() >= 0.8:
        return a, va, max(vb, va + 1), b
    en = np.log(sp[a:b].sum(axis=1) + 1e-12)
    best, best_score, i = None, -np.inf, 0
    while i < len(voiced):
        if voiced[i]:
            j = i
            while j < len(voiced) and voiced[j]:
                j += 1
            score = en[i:j].mean() + 0.02 * (j - i)
            if score > best_score:
                best, best_score = (i, j), score
            i = j
        else:
            i += 1
    if best is None:
        return a, va, max(vb, va + 1), b
    return a, a + best[0], a + best[1], b


def find_segments(x, f0, centers):
    """Locate each syllable's vowel from the audio itself.

    Peaks of voiced loudness near the predicted vowel centres = vowel nuclei; a vowel spans
    the frames within 7 dB of its peak. Everything between vowel k-1 and vowel k is the
    onset of syllable k (V.CV); what follows the last vowel is the word's coda.
    Returns [(a, va, vb, b)] frame indices per syllable.
    """
    n = len(f0)
    hop = int(SR * FP / 1000)
    rms = np.array([np.sqrt(np.mean(x[i * hop: i * hop + hop] ** 2) + 1e-12) for i in range(n)])
    en = 20 * np.log10(np.convolve(rms, np.ones(5) / 5, mode="same") + 1e-9)
    en_v = np.where(f0 > 0, en, -120.0)
    # rescale predicted centres to the voiced span of the word
    vf = np.where(f0 > 0)[0]
    c = np.array(centers, dtype=float)
    span0, span1 = (vf[0], vf[-1]) if len(vf) else (0, n - 1)
    if len(c) > 1 and c[-1] > c[0]:
        c = span0 + (c - c[0]) / (c[-1] - c[0]) * (span1 - span0) * 0.85 + (span1 - span0) * 0.05
    else:
        c = np.array([(span0 + span1) / 2])
    peaks, lo_lim = [], 0
    for k, ck in enumerate(c):
        hi_lim = int((ck + c[k + 1]) / 2) if k + 1 < len(c) else n
        w0, w1 = max(lo_lim, int(ck - 30)), max(min(hi_lim, int(ck + 30)), lo_lim + 1)
        pk = w0 + int(np.argmax(en_v[w0:w1]))
        peaks.append(pk)
        lo_lim = pk + 3
    spans = []
    for k, pk in enumerate(peaks):
        left = peaks[k - 1] + 1 if k else 0
        right = peaks[k + 1] - 1 if k + 1 < len(peaks) else n - 1
        thr = en_v[pk] - 7
        va = pk
        while va - 1 >= left and en_v[va - 1] > thr:
            va -= 1
        vb = pk + 1
        while vb < right and en_v[vb] > thr:
            vb += 1
        spans.append((va, vb))
    segs = []
    for k, (va, vb) in enumerate(spans):
        a = spans[k - 1][1] if k else 0
        b = vb if k + 1 < len(spans) else n
        segs.append((a, va, vb, b))
    return segs


def sing_phrase(words, notes, durs):
    """Sing a whole lyric line in one breath (legato).

    words: list of (word, n_syllables); notes/durs: per syllable.
    The line is spoken as ONE utterance (natural flow between words), cut into syllables,
    then vowels are stretched with smooth spectral interpolation (no frame repeats).
    Returns (audio, lead_seconds_before_first_beat).
    """
    text = " ".join(w for w, _ in words)
    x = speak(text)
    # predicted vowel centres from espeak phoneme timings, word by word
    centers_ms, t_ms = [], 0.0
    for w, n in words:
        ph = pho_list(w)
        edges = np.concatenate([[0], np.cumsum([d for _, d in ph])])
        for lo, hi, vlo, vhi in split_syllables(ph, n):
            centers_ms.append(t_ms + (edges[vlo] + edges[vhi]) / 2)
        t_ms += edges[-1]
    f0, t = pw.harvest(x, SR, f0_floor=70, f0_ceil=600, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, SR)
    ap = pw.d4c(x, f0, t, SR)
    nfr = len(f0)
    segs = find_segments(x, f0, [c / FP for c in centers_ms])
    leads = [len(squeeze(list(range(a, va)), MAX_CONS)) * FP / 1000 for a, va, _, _ in segs]
    pos, out_f0, out_vow = [], [], []
    for k, ((a, va, vb, b), note, dur) in enumerate(zip(segs, notes, durs)):
        onset = [float(i) for i in squeeze(list(range(a, va)), MAX_CONS)]
        coda = [float(i) for i in squeeze(list(range(vb, b)), MAX_CONS)]
        dur = dur + leads[k] - (leads[k + 1] if k + 1 < len(leads) else 0)
        n_total = max(len(onset) + len(coda) + 6, int(dur * 1000 / FP))
        n_vowel = n_total - len(onset) - len(coda)
        vb_ = max(vb, va + 2)
        # smooth stretch: hold the steady middle of the vowel, keep its natural start/end
        u = np.linspace(0, 1, n_vowel)
        warp = np.where(u < 0.15, u / 0.15 * 0.3, np.where(u > 0.85, 0.7 + (u - 0.85) / 0.15 * 0.3, 0.3 + (u - 0.15) / 0.7 * 0.4))
        v_src = va + warp * (vb_ - 1 - va)
        pos += onset + list(v_src) + coda
        out_vow += [False] * len(onset) + [True] * n_vowel + [False] * len(coda)
        tt = np.arange(n_total) * FP / 1000
        rate = 5.2 + 0.4 * np.sin(k * 1.7)
        target = hz(note) * (1 + 0.008 * np.sin(2 * np.pi * rate * tt) * np.clip((tt - 0.22) / 0.2, 0, 1))
        target *= 1 + 0.003 * np.sin(2 * np.pi * 1.3 * tt + k)
        out_f0.append(target)
    pos = np.clip(np.array(pos), 0, nfr - 1)
    lo_i = np.floor(pos).astype(int)
    hi_i = np.minimum(lo_i + 1, nfr - 1)
    fr_ = (pos - lo_i)[:, None]
    f0o = np.concatenate(out_f0)
    lf = np.convolve(np.pad(np.log(f0o), 4, mode="edge"), np.ones(9) / 9, mode="valid")
    f0o = np.exp(lf)
    near = np.round(pos).astype(int)
    if MODE == "chant":
        # natural spoken melody of the line, lifted so its average sits on the line's mean note
        src_f0 = f0[lo_i] * (1 - fr_[:, 0]) + f0[hi_i] * fr_[:, 0]
        vv = src_f0[src_f0 > 0]
        ratio = (np.exp(np.mean(np.log(f0o))) / np.exp(np.mean(np.log(vv)))) if len(vv) else 1.0
        fill = np.interp(np.arange(len(src_f0)), np.where(src_f0 > 0)[0], src_f0[src_f0 > 0]) if len(vv) else f0o
        f0o = fill * ratio
    voiced = (f0[near] > 0) | np.array(out_vow)
    # bridge tiny unvoiced gaps inside the line so it does not stutter
    v = voiced.copy()
    for i in range(1, len(v) - 3):
        if not v[i] and v[i - 1]:
            j = i
            while j < len(v) and not v[j]:
                j += 1
            if j < len(v) and j - i <= 2:
                voiced[i:j] = True
    f0o = np.where(voiced, f0o, 0.0)
    sp2 = sp[lo_i] * (1 - fr_) + sp[hi_i] * fr_
    ap2 = ap[lo_i] * (1 - fr_) + ap[hi_i] * fr_
    bins = sp2.shape[1]
    src = np.clip(np.arange(bins) / FORMANT, 0, bins - 1)
    lo_b = np.floor(src).astype(int)
    hi_b = np.minimum(lo_b + 1, bins - 1)
    frac = src - lo_b
    sp3 = sp2[:, lo_b] * (1 - frac) + sp2[:, hi_b] * frac
    hb = int(3000 / (SR / 2) * (bins - 1))
    ap2[:, hb:] = np.maximum(ap2[:, hb:], BREATH)
    y = pw.synthesize(np.ascontiguousarray(f0o), np.ascontiguousarray(sp3), np.ascontiguousarray(ap2), SR, FP)
    # splice ORIGINAL audio for unvoiced consonant frames (s, k, t, p, h, c) -> crisp diction
    hop = int(SR * FP / 1000)
    cons = np.zeros(len(y))
    orig = np.zeros(len(y))
    for i, j in enumerate(near):
        if not voiced[i]:
            seg = x[j * hop: j * hop + hop]
            orig[i * hop: i * hop + len(seg)] = seg
            cons[i * hop: i * hop + hop] = 1.0
    ramp = int(0.015 * SR)
    cons = np.convolve(cons, np.ones(ramp) / ramp, mode="same")[: len(y)]
    y = y * (1 - cons) + CONS_GAIN * orig[: len(y)] * cons
    fade = int(0.02 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    return y, leads[0]


def main():
    song = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    total = song["durationInFrames"] / song["fps"]
    buf = np.zeros(int(total * SR) + SR)
    E = song["eighth"]
    for li, line in enumerate(song["lines"]):
        t0 = song["songStart"] + li * song["lineSec"]
        starts, cum = [], 0
        for r in song["rhythm"]:
            starts.append(t0 + cum * E)
            cum += r
        words, cur = [], []
        for j, sy in enumerate(line["syll"]):
            cur.append(j)
            if sy != sy.rstrip() or sy.endswith((",", "!", "?", ".")) or j == len(line["syll"]) - 1:
                words.append(cur)
                cur = []
        wl = [("".join("".join(c for c in line["syll"][j].lower() if c.isalpha()) for j in w), len(w)) for w in words]
        n = len(line["syll"])
        durs = []
        for j in range(n):
            last = li == len(song["lines"]) - 1 and j == n - 1
            d = song["rhythm"][j] * E * (2.4 if last else 1.0)
            if j == n - 1 and not last:
                d -= 0.06  # breath only at the end of a line
            durs.append(d)
        y, lead = sing_phrase(wl, line["notes"], durs)
        i = int((starts[0] - lead) * SR)
        buf[i: i + len(y)] += y[: len(buf) - i]
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
