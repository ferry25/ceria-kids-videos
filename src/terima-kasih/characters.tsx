import React from "react";

/**
 * "Bintang Kata Ajaib" — original channel character: a soft five-point star.
 * Centred at (0,0), ~260 wide. glow: 0 dim/grey … 1 bright gold. mood: -1 sad … 1 happy.
 */
export const MagicStar: React.FC<{ frame: number; mood: number; glow: number; blink?: boolean; crying?: boolean }> = ({
  frame,
  mood,
  glow,
  blink = false,
  crying = false,
}) => {
  const happy = Math.max(0, mood);
  const sad = Math.max(0, -mood);
  const mixc = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * glow)).join(",")})`;
  const fill = mixc([176, 172, 160], [255, 212, 59]);
  const edge = mixc([120, 116, 108], [230, 150, 0]);
  const pts = Array.from({ length: 10 })
    .map((_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? 130 : 62;
      return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
    })
    .join(" ");
  const tears = [];
  if (crying) {
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k < 3; k++) {
        const t = ((frame + k * 8 + side * 5) % 24) / 24;
        const ex = side === 0 ? -34 : 34;
        tears.push(<circle key={`${side}${k}`} cx={ex + (side ? 6 : -6) * t} cy={10 + 70 * t * t} r={8 * (1 - 0.3 * t)} fill="#bfe9ff" opacity={1 - 0.6 * t} />);
      }
    }
  }
  return (
    <g>
      {glow > 0.05 && <circle r={150 + 20 * Math.sin(frame * 0.2)} fill="#fff3a0" opacity={0.45 * glow} />}
      <polygon points={pts} fill={fill} stroke={edge} strokeWidth={10} strokeLinejoin="round" />
      <polygon points={pts} fill="white" opacity={0.18} transform="translate(-8,-8) scale(0.8)" />
      {/* eyes */}
      {[-34, 34].map((ex, i) => (
        <g key={ex} transform={`translate(${ex},-6)`}>
          {blink ? (
            <path d="M-12,0 Q0,8 12,0" stroke="#2d1b69" strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <>
              <ellipse rx={13} ry={17} fill="#2d1b69" />
              <circle cx={-4} cy={-6} r={5} fill="white" />
            </>
          )}
          <path
            d="M-14,0 Q0,-6 14,0"
            transform={`translate(0,-30) rotate(${(i === 0 ? 1 : -1) * (-18 * sad + 4 * happy)})`}
            stroke="#2d1b69"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
      <ellipse cx={-56} cy={22} rx={14} ry={8} fill="#ff8fa3" opacity={0.6} />
      <ellipse cx={56} cy={22} rx={14} ry={8} fill="#ff8fa3" opacity={0.6} />
      <path d={`M-22,30 Q0,${30 + 26 * happy - 16 * sad} 22,30`} stroke="#2d1b69" strokeWidth={7} fill={happy > 0.3 ? "#8a2a3c" : "none"} strokeLinecap="round" />
      {tears}
    </g>
  );
};

/**
 * "Beru" — original grumpy-then-kind little bear (channel character).
 * Bottom-centre at (0,0), ~300 wide x 420 tall. mood: -1 grumpy … 1 happy.
 */
export const Bear: React.FC<{ frame: number; mood: number; blink?: boolean; armUp?: number }> = ({ frame, mood, blink = false, armUp = 0 }) => {
  const happy = Math.max(0, mood);
  const grumpy = Math.max(0, -mood);
  const breathe = 3 * Math.sin(frame * 0.15);
  return (
    <g>
      {/* feet */}
      <ellipse cx={-60} cy={-14} rx={52} ry={26} fill="#8f5a2b" />
      <ellipse cx={60} cy={-14} rx={52} ry={26} fill="#8f5a2b" />
      {/* body */}
      <ellipse cx={0} cy={-120 + breathe} rx={120} ry={115} fill="#b07a45" />
      <ellipse cx={0} cy={-105 + breathe} rx={72} ry={70} fill="#e8c39a" />
      {/* arms */}
      <path d="M-110,-160 Q-160,-110 -140,-60" stroke="#b07a45" strokeWidth={50} fill="none" strokeLinecap="round" />
      <path d={`M110,-160 Q${165 + 20 * armUp},${-110 - 120 * armUp} ${140 + 10 * armUp},${-60 - 170 * armUp}`} stroke="#b07a45" strokeWidth={50} fill="none" strokeLinecap="round" />
      {/* ears */}
      <circle cx={-92} cy={-370} r={42} fill="#b07a45" />
      <circle cx={92} cy={-370} r={42} fill="#b07a45" />
      <circle cx={-92} cy={-370} r={22} fill="#e8a8a0" />
      <circle cx={92} cy={-370} r={22} fill="#e8a8a0" />
      {/* head */}
      <circle cx={0} cy={-300} r={118} fill="#b07a45" />
      <ellipse cx={0} cy={-262} rx={58} ry={44} fill="#e8c39a" />
      <ellipse cx={0} cy={-284} rx={22} ry={15} fill="#3b2314" />
      {/* eyes */}
      {[-46, 46].map((ex, i) => (
        <g key={ex} transform={`translate(${ex},-322)`}>
          {blink ? (
            <path d="M-12,0 Q0,8 12,0" stroke="#2a1a12" strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <>
              <circle r={14} fill="#2a1a12" />
              <circle cx={-4} cy={-5} r={5} fill="white" />
            </>
          )}
          <path
            d="M-16,0 L16,0"
            transform={`translate(0,-26) rotate(${(i === 0 ? 1 : -1) * (22 * grumpy - 8 * happy)})`}
            stroke="#3b2314"
            strokeWidth={7}
            strokeLinecap="round"
          />
        </g>
      ))}
      <ellipse cx={-76} cy={-270} rx={16} ry={9} fill="#ff8fa3" opacity={0.5 + 0.3 * happy} />
      <ellipse cx={76} cy={-270} rx={16} ry={9} fill="#ff8fa3" opacity={0.5 + 0.3 * happy} />
      <path d={`M-22,-246 Q0,${-246 + 26 * happy - 14 * grumpy} 22,-246`} stroke="#3b2314" strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Round cookie with chips, centred at (0,0), radius ~50. No brands. */
export const Cookie: React.FC<{ bite?: boolean }> = ({ bite = false }) => (
  <g>
    <circle r={50} fill="#e0a458" stroke="#a8692b" strokeWidth={6} />
    {[
      [-18, -16],
      [16, -22],
      [22, 12],
      [-14, 20],
      [0, 0],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={7} fill="#5c3a1e" />
    ))}
    {bite && <circle cx={44} cy={-30} r={22} fill="#fff4e0" />}
  </g>
);

/** Toy block, centred at (0,0), 90x90. */
export const Block: React.FC<{ color: string; letter: string }> = ({ color, letter }) => (
  <g>
    <rect x={-45} y={-45} width={90} height={90} rx={12} fill={color} stroke="#2d1b69" strokeWidth={6} />
    <text textAnchor="middle" y={22} fontFamily="Fredoka, sans-serif" fontWeight={700} fontSize={62} fill="white" stroke="#2d1b69" strokeWidth={4} paintOrder="stroke">
      {letter}
    </text>
  </g>
);
