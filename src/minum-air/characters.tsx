import React from "react";

/**
 * "Si Tetes" — original water-drop friend, drawn in a 220x300 box, feet at y≈300.
 * mood: -1 sad … 0 surprised … 1 happy. armsUp 0..1.
 */
export const Drop: React.FC<{
  frame: number;
  mood: number;
  blink?: boolean;
  armsUp?: number;
  shine?: number;
  crying?: boolean;
}> = ({ frame, mood, blink = false, armsUp = 0, shine = 0, crying = false }) => {
  const sad = Math.max(0, -mood);
  const happy = Math.max(0, mood);
  const eyeH = blink ? 3 : 17 + 3 * happy;
  const browTilt = -14 * sad + 4 * happy;
  const mouthY = 205;
  const curve = 22 * happy - 14 * sad;
  const armA = -20 - 120 * armsUp;
  const wob = 3 * Math.sin(frame * 0.25);
  const tears = [];
  if (crying) {
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k < 3; k++) {
        const period = 24;
        const t = ((frame + k * 8 + side * 9) % period) / period;
        const ex = side === 0 ? 82 : 138;
        tears.push(
          <circle key={`${side}${k}`} cx={ex + (side ? 1 : -1) * 12 * t} cy={180 + 90 * t * t} r={6 * (1 - 0.3 * t)} fill="#bfe9ff" opacity={1 - 0.6 * t} />,
        );
      }
    }
  }
  return (
    <g>
      {/* legs */}
      <rect x={82} y={262} width={18} height={34} rx={9} fill="#3aa8e8" />
      <rect x={120} y={262} width={18} height={34} rx={9} fill="#3aa8e8" />
      <ellipse cx={88} cy={296} rx={18} ry={8} fill="#1f7fbf" />
      <ellipse cx={132} cy={296} rx={18} ry={8} fill="#1f7fbf" />
      {/* arms */}
      <g transform={`translate(42,200) rotate(${armA})`}>
        <rect x={-46} y={-8} width={50} height={16} rx={8} fill="#6cc8ff" stroke="#2b8fd0" strokeWidth={3} />
        <circle cx={-48} cy={0} r={11} fill="#6cc8ff" stroke="#2b8fd0" strokeWidth={3} />
      </g>
      <g transform={`translate(178,200) rotate(${-armA}) scale(-1,1)`}>
        <rect x={-46} y={-8} width={50} height={16} rx={8} fill="#6cc8ff" stroke="#2b8fd0" strokeWidth={3} />
        <circle cx={-48} cy={0} r={11} fill="#6cc8ff" stroke="#2b8fd0" strokeWidth={3} />
      </g>
      {/* body drop */}
      <path
        d={`M110,${6 + wob} C140,70 196,130 196,186 C196,240 158,272 110,272 C62,272 24,240 24,186 C24,130 80,70 110,${6 + wob} Z`}
        fill="#5ec2ff"
        stroke="#2b8fd0"
        strokeWidth={5}
      />
      <path d="M110,40 C125,80 160,120 168,170" stroke="#9fdcff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.5} />
      <ellipse cx={72} cy={140} rx={14} ry={26} fill="white" opacity={0.75} transform="rotate(25 72 140)" />
      <circle cx={88} cy={102} r={7} fill="white" opacity={0.75} />
      {/* shine sweep */}
      <clipPath id="dropclip">
        <path d="M110,6 C140,70 196,130 196,186 C196,240 158,272 110,272 C62,272 24,240 24,186 C24,130 80,70 110,6 Z" />
      </clipPath>
      <g clipPath="url(#dropclip)">
        <rect x={-60 + 340 * shine} y={-20} width={26} height={340} fill="white" opacity={shine > 0 && shine < 1 ? 0.6 : 0} transform="rotate(20 110 150)" />
      </g>
      {/* cheeks */}
      <ellipse cx={62} cy={200} rx={14} ry={8} fill="#ff9fb5" opacity={0.75} />
      <ellipse cx={158} cy={200} rx={14} ry={8} fill="#ff9fb5" opacity={0.75} />
      {[82, 138].map((ex, i) => (
        <g key={ex} transform={`translate(${ex}, 168)`}>
          <ellipse rx={14} ry={eyeH} fill="#13304a" />
          {!blink && (
            <>
              <circle cx={-5} cy={-6} r={5} fill="white" />
              <circle cx={4} cy={6} r={2.5} fill="white" opacity={0.8} />
            </>
          )}
          <path
            d="M-13,0 Q0,-5 13,0"
            transform={`translate(0, ${-eyeH - 9}) rotate(${i === 0 ? browTilt : -browTilt})`}
            stroke="#1b5f8f"
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
      {happy > 0.5 ? (
        <g>
          <path d={`M88,${mouthY - 2} Q110,${mouthY + 2 + curve * 1.6} 132,${mouthY - 2} Z`} fill="#6b1f2e" />
          <path d={`M100,${mouthY + 12} Q110,${mouthY + 6} 120,${mouthY + 12} Q110,${mouthY + 20} 100,${mouthY + 12} Z`} fill="#ff7d94" />
        </g>
      ) : Math.abs(mood) < 0.25 ? (
        <ellipse cx={110} cy={mouthY + 4} rx={9} ry={12} fill="#6b1f2e" />
      ) : (
        <path d={`M94,${mouthY} Q110,${mouthY + curve} 126,${mouthY}`} stroke="#6b1f2e" strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
      {tears}
    </g>
  );
};

/** Grinning hot sun with sunglasses, centred at (0,0), radius ~150. */
export const Sun: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    <g transform={`rotate(${frame * 1.5})`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <path
          key={i}
          d="M-22,-150 L0,-215 L22,-150 Z"
          fill={i % 2 ? "#ffb703" : "#ff8c1a"}
          transform={`rotate(${i * 30}) scale(1, ${1 + 0.12 * Math.sin(frame * 0.3 + i)})`}
        />
      ))}
    </g>
    <circle r={150} fill="#ffd23f" stroke="#ff9f1c" strokeWidth={10} />
    <ellipse cx={-60} cy={-80} rx={30} ry={16} fill="white" opacity={0.5} transform="rotate(-30 -60 -80)" />
    {/* sunglasses */}
    <path d="M-110,-30 L110,-30" stroke="#222" strokeWidth={12} strokeLinecap="round" />
    <path d="M-105,-34 L-15,-34 Q-15,20 -60,20 Q-105,20 -105,-34 Z" fill="#2a2a3a" />
    <path d="M15,-34 L105,-34 Q105,20 60,20 Q15,20 15,-34 Z" fill="#2a2a3a" />
    <path d="M-90,-24 L-60,-24" stroke="white" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
    <path d="M30,-24 L60,-24" stroke="white" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
    <ellipse cx={-105} cy={50} rx={22} ry={12} fill="#ff7b54" opacity={0.6} />
    <ellipse cx={105} cy={50} rx={22} ry={12} fill="#ff7b54" opacity={0.6} />
    {/* big grin */}
    <path d={`M-70,50 Q0,${120 + 10 * Math.sin(frame * 0.5)} 70,50 Z`} fill="#8a2a3c" />
    <path d="M-52,56 L52,56 L46,68 L-46,68 Z" fill="white" />
  </g>
);

/** Clear glass, bottom-centre at (0,0), height 170. level 0..1 */
export const Glass: React.FC<{ level: number }> = ({ level }) => {
  const h = 160 * level;
  return (
    <g>
      <clipPath id="glassclip">
        <path d="M-58,-170 L58,-170 L48,0 L-48,0 Z" />
      </clipPath>
      <rect x={-70} y={-h} width={140} height={h} fill="#7fd3ff" opacity={0.85} clipPath="url(#glassclip)" />
      {level > 0.02 && <ellipse cx={0} cy={-h} rx={55 - 8 * (1 - level)} ry={6} fill="#c4ecff" clipPath="url(#glassclip)" />}
      <path d="M-58,-170 L58,-170 L48,0 L-48,0 Z" fill="white" fillOpacity={0.25} stroke="#9fb7d0" strokeWidth={6} strokeLinejoin="round" />
      <path d="M-40,-150 L-34,-20" stroke="white" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

/** Sweat drop centred at (0,0). */
export const Sweat: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <path d="M0,-14 C6,-4 9,2 9,6 A9,9 0 1 1 -9,6 C-9,2 -6,-4 0,-14 Z" transform={`scale(${s})`} fill="#9fe0ff" stroke="#4fb3e8" strokeWidth={2} />
);
