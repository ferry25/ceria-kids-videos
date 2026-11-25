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
import { Ball, Block } from "../tidur-siang/characters";
import { Bear, ToyBox, ToyCar } from "./characters";

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

// ---------------- room ----------------
const Playroom: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="pwall" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#b8e6ff" />
        <stop offset="1" stopColor="#f2fbff" />
      </linearGradient>
      <pattern id="pstripe" width="90" height="90" patternUnits="userSpaceOnUse">
        <rect width="45" height="90" fill="#ffffff" opacity="0.25" />
      </pattern>
    </defs>
    <rect width="1080" height="1920" fill="url(#pwall)" />
    <rect width="1080" height="1360" fill="url(#pstripe)" />
    {/* bunting */}
    <path d="M0,560 Q540,660 1080,560" stroke="#8f5a2b" strokeWidth={5} fill="none" />
    {Array.from({ length: 9 }).map((_, i) => {
      const x = 60 + i * 120;
      const y = 560 + 100 * (1 - Math.pow((x - 540) / 540, 2)) - 2;
      const c = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#b197fc"][i % 5];
      return <path key={i} d={`M${x - 34},${y} L${x + 34},${y} L${x},${y + 70} Z`} fill={c} transform={`rotate(${3 * Math.sin(frame * 0.1 + i)} ${x} ${y})`} />;
    })}
    {/* shelf */}
    <rect x={80} y={860} width={300} height={26} rx={8} fill="#c98a4b" stroke="#8f5a2b" strokeWidth={5} />
    <rect x={110} y={790} width={60} height={70} rx={10} fill="#ffa8a8" />
    <rect x={190} y={760} width={50} height={100} rx={10} fill="#a5d8ff" />
    <circle cx={300} cy={820} r={40} fill="#b2f2bb" />
    {/* floor */}
    <rect x={0} y={1360} width={1080} height={560} fill="#f0c48f" />
    <rect x={0} y={1360} width={1080} height={30} fill="#d9a36a" />
    {[1450, 1560, 1690, 1830].map((y) => (
      <path key={y} d={`M0,${y} L1080,${y}`} stroke="#e0ad75" strokeWidth={4} />
    ))}
    <ellipse cx={540} cy={1560} rx={440} ry={120} fill="#c5f6fa" opacity={0.85} />
  </svg>
);

const Mess: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <g transform={`translate(80,1520) rotate(-12)`}>
      <Block color="#ff6b6b" letter="A" />
    </g>
    <g transform={`translate(880,1480) rotate(18)`}>
      <Block color="#69db7c" letter="C" />
    </g>
    <g transform={`translate(310,1610) rotate(-160) scale(0.8)`}>
      <ToyCar spin={0} />
    </g>
    <g transform={`translate(820,1590) scale(0.8)`}>
      <Ball spin={f * 2} />
    </g>
    <g transform={`translate(640,1430) rotate(40) scale(0.8)`}>
      <Block color="#4dabf7" letter="B" />
    </g>
  </g>
);

const SadScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = popIn(f, 0, 14);
  return (
    <AbsoluteFill>
      <Playroom frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Mess f={f} />
        <g transform={`translate(540, ${1250 + 5 * Math.sin(f * 0.4)}) scale(${1.45 * enter}) rotate(${3 * Math.sin(f * 0.25)})`}>
          <Bear frame={f} mood={-1} crying blink={f % 45 > 41} />
        </g>
      </svg>
      <Title lines={["KOK MAINAN", "MENANGIS?"]} frame={f} at={4} top={190} size={116} color="#ffd36b" />
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

const PlayScene: React.FC = () => {
  const f = useCurrentFrame();
  const ouch = f >= 66 && f < 86;
  const jump = ouch ? 60 * Math.sin(((f - 66) / 20) * Math.PI) : 30 * Math.abs(Math.sin(f * 0.3));
  return (
    <AbsoluteFill>
      <Playroom frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* toys tossed everywhere */}
        <Flying f={f} start={6} from={[520, 1300]} to={[120, 1560]} h={420}>
          <g transform="translate(-55,55)">
            <Block color="#ff6b6b" letter="A" />
          </g>
        </Flying>
        <Flying f={f} start={18} from={[540, 1300]} to={[900, 1500]} h={500} spin={-540}>
          <ToyCar spin={f * 20} />
        </Flying>
        <Flying f={f} start={34} from={[560, 1300]} to={[860, 1640]} h={380}>
          <Ball spin={f * 10} />
        </Flying>
        <Flying f={f} start={48} from={[540, 1300]} to={[300, 1640]} h={300} spin={200}>
          <g transform="translate(-55,55)">
            <Block color="#4dabf7" letter="B" />
          </g>
        </Flying>
        {/* block on the floor she steps on */}
        <g transform="translate(560,1600) rotate(10) scale(0.7)">
          <Block color="#69db7c" letter="C" />
        </g>
        {/* the bear, ignored on the floor */}
        <g transform={`translate(160, 1250) scale(0.7) rotate(-14)`}>
          <Bear frame={f} mood={-0.8} blink={f % 40 > 37} />
        </g>
        <g transform={`translate(${ouch ? 600 : 540 + 40 * Math.sin(f * 0.08)}, ${1560 - jump}) scale(0.72) rotate(${ouch ? 8 * Math.sin(f * 1.2) : 4 * Math.sin(f * 0.3)}) translate(-200,-620)`}>
          <Kid frame={f} smile={ouch ? 0.1 : 0.9} blink={ouch || f % 50 > 46} />
          <path d={`M288,450 Q${350 + (ouch ? 30 : 0)},${ouch ? 360 : 400} ${360 + (ouch ? 20 : 0)},${ouch ? 300 : 340}`} stroke="#ffb84d" strokeWidth={46} fill="none" strokeLinecap="round" />
        </g>
        {ouch && (
          <g transform={`translate(800, 1180) scale(${popIn(f, 66, 8)}) rotate(-8)`}>
            <path d="M-150,-70 L150,-70 L120,70 L-130,60 Z" fill="#fff36b" stroke="#2d1b69" strokeWidth={8} strokeLinejoin="round" />
            <text textAnchor="middle" y={28} fontFamily={FONT} fontWeight={700} fontSize={96} fill="#ff4f8b" stroke="#2d1b69" strokeWidth={6} paintOrder="stroke">
              ADUH!
            </text>
          </g>
        )}
      </svg>
      <Title lines={["HABIS MAIN,", "DITINGGAL!"]} frame={f} at={2} top={180} size={112} color="#ffffff" />
    </AbsoluteFill>
  );
};

