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
import { Broccoli, Candy, CarrotSlice, Floret, Fork } from "./characters";

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
          fontSize: 64,
          whiteSpace: "pre",
          color: "#b9b2d6",
        }}
      >
        {song.lines[line].syll.map((s, j) => {
          const on = frame >= nf[0] - 6; // spoken line: whole line lights up together
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
const Plate: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={20} rx={300} ry={62} fill="#00000022" />
    <ellipse cx={0} cy={0} rx={290} ry={72} fill="#ffffff" stroke="#c9d3ee" strokeWidth={6} />
    <ellipse cx={0} cy={-8} rx={210} ry={46} fill="#f1f4ff" />
  </g>
);

const SadScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = popIn(f, 0, 14);
  const sob = Math.sin(f * 0.9) * 6 * (f % 30 < 18 ? 1 : 0.3);
  return (
    <AbsoluteFill>
      <Kitchen tint="#e8d6b0" frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Plate x={540} y={1330} />
        <g transform={`translate(540, ${1322 + sob}) scale(${2.5 * enter}) translate(-110,-298)`}>
          <Broccoli frame={f} mood={-1} crying blink={f % 45 > 40} />
        </g>
        {/* lonely fly-by leaf */}
        <path
          d={`M${1000 - f * 5},${820 + 30 * Math.sin(f * 0.15)} q20,-20 40,0 q-20,20 -40,0 Z`}
          fill="#7bd88f"
          opacity={0.7}
        />
      </svg>
      <Title lines={["BROKOLI KOK", "DITINGGAL?"]} frame={f} at={4} top={190} color="#7ae582" />
    </AbsoluteFill>
  );
};

const CANDIES = [
  { x: 330, y: 1080, c: "#ff6fa3", s: "#ffffff" },
  { x: 620, y: 1000, c: "#ffd23f", s: "#ff8c42" },
  { x: 470, y: 1220, c: "#7ab8ff", s: "#ffffff" },
  { x: 250, y: 1300, c: "#b18cff", s: "#ffe066" },
  { x: 680, y: 1260, c: "#ff8c69", s: "#fff36b" },
];

const PartyScene: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SC[1];
  return (
    <AbsoluteFill>
      <Kitchen frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Plate x={470} y={1340} s={1.15} />
        {/* broccoli pushed to the side */}
        <g transform={`translate(920, 1350) scale(1.25) rotate(${-4 + 2 * Math.sin(f * 0.3)}) translate(-110,-298)`}>
          <Broccoli frame={f} mood={-0.8} blink={f % 40 > 37} />
        </g>
        {CANDIES.map((cd, i) => {
          const s = popIn(f, 4 + i * 7, 10);
          const b = bounce(g + i * 3);
          return (
            <g
              key={i}
              transform={`translate(${cd.x + 14 * Math.sin(f * 0.2 + i)}, ${cd.y - 50 * b}) rotate(${14 * Math.sin(f * 0.22 + i * 1.3)}) scale(${1.15 * s * (1 + 0.08 * b)}, ${1.15 * s * (1 - 0.06 * b)})`}
            >
              <Candy frame={f} color={cd.c} stripe={cd.s} seed={i} />
            </g>
          );
        })}
      </svg>
      <Title lines={["SEMUA PILIH", "PERMEN SAJA!"]} frame={f} at={2} top={200} size={100} color="#ffffff" />
    </AbsoluteFill>
  );
};

const PLATE3 = { x: 600, y: 1290 };
const FLORETS = [
  { x: 480, y: 1275, kind: 0 },
  { x: 560, y: 1300, kind: 1 },
  { x: 650, y: 1265, kind: 0 },
  { x: 730, y: 1300, kind: 1 },
];
const MOUTH = { x: 168, y: 1000 };

