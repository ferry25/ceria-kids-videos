import React from "react";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const CROWN = [
  [110, 70, 62],
  [58, 100, 46],
  [162, 100, 46],
  [70, 50, 40],
  [150, 50, 40],
  [110, 30, 40],
  [86, 130, 40],
  [134, 130, 40],
];

/**
 * Broccoli friend ("Si Brokoli"), drawn in a 220x300 box, origin top-left, feet at y≈300.
 * mood: -1 sad … 0 surprised … 1 happy. armsUp 0..1.
 */
export const Broccoli: React.FC<{
  frame: number;
  mood: number;
  crying?: boolean;
  blink?: boolean;
  armsUp?: number;
  shine?: number;
}> = ({ frame, mood, crying = false, blink = false, armsUp = 0, shine = 0 }) => {
  const sad = Math.max(0, -mood);
  const happy = Math.max(0, mood);
  const tears = [];
  if (crying) {
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k < 4; k++) {
        const period = 22;
        const t = ((frame + k * (period / 4) + side * 7) % period) / period;
        const ex = side === 0 ? 84 : 136;
        tears.push(
          <path
            key={`${side}-${k}`}
            d="M0,-9 C5,-2 7,3 7,6 A7,7 0 1 1 -7,6 C-7,3 -5,-2 0,-9 Z"
            transform={`translate(${ex + (side ? 1 : -1) * 10 * t}, ${116 + 110 * t * t}) scale(${1 - 0.3 * t})`}
            fill="#7fd3ff"
            stroke="#3aa8e8"
            strokeWidth={1.5}
            opacity={1 - t * 0.6}
          />,
        );
      }
    }
  }
  const eyeH = blink ? 3 : 16 + 3 * happy;
  const browTilt = -14 * sad + 4 * happy;
  const mouthY = 150;
  const curve = lerp(0, 20, happy) - 14 * sad;
  const openMouth = happy > 0.55 || Math.abs(mood) < 0.25;
  const armA = -20 - 120 * armsUp;
  const droop = 1 - 0.06 * sad;
  return (
    <g>
      {/* legs */}
      <rect x={82} y={262} width={18} height={34} rx={9} fill="#7cc04a" />
      <rect x={120} y={262} width={18} height={34} rx={9} fill="#7cc04a" />
      <ellipse cx={88} cy={296} rx={18} ry={8} fill="#4f8f2a" />
      <ellipse cx={132} cy={296} rx={18} ry={8} fill="#4f8f2a" />
      {/* arms */}
      <g transform={`translate(74,212) rotate(${armA})`}>
        <rect x={-46} y={-8} width={50} height={16} rx={8} fill="#9ad860" stroke="#5f9e35" strokeWidth={3} />
        <circle cx={-48} cy={0} r={11} fill="#9ad860" stroke="#5f9e35" strokeWidth={3} />
      </g>
      <g transform={`translate(146,212) rotate(${-armA}) scale(-1,1)`}>
        <rect x={-46} y={-8} width={50} height={16} rx={8} fill="#9ad860" stroke="#5f9e35" strokeWidth={3} />
        <circle cx={-48} cy={0} r={11} fill="#9ad860" stroke="#5f9e35" strokeWidth={3} />
      </g>
      {/* stalk */}
      <path d="M70,150 L150,150 L140,272 Q110,284 80,272 Z" fill="#a8e06a" stroke="#5f9e35" strokeWidth={4} />
      <path d="M96,180 L100,262 M124,180 L120,262" stroke="#8fcc55" strokeWidth={5} strokeLinecap="round" />
      {/* crown */}
      <g transform={`translate(110,150) scale(1, ${droop}) translate(-110,-150)`}>
        {CROWN.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y + 2 * Math.sin(frame * 0.2 + i)} r={r + 4} fill="#2f8f3a" />
        ))}
        {CROWN.map(([x, y, r], i) => (
          <circle key={`b${i}`} cx={x} cy={y + 2 * Math.sin(frame * 0.2 + i)} r={r} fill="#47b34f" />
        ))}
        {[
          [40, 92],
          [178, 90],
          [74, 36],
          [146, 34],
          [110, 14],
          [60, 140],
          [160, 140],
        ].map(([x, y], i) => (
          <circle key={`d${i}`} cx={x} cy={y} r={7} fill="#2f8f3a" opacity={0.7} />
        ))}
        <ellipse cx={80} cy={40} rx={14} ry={8} fill="#8be08f" opacity={0.7} transform="rotate(-25 80 40)" />
        {/* shine sweep */}
        <rect
          x={-60 + 340 * shine}
          y={-20}
          width={26}
          height={220}
          fill="white"
          opacity={shine > 0 && shine < 1 ? 0.5 : 0}
          transform="rotate(20 110 100)"
        />
      </g>
      {/* face (on lower crown) */}
      <ellipse cx={110} cy={124} rx={66} ry={52} fill="#5cc463" opacity={0.6} />
      <ellipse cx={66} cy={146} rx={13} ry={8} fill="#ff9fb5" opacity={0.75} />
      <ellipse cx={154} cy={146} rx={13} ry={8} fill="#ff9fb5" opacity={0.75} />
      {[84, 136].map((ex, i) => (
        <g key={ex} transform={`translate(${ex}, 114)`}>
          <ellipse rx={14} ry={eyeH} fill="#1f2a16" />
          {!blink && (
            <>
              <circle cx={-5} cy={-6} r={5} fill="white" />
              <circle cx={4} cy={6} r={2.5} fill="white" opacity={0.8} />
              {crying && <ellipse cx={0} cy={eyeH - 3} rx={12} ry={4} fill="#9fe0ff" opacity={0.8} />}
            </>
          )}
          <path
            d="M-13,0 Q0,-5 13,0"
            transform={`translate(0, ${-eyeH - 9}) rotate(${i === 0 ? browTilt : -browTilt})`}
            stroke="#1f5c25"
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
      {openMouth ? (
        Math.abs(mood) < 0.25 ? (
          <ellipse cx={110} cy={mouthY + 4} rx={9} ry={12} fill="#6b1f2e" />
        ) : (
          <g>
            <path d={`M88,${mouthY - 2} Q110,${mouthY + 2 + curve * 1.6} 132,${mouthY - 2} Z`} fill="#6b1f2e" />
            <path
              d={`M99,${mouthY + 9 + curve * 0.5} Q110,${mouthY + 2} 121,${mouthY + 9 + curve * 0.5} Q110,${mouthY + 5 + curve * 0.75} 99,${mouthY + 9 + curve * 0.5} Z`}
              fill="#ff7d94"
            />
          </g>
        )
      ) : (
        <path d={`M94,${mouthY} Q110,${mouthY + curve} 126,${mouthY}`} stroke="#6b1f2e" strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
      {tears}
    </g>
  );
};

/** Wrapped candy character centred at (0,0), ~ 200x90. */
export const Candy: React.FC<{ frame: number; color: string; stripe: string; seed: number }> = ({ frame, color, stripe, seed }) => {
  const blink = (frame + seed * 7) % 50 < 3;
  const tw = 6 * Math.sin(frame * 0.4 + seed);
  return (
    <g>
      <path d={`M-58,0 L-100,${-34 + tw} L-92,0 L-100,${34 - tw} Z`} fill={color} stroke="#00000030" strokeWidth={3} />
      <path d={`M58,0 L100,${-34 - tw} L92,0 L100,${34 + tw} Z`} fill={color} stroke="#00000030" strokeWidth={3} />
      <ellipse rx={64} ry={46} fill={color} stroke="#00000030" strokeWidth={4} />
      <clipPath id={`cc${seed}`}>
        <ellipse rx={64} ry={46} />
      </clipPath>
      <g clipPath={`url(#cc${seed})`}>
        {[-60, -20, 20, 60].map((x) => (
          <rect key={x} x={x - 8} y={-60} width={14} height={120} fill={stripe} opacity={0.55} transform={`rotate(25 ${x} 0)`} />
        ))}
      </g>
      <ellipse cx={-30} cy={-24} rx={14} ry={7} fill="white" opacity={0.7} />
      {[-18, 18].map((ex) => (
        <g key={ex} transform={`translate(${ex}, -4)`}>
          <ellipse rx={10} ry={blink ? 2 : 12} fill="white" stroke="#2d1b3a" strokeWidth={3} />
          {!blink && <circle cx={ex > 0 ? -2 : 2} cy={2} r={5} fill="#2d1b3a" />}
        </g>
      ))}
      <path d="M-14,18 Q0,32 14,18" stroke="#2d1b3a" strokeWidth={4} fill="#7a2638" strokeLinecap="round" />
    </g>
  );
};

/** Small faceless broccoli floret centred at (0,0), ~ 60px. */
export const Floret: React.FC = () => (
  <g>
    <path d="M-9,4 L9,4 L7,30 Q0,34 -7,30 Z" fill="#a8e06a" stroke="#5f9e35" strokeWidth={2.5} />
    <circle cx={-14} cy={-2} r={14} fill="#47b34f" stroke="#2f8f3a" strokeWidth={2.5} />
    <circle cx={14} cy={-2} r={14} fill="#47b34f" stroke="#2f8f3a" strokeWidth={2.5} />
    <circle cx={0} cy={-14} r={16} fill="#47b34f" stroke="#2f8f3a" strokeWidth={2.5} />
  </g>
);

/** Carrot slice centred at (0,0). */
export const CarrotSlice: React.FC = () => (
  <g>
    <ellipse rx={20} ry={14} fill="#ff9a3c" stroke="#e0701a" strokeWidth={3} />
    <ellipse rx={8} ry={5} fill="#ffc07a" />
  </g>
);

/** Fork, tines up, tip of tines at (0,0). */
export const Fork: React.FC = () => (
  <g>
    {[-15, -5, 5, 15].map((x) => (
      <rect key={x} x={x - 3} y={0} width={6} height={36} rx={3} fill="#cfd8e6" stroke="#8a97ad" strokeWidth={2} />
    ))}
    <rect x={-20} y={30} width={40} height={16} rx={8} fill="#cfd8e6" stroke="#8a97ad" strokeWidth={2} />
    <rect x={-6} y={42} width={12} height={110} rx={6} fill="#4fc3f7" stroke="#1f8fc4" strokeWidth={3} />
  </g>
);
