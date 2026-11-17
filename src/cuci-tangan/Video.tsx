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
import { Germ, Kid, Sparkle } from "../tooth/characters";
import { Cookie, Faucet, Hand, Soap } from "./characters";

loadFont({ family: "Fredoka", url: staticFile("fredoka-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "Fredoka", url: staticFile("fredoka-latin-600-normal.woff2"), weight: "600" });

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
const Bathroom: React.FC<{ tint?: string }> = ({ tint = "#bfe7ff" }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={tint} />
        <stop offset="1" stopColor="#e9f7ff" />
      </linearGradient>
      <pattern id="tiles" width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="none" stroke="#ffffff" strokeWidth="6" opacity="0.7" />
      </pattern>
      <radialGradient id="glow" cx="0.5" cy="0.4" r="0.6">
        <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#wall)" />
    <rect width="1080" height="1340" fill="url(#tiles)" />
    {/* mirror */}
    <ellipse cx={870} cy={430} rx={150} ry={190} fill="#e6f6ff" stroke="#ffd27a" strokeWidth={18} />
    <path d="M800,330 L880,260 M820,390 L930,300" stroke="white" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
    {/* shelf */}
    <rect x={60} y={560} width={300} height={22} rx={10} fill="#ffd27a" />
    <rect x={90} y={470} width={56} height={90} rx={16} fill="#ff8fb1" />
    <rect x={160} y={440} width={44} height={120} rx={14} fill="#7bd88f" />
    <rect x={164} y={420} width={36} height={30} rx={8} fill="#ffffff" />
    <path d="M230,560 L240,470 L310,470 L320,560 Z" fill="#8ec5ff" />
    <rect x={262} y={410} width={10} height={70} rx={5} fill="#ffb84d" />
    <rect x={284} y={420} width={10} height={60} rx={5} fill="#ff6fa3" />
    {/* counter */}
    <rect x={0} y={1340} width={1080} height={580} fill="#ffe7c2" />
    <rect x={0} y={1340} width={1080} height={36} fill="#ffd08a" />
    <rect width="1080" height="1920" fill="url(#glow)" />
    {/* bubbles */}
    {[
      [120, 900, 30],
      [980, 1000, 40],
      [940, 760, 18],
      [70, 1180, 22],
    ].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="white" opacity={0.35} stroke="white" strokeWidth={3} />
    ))}
  </svg>
);

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
const SadScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = popIn(f, 0, 14);
  const sob = Math.sin(f * 0.9) * 6 * (f % 30 < 18 ? 1 : 0.3);
  const rumbleOn = f > 38 && f < 70;
  const shake = rumbleOn ? 6 * Math.sin(f * 2.2) : 0;
  return (
    <AbsoluteFill>
      <Kitchen tint="#f2d9a6" frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={540} cy={1340} rx={220} ry={34} fill="#00000022" />
        <g transform={`translate(${540 + shake}, ${1335 + sob}) scale(${2.6 * enter}) translate(-112,-300)`}>
          <Hand frame={f} mood={-1} dirt={1} crying blink={f % 45 > 40} />
        </g>
        {/* tummy rumble lines */}
        {rumbleOn &&
          [0, 1, 2].map((k) => (
            <path
              key={k}
              d={`M${830 + k * 18},${1000 + k * 50} q20,-14 40,0 q20,14 40,0`}
              stroke="#c45a3c"
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              opacity={0.5 + 0.5 * Math.sin(f * 0.8 + k)}
            />
          ))}
      </svg>
      <Title lines={["TANGAN KOTOR", "SAKIT PERUT?"]} frame={f} at={4} top={190} color="#fff36b" />
    </AbsoluteFill>
  );
};

const HOP_GERMS = [
  { tx: 620, ty: 1100, c: "#7bd88f", d: "#2f8f4e", hat: "#ff6bd6" },
  { tx: 820, ty: 1100, c: "#b18cff", d: "#5b34b5", hat: "#ffd23f" },
  { tx: 720, ty: 1010, c: "#4dd4ff", d: "#1676a8", hat: "#ff8c42" },
  { tx: 560, ty: 1010, c: "#ffd23f", d: "#b07d00", hat: "#4ea8ff" },
  { tx: 900, ty: 1010, c: "#ff8c69", d: "#b2432a", hat: "#7ae582" },
];