const EatScene: React.FC = () => {
  const f = useCurrentFrame();
  const mood = interpolate(f, [0, 20, 30, 60, 72], [-0.6, -0.6, 0, 0.3, 1], CLAMP);
  const hits = song.popFrames.map((p) => p - SC[2]);
  // fork position: travels plate -> mouth for each bite
  let fx = 760;
  let fy = 1180;
  let carrying = -1;
  for (let i = 0; i < hits.length; i++) {
    const a = hits[i] - 13;
    if (f >= a && f <= hits[i]) {
      const p = Easing.inOut(Easing.quad)((f - a) / 13);
      const fl = FLORETS[i];
      fx = fl.x + (MOUTH.x + 40 - fl.x) * p;
      fy = fl.y - 40 + (MOUTH.y + 20 - (fl.y - 40)) * p - 120 * Math.sin(Math.PI * p);
      carrying = i;
    } else if (f > hits[i] && (i === hits.length - 1 || f < hits[i + 1] - 13)) {
      const p = Math.min(1, (f - hits[i]) / 8);
      const nx = i < hits.length - 1 ? FLORETS[i + 1].x : 760;
      const ny = i < hits.length - 1 ? FLORETS[i + 1].y - 40 : 1180;
      fx = MOUTH.x + 40 + (nx - MOUTH.x - 40) * p;
      fy = MOUTH.y + 20 + (ny - MOUTH.y - 20) * p;
    } else if (f < hits[0] - 13) {
      const p = interpolate(f, [0, hits[0] - 13], [0, 1], CLAMP);
      fx = 760 + (FLORETS[0].x - 760) * p;
      fy = 1180 + (FLORETS[0].y - 40 - 1180) * p;
    }
  }
  const chewing = hits.some((h) => f >= h && f < h + 10);
  const smile = chewing ? 0.25 + 0.35 * Math.abs(Math.sin(f * 0.9)) : 0.9;
  const shoulder = { x: -40 + 290, y: 720 + 450 };
  return (
    <AbsoluteFill>
      <Kitchen tint="#fff0c2" frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Plate x={PLATE3.x} y={PLATE3.y} s={0.95} />
        {FLORETS.map((fl, i) => {
          const pickAt = hits[i] - 13;
          if (f >= pickAt) return null;
          return (
            <g key={i} transform={`translate(${fl.x},${fl.y}) scale(2.1)`}>
              {fl.kind === 0 ? <Floret /> : <CarrotSlice />}
            </g>
          );
        })}
        {/* cheering broccoli friend */}
        <g transform={`translate(910, ${1330 - 30 * bounce(f + SC[2]) * Math.max(0, mood)}) scale(1.35) translate(-110,-298)`}>
          <Broccoli frame={f} mood={mood} armsUp={Math.max(0, mood) * (0.5 + 0.5 * Math.sin(f * 0.4))} blink={f % 44 > 41} />
        </g>
        {/* kid */}
        <g transform="translate(-40, 720)">
          <Kid frame={f} smile={smile} blink={f % 50 > 46} />
        </g>
        {/* bite sparkles at mouth */}
        {hits.map((h, i) => {
          if (f < h || f > h + 12) return null;
          const p = (f - h) / 12;
          return (
            <g key={i} transform={`translate(${MOUTH.x + 60},${MOUTH.y - 20})`} opacity={1 - p}>
              {Array.from({ length: 6 }).map((_, k) => (
                <g key={k} transform={`rotate(${k * 60 + i * 20}) translate(${30 + 90 * p},0)`}>
                  <Sparkle size={20 * (1 - p)} color={k % 2 ? "#fff36b" : "#7ae582"} />
                </g>
              ))}
            </g>
          );
        })}
        {/* arm + fork */}
        <path
          d={`M${shoulder.x},${shoulder.y} Q${(shoulder.x + fx) / 2 + 40},${Math.max(shoulder.y, fy) + 80} ${fx + 10},${fy + 120}`}
          stroke="#ffb84d"
          strokeWidth={46}
          fill="none"
          strokeLinecap="round"
        />
        <g transform={`translate(${fx},${fy}) rotate(-20)`}>
          <Fork />
          {carrying >= 0 && (
            <g transform="translate(0,-14) scale(1.6)">{FLORETS[carrying].kind === 0 ? <Floret /> : <CarrotSlice />}</g>
          )}
        </g>
        <circle cx={fx + 10} cy={fy + 120} r={32} fill="#f4bf94" stroke="#e39a72" strokeWidth={4} />
      </svg>
      <Title lines={["AYO MAKAN SAYUR!"]} frame={f} at={2} top={180} size={96} color="#7ae582" />
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
    const r = 360 + 30 * Math.sin(f * 0.2 + i);
    const tw = 0.5 + 0.5 * Math.sin(f * 0.35 + i * 1.7);
    return (
      <g key={i} transform={`translate(${470 + Math.cos(a) * r}, ${1000 + Math.sin(a) * r * 1.05}) rotate(${f * 3 + i * 20}) scale(${tw * popIn(f, 6 + i, 10)})`}>
        <Sparkle size={34} color={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#fff36b" : "#9be88f"} />
      </g>
    );
  });
  return (
    <AbsoluteFill>
      <Sky frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={460} cy={1330} rx={200 - 50 * b} ry={32} fill="#00000022" />
        {sparkles}
        <g transform={`translate(460, ${1330 - 70 * b}) scale(${2.4 * enter * (1 - 0.05 * b)}, ${2.4 * enter * (1 + 0.05 * b)}) translate(-110,-298)`}>
          <Broccoli frame={f} mood={1} shine={shine} armsUp={0.5 + 0.5 * Math.sin(f * 0.4)} blink={f % 48 > 45} />
        </g>
        <g transform={`translate(770, ${1170 + 60 * (1 - popIn(f, 8, 12))}) scale(0.72)`}>
          <Kid frame={f} smile={1} blink={f % 55 > 51} />
        </g>
        {/* love heart */}
        <g transform={`translate(${890}, ${1060 + 8 * Math.sin(f * 0.3)}) scale(${popIn(f, 20, 10) * (1 + 0.06 * Math.sin(f * 0.5))})`}>
          <path d="M0,40 C-70,-5 -55,-60 -20,-60 C-5,-60 0,-45 0,-38 C0,-45 5,-60 20,-60 C55,-60 70,-5 0,40 Z" fill="#ff6fa3" stroke="#ffffff" strokeWidth={8} />
          <ellipse cx={-22} cy={-38} rx={10} ry={6} fill="white" opacity={0.7} />
        </g>
      </svg>
      <Title lines={["MAKAN SAYUR", "BIAR KUAT!"]} frame={f} at={4} top={170} size={120} color="#7ae582" />
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
        Setiap hari, ya!
      </div>
    </AbsoluteFill>
  );
};

export const VeggieShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1c1440", overflow: "hidden" }}>
      <Audio src={staticFile("makan_sayur_song.wav")} />
      <Sequence from={SC[0]} durationInFrames={SC[1] - SC[0]} layout="absolute-fill">
        <SceneIn>
          <SadScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[1]} durationInFrames={SC[2] - SC[1]} layout="absolute-fill">
        <SceneIn>
          <PartyScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[2]} durationInFrames={SC[3] - SC[2]} layout="absolute-fill">
        <SceneIn>
          <EatScene />
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
