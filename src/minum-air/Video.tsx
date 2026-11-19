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
import { Drop, Glass, Sun, Sweat } from "./characters";

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

const Kitchen: React.FC<{ tint?: string; frame: number }> = ({ tint = "#ffe9b0", frame }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="kwall" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={tint} />
        <stop offset="1" stopColor="#fff7e3" />
      </linearGradient>
      <pattern id="kstripe" width="90" height="1920" patternUnits="userSpaceOnUse">
        <rect width="45" height="1920" fill="#ffffff" opacity="0.25" />
      </pattern>
    </defs>
    <rect width="1080" height="1920" fill="url(#kwall)" />
    <rect width="1080" height="1340" fill="url(#kstripe)" />
    {/* window */}
    <rect x={640} y={500} width={340} height={300} rx={26} fill="#9fdcff" stroke="#ffffff" strokeWidth={18} />
    <path d="M810,500 L810,800 M640,650 L980,650" stroke="#ffffff" strokeWidth={14} />
    <circle cx={720} cy={570} r={34} fill="#fff36b" />
    <g transform={`translate(${880 + 10 * Math.sin(frame * 0.04)},740)`}>
      <circle cx={-30} cy={0} r={28} fill="white" />
      <circle cx={10} cy={-14} r={36} fill="white" />
      <circle cx={46} cy={4} r={24} fill="white" />
    </g>
    {/* hanging pans */}
    <rect x={80} y={520} width={360} height={14} rx={7} fill="#c98a4b" />
    <circle cx={150} cy={620} r={60} fill="#ff8c69" stroke="#c45a3c" strokeWidth={8} />
    <rect x={142} y={534} width={16} height={30} fill="#c45a3c" />
    <circle cx={320} cy={600} r={44} fill="#7bd88f" stroke="#3f9b57" strokeWidth={8} />
    <rect x={312} y={534} width={16} height={24} fill="#3f9b57" />
    {/* table */}
    <rect x={0} y={1340} width={1080} height={580} fill="#e7a868" />
    <rect x={0} y={1340} width={1080} height={40} fill="#cf8a4a" />
    {Array.from({ length: 6 }).map((_, i) => (
      <path key={i} d={`M0,${1440 + i * 80} L1080,${1440 + i * 80}`} stroke="#d6965a" strokeWidth={6} opacity={0.6} />
    ))}
  </svg>
);

// ---------------- scenes ----------------

