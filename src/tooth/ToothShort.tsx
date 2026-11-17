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
import song from "../tooth_song.json";
import { Brush, Germ, Kid, Sparkle, Tooth } from "./characters";

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

const Mouth: React.FC<{ frame: number }> = ({ frame }) => {
  const teethTop = Array.from({ length: 7 });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="mouthIn" cx="0.5" cy="0.55" r="0.7">
          <stop offset="0" stopColor="#c2324f" />
          <stop offset="1" stopColor="#5a0c22" />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#mouthIn)" />
      {/* party lights */}
      {["#ffd23f", "#3ddbd9", "#ff6bd6"].map((c, i) => (
        <path
          key={c}
          d={`M${200 + i * 340},0 L${40 + i * 340 + 160 * Math.sin(frame * 0.12 + i * 2)},1500 L${360 + i * 340 + 160 * Math.sin(frame * 0.12 + i * 2)},1500 Z`}
          fill={c}
          opacity={0.13}
        />
      ))}
      {/* upper gum + teeth */}
      <path d="M-40,0 L1120,0 L1120,330 Q540,470 -40,330 Z" fill="#ff8fa6" />
      {teethTop.map((_, i) => (
        <rect key={i} x={10 + i * 152} y={240 + Math.abs(i - 3) * -14 + 30} width={136} height={170} rx={50} fill="#fbfbff" stroke="#e0e4f5" strokeWidth={6} />
      ))}
      {/* tongue */}
      <ellipse cx={540} cy={1250} rx={520} ry={260} fill="#ff6f8a" />
      <path d="M540,1060 L540,1300" stroke="#e5506f" strokeWidth={10} strokeLinecap="round" />
      {/* lower gum + teeth */}
      <path d="M-40,1920 L1120,1920 L1120,1500 Q540,1380 -40,1500 Z" fill="#ff8fa6" />
      {teethTop.map((_, i) => (
        <rect key={i} x={10 + i * 152} y={1360 - Math.abs(i - 3) * -14 - 10} width={136} height={170} rx={50} fill="#f4f1e6" stroke="#e0dcc8" strokeWidth={6} />
      ))}
    </svg>
  );
};

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

// ---------------- scenes ----------------
const SadScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = popIn(f, 0, 14);
  const sob = Math.sin(f * 0.9) * 6 * (f % 30 < 18 ? 1 : 0.3);
  const puddle = interpolate(f, [10, 100], [0.2, 1], CLAMP);
  return (
    <AbsoluteFill>
      <Bathroom tint="#a9c8e8" />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={540} cy={1330} rx={260 * puddle} ry={40 * puddle} fill="#7fd3ff" opacity={0.7} />
        <ellipse cx={540} cy={1330} rx={200} ry={30} fill="#00000022" />
        <g transform={`translate(540, ${1330 + sob}) scale(${2.6 * enter}) translate(-100,-226)`}>
          <Tooth frame={f} mood={-1} dirt={0.9} crying blink={f % 45 > 40} />
        </g>
      </svg>
      <Title lines={["KENAPA GIGI", "MENANGIS?"]} frame={f} at={4} top={190} color="#fff36b" />
    </AbsoluteFill>
  );
};

const GERMS = [
  { x: 190, y: 1000, c: "#7bd88f", d: "#2f8f4e", hat: "#ff6bd6" },
  { x: 540, y: 880, c: "#b18cff", d: "#5b34b5", hat: "#ffd23f" },
  { x: 890, y: 1010, c: "#4dd4ff", d: "#1676a8", hat: "#ff8c42" },
  { x: 330, y: 1250, c: "#ffd23f", d: "#b07d00", hat: "#4ea8ff" },
  { x: 750, y: 1260, c: "#ff8c69", d: "#b2432a", hat: "#7ae582" },
];

