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
import { Bear, Block, Cookie, MagicStar } from "./characters";

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

const Flying: React.FC<{ f: number; start: number; from: [number, number]; to: [number, number]; h: number; len?: number; children: React.ReactNode; spin?: number }> = ({
  f,
  start,
  from,
  to,
  h,
  len = 22,
  children,
  spin = 360,
}) => {
  const p = interpolate(f, [start, start + len], [0, 1], CLAMP);
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p - h * 4 * p * (1 - p);
  return <g transform={`translate(${x},${y}) rotate(${spin * p})`}>{children}</g>;
};

// ---------------- cosy room ----------------
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
const FLOOR = 1500;

const Room: React.FC<{ frame: number; glow: number }> = ({ frame, glow }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="tkwall" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={mix("#8e88ad", "#ffd8a8", glow)} />
        <stop offset="1" stopColor={mix("#b3aec8", "#fff4e0", glow)} />
      </linearGradient>
      <linearGradient id="tksky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={mix("#2b2d42", "#3b5bdb", glow)} />
        <stop offset="1" stopColor={mix("#4a4e69", "#91a7ff", glow)} />
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#tkwall)" />
    {/* wallpaper dots */}
    {Array.from({ length: 6 }).map((_, r) =>
      Array.from({ length: 6 }).map((__, c) => (
        <circle key={`${r}-${c}`} cx={90 + c * 180 + (r % 2) * 90} cy={120 + r * 220} r={10} fill="#ffffff" opacity={0.25} />
      )),
    )}
    {/* window */}
    <rect x={250} y={500} width={580} height={600} rx={40} fill="url(#tksky)" stroke="#ffffff" strokeWidth={22} />
    <rect x={530} y={500} width={20} height={600} fill="#ffffff" />
    <rect x={250} y={790} width={580} height={20} fill="#ffffff" />
    {[[320, 580], [760, 640], [380, 1000], [720, 980], [300, 860]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={5 + 2 * Math.sin(frame * 0.2 + i)} fill="#fff9db" opacity={0.3 + 0.7 * glow} />
    ))}
    {/* curtains */}
    <path d={`M200,480 Q250,800 ${215 + 6 * Math.sin(frame * 0.05)},1130 L150,1130 L150,480 Z`} fill="#ff8fab" />
    <path d={`M880,480 Q830,800 ${865 - 6 * Math.sin(frame * 0.05)},1130 L930,1130 L930,480 Z`} fill="#ff8fab" />
    <rect x={130} y={462} width={820} height={26} rx={13} fill="#c2255c" />
    {/* floor + rug */}
    <rect x={0} y={1300} width={1080} height={620} fill={mix("#8d7b68", "#e9b97a", glow)} />
    <rect x={0} y={1300} width={1080} height={16} fill={mix("#6d5d4d", "#c98b4a", glow)} />
    <ellipse cx={540} cy={FLOOR + 10} rx={480} ry={90} fill={mix("#9d8fb3", "#b197fc", glow)} />
    <ellipse cx={540} cy={FLOOR + 10} rx={400} ry={66} fill="none" stroke="#ffffff" strokeWidth={8} strokeDasharray="20 18" opacity={0.6} />
  </svg>
);