const SadKid: React.FC<{ f: number; x: number; y: number; s: number }> = ({ f, x, y, s }) => {
  const droop = 4 + 2 * Math.sin(f * 0.08);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${droop} 200 620)`}>
      <Kid frame={f * 0.4} smile={0.02} blink={f % 60 > 40} />
      {/* droopy half-closed lids + frown */}
      {[148, 252].map((ex) => (
        <path key={ex} d={`M${ex - 24},205 Q${ex},196 ${ex + 24},205 L${ex + 24},190 L${ex - 24},190 Z`} fill="#f4bf94" />
      ))}
      <path d="M170,300 Q200,278 230,300" stroke="#8a2a3c" strokeWidth={8} fill="none" strokeLinecap="round" />
      {[0, 1, 2].map((k) => {
        const t = ((f + k * 14) % 42) / 42;
        return (
          <g key={k} transform={`translate(${k === 1 ? 330 : 70 + k * 10}, ${110 + 140 * t})`} opacity={1 - t}>
            <Sweat s={1.6} />
          </g>
        );
      })}
    </g>
  );
};

const SadScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = popIn(f, 0, 14);
  return (
    <AbsoluteFill>
      <Kitchen tint="#f2d9a8" frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SadKid f={f} x={60} y={760} s={1.0 * (0.6 + 0.4 * enter)} />
        {/* forgotten water drop friend waiting on the table */}
        <g transform={`translate(800, ${1360 + 4 * Math.sin(f * 0.5)}) scale(${1.4 * enter}) translate(-110,-298)`}>
          <Drop frame={f} mood={-1} crying blink={f % 45 > 41} />
        </g>
      </svg>
      <Title lines={["KENAPA", "BADANKU LEMAS?"]} frame={f} at={4} top={190} size={108} color="#7fd3ff" />
    </AbsoluteFill>
  );
};

const HotScene: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SC[1];
  const b = bounce(g);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="hot" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffb36b" />
            <stop offset="1" stopColor="#fff1b8" />
          </linearGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#hot)" />
        {/* heat waves */}
        {[0, 1, 2].map((k) => (
          <path
            key={k}
            d={`M80,${1250 + k * 50} q60,${-20 + 10 * Math.sin(f * 0.3 + k)} 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0`}
            stroke="#ffffff"
            strokeWidth={8}
            fill="none"
            opacity={0.45}
          />
        ))}
        <rect x={0} y={1420} width={1080} height={500} fill="#f4d58d" />
        <ellipse cx={540} cy={1430} rx={720} ry={70} fill="#e9c46a" />
        <g transform={`translate(${720 + 20 * Math.sin(f * 0.08)}, ${720 - 40 * b}) scale(${popIn(f, 0, 12) * (1 + 0.05 * b)})`}>
          <Sun frame={f} />
        </g>
        {/* kid running back and forth, sweating */}
        <g transform={`translate(${360 + 140 * Math.sin(f * 0.07)}, ${1500 - 40 * Math.abs(Math.sin(f * 0.35))}) scale(0.62) translate(-200,-620)`}>
          <Kid frame={f} smile={0.9} blink={f % 50 > 46} />
          {[0, 1, 2, 3].map((k) => {
            const t = ((f + k * 9) % 36) / 36;
            return (
              <g key={k} transform={`translate(${k % 2 ? 360 + 60 * t : 40 - 60 * t}, ${120 + 80 * t})`} opacity={1 - t}>
                <Sweat s={2} />
              </g>
            );
          })}
        </g>
        {/* water drop waving from the side, ignored */}
        <g transform={`translate(950, 1560) scale(1.1) rotate(${6 * Math.sin(f * 0.3)}) translate(-110,-298)`}>
          <Drop frame={f} mood={-0.7} armsUp={0.5 + 0.5 * Math.sin(f * 0.6)} blink={f % 40 > 37} />
        </g>
      </svg>
      <Title lines={["PANAS TERIK,", "LUPA MINUM!"]} frame={f} at={2} top={180} size={104} color="#ffffff" />
    </AbsoluteFill>
  );
};

const DrinkScene: React.FC = () => {
  const f = useCurrentFrame();
  const hits = song.popFrames.map((p) => p - SC[2]);
  const level = interpolate(f, [-1, hits[0], hits[0] + 6, hits[1], hits[1] + 6, hits[2], hits[2] + 6], [1, 1, 0.7, 0.7, 0.4, 0.4, 0.08], CLAMP);
  const lift = interpolate(f, [-8, 0, hits[2] + 18, hits[2] + 30], [0, 1, 1, 0], CLAMP);
  const done = interpolate(f, [hits[2] + 18, hits[2] + 30], [0, 1], CLAMP);
  const gulping = hits.some((h) => f >= h && f < h + 8);
  const mood = interpolate(f, [0, hits[2] + 10, hits[2] + 24], [0, 0, 1], CLAMP);
  // glass: at mouth while drinking, lowered after
  const gx = 460 + 150 * done;
  const gy = 1130 + 170 * done;
  const tilt = -35 * lift;
  const shoulder = { x: 140 + 290, y: 720 + 450 };
  return (
    <AbsoluteFill>
      <Kitchen tint="#d9f1ff" frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(860, ${1360 - 30 * bounce(f + SC[2]) * mood}) scale(1.3) translate(-110,-298)`}>
          <Drop frame={f} mood={mood} armsUp={mood * (0.5 + 0.5 * Math.sin(f * 0.4))} blink={f % 44 > 41} />
        </g>
        <g transform="translate(140, 720)">
          <Kid frame={f} smile={gulping ? 0.15 : 0.6 + 0.4 * done} blink={f % 50 > 46} />
        </g>
        {/* gulp bubbles */}
        {hits.map((h, i) => {
          if (f < h || f > h + 14) return null;
          const p = (f - h) / 14;
          return (
            <g key={i} opacity={1 - p}>
              {[0, 1, 2].map((k) => (
                <circle key={k} cx={420 + k * 30} cy={960 - 80 * p - k * 20} r={10 + 6 * k * (1 - p)} fill="none" stroke="#4fb3e8" strokeWidth={4} />
              ))}
            </g>
          );
        })}
        {done > 0.5 &&
          Array.from({ length: 6 }).map((_, k) => {
            const p = interpolate(f, [hits[2] + 24, hits[2] + 44], [0, 1], CLAMP);
            return (
              <g key={k} transform={`translate(340,1000) rotate(${k * 60}) translate(${80 + 110 * p},0)`} opacity={1 - p}>
                <Sparkle size={24 * (1 - p)} color={k % 2 ? "#fff36b" : "#7fd3ff"} />
              </g>
            );
          })}
        {/* arm + glass */}
        <path
          d={`M${shoulder.x},${shoulder.y} Q${shoulder.x + 120},${shoulder.y + 40} ${gx + 20},${gy + 30}`}
          stroke="#ffb84d"
          strokeWidth={46}
          fill="none"
          strokeLinecap="round"
        />
        <g transform={`translate(${gx},${gy}) rotate(${tilt}) scale(1.1)`}>
          <Glass level={level} />
        </g>
        <circle cx={gx + 20} cy={gy + 30} r={32} fill="#f4bf94" stroke="#e39a72" strokeWidth={4} />
      </svg>
      <Title lines={["AYO MINUM", "AIR PUTIH!"]} frame={f} at={2} top={180} size={108} color="#7fd3ff" />
    </AbsoluteFill>
  );
};

