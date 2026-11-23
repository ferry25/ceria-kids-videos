import React from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import song from "./song.json";
import { Kid, Sparkle } from "../tooth/characters";
import { Ball, Block, Moon, Pillow, Zed } from "./characters";

loadFont({ family: "Fredoka", url: staticFile("fredoka-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "Fredoka", url: staticFile("fredoka-latin-600-normal.woff2"), weight: "600" });

// ---------------- backgrounds ----------------
const FPS = song.fps;
const SC = song.scenes;
const END = song.durationInFrames;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FONT = "Fredoka, sans-serif";

const noteFrames = (line: number) => {
  const out: number[] = [];
  let cum = 0;
  for (const r of song.rhythm) {
    out.push(Math.round((song.songStart + line * song.lineSec + cum * song.eighth) * FPS));
    cum += r;
  }
  return out;
};
const BEAT_FRAMES = song.eighth * 2 * FPS; // 15
const beatPhase = (f: number) => (((f - song.songStart * FPS) % BEAT_FRAMES) + BEAT_FRAMES) % BEAT_FRAMES / BEAT_FRAMES;
const bounce = (f: number) => Math.pow(1 - beatPhase(f), 3);

const popIn = (f: number, at: number, len = 10) =>
  interpolate(f, [at, at + len], [0, 1], { ...CLAMP, easing: Easing.out(Easing.back(2.2)) });

// ---------------- backgrounds ----------------
const Sky: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#8fd3ff" />
        <stop offset="1" stopColor="#fff0f8" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#sky)" />
    <g transform={`rotate(${Math.sin(frame * 0.03) * 2} 540 1500)`}>
      {["#ff6b6b", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"].map((c, i) => (
        <path
          key={c}
          d={`M${-80 + i * 40},1500 A${620 - i * 40},${620 - i * 40} 0 0 1 ${1160 - i * 40},1500`}
          stroke={c}
          strokeWidth={40}
          fill="none"
          opacity={0.75}
        />
      ))}
    </g>
    {[
      [140, 1430, 1],
      [930, 1450, 1.2],
    ].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
        <circle cx={-60} cy={0} r={60} fill="white" />
        <circle cx={10} cy={-30} r={80} fill="white" />
        <circle cx={80} cy={10} r={55} fill="white" />
        <rect x={-120} y={0} width={260} height={60} rx={30} fill="white" />
      </g>
    ))}
    <rect x={0} y={1480} width={1080} height={440} fill="#c9f2c7" />
    <ellipse cx={540} cy={1490} rx={700} ry={80} fill="#a6e3a1" />
  </svg>
);

// ---------------- text ----------------
const Title: React.FC<{ lines: string[]; frame: number; at: number; size?: number; color?: string; top: number }> = ({
  lines,
  frame,
  at,
  size = 112,
  color = "#ffffff",
  top,
}) => (
  <div style={{ position: "absolute", top, left: 60, right: 60, textAlign: "center" }}>
    {lines.map((l, i) => (
      <div
        key={l}
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.05,
          color,
          WebkitTextStroke: `${size * 0.11}px #2d1b69`,
          paintOrder: "stroke fill",
          textShadow: "0 10px 0 #2d1b69",
          scale: String(popIn(frame, at + i * 5, 12)),
          rotate: `${Math.sin((frame + i * 9) * 0.12) * 2.5}deg`,
          letterSpacing: 1,
        }}
      >
        {l}
      </div>
    ))}
  </div>
);

const Lyrics: React.FC<{ frame: number }> = ({ frame }) => {
  let line = -1;
  for (let i = 0; i < song.lines.length; i++) if (frame >= noteFrames(i)[0] - 12) line = i;
  if (line < 0 || frame > END - 20) return null;
  const nf = noteFrames(line);
  const lineIn = popIn(frame, nf[0] - 12, 8);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        bottom: 130,
        display: "flex",
        justifyContent: "center",
        scale: String(0.85 + 0.15 * lineIn),
        opacity: lineIn,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.92)",
          borderRadius: 60,
          padding: "22px 40px 26px",
          boxShadow: "0 10px 0 rgba(45,27,105,0.35)",
          border: "6px solid #2d1b69",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: Math.min(64, Math.floor(1720 / song.lines[line].syll.join("").length)),
          whiteSpace: "pre",
          color: "#b9b2d6",
        }}
      >
        {song.lines[line].syll.map((s, j) => {
          const on = frame >= nf[j];
          const hit = interpolate(frame - nf[j], [0, 3, 9], [0, 1, 0], CLAMP);
          return (
            <span
              key={j}
              style={{
                display: "inline-block",
                color: on ? "#ff4f8b" : "#b9b2d6",
                translate: `0px ${-14 * hit}px`,
                scale: String(1 + 0.08 * hit),
              }}
            >
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const SceneIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        scale: String(interpolate(f, [0, 9], [1.15, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) })),
        opacity: interpolate(f, [0, 4], [0, 1], CLAMP),
      }}
    >
      {children}
      <AbsoluteFill style={{ background: "white", opacity: interpolate(f, [0, 6], [0.6, 0], CLAMP) }} />
    </AbsoluteFill>
  );
};