const Bubble: React.FC<{ f: number; at: number; x: number; y: number; text: string; color?: string; size?: number }> = ({
  f,
  at,
  x,
  y,
  text,
  color = "#ff4f8b",
  size = 84,
}) => {
  const w = text.length * size * 0.33 + 70;
  return (
    <g transform={`translate(${x}, ${y}) scale(${popIn(f, at, 8)}) rotate(-5)`}>
      <rect x={-w} y={-size * 0.85} width={2 * w} height={size * 1.7} rx={size * 0.6} fill="#fff36b" stroke="#2d1b69" strokeWidth={8} />
      <path d={`M-30,${size * 0.8} L-60,${size * 1.4} L10,${size * 0.82}`} fill="#fff36b" stroke="#2d1b69" strokeWidth={8} strokeLinejoin="round" />
      <text textAnchor="middle" y={size * 0.34} fontFamily={FONT} fontWeight={700} fontSize={size} fill={color} stroke="#2d1b69" strokeWidth={6} paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

const KidAt: React.FC<{ f: number; x: number; y: number; smile: number; hand?: [number, number]; enter?: number }> = ({ f, x, y, smile, hand, enter = 1 }) => {
  const [hx, hy] = hand ?? [370, 560];
  return (
    <g transform={`translate(${x}, ${y}) scale(${0.62 * enter}) translate(-200,-620)`}>
      <Kid frame={f} smile={smile} blink={f % 52 > 48} />
      <path d={`M288,450 Q${(288 + hx) / 2 + 40},${(450 + hy) / 2 - 20} ${hx},${hy}`} stroke="#ffb84d" strokeWidth={46} fill="none" strokeLinecap="round" />
    </g>
  );
};

const SadScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = popIn(f, 0, 14);
  return (
    <AbsoluteFill>
      <Room frame={f} glow={0} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540, ${880 + 10 * Math.sin(f * 0.12)}) scale(${1.45 * enter}) rotate(${6 * Math.sin(f * 0.1)})`}>
          <MagicStar frame={f} mood={-1} glow={0} crying blink={f % 45 > 41} />
        </g>
        <KidAt f={f} x={300} y={FLOOR} smile={-0.2} />
        <g transform={`translate(800, ${FLOOR}) scale(-0.85, 0.85)`}>
          <Bear frame={f} mood={-0.6} blink={f % 50 > 46} />
        </g>
      </svg>
      <Title lines={["KATA AJAIB", "APA ITU?"]} frame={f} at={4} top={190} size={124} color="#ffd36b" />
    </AbsoluteFill>
  );
};

const GrabScene: React.FC = () => {
  const f = useCurrentFrame();
  const grab = 10;
  const got = f >= grab + 14;
  const stomp = 57;
  const stompY = interpolate(f, [stomp - 8, stomp - 3, stomp], [0, -50, 0], CLAMP);
  const fall = interpolate(f, [stomp, stomp + 16], [0, 1], { ...CLAMP, easing: Easing.in(Easing.quad) });
  const blocks = [
    { c: "#4dabf7", l: "A", dx: 60, rot: 80 },
    { c: "#ff6b6b", l: "B", dx: -40, rot: -120 },
    { c: "#51cf66", l: "C", dx: 110, rot: 200 },
  ];
  return (
    <AbsoluteFill>
      <Room frame={f} glow={0} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(170, ${640 + 8 * Math.sin(f * 0.15)}) scale(0.55)`}>
          <MagicStar frame={f} mood={-0.8} glow={0} blink={f % 40 > 37} />
        </g>
        {/* block tower */}
        {blocks.map((b, i) => {
          const y0 = FLOOR - 45 - i * 90;
          const y = y0 + (FLOOR - 45 - y0) * fall;
          return (
            <g key={i} transform={`translate(${985 + b.dx * fall * (i / 2)}, ${y - 120 * fall * (1 - fall) * i}) rotate(${b.rot * fall * (i > 0 ? 1 : 0.1)}) scale(0.8)`}>
              <Block color={b.c} letter={b.l} />
            </g>
          );
        })}
        <KidAt f={f} x={300} y={FLOOR} smile={got ? -0.4 : 0.6} hand={got ? [360, 560] : [420, 330]} />
        {/* plate */}
        <ellipse cx={460} cy={1330} rx={70} ry={16} fill="#ffffff" stroke="#adb5bd" strokeWidth={5} opacity={got ? 0 : 1} />
        <Flying f={f} start={grab} from={[460, 1300]} to={[640, 1290]} h={120} len={14} spin={360}>
          <g transform="scale(0.8)">
            <Cookie />
          </g>
        </Flying>
        <g transform={`translate(780, ${FLOOR + stompY}) scale(-0.85, 0.85)`}>
          <Bear frame={f} mood={-1} armUp={got ? 0.35 : interpolate(f, [0, grab], [0, 0.3], CLAMP)} blink={f % 48 > 45} />
        </g>
        {f >= 18 && f < 52 && <Bubble f={f} at={18} x={760} y={900} text="MAU!" />}
        {f >= 60 && <Bubble f={f} at={62} x={720} y={900} text="HMPH!" color="#ff922b" />}
      </svg>
      <Title lines={["LUPA BILANG", "TOLONG!"]} frame={f} at={2} top={190} size={116} color="#ffffff" />
    </AbsoluteFill>
  );
};

const WORDS = ["TOLONG", "MAAF", "TERIMA KASIH"];