const HappyScene: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SC[3];
  const b = f < 100 ? bounce(g) : 0;
  const shine = interpolate(f, [16, 34], [0, 1], CLAMP);
  const enter = popIn(f, 0, 14);
  const sparkles = Array.from({ length: 12 }).map((_, i) => {
    const a = (i / 12) * Math.PI * 2 + f * 0.02;
    const r = 340 + 30 * Math.sin(f * 0.2 + i);
    const tw = 0.5 + 0.5 * Math.sin(f * 0.35 + i * 1.7);
    return (
      <g key={i} transform={`translate(${470 + Math.cos(a) * r}, ${1040 + Math.sin(a) * r * 1.05}) rotate(${f * 3 + i * 20}) scale(${tw * popIn(f, 6 + i, 10)})`}>
        <Sparkle size={34} color={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#fff36b" : "#9fdcff"} />
      </g>
    );
  });
  return (
    <AbsoluteFill>
      <Sky frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={440} cy={1350} rx={200 - 50 * b} ry={32} fill="#00000022" />
        {sparkles}
        <g transform={`translate(440, ${1350 - 70 * b}) scale(${2.2 * enter * (1 - 0.05 * b)}, ${2.2 * enter * (1 + 0.05 * b)}) translate(-110,-298)`}>
          <Drop frame={f} mood={1} shine={shine} armsUp={0.5 + 0.5 * Math.sin(f * 0.4)} blink={f % 48 > 45} />
        </g>
        <g transform={`translate(760, ${1180 + 60 * (1 - popIn(f, 8, 12))}) scale(0.72)`}>
          <Kid frame={f} smile={1} blink={f % 55 > 51} />
        </g>
        <g transform={`translate(890, ${1080 + 8 * Math.sin(f * 0.3)}) scale(${popIn(f, 20, 10) * (1 + 0.06 * Math.sin(f * 0.5))})`}>
          <path d="M0,40 C-70,-5 -55,-60 -20,-60 C-5,-60 0,-45 0,-38 C0,-45 5,-60 20,-60 C55,-60 70,-5 0,40 Z" fill="#ff6fa3" stroke="#ffffff" strokeWidth={8} />
          <ellipse cx={-22} cy={-38} rx={10} ry={6} fill="white" opacity={0.7} />
        </g>
      </svg>
      <Title lines={["MINUM AIR", "YANG CUKUP!"]} frame={f} at={4} top={170} size={118} color="#7fd3ff" />
      <div
        style={{
          position: "absolute",
          top: 450,
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
        Badan segar, ceria!
      </div>
    </AbsoluteFill>
  );
};

export const WaterShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1c1440", overflow: "hidden" }}>
      <Audio src={staticFile("minum_air_song.wav")} />
      <Sequence from={SC[0]} durationInFrames={SC[1] - SC[0]} layout="absolute-fill">
        <SceneIn>
          <SadScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[1]} durationInFrames={SC[2] - SC[1]} layout="absolute-fill">
        <SceneIn>
          <HotScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[2]} durationInFrames={SC[3] - SC[2]} layout="absolute-fill">
        <SceneIn>
          <DrinkScene />
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
