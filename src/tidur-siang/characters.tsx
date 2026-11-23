import React from "react";

/**
 * "Si Bantal" — original fluffy pillow friend, drawn in a 300x200 box centred at (150,100).
 * mood: -1 sad … 0 neutral … 1 happy. sleepy 0..1 closes the eyes.
 */
export const Pillow: React.FC<{
  frame: number;
  mood: number;
  blink?: boolean;
  sleepy?: number;
  crying?: boolean;
  squash?: number;
}> = ({ frame, mood, blink = false, sleepy = 0, crying = false, squash = 0 }) => {
  const sad = Math.max(0, -mood);
  const happy = Math.max(0, mood);
  const puff = 4 * Math.sin(frame * 0.12);
  const eyeOpen = blink ? 0 : 1 - sleepy;
  const browTilt = -14 * sad + 4 * happy;
  const mouthY = 128;
  const curve = 20 * happy - 14 * sad;
  const tears = [];
  if (crying) {
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k < 3; k++) {
        const t = ((frame + k * 8 + side * 9) % 24) / 24;
        const ex = side === 0 ? 112 : 188;
        tears.push(
          <circle key={`${side}${k}`} cx={ex + (side ? 1 : -1) * 14 * t} cy={105 + 70 * t * t} r={6 * (1 - 0.3 * t)} fill="#bfe9ff" opacity={1 - 0.6 * t} />,
        );
      }
    }
  }
  return (
    <g transform={`translate(150,100) scale(${1 + 0.08 * squash},${1 - 0.1 * squash}) translate(-150,-100)`}>
      <path
        d={`M20,${30 - puff} Q150,${0 - puff} 280,${30 - puff} Q${300 + puff},100 280,${172 + puff} Q150,${200 + puff} 20,${172 + puff} Q${0 - puff},100 20,${30 - puff} Z`}
        fill="#fdf6ff"
        stroke="#b49be0"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      {/* corner tufts */}
      {[
        [20, 30],
        [280, 30],
        [20, 172],
        [280, 172],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={11} fill="#e2d4ff" stroke="#b49be0" strokeWidth={4} />
      ))}
      {/* little stars print */}
      <path d="M60,60 l5,10 l11,1 l-8,7 l3,11 l-11,-6 l-11,6 l3,-11 l-8,-7 l11,-1 Z" fill="#ffe17a" opacity={0.8} />
      <path d="M238,150 l4,8 l9,1 l-7,6 l2,9 l-8,-5 l-8,5 l2,-9 l-7,-6 l9,-1 Z" fill="#9fdcff" opacity={0.8} />
      <ellipse cx={92} cy={122} rx={16} ry={9} fill="#ffb3c7" opacity={0.75} />
      <ellipse cx={208} cy={122} rx={16} ry={9} fill="#ffb3c7" opacity={0.75} />
      {[112, 188].map((ex, i) => (
        <g key={ex} transform={`translate(${ex}, 92)`}>
          {eyeOpen < 0.2 ? (
            <path d="M-14,0 Q0,10 14,0" stroke="#3b2a5c" strokeWidth={5} fill="none" strokeLinecap="round" />
          ) : (
            <>
              <ellipse rx={13} ry={(15 + 3 * happy) * eyeOpen} fill="#3b2a5c" />
              <circle cx={-4} cy={-5 * eyeOpen} r={4.5} fill="white" />
            </>
          )}
          <path
            d="M-13,0 Q0,-5 13,0"
            transform={`translate(0, -26) rotate(${i === 0 ? browTilt : -browTilt})`}
            stroke="#7a5fb0"
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
      {happy > 0.5 ? (
        <g>
          <path d={`M128,${mouthY - 2} Q150,${mouthY + 2 + curve * 1.6} 172,${mouthY - 2} Z`} fill="#6b1f2e" />
          <path d={`M140,${mouthY + 12} Q150,${mouthY + 6} 160,${mouthY + 12} Q150,${mouthY + 20} 140,${mouthY + 12} Z`} fill="#ff7d94" />
        </g>
      ) : sleepy > 0.5 ? (
        <ellipse cx={150} cy={mouthY + 4} rx={7} ry={5 + 2 * Math.sin(frame * 0.15)} fill="#6b1f2e" />
      ) : (
        <path d={`M134,${mouthY} Q150,${mouthY + curve} 166,${mouthY}`} stroke="#6b1f2e" strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
      {tears}
    </g>
  );
};

/** Little crescent moon with a nightcap, centred at (0,0), radius ~110. */
export const Moon: React.FC<{ frame: number; yawn?: number; sleepy?: number }> = ({ frame, yawn = 0, sleepy = 0 }) => (
  <g>
    <circle r={140} fill="#fff6c2" opacity={0.25 + 0.08 * Math.sin(frame * 0.1)} />
    <path d="M30,-110 A110,110 0 1 0 30,110 A86,86 0 1 1 30,-110 Z" fill="#ffe47a" stroke="#e8b931" strokeWidth={7} strokeLinejoin="round" />
    {/* nightcap */}
    <path d="M-70,-62 Q-10,-150 60,-150 Q20,-120 -4,-80 Z" fill="#7c6cf0" stroke="#5546c4" strokeWidth={5} strokeLinejoin="round" />
    <circle cx={64} cy={-150} r={16} fill="white" />
    <path d="M-76,-60 Q-36,-92 0,-78" stroke="white" strokeWidth={14} strokeLinecap="round" fill="none" />
    {/* face on the inner curve */}
    {sleepy > 0.5 ? (
      <path d="M-52,-20 Q-40,-10 -28,-20" stroke="#8a5a00" strokeWidth={5} fill="none" strokeLinecap="round" />
    ) : (
      <ellipse cx={-40} cy={-20} rx={8} ry={10} fill="#5c3b00" />
    )}
    <ellipse cx={-30} cy={10} rx={10} ry={6} fill="#ffad8a" opacity={0.7} />
    {yawn > 0.1 ? (
      <ellipse cx={-50} cy={30} rx={8 + 4 * yawn} ry={6 + 14 * yawn} fill="#8a2a3c" />
    ) : (
      <path d="M-62,26 Q-48,38 -36,28" stroke="#8a5a00" strokeWidth={5} fill="none" strokeLinecap="round" />
    )}
  </g>
);

/** Bouncy toy ball, centred at (0,0), radius 60. */
export const Ball: React.FC<{ spin: number }> = ({ spin }) => (
  <g transform={`rotate(${spin})`}>
    <circle r={60} fill="#ff6b6b" stroke="#c63d3d" strokeWidth={6} />
    <path d="M-60,0 Q0,-30 60,0" stroke="#ffe066" strokeWidth={16} fill="none" />
    <path d="M-60,0 Q0,30 60,0" stroke="#4dabf7" strokeWidth={16} fill="none" />
    <circle cx={-22} cy={-30} r={10} fill="white" opacity={0.6} />
  </g>
);

/** Toy block with a letter, bottom-left at (0,0), size 110. */
export const Block: React.FC<{ color: string; letter: string }> = ({ color, letter }) => (
  <g>
    <rect x={0} y={-110} width={110} height={110} rx={14} fill={color} stroke="#2d1b69" strokeWidth={6} />
    <text x={55} y={-30} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight={700} fontSize={80} fill="white" stroke="#2d1b69" strokeWidth={4} paintOrder="stroke">
      {letter}
    </text>
  </g>
);

/** Floating "Z", centred at (0,0). */
export const Zed: React.FC<{ size: number; color?: string }> = ({ size, color = "#ffffff" }) => (
  <text
    textAnchor="middle"
    dominantBaseline="middle"
    fontFamily="Fredoka, sans-serif"
    fontWeight={700}
    fontSize={size}
    fill={color}
    stroke="#2d1b69"
    strokeWidth={size * 0.08}
    paintOrder="stroke"
  >
    Z
  </text>
);