const MagicScene: React.FC = () => {
  const f = useCurrentFrame();
  const hits = song.popFrames.map((p) => p - SC[2]);
  const said = hits.filter((h) => f >= h).length;
  const glow = interpolate(f, [hits[0], hits[2] + 10], [0.05, 0.7], CLAMP);
  const starPulse = Math.max(0, ...hits.map((h) => interpolate(f - h, [0, 3, 10], [0, 1, 0], CLAMP)));
  const pos: [number, number][] = [
    [330, 1040],
    [760, 910],
    [540, 785],
  ];
  return (
    <AbsoluteFill>
      <Room frame={f} glow={glow * 0.6} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540, ${545 + 6 * Math.sin(f * 0.15)}) scale(${0.6 + 0.08 * said + 0.08 * starPulse})`}>
          <MagicStar frame={f} mood={-0.6 + 0.55 * said} glow={glow} blink={f % 44 > 41} />
        </g>
        {hits.map((h, i) =>
          f >= h ? (
            <g key={i}>
              <Bubble f={f} at={h} x={pos[i][0]} y={pos[i][1]} text={WORDS[i]} size={i === 2 ? 70 : 78} color={["#ff4f8b", "#4c6ef5", "#2f9e44"][i]} />
              {f < h + 16 && (
                <g transform={`translate(${pos[i][0] + (540 - pos[i][0]) * ((f - h) / 16)}, ${pos[i][1] + (545 - pos[i][1]) * ((f - h) / 16)}) rotate(${f * 12})`}>
                  <Sparkle size={34} color="#fff36b" />
                </g>
              )}
            </g>
          ) : null,
        )}
        <KidAt f={f} x={300} y={FLOOR - 14 * bounce(f + SC[2])} smile={1} hand={[400, 300]} />
        <g transform={`translate(800, ${FLOOR}) scale(-0.85, 0.85)`}>
          <Bear frame={f} mood={-0.6 + 0.5 * said} blink={f % 50 > 46} />
        </g>
      </svg>
      <Title lines={["UCAPKAN", "KATA AJAIB!"]} frame={f} at={2} top={180} size={112} color="#ffd36b" />
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
    const r = 260 + 24 * Math.sin(f * 0.2 + i);
    const tw = 0.5 + 0.5 * Math.sin(f * 0.35 + i * 1.7);
    return (
      <g key={i} transform={`translate(${540 + Math.cos(a) * r}, ${840 + Math.sin(a) * r * 0.75}) rotate(${f * 3 + i * 20}) scale(${tw * popIn(f, 6 + i, 10)})`}>
        <Sparkle size={30} color={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#fff36b" : "#ffb3d1"} />
      </g>
    );
  });
  return (
    <AbsoluteFill>
      <Room frame={f} glow={1} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {sparkles}
        <g transform={`translate(540, ${850 - 20 * b}) scale(${1.05 * enter}) rotate(${5 * Math.sin(f * 0.15)})`}>
          <MagicStar frame={f} mood={1} glow={1} blink={f % 50 > 47} />
        </g>
        <ellipse cx={320} cy={FLOOR} rx={130 - 30 * b} ry={20} fill="#00000022" />
        <KidAt f={f} x={320} y={FLOOR - 90 * b} smile={1} hand={[400, 290 - 30 * b]} enter={enter} />
        <ellipse cx={780} cy={FLOOR} rx={130 - 30 * bounce(g + 7)} ry={20} fill="#00000022" />
        <g transform={`translate(780, ${FLOOR - 70 * (f < 100 ? bounce(g + 7) : 0)}) scale(${-0.85 * enter}, ${0.85 * enter})`}>
          <Bear frame={f} mood={1} armUp={0.4} blink={f % 46 > 43} />
        </g>
        <g transform={`translate(${615}, ${FLOOR - 270 - 60 * (f < 100 ? bounce(g + 7) : 0)}) scale(${0.7 * popIn(f, 10, 10)})`}>
          <Cookie bite />
        </g>
      </svg>
      <Title lines={["KATA AJAIB,", "HATI SENANG!"]} frame={f} at={4} top={170} size={108} color="#ffd36b" />
      <div
        style={{
          position: "absolute",
          top: 432,
          left: 90,
          right: 90,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 50,
          lineHeight: 1.15,
          color: "#2d1b69",
          background: "rgba(255,255,255,0.93)",
          border: "5px solid #2d1b69",
          borderRadius: 40,
          padding: "12px 24px 16px",
          zIndex: 2,
          opacity: interpolate(f, [18, 26], [0, 1], CLAMP),
          translate: `0px ${interpolate(f, [18, 26], [20, 0], CLAMP)}px`,
        }}
      >
        Ucapkan tolong, maaf,
        <br />
        dan terima kasih!
      </div>
    </AbsoluteFill>
  );
};

export const MagicWordsShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1c1440", overflow: "hidden" }}>
      <Audio src={staticFile("terima_kasih_song.wav")} />
      <Sequence from={SC[0]} durationInFrames={SC[1] - SC[0]} layout="absolute-fill">
        <SceneIn>
          <SadScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[1]} durationInFrames={SC[2] - SC[1]} layout="absolute-fill">
        <SceneIn>
          <GrabScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[2]} durationInFrames={SC[3] - SC[2]} layout="absolute-fill">
        <SceneIn>
          <MagicScene />
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
