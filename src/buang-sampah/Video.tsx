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
import { Bottle, Can, Fish, Peel, TrashBin, Wrapper } from "./characters";

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

// ---------------- park + river ----------------
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
const RIVER_Y = 1230;
const RIVER_H = 340;

const Park: React.FC<{ frame: number; clean: number }> = ({ frame, clean }) => {
  const water = mix("#7f8f5a", "#4dabf7", clean);
  const waterLight = mix("#9aa86f", "#a5d8ff", clean);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="bsky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix("#c9d3c0", "#8fd3ff", clean)} />
          <stop offset="1" stopColor={mix("#eef0e6", "#e7f8ff", clean)} />
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#bsky)" />
      {/* sun */}
      <circle cx={900} cy={140 + 4 * Math.sin(frame * 0.05)} r={70} fill="#ffe066" opacity={0.4 + 0.6 * clean} />
      {/* clouds */}
      {[[180, 640], [760, 720]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x + 10 * Math.sin(frame * 0.02 + i)},${y})`} opacity={0.9}>
          <ellipse rx={90} ry={40} fill="white" />
          <ellipse cx={-60} cy={10} rx={60} ry={30} fill="white" />
          <ellipse cx={60} cy={10} rx={60} ry={30} fill="white" />
        </g>
      ))}
      {/* hills + trees */}
      <ellipse cx={250} cy={1060} rx={500} ry={200} fill="#8ce99a" />
      <ellipse cx={850} cy={1080} rx={480} ry={180} fill="#69db7c" />
      {[90, 330, 990].map((x, i) => (
        <g key={x} transform={`translate(${x},${930 + (i % 2) * 20})`}>
          <rect x={-14} y={0} width={28} height={110} rx={8} fill="#a0612b" />
          <circle cy={-30} r={70} fill="#40c057" />
          <circle cx={-40} cy={10} r={46} fill="#37b24d" />
          <circle cx={42} cy={6} r={50} fill="#37b24d" />
        </g>
      ))}
      {/* near bank */}
      <rect x={0} y={1090} width={1080} height={RIVER_Y - 1090 + 20} fill="#51cf66" />
      {/* river */}
      <rect x={0} y={RIVER_Y} width={1080} height={RIVER_H} fill={water} />
      {[0, 1, 2].map((r) => (
        <path
          key={r}
          d={Array.from({ length: 13 })
            .map((_, k) => {
              const x = k * 90 - ((frame * (2 + r)) % 90);
              const y = RIVER_Y + 70 + r * 100;
              return `${k === 0 ? "M" : "L"}${x},${y} Q${x + 22},${y - 14} ${x + 45},${y} T${x + 90},${y}`;
            })
            .join(" ")}
          stroke={waterLight}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      {/* far bank / path */}
      <rect x={0} y={RIVER_Y + RIVER_H} width={1080} height={1920 - RIVER_Y - RIVER_H} fill="#69db7c" />
      <rect x={0} y={RIVER_Y + RIVER_H} width={1080} height={22} fill="#40c057" />
      {/* flowers appear as it gets clean */}
      {[120, 300, 760, 960].map((x, i) => (
        <g key={x} transform={`translate(${x},${1150 + (i % 2) * 30}) scale(${clean})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={14 * Math.cos((a * Math.PI) / 180)} cy={14 * Math.sin((a * Math.PI) / 180)} r={10} fill={i % 2 ? "#ffa8a8" : "#ffe066"} />
          ))}
          <circle r={8} fill="#ff922b" />
        </g>
      ))}
    </svg>
  );
};

const Floating: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <g transform={`translate(${150 + 6 * Math.sin(f * 0.1)},${RIVER_Y + 70}) rotate(${70 + 8 * Math.sin(f * 0.15)}) scale(0.8)`}>
      <Bottle />
    </g>
    <g transform={`translate(${840 + 6 * Math.sin(f * 0.12)},${RIVER_Y + 60}) rotate(${-10 + 6 * Math.sin(f * 0.2)}) scale(0.8)`}>
      <Wrapper />
    </g>
    <g transform={`translate(${880},${RIVER_Y + 250 + 6 * Math.sin(f * 0.13)}) rotate(${100}) scale(0.8)`}>
      <Can />
    </g>
    <g transform={`translate(${200},${RIVER_Y + 260 + 5 * Math.sin(f * 0.11)}) rotate(20) scale(0.8)`}>
      <Peel />
    </g>
  </g>
);

const Bubble: React.FC<{ f: number; at: number; x: number; y: number; text: string; color?: string }> = ({ f, at, x, y, text, color = "#ff4f8b" }) => (
  <g transform={`translate(${x}, ${y}) scale(${popIn(f, at, 8)}) rotate(-6)`}>
    <path d="M-170,-70 L170,-70 L140,70 L-150,60 Z" fill="#fff36b" stroke="#2d1b69" strokeWidth={8} strokeLinejoin="round" />
    <text textAnchor="middle" y={28} fontFamily={FONT} fontWeight={700} fontSize={84} fill={color} stroke="#2d1b69" strokeWidth={6} paintOrder="stroke">
      {text}
    </text>
  </g>
);

const SadScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = popIn(f, 0, 14);
  return (
    <AbsoluteFill>
      <Park frame={f} clean={0} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Floating f={f} />
        <g transform={`translate(540, ${RIVER_Y + 160 + 8 * Math.sin(f * 0.3)}) scale(${1.6 * enter}) rotate(${4 * Math.sin(f * 0.2)})`}>
          <Fish frame={f} mood={-1} crying blink={f % 45 > 41} />
        </g>
      </svg>
      <Title lines={["SUNGAI KOK", "SEDIH?"]} frame={f} at={4} top={200} size={120} color="#ffd36b" />
    </AbsoluteFill>
  );
};

const LITTER = [<Bottle key="b" />, <Wrapper key="w" />, <Can key="c" />];

const LitterScene: React.FC = () => {
  const f = useCurrentFrame();
  const tosses = [9, 33, 57];
  const hungry = f >= 72;
  return (
    <AbsoluteFill>
      <Park frame={f} clean={0} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* floating ones that already landed */}
        {tosses.map((s, i) =>
          f >= s + 16 ? (
            <g key={i} transform={`translate(${300 + i * 220 + 5 * Math.sin(f * 0.1 + i)}, ${RIVER_Y + 110 + i * 60}) rotate(${40 * i + 10 * Math.sin(f * 0.1)}) scale(0.8)`}>
              {LITTER[i]}
            </g>
          ) : null,
        )}
        {tosses.map((s, i) => (
          <Flying key={i} f={f} start={s} from={[-60, 900]} to={[300 + i * 220, RIVER_Y + 110 + i * 60]} h={300} len={16} spin={540}>
            {f < s + 16 && f >= s ? <g transform="scale(0.8)">{LITTER[i]}</g> : null}
          </Flying>
        ))}
        {/* splashes */}
        {tosses.map((s, i) =>
          f >= s + 16 && f < s + 30 ? (
            <g key={i} transform={`translate(${300 + i * 220}, ${RIVER_Y + 100 + i * 60})`} opacity={1 - (f - s - 16) / 14}>
              {[-1, -0.4, 0.4, 1].map((d) => (
                <circle key={d} cx={d * (30 + 3 * (f - s - 16))} cy={-30 - 40 * Math.sin(((f - s - 16) / 14) * Math.PI) * (1 - Math.abs(d) * 0.4)} r={12} fill="#d0ebff" />
              ))}
            </g>
          ) : null,
        )}
        {/* fish hiding, worried */}
        <g transform={`translate(160, ${RIVER_Y + 270}) scale(0.8) rotate(-8)`}>
          <Fish frame={f} mood={-0.9} blink={f % 40 > 37} />
        </g>
        {/* the hungry bin, ignored on the bank */}
        <g transform={`translate(860, ${1225 + (hungry ? 6 * Math.sin(f * 1.4) : 0)}) scale(0.75)`}>
          <TrashBin frame={f} mood={-0.7} open={0.15 + 0.15 * Math.sin(f * 0.2)} blink={f % 50 > 47} />
        </g>
        {hungry && <Bubble f={f} at={72} x={700} y={780} text="LAPAR..." color="#40c057" />}
      </svg>
      <Title lines={["SAMPAH NAKAL", "MASUK SUNGAI!"]} frame={f} at={2} top={190} size={108} color="#ffffff" />
    </AbsoluteFill>
  );
};