const Bedroom: React.FC<{ frame: number; night?: number; curtains?: number }> = ({ frame, night = 0, curtains = 0 }) => {
  const wallTop = night > 0.5 ? "#6a5fc9" : "#ffd9e8";
  const wallBot = night > 0.5 ? "#a89ae8" : "#fff4f8";
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="bwall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={wallTop} />
          <stop offset="1" stopColor={wallBot} />
        </linearGradient>
        <pattern id="bdots" width="120" height="120" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="8" fill="#ffffff" opacity="0.35" />
          <circle cx="90" cy="90" r="5" fill="#ffffff" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="1080" height="1920" fill="url(#bwall)" />
      <rect width="1080" height="1360" fill="url(#bdots)" />
      {/* window */}
      <rect x={600} y={520} width={380} height={330} rx={26} fill={night > 0.5 ? "#2b2470" : "#9fdcff"} stroke="#ffffff" strokeWidth={18} />
      <path d="M790,520 L790,850 M600,685 L980,685" stroke="#ffffff" strokeWidth={14} />
      {night <= 0.5 && (
        <g transform={`translate(${880 + 10 * Math.sin(frame * 0.04)},780)`}>
          <circle cx={-30} cy={0} r={28} fill="white" />
          <circle cx={10} cy={-14} r={36} fill="white" />
          <circle cx={46} cy={4} r={24} fill="white" />
        </g>
      )}
      {night > 0.5 &&
        [
          [650, 570],
          [940, 600],
          [700, 800],
          [920, 810],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x},${y}) scale(${0.7 + 0.3 * Math.sin(frame * 0.3 + i)})`}>
            <Sparkle size={16} color="#fff6a8" />
          </g>
        ))}
      {/* curtains */}
      <rect x={570} y={500} width={60 + 150 * curtains} height={380} rx={20} fill="#ff9ec4" stroke="#e46e9f" strokeWidth={6} />
      <rect x={950 - 150 * curtains} y={500} width={60 + 150 * curtains} height={380} rx={20} fill="#ff9ec4" stroke="#e46e9f" strokeWidth={6} />
      <rect x={560} y={486} width={460} height={22} rx={11} fill="#c98a4b" />
      {/* floor */}
      <rect x={0} y={1360} width={1080} height={560} fill={night > 0.5 ? "#8a6bb8" : "#e7b98a"} />
      <rect x={0} y={1360} width={1080} height={30} fill={night > 0.5 ? "#6f53a0" : "#cf9a64"} />
      <ellipse cx={540} cy={1640} rx={420} ry={110} fill={night > 0.5 ? "#a58bd6" : "#ffc6dc"} opacity={0.8} />
    </svg>
  );
};

const Bed: React.FC = () => (
  <g>
    <rect x={40} y={1060} width={60} height={420} rx={20} fill="#c98a4b" stroke="#8f5a2b" strokeWidth={6} />
    <rect x={980} y={1200} width={50} height={280} rx={18} fill="#c98a4b" stroke="#8f5a2b" strokeWidth={6} />
    <rect x={70} y={1250} width={950} height={150} rx={30} fill="#ffffff" stroke="#b49be0" strokeWidth={6} />
    <rect x={70} y={1360} width={950} height={70} rx={20} fill="#c98a4b" stroke="#8f5a2b" strokeWidth={6} />
  </g>
);

const SleepyKid: React.FC<{ f: number; x: number; y: number; s: number }> = ({ f, x, y, s }) => {
  const sway = 5 * Math.sin(f * 0.06);
  const yawn = interpolate(f % 60, [0, 12, 30, 42], [0, 1, 1, 0], CLAMP);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${sway} 200 620)`}>
      <Kid frame={f * 0.4} smile={0.02} blink={f % 70 > 50} />
      {[148, 252].map((ex) => (
        <path key={ex} d={`M${ex - 26},214 Q${ex},204 ${ex + 26},214 L${ex + 26},188 L${ex - 26},188 Z`} fill="#f4bf94" />
      ))}
      <ellipse cx={200} cy={296} rx={26 + 8 * yawn} ry={6 + 30 * yawn} fill="#8a2a3c" />
      <ellipse cx={200} cy={296 + 18 * yawn} rx={14 * yawn} ry={8 * yawn} fill="#ff7d94" />
    </g>
  );
};

const SadScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = popIn(f, 0, 14);
  return (
    <AbsoluteFill>
      <Bedroom frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Bed />
        <g transform={`translate(${740}, ${1170 + 4 * Math.sin(f * 0.4)}) scale(${1.1 * enter}) translate(-150,-100)`}>
          <Pillow frame={f} mood={-1} crying blink={f % 45 > 41} />
        </g>
        <SleepyKid f={f} x={40} y={790} s={0.95 * (0.6 + 0.4 * enter)} />
      </svg>
      <Title lines={["MATA NGANTUK,", "TAPI MAU MAIN?"]} frame={f} at={4} top={190} size={104} color="#ffd36b" />
    </AbsoluteFill>
  );
};

const PlayScene: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SC[1];
  const b = bounce(g);
  const yawn = interpolate(f, [50, 60, 75, 85], [0, 1, 1, 0], CLAMP);
  return (
    <AbsoluteFill>
      <Bedroom frame={f} night={1} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(790, ${690 + 6 * Math.sin(f * 0.1)}) scale(${1.0 * popIn(f, 0, 12)})`}>
          <Moon frame={f} yawn={yawn} />
        </g>
        {/* toy blocks tower wobbling */}
        <g transform={`translate(110, 1560) rotate(${3 * Math.sin(f * 0.3)})`}>
          <Block color="#ff6b6b" letter="A" />
          <g transform="translate(10,-110)">
            <Block color="#4dabf7" letter="B" />
          </g>
          <g transform={`translate(${-6 + 6 * Math.sin(f * 0.4)},-220)`}>
            <Block color="#69db7c" letter="C" />
          </g>
        </g>
        {/* bouncing ball */}
        <g transform={`translate(${560 + 300 * Math.sin(f * 0.09)}, ${1560 - 360 * b})`}>
          <Ball spin={f * 8} />
        </g>
        {/* kid jumping around with the toys */}
        <g transform={`translate(${520 + 120 * Math.sin(f * 0.07)}, ${1520 - 50 * Math.abs(Math.sin(f * 0.35))}) scale(0.62) translate(-200,-620)`}>
          <Kid frame={f} smile={0.9} blink={f % 50 > 46} />
        </g>
        {/* pillow waving from the corner, ignored */}
        <g transform={`translate(890, 1330) scale(0.75) rotate(${6 * Math.sin(f * 0.3)}) translate(-150,-100)`}>
          <Pillow frame={f} mood={-0.7} blink={f % 40 > 37} />
        </g>
      </svg>
      <Title lines={["MAIN TERUS,", "LUPA TIDUR!"]} frame={f} at={2} top={180} size={108} color="#ffffff" />
    </AbsoluteFill>
  );
};

const NapScene: React.FC = () => {
  const f = useCurrentFrame();
  const hits = song.popFrames.map((p) => p - SC[2]);
  const lieDown = interpolate(f, [0, 18], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
  const blanket = interpolate(f, [10, 26], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const breathe = Math.sin(f * 0.12);
  return (
    <AbsoluteFill>
      <Bedroom frame={f} curtains={interpolate(f, [0, 16], [0, 1], CLAMP)} />
      <AbsoluteFill style={{ background: "#2d1b69", opacity: 0.25 * lieDown }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* moon night-light on the wall */}
        <g transform={`translate(230, 700) scale(${0.55 * popIn(f, 4, 12)})`}>
          <Moon frame={f} sleepy={1} />
        </g>
        <Bed />
        <g transform={`translate(270, 1160) translate(-150,-100)`}>
          <Pillow frame={f} mood={0.3} sleepy={lieDown} squash={0.5 * lieDown} />
        </g>
        {/* kid lying down, head on the pillow */}
        <g transform={`translate(270, ${1110 - 250 * (1 - lieDown)}) rotate(${-90 * lieDown}) scale(0.62) translate(-200,-210)`}>
          <Kid frame={f * 0.3} smile={0.35} blink={lieDown > 0.8} />
        </g>
        {/* blanket */}
        <path
          d={`M${400},${1140 - 6 * breathe} Q620,${1080 - 10 * breathe} 1000,${1150} L1000,1290 L400,1290 Z`}
          fill="#7cc6ff"
          stroke="#3d8fd0"
          strokeWidth={7}
          opacity={blanket}
          transform={`translate(${300 * (1 - blanket)},0)`}
        />
        {blanket > 0.5 &&
          [480, 620, 760, 900].map((x, i) => (
            <circle key={x} cx={x} cy={1220 + (i % 2) * 30} r={16} fill="#ffffff" opacity={0.7 * blanket} />
          ))}
        {/* Zzz pops on the beat */}
        {hits.map((h, i) => {
          if (f < h) return null;
          const p = Math.min(1, (f - h) / 40);
          return (
            <g key={i} transform={`translate(${330 + 120 * p + i * 40}, ${1000 - 260 * p - i * 30}) scale(${popIn(f, h, 8)})`} opacity={1 - 0.7 * p}>
              <Zed size={70 + i * 20} color={i % 2 ? "#9fdcff" : "#fff36b"} />
            </g>
          );
        })}
      </svg>
      <Title lines={["AYO BOBO", "SIANG DULU!"]} frame={f} at={2} top={180} size={112} color="#ffd36b" />
    </AbsoluteFill>
  );
};

const HappyScene: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SC[3];
  const b = f < 100 ? bounce(g) : 0;
  const enter = popIn(f, 0, 14);
  const sparkles = Array.from({ length: 12 }).map((_, i) => {
    const a = (i / 12) * Math.PI * 2 + f * 0.02;
    const r = 340 + 30 * Math.sin(f * 0.2 + i);
    const tw = 0.5 + 0.5 * Math.sin(f * 0.35 + i * 1.7);
    return (
      <g key={i} transform={`translate(${540 + Math.cos(a) * r}, ${1080 + Math.sin(a) * r * 1.05}) rotate(${f * 3 + i * 20}) scale(${tw * popIn(f, 6 + i, 10)})`}>
        <Sparkle size={34} color={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#fff36b" : "#ffb3d1"} />
      </g>
    );
  });
  return (
    <AbsoluteFill>
      <Sky frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {sparkles}
        <ellipse cx={540} cy={1360} rx={180 - 50 * b} ry={30} fill="#00000022" />
        {/* kid jumping full of energy */}
        <g transform={`translate(540, ${1360 - 110 * b}) scale(${0.8 * enter}) translate(-200,-620)`}>
          <Kid frame={f} smile={1} blink={f % 55 > 51} />
        </g>
        <g transform={`translate(230, ${1450 - 40 * bounce(g + 7)}) scale(${0.9 * popIn(f, 6, 12)}) rotate(-6) translate(-150,-100)`}>
          <Pillow frame={f} mood={1} blink={f % 48 > 45} />
        </g>
        <g transform={`translate(860, ${1420 + 8 * Math.sin(f * 0.3)}) scale(${0.6 * popIn(f, 12, 12)})`}>
          <Moon frame={f} />
        </g>
        <g transform={`translate(860, ${1100 + 8 * Math.sin(f * 0.3)}) scale(${popIn(f, 20, 10) * (1 + 0.06 * Math.sin(f * 0.5))})`}>
          <path d="M0,40 C-70,-5 -55,-60 -20,-60 C-5,-60 0,-45 0,-38 C0,-45 5,-60 20,-60 C55,-60 70,-5 0,40 Z" fill="#ff6fa3" stroke="#ffffff" strokeWidth={8} />
          <ellipse cx={-22} cy={-38} rx={10} ry={6} fill="white" opacity={0.7} />
        </g>
      </svg>
      <Title lines={["TIDUR CUKUP,", "BIAR SEMANGAT!"]} frame={f} at={4} top={170} size={108} color="#ffd36b" />
      <div
        style={{
          position: "absolute",
          top: 440,
          left: 60,
          right: 60,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 62,
          color: "#2d1b69",
          opacity: interpolate(f, [18, 26], [0, 1], CLAMP),
          translate: `0px ${interpolate(f, [18, 26], [20, 0], CLAMP)}px`,
        }}
      >
        Bangun ceria, semangat!
      </div>
    </AbsoluteFill>
  );
};

export const NapShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1c1440", overflow: "hidden" }}>
      <Audio src={staticFile("tidur_siang_song.wav")} />
      <Sequence from={SC[0]} durationInFrames={SC[1] - SC[0]} layout="absolute-fill">
        <SceneIn>
          <SadScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[1]} durationInFrames={SC[2] - SC[1]} layout="absolute-fill">
        <SceneIn>
          <PlayScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[2]} durationInFrames={SC[3] - SC[2]} layout="absolute-fill">
        <SceneIn>
          <NapScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[3]} durationInFrames={END - SC[3]} layout="absolute-fill">
        <SceneIn>
          <HappyScene />
        </SceneIn>
      </Sequence>
      <Lyrics frame={frame} />
    </AbsoluteFill>
  );
};
