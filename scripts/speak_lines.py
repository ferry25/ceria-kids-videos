"""Clearest vocal option: each lyric line SPOKEN naturally by the Piper Indonesian neural voice
(no vowel stretching, no pitch locking), lifted slightly to a child-like register with
ffmpeg rubberband, and placed at the start of its line in the song timeline.

Usage: python3 scripts/speak_lines.py src/<slug>/song.json public/<slug>_vocal.wav
Needs: pip install piper-tts numpy scipy ; ffmpeg with rubberband ;
Piper voice in $PIPER_VOICE_DIR (see scripts/sing.py).
"""
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
from scipy.signal import resample_poly

SR = 44100
PITCH = 1.22  # ~ +3.5 semitones: brighter, child-like, still natural
PIPER_DIR = os.environ.get("PIPER_VOICE_DIR", "/home/claude/voices/piper-id/vits-piper-id_ID-news_tts-medium")


def main():
    from piper import PiperVoice, SynthesisConfig

    onnx = os.path.join(PIPER_DIR, "id_ID-news_tts-medium.onnx")
    voice = PiperVoice.load(onnx, config_path=onnx + ".json")
    song = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    total = song["durationInFrames"] / song["fps"]
    buf = np.zeros(int(total * SR) + SR)
    room = song["lineSec"] - 0.25
    for li, line in enumerate(song["lines"]):
        text = "".join(line["syll"]).strip()
        with tempfile.TemporaryDirectory() as d:
            raw, shifted = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
            length = 1.15
            for _ in range(6):
                with wave.open(raw, "wb") as w:
                    voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=length, noise_scale=0.5, noise_w_scale=0.6))
                with wave.open(raw) as w:
                    dur = w.getnframes() / w.getframerate()
                if dur <= room + 0.3:  # leading/trailing silence is trimmed below
                    break
                length *= 0.92
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", f"rubberband=pitch={PITCH}:formant=shifted:transients=crisp", "-ar", str(SR), shifted],
                check=True,
            )
            with wave.open(shifted) as w:
                sr = w.getframerate()
                ch = w.getnchannels()
                x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
                if ch > 1:
                    x = x.reshape(-1, ch).mean(axis=1)
        if sr != SR:
            x = resample_poly(x, SR, sr)
        idx = np.where(np.abs(x) > 0.02 * np.max(np.abs(x)))[0]
        x = x[max(0, idx[0] - 300): idx[-1] + 2000]
        x = x[: int(room * SR)]
        fade = int(0.03 * SR)
        x[-fade:] *= np.linspace(1, 0, fade)
        i = int((song["songStart"] + li * song["lineSec"]) * SR)
        buf[i: i + len(x)] += x
        print(f"line {li}: {len(x) / SR:.2f}s (length_scale {length:.2f})")
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