const BinScene: React.FC = () => {
  const f = useCurrentFrame();
  const hits = song.popFrames.map((p) => p - SC[2]);
  const BIN: [number, number] = [790, 1180];
  const items = [
    { from: [250, 1130] as [number, number], el: <Bottle /> },
    { from: [330, 1150] as [number, number], el: <Wrapper /> },
    { from: [280, 1150] as [number, number], el: <Peel /> },
  ];
  const lastHit = Math.max(...hits.filter((h) => f >= h - 14), -100);
  const reach = interpolate(f - lastHit, [-14, 0, 10], [1, 0, 0.3], CLAMP);
  const open = Math.max(0.1, ...hits.map((h) => interpolate(f - h, [-10, -2, 4, 10], [0, 1, 1, 0.1], CLAMP)));
  const eaten = hits.filter((h) => f >= h).length;
  return (
    <AbsoluteFill>
      <Park frame={f} clean={0.15 * eaten} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540, ${RIVER_Y + 200 + 6 * Math.sin(f * 0.2)}) scale(0.8)`}>
          <Fish frame={f} mood={-0.4 + 0.4 * eaten} blink={f % 44 > 41} />
        </g>
        <g transform={`translate(${BIN[0]},${BIN[1]}) scale(${0.8 * (1 + 0.05 * Math.max(0, ...hits.map((h) => interpolate(f - h, [0, 3, 10], [0, 1, 0], CLAMP))))})`}>
          <TrashBin frame={f} mood={0.2 + 0.3 * eaten} open={open} blink={f % 52 > 49} />
        </g>
        {items.map((t, i) => {
          const h = hits[i];
          if (f >= h) return null;
          const start = h - 16;
          if (f < start) {
            return (
              <g key={i} transform={`translate(${t.from[0]},${t.from[1] + 40}) scale(0.55)`}>
                {t.el}
              </g>
            );
          }
          return (
            <Flying key={i} f={f} start={start} from={t.from} to={[BIN[0], BIN[1] - 240]} h={300} len={16}>
              <g transform={`scale(${interpolate(f, [h - 4, h], [0.7, 0.4], CLAMP)})`}>{t.el}</g>
            </Flying>
          );
        })}
        {hits.map((h, i) =>
          f >= h && f < h + 18 ? (
            <g key={i} transform={`translate(${BIN[0] - 60 + i * 60}, ${BIN[1] - 300 - (f - h) * 4}) scale(${popIn(f, h, 6)})`} opacity={1 - (f - h) / 18}>
              <Sparkle size={40} color={i % 2 ? "#ffffff" : "#fff36b"} />
            </g>
          ) : null,
        )}
        {f >= hits[0] && f < hits[2] + 24 && <Bubble f={f} at={hits[0]} x={800} y={760} text="NYAM!" />}
        {/* kid tossing litter in */}
        <g transform={`translate(330, ${1220 - 16 * bounce(f + SC[2])}) scale(0.62) translate(-200,-620)`}>
          <Kid frame={f} smile={1} blink={f % 52 > 48} />
          <path d={`M288,450 Q${360 + 40 * reach},${420 + 140 * reach} ${400 + 30 * reach},${330 + 260 * reach}`} stroke="#ffb84d" strokeWidth={46} fill="none" strokeLinecap="round" />
        </g>
      </svg>
      <Title lines={["AYO BUANG KE", "TEMPATNYA!"]} frame={f} at={2} top={190} size={112} color="#ffd36b" />
    </AbsoluteFill>
  );
};

const HappyScene: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SC[3];
  const b = f < 100 ? bounce(g) : 0;
  const enter = popIn(f, 0, 14);
  const jumpP = ((f + 10) % 45) / 45;
  const jumpY = jumpP < 0.6 ? -260 * Math.sin((jumpP / 0.6) * Math.PI) : 0;
  const sparkles = Array.from({ length: 10 }).map((_, i) => {
    const a = (i / 10) * Math.PI * 2 + f * 0.02;
    const r = 360 + 30 * Math.sin(f * 0.2 + i);
    const tw = 0.5 + 0.5 * Math.sin(f * 0.35 + i * 1.7);
    return (
      <g key={i} transform={`translate(${540 + Math.cos(a) * r}, ${1050 + Math.sin(a) * r * 0.7}) rotate(${f * 3 + i * 20}) scale(${tw * popIn(f, 6 + i, 10)})`}>
        <Sparkle size={34} color={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#fff36b" : "#ffb3d1"} />
      </g>
    );
  });
  return (
    <AbsoluteFill>
      <Park frame={f} clean={1} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {sparkles}
        <g transform={`translate(840, ${1200 - 30 * bounce(g + 7)}) scale(${0.7 * popIn(f, 8, 12)})`}>
          <TrashBin frame={f} mood={1} open={0.25} blink={f % 50 > 47} />
        </g>
        <ellipse cx={420} cy={1210} rx={150 - 40 * b} ry={24} fill="#00000022" />
        <g transform={`translate(420, ${1210 - 100 * b}) scale(${0.62 * enter}) translate(-200,-620)`}>
          <Kid frame={f} smile={1} blink={f % 55 > 51} />
          <path d={`M288,450 Q360,${380 - 20 * b} 370,${290 - 30 * b}`} stroke="#ffb84d" strokeWidth={46} fill="none" strokeLinecap="round" />
        </g>
        <g transform={`translate(600, ${RIVER_Y + 200 + jumpY}) rotate(${jumpY < 0 ? -20 * Math.cos((jumpP / 0.6) * Math.PI) : 0}) scale(${0.85 * popIn(f, 4, 12)})`}>
          <Fish frame={f} mood={1} blink={f % 48 > 45} />
        </g>
        <g transform={`translate(220, ${RIVER_Y + 270 + 6 * Math.sin(f * 0.2)}) scale(${0.6 * popIn(f, 10, 12)})`}>
          <Fish frame={f} mood={1} color="#ffd43b" blink={f % 40 > 37} />
        </g>
      </svg>
      <Title lines={["BUMI BERSIH,", "HATI SENANG!"]} frame={f} at={4} top={170} size={110} color="#ffd36b" />
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
        Buang sampah pada tempatnya!
      </div>
    </AbsoluteFill>
  );
};

export const TrashShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#1c1440", overflow: "hidden" }}>
      <Audio src={staticFile("buang_sampah_song.wav")} />
      <Sequence from={SC[0]} durationInFrames={SC[1] - SC[0]} layout="absolute-fill">
        <SceneIn>
          <SadScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[1]} durationInFrames={SC[2] - SC[1]} layout="absolute-fill">
        <SceneIn>
          <LitterScene />
        </SceneIn>
      </Sequence>
      <Sequence from={SC[2]} durationInFrames={SC[3] - SC[2]} layout="absolute-fill">
        <SceneIn>
          <BinScene />
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
