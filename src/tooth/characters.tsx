import React from "react";

const TOOTH_PATH =
  "M40,30 C60,5 90,15 100,25 C110,15 140,5 160,30 C185,60 178,110 166,135 C158,155 160,200 146,214 C131,226 122,190 116,162 C111,146 89,146 84,162 C78,190 69,226 54,214 C40,200 42,155 34,135 C22,110 15,60 40,30 Z";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Tooth character drawn in a 200x230 box, origin at the top-left.
 * mood: -1 sad … 0 surprised … 1 happy. dirt: 0 clean … 1 dirty.
 */
export const Tooth: React.FC<{
  frame: number;
  mood: number;
  dirt?: number;
  crying?: boolean;
  shine?: number;
  blink?: boolean;
  look?: number;
  armsUp?: number;
}> = ({ frame, mood, dirt = 0, crying = false, shine = 0, blink = false, look = 0, armsUp = 0 }) => {
  const sad = Math.max(0, -mood);
  const happy = Math.max(0, mood);
  const tears = [];
  if (crying) {
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k < 4; k++) {
        const period = 22;
        const t = ((frame + k * (period / 4) + side * 7) % period) / period;
        const ex = side === 0 ? 62 : 138;
        tears.push(
          <path
            key={`${side}-${k}`}
            d="M0,-9 C5,-2 7,3 7,6 A7,7 0 1 1 -7,6 C-7,3 -5,-2 0,-9 Z"
            transform={`translate(${ex + (side ? 1 : -1) * 10 * t}, ${100 + 120 * t * t}) scale(${1 - 0.3 * t})`}
            fill="#7fd3ff"
            stroke="#3aa8e8"
            strokeWidth={1.5}
            opacity={1 - t * 0.6}
          />,
        );
      }
    }
  }
  const eyeH = blink ? 3 : 22 + 3 * happy;
  const browTilt = 14 * sad - 4 * happy;
  const mouthY = 150;
  const curve = lerp(0, 22, happy) - 16 * sad;
  const openMouth = happy > 0.55 || Math.abs(mood) < 0.25;

  const armL = -30 - 110 * armsUp;
  return (
    <g>
      {/* arms */}
      <g transform={`translate(30,118) rotate(${armL})`}>
        <rect x={-42} y={-9} width={46} height={18} rx={9} fill="#f3f6ff" stroke="#c9d3ee" strokeWidth={3} />
        <circle cx={-44} cy={0} r={12} fill="#fff" stroke="#c9d3ee" strokeWidth={3} />
      </g>
      <g transform={`translate(170,118) rotate(${-armL}) scale(-1,1)`}>
        <rect x={-42} y={-9} width={46} height={18} rx={9} fill="#f3f6ff" stroke="#c9d3ee" strokeWidth={3} />
        <circle cx={-44} cy={0} r={12} fill="#fff" stroke="#c9d3ee" strokeWidth={3} />
      </g>
      <defs>
        <linearGradient id="toothBody" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.65" stopColor="#f1f4ff" />
          <stop offset="1" stopColor="#cfd8f2" />
        </linearGradient>
        <clipPath id="toothClip">
          <path d={TOOTH_PATH} />
        </clipPath>
      </defs>
      <path d={TOOTH_PATH} fill="url(#toothBody)" stroke="#b9c4e4" strokeWidth={4} />
      {/* dirt stains */}
      <g clipPath="url(#toothClip)" opacity={dirt}>
        <ellipse cx={55} cy={60} rx={20} ry={14} fill="#d6b45a" opacity={0.75} />
        <ellipse cx={150} cy={170} rx={16} ry={20} fill="#c99d43" opacity={0.7} />
        <ellipse cx={135} cy={45} rx={12} ry={9} fill="#b58a3a" opacity={0.6} />
        <ellipse cx={70} cy={185} rx={14} ry={11} fill="#c49846" opacity={0.65} />
        <circle cx={160} cy={110} r={8} fill="#8f6b2e" opacity={0.6} />
      </g>
      {/* shine sweep */}
      <g clipPath="url(#toothClip)">
        <rect
          x={-120 + 420 * shine}
          y={-40}
          width={40}
          height={320}
          fill="white"
          opacity={shine > 0 && shine < 1 ? 0.85 : 0}
          transform={`rotate(20 100 115)`}
        />
        <ellipse cx={58} cy={48} rx={14} ry={22} fill="white" opacity={0.9} transform="rotate(-25 58 48)" />
      </g>
      {/* cheeks */}
      <ellipse cx={46} cy={135} rx={15} ry={9} fill="#ffb3c7" opacity={0.75} />
      <ellipse cx={154} cy={135} rx={15} ry={9} fill="#ffb3c7" opacity={0.75} />
      {/* eyes */}
      {[72, 128].map((ex, i) => (
        <g key={ex} transform={`translate(${ex}, 98)`}>
          <ellipse rx={18} ry={eyeH} fill="#3b2418" />
          {!blink && (
            <>
              <ellipse cx={look * 4} cy={2} rx={11} ry={eyeH * 0.55} fill="#7a4a2c" />
              <circle cx={-6 + look * 3} cy={-8} r={6} fill="white" />
              <circle cx={5 + look * 3} cy={7} r={3} fill="white" opacity={0.8} />
              {crying && <ellipse cx={0} cy={eyeH - 4} rx={15} ry={5} fill="#9fe0ff" opacity={0.8} />}
            </>
          )}
          {/* brow */}
          <path
            d="M-16,0 Q0,-6 16,0"
            transform={`translate(0, ${-eyeH - 12}) rotate(${i === 0 ? browTilt : -browTilt})`}
            stroke="#8a5a3a"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
      {/* mouth */}
      {openMouth ? (
        Math.abs(mood) < 0.25 ? (
          <ellipse cx={100} cy={mouthY + 4} rx={10} ry={13} fill="#7a2638" />
        ) : (
          <g>
            <path
              d={`M76,${mouthY - 2} Q100,${mouthY + 2 + curve * 1.6} 124,${mouthY - 2} Z`}
              fill="#7a2638"
            />
            <path d={`M88,${mouthY + 10 + curve * 0.5} Q100,${mouthY + 2} 112,${mouthY + 10 + curve * 0.5} Q100,${mouthY + 6 + curve * 0.75} 88,${mouthY + 10 + curve * 0.5} Z`} fill="#ff7d94" />
          </g>
        )
      ) : (
        <path
          d={`M82,${mouthY} Q100,${mouthY + curve} 118,${mouthY}`}
          stroke="#7a2638"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {tears}
    </g>
  );
};

/** Germ drawn around (0,0), ~ 120px across. */
export const Germ: React.FC<{
  frame: number;
  color: string;
  dark: string;
  seed: number;
  hat?: string;
  scared?: boolean;
}> = ({ frame, color, dark, seed, hat, scared = false }) => {
  const pts = [];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 52 + 5 * Math.sin(frame * 0.35 + i * 1.7 + seed) + (i % 2 ? 7 : 0);
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  let d = "";
  for (let i = 0; i < N; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % N];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    d += i === 0 ? `M${mx},${my}` : "";
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    d += ` Q${p2[0]},${p2[1]} ${(p2[0] + p3[0]) / 2},${(p2[1] + p3[1]) / 2}`;
  }
  const blink = (frame + seed * 7) % 50 < 3;
  return (
    <g>
      {/* feet */}
      <ellipse cx={-20} cy={56} rx={14} ry={9} fill={dark} />
      <ellipse cx={20} cy={56} rx={14} ry={9} fill={dark} />
      <path d={d + " Z"} fill={color} stroke={dark} strokeWidth={5} />
      {/* spots */}
      <circle cx={-28} cy={20} r={7} fill={dark} opacity={0.35} />
      <circle cx={30} cy={-24} r={5} fill={dark} opacity={0.35} />
      {/* eyes */}
      {[-17, 17].map((ex) => (
        <g key={ex} transform={`translate(${ex}, -8)`}>
          <ellipse rx={13} ry={blink ? 2 : scared ? 17 : 15} fill="white" stroke={dark} strokeWidth={3} />
          {!blink && <circle cx={ex > 0 ? -2 : 2} cy={2} r={scared ? 4 : 7} fill="#1d1430" />}
        </g>
      ))}
      {/* brows: mischievous */}
      {!scared && (
        <>
          <path d="M-30,-30 L-6,-22" stroke={dark} strokeWidth={5} strokeLinecap="round" />
          <path d="M30,-30 L6,-22" stroke={dark} strokeWidth={5} strokeLinecap="round" />
        </>
      )}
      {/* mouth */}
      {scared ? (
        <ellipse cx={0} cy={24} rx={10} ry={13} fill="#3a0f2a" />
      ) : (
        <g>
          <path d="M-22,14 Q0,40 22,14 Z" fill="#3a0f2a" />
          <rect x={-10} y={14} width={8} height={8} fill="white" />
          <rect x={3} y={14} width={8} height={8} fill="white" />
        </g>
      )}
      {hat && (
        <g transform="translate(6,-50) rotate(12)">
          <path d="M-22,8 L0,-52 L22,8 Z" fill={hat} stroke="#00000033" strokeWidth={3} />
          <path d="M-14,-12 L14,-12" stroke="white" strokeWidth={6} opacity={0.8} />
          <path d="M-7,-32 L7,-32" stroke="white" strokeWidth={5} opacity={0.8} />
          <circle cx={0} cy={-54} r={9} fill="#fff36b" />
        </g>
      )}
    </g>
  );
};

/** Kid (original design: girl with two puffs), drawn in a 400x620 box. */
export const Kid: React.FC<{ frame: number; smile?: number; blink?: boolean; armAngle?: number }> = ({
  frame,
  smile = 1,
  blink = false,
  armAngle = 0,
}) => {
  const breathe = Math.sin(frame * 0.15) * 3;
  return (
    <g>
      {/* body */}
      <path d={`M80,620 C80,420 120,${380 + breathe} 200,${380 + breathe} C280,${380 + breathe} 320,420 320,620 Z`} fill="#ffb84d" />
      <path d={`M140,${392 + breathe} Q200,${440 + breathe} 260,${392 + breathe}`} stroke="#ff9a1f" strokeWidth={10} fill="none" strokeLinecap="round" />
      <circle cx={200} cy={500} r={34} fill="#fff3d6" />
      <path d="M186,500 l10,10 l18,-20" stroke="#ff9a1f" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* left arm (resting) */}
      <path d="M112,450 Q70,520 96,600" stroke="#ffb84d" strokeWidth={46} fill="none" strokeLinecap="round" />
      {/* puffs */}
      <circle cx={70} cy={120} r={62} fill="#3a2418" />
      <circle cx={330} cy={120} r={62} fill="#3a2418" />
      <circle cx={92} cy={150} r={10} fill="#ff5c8a" />
      <circle cx={308} cy={150} r={10} fill="#ff5c8a" />
      {/* neck + head */}
      <rect x={176} y={330} width={48} height={50} fill="#e8a77a" />
      <circle cx={200} cy={210} r={140} fill="#f4bf94" />
      {/* hair cap + bangs */}
      <path d="M62,200 C60,90 140,58 200,58 C260,58 340,90 338,200 C320,140 280,112 240,120 C220,150 170,150 150,118 C120,126 80,150 62,200 Z" fill="#3a2418" />
      {/* ears */}
      <circle cx={62} cy={230} r={22} fill="#eaa97f" />
      <circle cx={338} cy={230} r={22} fill="#eaa97f" />
      {/* eyes */}
      {[148, 252].map((ex) => (
        <g key={ex} transform={`translate(${ex},220)`}>
          {blink ? (
            <path d="M-20,0 Q0,10 20,0" stroke="#2a1a12" strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <>
              <ellipse rx={22} ry={27} fill="#2a1a12" />
              <circle cx={-7} cy={-10} r={8} fill="white" />
              <circle cx={7} cy={8} r={4} fill="white" opacity={0.8} />
            </>
          )}
          <path d="M-22,-42 Q0,-52 22,-42" stroke="#3a2418" strokeWidth={7} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* cheeks */}
      <ellipse cx={120} cy={278} rx={24} ry={14} fill="#ff8fa3" opacity={0.6} />
      <ellipse cx={280} cy={278} rx={24} ry={14} fill="#ff8fa3" opacity={0.6} />
      {/* mouth */}
      <path d={`M165,${282} Q200,${282 + 40 * smile} 235,${282} Z`} fill="#8a2a3c" />
      <path d="M176,284 L224,284 L220,292 L180,292 Z" fill="white" opacity={smile > 0.4 ? 1 : 0} />
      <ellipse cx={200} cy={240} rx={9} ry={6} fill="#e39a72" />
      {/* right arm placeholder angle used by caller */}
      <g transform={`translate(290,450) rotate(${armAngle})`} />
    </g>
  );
};

/** Toothbrush pointing left, head at (0,0). */
export const Brush: React.FC<{ foam?: number }> = ({ foam = 0 }) => (
  <g>
    <rect x={40} y={-14} width={300} height={28} rx={14} fill="#4fc3f7" stroke="#1f8fc4" strokeWidth={4} />
    <rect x={180} y={-14} width={70} height={28} rx={10} fill="#ff6fa3" />
    <rect x={-20} y={-18} width={80} height={36} rx={14} fill="#4fc3f7" stroke="#1f8fc4" strokeWidth={4} />
    {Array.from({ length: 6 }).map((_, i) => (
      <rect key={i} x={-14 + i * 12} y={-58} width={9} height={42} rx={3} fill={i % 2 ? "#ffffff" : "#bfe9ff"} stroke="#8ccbe8" strokeWidth={2} />
    ))}
    {foam > 0 && (
      <g opacity={foam}>
        {[
          [-6, -70, 18],
          [18, -78, 22],
          [44, -70, 17],
          [6, -88, 14],
          [32, -94, 12],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r * (0.6 + 0.4 * foam)} fill="white" stroke="#cfe8ff" strokeWidth={3} />
        ))}
      </g>
    )}
  </g>
);

export const Sparkle: React.FC<{ size: number; color?: string }> = ({ size, color = "#fff6a8" }) => (
  <path
    d={`M0,${-size} C${size * 0.15},${-size * 0.15} ${size * 0.15},${-size * 0.15} ${size},0 C${size * 0.15},${size * 0.15} ${size * 0.15},${size * 0.15} 0,${size} C${-size * 0.15},${size * 0.15} ${-size * 0.15},${size * 0.15} ${-size},0 C${-size * 0.15},${-size * 0.15} ${-size * 0.15},${-size * 0.15} 0,${-size} Z`}
    fill={color}
  />
);