const PartyScene: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SC[1];
  return (
    <AbsoluteFill>
      <Kitchen frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* plate + cookies */}
        <ellipse cx={720} cy={1300} rx={290} ry={60} fill="#00000022" />
        <ellipse cx={720} cy={1280} rx={280} ry={70} fill="#ffffff" stroke="#c9d3ee" strokeWidth={6} />
        <ellipse cx={720} cy={1270} rx={200} ry={44} fill="#f1f4ff" />
        {[
          [620, 1230],
          [820, 1230],
          [720, 1180],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x},${y}) scale(1, 0.55)`}>
            <Cookie />
          </g>
        ))}
        {/* dirty hand waving */}
        <ellipse cx={240} cy={1345} rx={150} ry={24} fill="#00000022" />
        <g transform={`translate(240, 1340) scale(1.7) translate(-112,-300)`}>
          <Hand frame={f} mood={0} dirt={1} wave={1} blink={f % 40 > 37} />
        </g>
        {/* germs hopping from hand onto cookies */}
        {HOP_GERMS.map((gm, i) => {
          const start = 6 + i * 12;
          const t = interpolate(f, [start, start + 14], [0, 1], CLAMP);
          if (f < start) return null;
          const sx = 240;
          const sy = 1000;
          const x = sx + (gm.tx - sx) * t;
          const yArc = sy + (gm.ty - sy) * t - 260 * Math.sin(Math.PI * t);
          const landed = t >= 1;
          const b = landed ? bounce(g + i * 4) : 0;
          return (
            <g
              key={i}
              transform={`translate(${x + (landed ? 10 * Math.sin(f * 0.25 + i) : 0)}, ${yArc - 40 * b}) rotate(${landed ? 12 * Math.sin(f * 0.21 + i) : t * 360}) scale(${1.05 * (1 + 0.08 * b)}, ${1.05 * (1 - 0.06 * b)})`}
            >
              <Germ frame={f} color={gm.c} dark={gm.d} seed={i * 3} hat={gm.hat} />
            </g>
          );
        })}
      </svg>
      <Title lines={["KUMAN IKUT", "MAKAN KUE!"]} frame={f} at={2} top={200} size={100} color="#ffffff" />
    </AbsoluteFill>
  );
};

const WASH_GERMS = [
  { x: 640, y: 800, c: "#7bd88f", d: "#2f8f4e", dir: [-1, -1] },
  { x: 860, y: 820, c: "#b18cff", d: "#5b34b5", dir: [1, -1] },
  { x: 620, y: 1010, c: "#ffd23f", d: "#b07d00", dir: [-1, 0.3] },
  { x: 880, y: 1020, c: "#ff8c69", d: "#b2432a", dir: [1, 0.2] },
];

const WashScene: React.FC = () => {
  const f = useCurrentFrame();
  const scrub = Math.sin((f / 10) * Math.PI * 2);
  const soapX = 600 + 28 * scrub;
  const soapY = 1090 + 45 * Math.cos((f / 10) * Math.PI * 2);
  const dirt = interpolate(f, [12, 75], [1, 0], CLAMP);
  const mood = interpolate(f, [0, 22, 30, 60, 72], [-1, -1, 0, 0.1, 1], CLAMP);
  const foam = interpolate(f, [4, 30], [0, 1], CLAMP);
  const shakeX = 4 * scrub;
  const handX = soapX - 95;
  return (
    <AbsoluteFill>
      <Bathroom />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* sink basin */}
        <path d="M430,1230 L1060,1230 Q1040,1400 745,1400 Q450,1400 430,1230 Z" fill="#f4f8ff" stroke="#b9c4e4" strokeWidth={8} />
        <ellipse cx={745} cy={1232} rx={315} ry={30} fill="#dbe7f7" stroke="#b9c4e4" strokeWidth={6} />
        <g transform={`translate(${745 + shakeX}, 1235) scale(2.0) translate(-112,-300)`}>
          <Hand frame={f} mood={mood} dirt={dirt} blink={f % 40 > 37} />
        </g>
        {/* faucet with running water */}
        <g transform="translate(745, 560)">
          <Faucet frame={f} />
        </g>
        {/* foam bubbles on hand */}
        {Array.from({ length: 14 }).map((_, i) => {
          const at = 6 + i * 4;
          const s = popIn(f, at, 8) * interpolate(f, [70, 88], [1, 0.4], CLAMP);
          const x = 560 + ((i * 137) % 360);
          const y = 870 + ((i * 89) % 260);
          return <circle key={i} cx={x + 4 * Math.sin(f * 0.3 + i)} cy={y} r={(16 + (i % 4) * 8) * s} fill="white" stroke="#cfe8ff" strokeWidth={4} opacity={0.95} />;
        })}
        {/* germs washed away */}
        {WASH_GERMS.map((gm, i) => {
          const hitAt = song.popFrames[i] - SC[2];
          const t = interpolate(f, [hitAt - 12, hitAt], [0, 1], CLAMP);
          if (f > hitAt + 12) return null;
          if (f >= hitAt) {
            const p = (f - hitAt) / 12;
            const px = gm.x + gm.dir[0] * 200;
            const py = gm.y + gm.dir[1] * 200 - 120;
            return (
              <g key={i} transform={`translate(${px},${py})`} opacity={1 - p}>
                <circle r={40 + 90 * p} fill="none" stroke={gm.c} strokeWidth={14 * (1 - p)} />
                {Array.from({ length: 8 }).map((_, k) => (
                  <g key={k} transform={`rotate(${k * 45}) translate(${30 + 110 * p},0)`}>
                    <Sparkle size={22 * (1 - p)} color={k % 2 ? "#fff36b" : gm.c} />
                  </g>
                ))}
              </g>
            );
          }
          const x = gm.x + gm.dir[0] * 200 * Easing.out(Easing.quad)(t);
          const y = gm.y + gm.dir[1] * 200 * t - 200 * Math.sin(Math.PI * t * 0.75);
          return (
            <g key={i} transform={`translate(${x},${y + 6 * Math.sin(f * 0.8 + i)}) rotate(${t * 540 * gm.dir[0]}) scale(0.8)`}>
              <Germ frame={f} color={gm.c} dark={gm.d} seed={i * 5} scared={f > 6} />
            </g>
          );
        })}
        {/* kid */}
        <g transform="translate(-70, 700) scale(1.05)">
          <Kid frame={f} smile={0.8} blink={f % 50 > 46} />
        </g>
        <path
          d={`M${-70 + 290 * 1.05},${700 + 450 * 1.05} Q${(handX + 200) / 2},${1240} ${handX},${soapY + 10}`}
          stroke="#ffb84d"
          strokeWidth={46}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={handX} cy={soapY + 8} r={32} fill="#f4bf94" stroke="#e39a72" strokeWidth={4} />
        <g transform={`translate(${soapX}, ${soapY}) rotate(${10 * scrub}) scale(0.9)`}>
          <Soap foam={foam} frame={f} />
        </g>
      </svg>
      <Title lines={["AYO CUCI TANGAN!"]} frame={f} at={2} top={150} size={96} color="#7ae582" />
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
      <g key={i} transform={`translate(${480 + Math.cos(a) * r}, ${980 + Math.sin(a) * r * 1.05}) rotate(${f * 3 + i * 20}) scale(${tw * popIn(f, 6 + i, 10)})`}>
        <Sparkle size={34} color={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#fff36b" : "#ff9fd0"} />
      </g>
    );
  });
  return (
    <AbsoluteFill>
      <Sky frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={460} cy={1330} rx={210 - 50 * b} ry={32} fill="#00000022" />
        {sparkles}
        <g transform={`translate(460, ${1330 - 70 * b}) scale(${2.4 * enter * (1 - 0.05 * b)}, ${2.4 * enter * (1 + 0.05 * b)}) translate(-112,-300)`}>
          <Hand frame={f} mood={1} dirt={0} shine={shine} wave={1} blink={f % 48 > 45} />
        </g>
        <g transform={`translate(770, ${1170 + 60 * (1 - popIn(f, 8, 12))}) scale(0.72)`}>
          <Kid frame={f} smile={1} blink={f % 55 > 51} />
        </g>
        <g transform={`translate(${790 + 8 * Math.sin(f * 0.2)}, ${1520}) scale(${0.7 * popIn(f, 14, 10)}) rotate(${Math.sin(f * 0.2) * 8})`}>
          <Cookie bite={f > 60} />
        </g>
      </svg>
      <Title lines={["CUCI TANGAN", "PAKAI SABUN!"]} frame={f} at={4} top={170} size={116} color="#ff6fa3" />
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
        Sebelum makan, ya!
      </div>
    </AbsoluteFill>
  );
};

export const HandWashShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1c1440", overflow: "hidden" }}>
      <Audio src={staticFile("cuci_tangan_song.wav")} />
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
          <WashScene />
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