const TidyScene: React.FC = () => {
  const f = useCurrentFrame();
  const hits = song.popFrames.map((p) => p - SC[2]);
  const BOX: [number, number] = [740, 1440];
  const toys = [
    { from: [130, 1580] as [number, number], el: <g transform="translate(-55,55)"><Block color="#ff6b6b" letter="A" /></g> },
    { from: [300, 1640] as [number, number], el: <ToyCar /> },
    { from: [420, 1660] as [number, number], el: <Ball spin={0} /> },
  ];
  const lastHit = Math.max(...hits.filter((h) => f >= h - 12), -100);
  const reach = interpolate(f - lastHit, [-12, 0, 10], [1, 0, 0.3], CLAMP);
  const inBox = hits.filter((h) => f >= h).length;
  return (
    <AbsoluteFill>
      <Playroom frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(900, 1150) scale(0.7)`}>
          <Bear frame={f} mood={0.2 + 0.25 * inBox} blink={f % 44 > 41} />
        </g>
        {/* toys peeking out of the box */}
        {inBox > 0 && <circle cx={BOX[0] - 60} cy={BOX[1] - 150} r={40} fill="#ff6b6b" stroke="#2d1b69" strokeWidth={5} />}
        {inBox > 1 && <rect x={BOX[0] - 20} y={BOX[1] - 196} width={70} height={60} rx={10} fill="#4dabf7" stroke="#1f6fb0" strokeWidth={5} />}
        {inBox > 2 && <circle cx={BOX[0] + 80} cy={BOX[1] - 150} r={36} fill="#ffe066" stroke="#c49a00" strokeWidth={5} />}
        <g transform={`translate(${BOX[0]},${BOX[1]}) scale(${1 + 0.06 * Math.max(0, ...hits.map((h) => interpolate(f - h, [0, 3, 10], [0, 1, 0], CLAMP)))})`}>
          <ToyBox frame={f} smile={0.3 + 0.25 * inBox} />
        </g>
        {toys.map((t, i) => {
          const h = hits[i];
          if (f >= h) return null;
          const start = h - 16;
          return (
            <Flying key={i} f={f} start={start} from={t.from} to={[BOX[0], BOX[1] - 140]} h={360} len={16}>
              <g transform={`scale(${interpolate(f, [h - 4, h], [1, 0.6], CLAMP)})`}>{t.el}</g>
            </Flying>
          );
        })}
        {hits.map((h, i) =>
          f >= h && f < h + 18 ? (
            <g key={i} transform={`translate(${BOX[0] - 60 + i * 60}, ${BOX[1] - 230 - (f - h) * 4}) scale(${popIn(f, h, 6)})`} opacity={1 - (f - h) / 18}>
              <Sparkle size={40} color={i % 2 ? "#ffffff" : "#fff36b"} />
            </g>
          ) : null,
        )}
        {/* kid tossing toys in */}
        <g transform={`translate(330, ${1500 - 16 * bounce(f + SC[2])}) scale(0.72) translate(-200,-620)`}>
          <Kid frame={f} smile={1} blink={f % 52 > 48} />
          <path d={`M288,450 Q${360 + 40 * reach},${420 + 140 * reach} ${400 + 30 * reach},${330 + 260 * reach}`} stroke="#ffb84d" strokeWidth={46} fill="none" strokeLinecap="round" />
        </g>
      </svg>
      <Title lines={["AYO RAPIKAN", "MAINANMU!"]} frame={f} at={2} top={180} size={112} color="#ffd36b" />
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
    const r = 380 + 30 * Math.sin(f * 0.2 + i);
    const tw = 0.5 + 0.5 * Math.sin(f * 0.35 + i * 1.7);
    return (
      <g key={i} transform={`translate(${540 + Math.cos(a) * r}, ${1150 + Math.sin(a) * r * 1.0}) rotate(${f * 3 + i * 20}) scale(${tw * popIn(f, 6 + i, 10)})`}>
        <Sparkle size={34} color={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#fff36b" : "#ffb3d1"} />
      </g>
    );
  });
  return (
    <AbsoluteFill>
      <Playroom frame={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {sparkles}
        <g transform={`translate(860, 1520) scale(${0.75 * popIn(f, 8, 12)})`}>
          <circle cx={-60} cy={-150} r={40} fill="#ff6b6b" stroke="#2d1b69" strokeWidth={5} />
          <rect x={-20} y={-196} width={70} height={60} rx={10} fill="#4dabf7" stroke="#1f6fb0" strokeWidth={5} />
          <circle cx={80} cy={-150} r={36} fill="#ffe066" stroke="#c49a00" strokeWidth={5} />
          <ToyBox frame={f} smile={1} />
        </g>
        <ellipse cx={500} cy={1540} rx={170 - 50 * b} ry={28} fill="#00000022" />
        <g transform={`translate(500, ${1540 - 110 * b}) scale(${0.78 * enter}) translate(-200,-620)`}>
          <Kid frame={f} smile={1} blink={f % 55 > 51} />
          <path d={`M288,450 Q360,${380 - 20 * b} 370,${290 - 30 * b}`} stroke="#ffb84d" strokeWidth={46} fill="none" strokeLinecap="round" />
        </g>
        <g transform={`translate(190, ${1420 - 50 * bounce(g + 7)}) scale(${0.72 * popIn(f, 6, 12)}) rotate(-5)`}>
          <Bear frame={f} mood={1} blink={f % 48 > 45} wave={1} />
        </g>
      </svg>
      <Title lines={["KAMAR RAPI,", "HATI SENANG!"]} frame={f} at={4} top={170} size={110} color="#ffd36b" />
      <div
        style={{
          position: "absolute",
          top: 445,
          left: 60,
          right: 60,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 58,
          color: "#2d1b69",
          opacity: interpolate(f, [18, 26], [0, 1], CLAMP),
          translate: `0px ${interpolate(f, [18, 26], [20, 0], CLAMP)}px`,
        }}
      >
        Rapikan mainan setelah bermain!
      </div>
    </AbsoluteFill>
  );
};

export const TidyToysShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1c1440", overflow: "hidden" }}>
      <Audio src={staticFile("rapikan_mainan_song.wav")} />
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
          <TidyScene />
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