const PartyScene: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SC[1];
  const confetti = Array.from({ length: 36 }).map((_, i) => {
    const x = (i * 197) % 1080;
    const speed = 9 + (i % 5) * 3;
    const y = -60 + ((f * speed + i * 211) % 1700);
    const colors = ["#ffd23f", "#3ddbd9", "#ff6bd6", "#7ae582", "#ffffff"];
    return (
      <rect
        key={i}
        x={x + 20 * Math.sin(f * 0.2 + i)}
        y={y}
        width={18}
        height={30}
        rx={4}
        fill={colors[i % colors.length]}
        transform={`rotate(${f * 12 + i * 40} ${x} ${y})`}
        opacity={0.9}
      />
    );
  });
  return (
    <AbsoluteFill>
      <Mouth frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {confetti}
        {GERMS.map((gm, i) => {
          const s = popIn(f, 4 + i * 6, 10);
          const b = bounce(g + i * 3);
          return (
            <g
              key={i}
              transform={`translate(${gm.x + 18 * Math.sin(f * 0.21 + i)}, ${gm.y - 50 * b}) rotate(${12 * Math.sin(f * 0.21 + i * 1.3)}) scale(${1.55 * s * (1 + 0.08 * b)}, ${1.55 * s * (1 - 0.06 * b)})`}
            >
              <Germ frame={f} color={gm.c} dark={gm.d} seed={i * 3} hat={gm.hat} />
            </g>
          );
        })}
      </svg>
      <Title lines={["OH TIDAK!", "KUMAN BERPESTA!"]} frame={f} at={2} top={520} size={92} color="#ffffff" />
    </AbsoluteFill>
  );
};

const SCENE3_GERMS = [
  { x: 610, y: 640, c: "#7bd88f", d: "#2f8f4e", dir: [-1, -1] },
  { x: 900, y: 690, c: "#b18cff", d: "#5b34b5", dir: [1, -1] },
  { x: 600, y: 930, c: "#ffd23f", d: "#b07d00", dir: [-1, 0.3] },
  { x: 900, y: 940, c: "#ff8c69", d: "#b2432a", dir: [1, 0.2] },
];

