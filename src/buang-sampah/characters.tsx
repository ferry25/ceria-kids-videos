import React from "react";

/**
 * "Si Lapar" — original hungry trash bin (channel character).
 * Bottom-centre at (0,0), ~260 wide x 380 tall. open: 0 closed … 1 lid wide open (mouth).
 */
export const TrashBin: React.FC<{ frame: number; mood: number; open?: number; blink?: boolean }> = ({
  frame,
  mood,
  open = 0,
  blink = false,
}) => {
  const happy = Math.max(0, mood);
  const sad = Math.max(0, -mood);
  const lid = -8 - 70 * open;
  return (
    <g>
      {/* feet */}
      <ellipse cx={-60} cy={-4} rx={44} ry={18} fill="#2b8a3e" />
      <ellipse cx={60} cy={-4} rx={44} ry={18} fill="#2b8a3e" />
      {/* body */}
      <path d="M-120,-300 L120,-300 L100,-14 Q0,4 -100,-14 Z" fill="#51cf66" stroke="#2b8a3e" strokeWidth={8} strokeLinejoin="round" />
      {[-60, 0, 60].map((x) => (
        <path key={x} d={`M${x},-250 L${x * 0.9},-60`} stroke="#40c057" strokeWidth={14} strokeLinecap="round" />
      ))}
      {/* recycle-ish leaf badge (original) */}
      <g transform="translate(0,-120)">
        <circle r={44} fill="#ffffff" stroke="#2b8a3e" strokeWidth={6} />
        <path d="M-20,18 C-26,-14 0,-30 24,-26 C26,4 6,22 -20,18 Z" fill="#69db7c" stroke="#2b8a3e" strokeWidth={4} />
        <path d="M-18,16 L14,-14" stroke="#2b8a3e" strokeWidth={4} strokeLinecap="round" />
      </g>
      {/* mouth (inside of the bin, visible when lid opens) */}
      <ellipse cx={0} cy={-300} rx={118} ry={16 + 28 * open} fill="#1b4d26" />
      {open > 0.3 && <ellipse cx={0} cy={-292 + 10 * open} rx={50} ry={10 * open} fill="#ff8fa3" />}
      {/* lid */}
      <g transform={`translate(-128,-304) rotate(${lid + 2 * Math.sin(frame * 0.3)})`}>
        <rect x={0} y={-26} width={256} height={30} rx={12} fill="#40c057" stroke="#2b8a3e" strokeWidth={7} />
        <rect x={100} y={-48} width={56} height={24} rx={10} fill="#2b8a3e" />
      </g>
      {/* eyes */}
      {[-48, 48].map((ex, i) => (
        <g key={ex} transform={`translate(${ex}, -216)`}>
          <ellipse rx={26} ry={30} fill="white" stroke="#2b8a3e" strokeWidth={5} />
          {blink ? (
            <path d="M-16,0 Q0,10 16,0" stroke="#1d3b22" strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <>
              <circle cx={0} cy={4} r={13 + 2 * happy} fill="#1d3b22" />
              <circle cx={-5} cy={-2} r={5} fill="white" />
            </>
          )}
          <path
            d="M-18,0 Q0,-7 18,0"
            transform={`translate(0,-42) rotate(${(i === 0 ? 1 : -1) * (-18 * sad + 4 * happy)})`}
            stroke="#1d3b22"
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
      <ellipse cx={-86} cy={-170} rx={18} ry={10} fill="#ff8fa3" opacity={0.6} />
      <ellipse cx={86} cy={-170} rx={18} ry={10} fill="#ff8fa3" opacity={0.6} />
    </g>
  );
};

/** Friendly river fish, centred at (0,0), ~200 wide. */
export const Fish: React.FC<{ frame: number; mood: number; color?: string; blink?: boolean; crying?: boolean }> = ({
  frame,
  mood,
  color = "#ff922b",
  blink = false,
  crying = false,
}) => {
  const happy = Math.max(0, mood);
  const sad = Math.max(0, -mood);
  const tail = 10 * Math.sin(frame * 0.4);
  const tears = [];
  if (crying) {
    for (let k = 0; k < 3; k++) {
      const t = ((frame + k * 8) % 24) / 24;
      tears.push(<circle key={k} cx={46 - 10 * t} cy={-6 + 60 * t * t} r={8 * (1 - 0.3 * t)} fill="#bfe9ff" opacity={1 - 0.6 * t} />);
    }
  }
  return (
    <g>
      <g transform={`translate(-78,0) rotate(${tail})`}>
        <path d="M0,0 L-60,-44 Q-48,0 -60,44 Z" fill={color} stroke="#2d1b69" strokeWidth={6} strokeLinejoin="round" />
      </g>
      <ellipse cx={0} cy={0} rx={92} ry={62} fill={color} stroke="#2d1b69" strokeWidth={6} />
      <path d="M-20,-60 Q10,-96 40,-58" fill={color} stroke="#2d1b69" strokeWidth={6} />
      <path d="M-30,-40 Q-14,0 -30,40" stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.5} />
      <g transform="translate(44,-14)">
        <circle r={18} fill="white" stroke="#2d1b69" strokeWidth={4} />
        {blink ? (
          <path d="M-10,0 Q0,7 10,0" stroke="#2d1b69" strokeWidth={5} fill="none" strokeLinecap="round" />
        ) : (
          <circle cx={3} cy={2} r={9} fill="#2d1b69" />
        )}
        <path d="M-14,-26 Q0,-32 14,-26" transform={`rotate(${-20 * sad + 4 * happy})`} stroke="#2d1b69" strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      <path d={`M54,26 Q70,${26 + 22 * happy - 14 * sad} 84,22`} stroke="#2d1b69" strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={30} cy={20} rx={12} ry={7} fill="#ff8fa3" opacity={0.6} />
      {tears}
    </g>
  );
};

/** Generic litter pieces, centred at (0,0). No brands. */
export const Bottle: React.FC = () => (
  <g>
    <rect x={-22} y={-70} width={44} height={120} rx={18} fill="#a5d8ff" stroke="#1971c2" strokeWidth={5} opacity={0.95} />
    <rect x={-12} y={-92} width={24} height={26} rx={6} fill="#1971c2" />
    <rect x={-22} y={-20} width={44} height={30} fill="#74c0fc" />
  </g>
);

export const Wrapper: React.FC = () => (
  <g>
    <path d="M-60,-20 L-80,-40 L-76,0 L-80,40 L-60,20 Z M60,-20 L80,-40 L76,0 L80,40 L60,20 Z" fill="#f783ac" stroke="#a61e4d" strokeWidth={4} strokeLinejoin="round" />
    <rect x={-60} y={-30} width={120} height={60} rx={14} fill="#f06595" stroke="#a61e4d" strokeWidth={5} />
    <circle cx={-20} cy={0} r={8} fill="#fff" opacity={0.7} />
    <circle cx={14} cy={-6} r={6} fill="#fff" opacity={0.7} />
  </g>
);

export const Peel: React.FC = () => (
  <g>
    <path d="M0,-50 Q-10,0 -60,30 Q-30,10 -8,30 Z" fill="#ffe066" stroke="#c49a00" strokeWidth={5} strokeLinejoin="round" />
    <path d="M0,-50 Q10,0 60,30 Q30,10 8,30 Z" fill="#ffd43b" stroke="#c49a00" strokeWidth={5} strokeLinejoin="round" />
    <path d="M0,-50 Q4,0 0,40" fill="none" stroke="#c49a00" strokeWidth={5} />
    <rect x={-6} y={-66} width={12} height={20} rx={4} fill="#8f5a2b" />
  </g>
);

export const Can: React.FC = () => (
  <g>
    <rect x={-30} y={-50} width={60} height={100} rx={10} fill="#ced4da" stroke="#495057" strokeWidth={5} />
    <rect x={-30} y={-20} width={60} height={40} fill="#ff6b6b" />
    <ellipse cx={0} cy={-50} rx={30} ry={8} fill="#adb5bd" stroke="#495057" strokeWidth={4} />
  </g>
);
