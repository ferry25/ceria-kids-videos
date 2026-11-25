import React from "react";

/**
 * "Si Beri" — original soft toy bear (channel character), centred at (0,0), ~ 300 wide x 360 tall.
 * mood: -1 sad … 1 happy. Head centre at (0,-90), body at (0,80).
 */
export const Bear: React.FC<{
  frame: number;
  mood: number;
  blink?: boolean;
  crying?: boolean;
  wave?: number;
}> = ({ frame, mood, blink = false, crying = false, wave = 0 }) => {
  const sad = Math.max(0, -mood);
  const happy = Math.max(0, mood);
  const browTilt = -16 * sad + 4 * happy;
  const curve = 26 * happy - 16 * sad;
  const fur = "#d9a066";
  const dark = "#9c6332";
  const light = "#f6dcb6";
  const tears = [];
  if (crying) {
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k < 3; k++) {
        const t = ((frame + k * 8 + side * 9) % 24) / 24;
        const ex = side === 0 ? -42 : 42;
        tears.push(
          <circle key={`${side}${k}`} cx={ex + (side ? 1 : -1) * 16 * t} cy={-80 + 80 * t * t} r={8 * (1 - 0.3 * t)} fill="#bfe9ff" opacity={1 - 0.6 * t} />,
        );
      }
    }
  }
  const armR = -30 - 110 * wave + 20 * wave * Math.sin(frame * 0.5);
  return (
    <g>
      {/* legs */}
      <ellipse cx={-62} cy={160} rx={52} ry={40} fill={fur} stroke={dark} strokeWidth={7} />
      <ellipse cx={62} cy={160} rx={52} ry={40} fill={fur} stroke={dark} strokeWidth={7} />
      <ellipse cx={-62} cy={166} rx={26} ry={20} fill={light} />
      <ellipse cx={62} cy={166} rx={26} ry={20} fill={light} />
      {/* body */}
      <ellipse cx={0} cy={80} rx={108} ry={100} fill={fur} stroke={dark} strokeWidth={7} />
      <ellipse cx={0} cy={96} rx={62} ry={58} fill={light} />
      {/* heart patch (original detail) */}
      <path d="M0,112 C-30,92 -24,70 -10,70 C-4,70 0,76 0,80 C0,76 4,70 10,70 C24,70 30,92 0,112 Z" fill="#ff6fa3" />
      {/* arms */}
      <g transform={`translate(-92,40) rotate(${30 + 10 * sad})`}>
        <ellipse cx={0} cy={44} rx={30} ry={52} fill={fur} stroke={dark} strokeWidth={7} />
      </g>
      <g transform={`translate(92,40) rotate(${armR})`}>
        <ellipse cx={0} cy={44} rx={30} ry={52} fill={fur} stroke={dark} strokeWidth={7} />
      </g>
      {/* ears */}
      <circle cx={-92} cy={-176} r={44} fill={fur} stroke={dark} strokeWidth={7} />
      <circle cx={92} cy={-176} r={44} fill={fur} stroke={dark} strokeWidth={7} />
      <circle cx={-92} cy={-176} r={22} fill="#f2a7b8" />
      <circle cx={92} cy={-176} r={22} fill="#f2a7b8" />
      {/* bow on one ear */}
      <g transform="translate(118,-196) rotate(20)">
        <path d="M0,0 L-30,-18 L-30,18 Z M0,0 L30,-18 L30,18 Z" fill="#4dabf7" stroke="#1f6fb0" strokeWidth={4} strokeLinejoin="round" />
        <circle r={9} fill="#1f6fb0" />
      </g>
      {/* head */}
      <circle cx={0} cy={-90} r={120} fill={fur} stroke={dark} strokeWidth={7} />
      <ellipse cx={0} cy={-46} rx={58} ry={44} fill={light} />
      {/* eyes */}
      {[-42, 42].map((ex, i) => (
        <g key={ex} transform={`translate(${ex}, -104)`}>
          {blink ? (
            <path d="M-14,0 Q0,10 14,0" stroke="#3b2414" strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <>
              <ellipse rx={14} ry={17 + 3 * happy} fill="#3b2414" />
              <circle cx={-4} cy={-6} r={5} fill="white" />
            </>
          )}
          <path
            d="M-15,0 Q0,-6 15,0"
            transform={`translate(0,-32) rotate(${i === 0 ? browTilt : -browTilt})`}
            stroke={dark}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
      {/* nose + mouth */}
      <ellipse cx={0} cy={-62} rx={20} ry={14} fill="#3b2414" />
      <ellipse cx={-6} cy={-66} rx={6} ry={4} fill="white" opacity={0.6} />
      {happy > 0.5 ? (
        <g>
          <path d={`M-26,-36 Q0,${-36 + curve * 1.5} 26,-36 Z`} fill="#6b1f2e" />
          <path d="M-10,-22 Q0,-28 10,-22 Q0,-14 -10,-22 Z" fill="#ff7d94" />
        </g>
      ) : (
        <path d={`M-22,-30 Q0,${-30 + curve} 22,-30`} stroke="#3b2414" strokeWidth={6} strokeLinecap="round" fill="none" />
      )}
      <ellipse cx={-74} cy={-60} rx={18} ry={10} fill="#ff8fa3" opacity={0.6} />
      <ellipse cx={74} cy={-60} rx={18} ry={10} fill="#ff8fa3" opacity={0.6} />
      {tears}
    </g>
  );
};

/** Open toy box, front face from (-170,-140) to (170,0); bottom-centre at (0,0). fill 0..1 shows toys peeking out. */
export const ToyBox: React.FC<{ frame: number; smile?: number }> = ({ frame, smile = 0 }) => (
  <g>
    {/* lid tilted open behind */}
    <g transform={`translate(-170,-150) rotate(${-24 + 3 * Math.sin(frame * 0.2)})`}>
      <rect x={0} y={-24} width={340} height={30} rx={10} fill="#ff922b" stroke="#c4600a" strokeWidth={6} />
    </g>
    <rect x={-170} y={-150} width={340} height={150} rx={18} fill="#ffa94d" stroke="#c4600a" strokeWidth={7} />
    <rect x={-170} y={-150} width={340} height={26} rx={10} fill="#ff922b" stroke="#c4600a" strokeWidth={6} />
    {/* stars */}
    <path d="M-110,-70 l7,14 l15,2 l-11,10 l3,15 l-14,-8 l-14,8 l3,-15 l-11,-10 l15,-2 Z" fill="#ffe066" />
    <path d="M110,-70 l7,14 l15,2 l-11,10 l3,15 l-14,-8 l-14,8 l3,-15 l-11,-10 l15,-2 Z" fill="#69db7c" />
    {/* face */}
    <circle cx={-34} cy={-80} r={9} fill="#5a2a00" />
    <circle cx={34} cy={-80} r={9} fill="#5a2a00" />
    <path d={`M-26,-52 Q0,${-52 + 24 * smile} 26,-52`} stroke="#5a2a00" strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
);

/** Small toy car, centred at (0,0), ~160 wide. */
export const ToyCar: React.FC<{ spin?: number }> = ({ spin = 0 }) => (
  <g>
    <path d="M-80,10 L-80,-20 Q-70,-30 -40,-32 L-20,-62 L40,-62 L60,-32 Q80,-30 80,-10 L80,10 Z" fill="#4dabf7" stroke="#1f6fb0" strokeWidth={6} strokeLinejoin="round" />
    <path d="M-10,-56 L-26,-34 L4,-34 L4,-56 Z M14,-56 L14,-34 L50,-34 L36,-56 Z" fill="#d0ecff" />
    {[-46, 46].map((x) => (
      <g key={x} transform={`translate(${x},14) rotate(${spin})`}>
        <circle r={22} fill="#2d1b69" />
        <circle r={9} fill="#ced4da" />
        <rect x={-2} y={-20} width={4} height={10} fill="#ced4da" />
      </g>
    ))}
  </g>
);