const BrushScene: React.FC = () => {
  const f = useCurrentFrame();
  const scrub = Math.sin((f / 10) * Math.PI * 2);
  const brushX = 735 + 85 * scrub;
  const brushY = 1060 + 6 * Math.cos((f / 10) * Math.PI * 4);
  const dirt = interpolate(f, [12, 75], [0.9, 0], CLAMP);
  const mood = interpolate(f, [0, 22, 30, 60, 72], [-1, -1, 0, 0.1, 1], CLAMP);
  const foam = interpolate(f, [4, 30], [0, 1], CLAMP);
  const toothShake = 4 * scrub;
  const handX = brushX - 300;
  return (
    <AbsoluteFill>
      <Bathroom />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={740} cy={1150} rx={240} ry={34} fill="#00000022" />
        <g transform={`translate(${740 + toothShake}, 1150) scale(2.3) translate(-100,-226)`}>
          <Tooth frame={f} mood={mood} dirt={dirt} look={-0.6} blink={f % 40 > 37} />
        </g>
        {/* foam bubbles on tooth */}
        {Array.from({ length: 14 }).map((_, i) => {
          const at = 6 + i * 4;
          const s = popIn(f, at, 8) * interpolate(f, [80, 90], [1, 0.6], CLAMP);
          const x = 560 + ((i * 137) % 360);
          const y = 975 + ((i * 89) % 120);
          return <circle key={i} cx={x + 4 * Math.sin(f * 0.3 + i)} cy={y} r={(18 + (i % 4) * 8) * s} fill="white" stroke="#cfe8ff" strokeWidth={4} opacity={0.95} />;
        })}
        {/* germs being brushed away */}
        {SCENE3_GERMS.map((gm, i) => {
          const hitAt = song.popFrames[i] - SC[2];
          const t = interpolate(f, [hitAt - 12, hitAt], [0, 1], CLAMP);
          if (f > hitAt + 12) return null;
          if (f >= hitAt) {
            const p = (f - hitAt) / 12;
            const px = gm.x + gm.dir[0] * 260;
            const py = gm.y + gm.dir[1] * 260 - 120;
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
          const x = gm.x + gm.dir[0] * 260 * Easing.out(Easing.quad)(t);
          const y = gm.y + gm.dir[1] * 260 * t - 200 * Math.sin(Math.PI * t * 0.75);
          return (
            <g key={i} transform={`translate(${x},${y + 6 * Math.sin(f * 0.8 + i)}) rotate(${t * 540 * gm.dir[0]}) scale(0.9)`}>
              <Germ frame={f} color={gm.c} dark={gm.d} seed={i * 5} scared={f > 6} />
            </g>
          );
        })}
        {/* kid */}
        <g transform="translate(-40, 610) scale(1.15)">
          <Kid frame={f} smile={0.8} blink={f % 50 > 46} />
        </g>
        {/* arm to brush */}
        <path
          d={`M${-40 + 290 * 1.15},${610 + 450 * 1.15} Q${(handX + 290) / 2},${1180} ${handX},${brushY + 5}`}
          stroke="#ffb84d"
          strokeWidth={50}
          fill="none"
          strokeLinecap="round"
        />
        <g transform={`translate(${brushX}, ${brushY}) scale(-1.1, 1.1)`}>
          <Brush foam={foam} />
        </g>
        <circle cx={handX} cy={brushY + 4} r={34} fill="#f4bf94" stroke="#e39a72" strokeWidth={4} />
      </svg>
      <Title lines={["AYO SIKAT GIGI!"]} frame={f} at={2} top={200} size={104} color="#7ae582" />
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
    const r = 380 + 30 * Math.sin(f * 0.2 + i);
    const tw = 0.5 + 0.5 * Math.sin(f * 0.35 + i * 1.7);
    return (
      <g key={i} transform={`translate(${540 + Math.cos(a) * r}, ${960 + Math.sin(a) * r * 1.05}) rotate(${f * 3 + i * 20}) scale(${tw * popIn(f, 6 + i, 10)})`}>
        <Sparkle size={34} color={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#fff36b" : "#ff9fd0"} />
      </g>
    );
  });
  return (
    <AbsoluteFill>
      <Sky frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={540} cy={1320} rx={230 - 60 * b} ry={34} fill="#00000022" />
        {sparkles}
        <g transform={`translate(540, ${1320 - 70 * b}) scale(${2.7 * enter * (1 - 0.05 * b)}, ${2.7 * enter * (1 + 0.05 * b)}) translate(-100,-226)`}>
          <Tooth frame={f} mood={1} dirt={0} shine={shine} armsUp={0.5 + 0.5 * Math.sin(f * 0.4)} blink={f % 48 > 45} />
        </g>
        <g transform={`translate(760, ${1190 + 60 * (1 - popIn(f, 8, 12))}) scale(0.72)`}>
          <Kid frame={f} smile={1} blink={f % 55 > 51} />
        </g>
      </svg>
      <Title lines={["SIKAT GIGI", "SETIAP HARI!"]} frame={f} at={4} top={180} size={120} color="#ff6fa3" />
      <div
        style={{
          position: "absolute",
          top: 470,
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
        Pagi dan malam, ya!
      </div>
    </AbsoluteFill>
  );
};

export const ToothShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1c1440", overflow: "hidden" }}>
      <Audio src={staticFile("tooth_song.wav")} />
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
          <BrushScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[3]} durationInFrames={END - SC[3]} layout="absolute-fill">
        <SceneIn>
          <HappyScene />
        </SceneIn>
      </Sequence>
      <Lyrics frame={frame} />
      <AbsoluteFill style={{ background: "white", opacity: interpolate(frame, [END - 10, END], [0, 0.0], CLAMP) }} />
    </AbsoluteFill>
  );
};
