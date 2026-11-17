import React from "react";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Little hand character ("Si Tangan"), drawn in a 220x300 box, origin top-left.
 * Stands on its wrist cuff at the bottom (~y=300).
 * mood: -1 sad … 0 surprised … 1 happy. dirt: 0 clean … 1 dirty. wave: finger wiggle 0..1.
 */
export const Hand: React.FC<{
  frame: number;
  mood: number;
  dirt?: number;
  crying?: boolean;
  shine?: number;
  blink?: boolean;
  wave?: number;
}> = ({ frame, mood, dirt = 0, crying = false, shine = 0, blink = false, wave = 0 }) => {
  const sad = Math.max(0, -mood);
  const happy = Math.max(0, mood);
  const skin = "#ffd6b0";
  const line = "#e3a27a";
  const fingers = [
    { x: 46, h: 118 },
    { x: 80, h: 134 },
    { x: 114, h: 130 },
    { x: 148, h: 112 },
  ];
  const tears = [];
  if (crying) {
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k < 4; k++) {
        const period = 22;
        const t = ((frame + k * (period / 4) + side * 7) % period) / period;
        const ex = side === 0 ? 82 : 140;
        tears.push(
          <path
            key={`${side}-${k}`}
            d="M0,-9 C5,-2 7,3 7,6 A7,7 0 1 1 -7,6 C-7,3 -5,-2 0,-9 Z"
            transform={`translate(${ex + (side ? 1 : -1) * 10 * t}, ${180 + 110 * t * t}) scale(${1 - 0.3 * t})`}
            fill="#7fd3ff"
            stroke="#3aa8e8"
            strokeWidth={1.5}
            opacity={1 - t * 0.6}
          />,
        );
      }
    }
  }
  const eyeH = blink ? 3 : 17 + 3 * happy;
  const browTilt = 14 * sad - 4 * happy;
  const mouthY = 222;
  const curve = lerp(0, 20, happy) - 14 * sad;
  const openMouth = happy > 0.55 || Math.abs(mood) < 0.25;
  const droop = sad * 6;
  return (
    <g>
      {/* thumb */}
      <g transform={`rotate(${-35 - 10 * wave * Math.sin(frame * 0.5)} 52 190)`}>
        <rect x={-6} y={150} width={44} height={86} rx={22} fill={skin} stroke={line} strokeWidth={4} transform="rotate(-20 16 193)" />
      </g>
      {/* fingers */}
      {fingers.map((fg, i) => {
        const wig = wave * 9 * Math.sin(frame * 0.45 + i * 0.9);
        return (
          <g key={i} transform={`rotate(${wig + (i - 1.5) * 4 + droop * (i - 1.5)} ${fg.x + 15} 150)`}>
            <rect x={fg.x} y={150 - fg.h} width={32} height={fg.h + 20} rx={16} fill={skin} stroke={line} strokeWidth={4} />
            <ellipse cx={fg.x + 16} cy={150 - fg.h + 16} rx={9} ry={7} fill="#fff1e4" />
          </g>
        );
      })}
      {/* palm */}
      <rect x={36} y={120} width={152} height={150} rx={64} fill={skin} stroke={line} strokeWidth={4} />
      {/* wrist cuff (orange sleeve) */}
      <rect x={70} y={258} width={84} height={44} rx={14} fill="#ffb84d" stroke="#ff9a1f" strokeWidth={4} />
      {/* dirt smudges */}
      <g opacity={dirt}>
        <ellipse cx={70} cy={150} rx={18} ry={12} fill="#8c6a3d" opacity={0.65} />
        <ellipse cx={160} cy={240} rx={16} ry={11} fill="#7a5a32" opacity={0.6} />
        <ellipse cx={96} cy={70} rx={10} ry={14} fill="#8c6a3d" opacity={0.6} />
        <ellipse cx={164} cy={80} rx={9} ry={12} fill="#7a5a32" opacity={0.55} />
        <ellipse cx={60} cy={235} rx={12} ry={9} fill="#8c6a3d" opacity={0.55} />
        <circle cx={130} cy={58} r={6} fill="#6b4c28" opacity={0.6} />
        {/* tiny germ dots */}
        {[
          [150, 150],
          [86, 252],
          [48, 190],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x},${y + 2 * Math.sin(frame * 0.4 + i)})`}>
            <circle r={8} fill="#7bd88f" stroke="#2f8f4e" strokeWidth={2} />
            <circle cx={-3} cy={-1} r={1.8} fill="#1d1430" />
            <circle cx={3} cy={-1} r={1.8} fill="#1d1430" />
          </g>
        ))}
      </g>
      {/* shine sweep */}
      <rect
        x={-60 + 340 * shine}
        y={0}
        width={30}
        height={300}
        fill="white"
        opacity={shine > 0 && shine < 1 ? 0.6 : 0}
        transform="rotate(20 110 150)"
      />
      {/* cheeks */}
      <ellipse cx={66} cy={214} rx={14} ry={8} fill="#ff9fb5" opacity={0.75} />
      <ellipse cx={158} cy={214} rx={14} ry={8} fill="#ff9fb5" opacity={0.75} />
      {/* eyes */}
      {[86, 138].map((ex, i) => (
        <g key={ex} transform={`translate(${ex}, 180)`}>
          <ellipse rx={14} ry={eyeH} fill="#3b2418" />
          {!blink && (
            <>
              <circle cx={-5} cy={-6} r={5} fill="white" />
              <circle cx={4} cy={6} r={2.5} fill="white" opacity={0.8} />
              {crying && <ellipse cx={0} cy={eyeH - 3} rx={12} ry={4} fill="#9fe0ff" opacity={0.8} />}
            </>
          )}
          <path
            d="M-13,0 Q0,-5 13,0"
            transform={`translate(0, ${-eyeH - 10}) rotate(${i === 0 ? browTilt : -browTilt})`}
            stroke="#a0684a"
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
      {/* mouth */}
      {openMouth ? (
        Math.abs(mood) < 0.25 ? (
          <ellipse cx={112} cy={mouthY + 4} rx={9} ry={12} fill="#7a2638" />
        ) : (
          <g>
            <path d={`M90,${mouthY - 2} Q112,${mouthY + 2 + curve * 1.6} 134,${mouthY - 2} Z`} fill="#7a2638" />
            <path
              d={`M101,${mouthY + 9 + curve * 0.5} Q112,${mouthY + 2} 123,${mouthY + 9 + curve * 0.5} Q112,${mouthY + 5 + curve * 0.75} 101,${mouthY + 9 + curve * 0.5} Z`}
              fill="#ff7d94"
            />
          </g>
        )
      ) : (
        <path d={`M96,${mouthY} Q112,${mouthY + curve} 128,${mouthY}`} stroke="#7a2638" strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
      {tears}
    </g>
  );
};

/** Round cookie centred at (0,0), r ~ 70. */
export const Cookie: React.FC<{ bite?: boolean }> = ({ bite = false }) => (
  <g>
    <circle r={70} fill="#e8a956" stroke="#b9772d" strokeWidth={5} />
    <circle r={58} fill="#f2bd6d" />
    {[
      [-28, -20],
      [20, -30],
      [30, 18],
      [-12, 26],
      [0, -2],
      [-40, 12],
    ].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={8} ry={6} fill="#6b3e1f" transform={`rotate(${i * 30} ${x} ${y})`} />
    ))}
    {bite && (
      <g fill="#bfe7ff">
        <circle cx={58} cy={-40} r={22} />
        <circle cx={70} cy={-12} r={18} />
      </g>
    )}
  </g>
);

/** Soap bar centred at (0,0), ~ 150x90. */
export const Soap: React.FC<{ foam?: number; frame?: number }> = ({ foam = 0, frame = 0 }) => (
  <g>
    <rect x={-75} y={-42} width={150} height={84} rx={36} fill="#ff9fd0" stroke="#e06aa6" strokeWidth={5} />
    <rect x={-58} y={-30} width={116} height={30} rx={15} fill="#ffc6e5" opacity={0.9} />
    <ellipse cx={-38} cy={-22} rx={14} ry={6} fill="white" opacity={0.85} />
    {foam > 0 &&
      [
        [-50, -52, 18],
        [-14, -62, 22],
        [26, -56, 18],
        [56, -46, 14],
        [4, -84, 13],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x + 3 * Math.sin(frame * 0.3 + i)}
          cy={y}
          r={r * foam}
          fill="white"
          stroke="#d6ecff"
          strokeWidth={3}
        />
      ))}
  </g>
);

/** Faucet whose spout tip is at (0,0), pointing down. */
export const Faucet: React.FC<{ frame: number; on?: number }> = ({ frame, on = 1 }) => (
  <g>
    <rect x={160} y={-150} width={60} height={200} rx={16} fill="#b8c6d8" stroke="#7d8ea6" strokeWidth={5} />
    <path d="M190,-120 Q190,-170 120,-170 L20,-170 Q-30,-170 -30,-110 L-30,-20 L30,-20 L30,-100 Q30,-110 40,-110 L190,-110 Z" fill="#cfdbea" stroke="#7d8ea6" strokeWidth={5} />
    <rect x={150} y={-230} width={80} height={36} rx={14} fill="#4fc3f7" stroke="#1f8fc4" strokeWidth={4} />
    <rect x={182} y={-200} width={16} height={34} fill="#9fb0c6" />
    <ellipse cx={-10} cy={-150} rx={14} ry={7} fill="white" opacity={0.6} />
    {on > 0 && (
      <g opacity={on}>
        <path
          d={`M-22,-18 Q${-26 + 4 * Math.sin(frame * 0.8)},200 -30,420 L30,420 Q${26 + 4 * Math.sin(frame * 0.7)},200 22,-18 Z`}
          fill="#8fd8ff"
          opacity={0.75}
        />
        {Array.from({ length: 6 }).map((_, i) => {
          const y = ((frame * 22 + i * 70) % 420) - 10;
          return <rect key={i} x={-6 + 6 * Math.sin(i)} y={y} width={8} height={40} rx={4} fill="white" opacity={0.7} />;
        })}
      </g>
    )}
  </g>
);
