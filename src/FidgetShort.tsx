import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import song from "./song.json";

const STEP = song.framesPerStep;
const START = song.startFrame;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const KEY_COLORS = [
  "#ff4d6d",
  "#ff8c42",
  "#ffd23f",
  "#7ae582",
  "#3ddbd9",
  "#4ea8ff",
  "#9b6bff",
  "#ff6bd6",
];

type Note = { k: number; f: number };
const NOTES: Note[] = song.melody
  .map((k, i) => ({ k, f: START + i * STEP }))
  .filter((n) => n.k >= 0);
const LAST_NOTE = NOTES[NOTES.length - 1];
const FINAL_LAND = LAST_NOTE.f + 32;
const FINAL_HOP = 20;

// Layout (1080 x 1920)
const TOY_W = 960;
const TOY_LEFT = (1080 - TOY_W) / 2;
const SCREEN_TOP = 650;
const SCREEN_H = 400;
const DECK_TOP = SCREEN_TOP + SCREEN_H - 30;
const DECK_H = 470;
const BTN_W = 100;
const BTN_H = 58;
const BTN_SIDE = 30;
const BTN_SPACING = 112;
const BTN_FIRST_X = (TOY_W - (BTN_W + 7 * BTN_SPACING)) / 2 + BTN_W / 2;
const BTN_TOP_Y = DECK_TOP + 120; // y of button cap center at rest
const DRUM_TOP = DECK_TOP + 255;
const DRUM_H = 150;

const keyX = (k: number) => TOY_LEFT + BTN_FIRST_X + k * BTN_SPACING;

const press = (k: number, frame: number) => {
  let v = 0;
  for (const n of NOTES) {
    if (n.k !== k) continue;
    v = Math.max(v, interpolate(frame - n.f, [-1, 0, 3, 10], [0, 1, 1, 0], CLAMP));
  }
  return v;
};

const glow = (k: number, frame: number) => {
  let v = 0;
  for (const n of NOTES) {
    if (n.k !== k) continue;
    v = Math.max(
      v,
      interpolate(frame - n.f, [0, 1, 18], [0, 1, 0], {
        ...CLAMP,
        easing: Easing.out(Easing.quad),
      }),
    );
  }
  return v;
};

const finale = (frame: number) =>
  interpolate(frame, [FINAL_LAND, FINAL_LAND + 2, FINAL_LAND + 14], [0, 1, 0.55], CLAMP);

// ---------- Character state ----------
type Landing = { k: number; f: number; hop?: number; h?: number; spin?: boolean };
const LANDINGS: Landing[] = [
  ...NOTES,
  { k: LAST_NOTE.k, f: FINAL_LAND, hop: FINAL_HOP, h: 340, spin: true },
];

const charState = (frame: number) => {
  const first = LANDINGS[0];
  if (frame < first.f) {
    const t = interpolate(frame, [2, first.f], [0, 1], { ...CLAMP, easing: Easing.in(Easing.quad) });
    return { x: keyX(first.k), y: -1100 * (1 - t), squash: 0, rot: 0, dir: 0 };
  }
  let j = 0;
  for (let i = 0; i < LANDINGS.length; i++) if (frame >= LANDINGS[i].f) j = i;
  const cur = LANDINGS[j];
  const next = LANDINGS[j + 1];
  if (next) {
    const hop = next.hop ?? Math.min(6, next.f - cur.f);
    const startHop = next.f - hop;
    const dir = Math.sign(next.k - cur.k);
    if (frame >= startHop) {
      const t = (frame - startHop) / hop;
      const e = Easing.inOut(Easing.quad)(t);
      const h = next.h ?? 55 + 16 * Math.abs(next.k - cur.k);
      return {
        x: keyX(cur.k) + (keyX(next.k) - keyX(cur.k)) * e,
        y: -4 * h * t * (1 - t),
        squash: interpolate(t, [0, 0.2], [-0.35, 0], CLAMP),
        rot: next.spin ? 360 * Easing.inOut(Easing.cubic)(t) : dir * 10 * Math.sin(Math.PI * t),
        dir,
      };
    }
    const land = interpolate(frame - cur.f, [0, 2, 7], [1, 0.5, 0], CLAMP);
    return { x: keyX(cur.k), y: 0, squash: land, rot: 0, dir };
  }
  const land = interpolate(frame - cur.f, [0, 3, 10], [1, -0.2, 0], CLAMP);
  return { x: keyX(cur.k), y: 0, squash: land, rot: 0, dir: 0 };
};

// ---------- Pieces ----------
const PRINT_LINES =
  "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 5px)";

const Screen: React.FC<{ frame: number }> = ({ frame }) => {
  const segs = 10;
  const fin = finale(frame);
  return (
    <div
      style={{
        position: "absolute",
        left: TOY_LEFT,
        top: SCREEN_TOP,
        width: TOY_W,
        height: SCREEN_H,
        borderRadius: "56px 56px 0 0",
        background: `${PRINT_LINES}, linear-gradient(180deg, #ff9f43 0%, #f0702c 100%)`,
        boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.15), inset 0 6px 0 rgba(255,255,255,0.25)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 40,
          right: 40,
          bottom: 60,
          borderRadius: 28,
          background: "#120f2a",
          boxShadow: "inset 0 0 0 8px #2a1d4d, inset 0 0 60px rgba(80,60,200,0.35)",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 14,
          paddingBottom: 26,
        }}
      >
        {KEY_COLORS.map((c, k) => {
          const g = Math.max(glow(k, frame), fin * (0.6 + 0.4 * Math.sin(k + frame * 0.6)));
          const idle = 1 + 0.5 * (1 + Math.sin(frame * 0.25 + k * 1.3));
          const lvl = Math.min(segs, Math.round(idle + g * (segs - 1)));
          return (
            <div key={k} style={{ display: "flex", flexDirection: "column-reverse", gap: 6 }}>
              {Array.from({ length: segs }).map((_, s) => (
                <div
                  key={s}
                  style={{
                    width: 90,
                    height: 18,
                    borderRadius: 3,
                    background: s < lvl ? c : "rgba(255,255,255,0.06)",
                    boxShadow: s < lvl ? `0 0 ${10 + 18 * g}px ${c}` : "none",
                    opacity: s < lvl ? 0.75 + 0.25 * g : 1,
                  }}
                />
              ))}
            </div>
          );
        })}
        {/* scanlines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)",
          }}
        />
      </div>
      {/* screws */}
      {[22, TOY_W - 34].map((x) => (
        <div
          key={x}
          style={{
            position: "absolute",
            left: x,
            top: SCREEN_H - 50,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#c45a1e",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3)",
          }}
        />
      ))}
    </div>
  );
};

const Button: React.FC<{ k: number; frame: number }> = ({ k, frame }) => {
  const p = press(k, frame);
  const g = glow(k, frame);
  const c = KEY_COLORS[k];
  const sink = p * BTN_SIDE * 0.75;
  const cx = keyX(k);
  return (
    <>
      {/* socket */}
      <div
        style={{
          position: "absolute",
          left: cx - BTN_W / 2 - 8,
          top: BTN_TOP_Y + BTN_SIDE - BTN_H / 2 - 6,
          width: BTN_W + 16,
          height: BTN_H + 12,
          borderRadius: "50%",
          background: "#0e6f66",
          boxShadow: "inset 0 6px 10px rgba(0,0,0,0.45)",
        }}
      />
      {/* side */}
      <div
        style={{
          position: "absolute",
          left: cx - BTN_W / 2,
          top: BTN_TOP_Y + sink,
          width: BTN_W,
          height: BTN_SIDE - sink + BTN_H / 2,
          borderRadius: `0 0 ${BTN_W / 2}px ${BTN_W / 2}px / 0 0 ${BTN_H / 2}px ${BTN_H / 2}px`,
          background: `linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.4)), ${c}`,
        }}
      />
      {/* cap */}
      <div
        style={{
          position: "absolute",
          left: cx - BTN_W / 2,
          top: BTN_TOP_Y - BTN_H / 2 + sink,
          width: BTN_W,
          height: BTN_H,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 40% 35%, rgba(255,255,255,${0.55 + 0.4 * g}), transparent 55%), ${c}`,
          boxShadow: `0 0 ${50 * g}px ${18 * g}px ${c}aa, inset 0 -4px 0 rgba(0,0,0,0.15)`,
          filter: `brightness(${1 + 0.35 * g})`,
        }}
      />
    </>
  );
};

const Drum: React.FC<{ frame: number }> = ({ frame }) => {
  const R = DRUM_H / 2;
  const OMEGA = 8; // degrees per frame
  const left = TOY_LEFT + 30;
  const width = TOY_W - 60;
  const ribs = [];
  const phase = (frame * OMEGA) % 30;
  for (let a = -90 + phase; a < 90; a += 30) {
    const y = R * (1 + Math.sin((a * Math.PI) / 180));
    ribs.push(
      <div
        key={`r${a}`}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: y,
          height: 2,
          background: `rgba(255,255,255,${0.12 * Math.cos((a * Math.PI) / 180)})`,
        }}
      />,
    );
  }
  const pins = NOTES.map((n, i) => {
    const theta = -90 + (n.f - frame) * OMEGA;
    if (theta < -90 || theta > 90) return null;
    const rad = (theta * Math.PI) / 180;
    const y = R * (1 + Math.sin(rad));
    const cos = Math.cos(rad);
    const hit = interpolate(frame - n.f, [-3, 0], [0, 1], CLAMP);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: BTN_FIRST_X - 30 + n.k * BTN_SPACING - 18,
          top: y - 14 * Math.max(cos, 0.25),
          width: 36,
          height: 28 * Math.max(cos, 0.25),
          borderRadius: 6,
          background: `linear-gradient(180deg, #fff6d6, #d9b25b)`,
          opacity: 0.35 + 0.65 * cos,
          boxShadow: `0 0 ${8 + 20 * hit}px ${KEY_COLORS[n.k]}, inset 0 -4px 0 rgba(0,0,0,0.2)`,
        }}
      />
    );
  });
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: DRUM_TOP,
        width,
        height: DRUM_H,
        borderRadius: 18,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #3b3352 0%, #8d86a8 30%, #b7b1cc 50%, #8d86a8 70%, #2c2640 100%)",
        boxShadow: "inset 0 0 0 4px rgba(0,0,0,0.35), 0 6px 0 #0a5a52",
      }}
    >
      {ribs}
      {pins}
    </div>
  );
};

const PIXEL_NOTE = ["..XX", "..XXX", "..X.X", "..X", "..X", "XXX", "XXX", ".X"];
const PixelNote: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <div style={{ position: "relative", width: size * 5, height: size * 8 }}>
    {PIXEL_NOTE.flatMap((row, r) =>
      row.split("").map((ch, c) =>
        ch === "X" ? (
          <div
            key={`${r}-${c}`}
            style={{
              position: "absolute",
              left: c * size,
              top: r * size,
              width: size,
              height: size,
              background: color,
            }}
          />
        ) : null,
      ),
    )}
  </div>
);

const Particles: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {NOTES.map((n, i) => {
      const d = frame - n.f;
      if (d < 0 || d > 34) return null;
      const t = d / 34;
      const side = i % 2 === 0 ? 1 : -1;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: keyX(n.k) - 20 + side * (30 + 50 * t),
            top: BTN_TOP_Y - 160 - 340 * Easing.out(Easing.cubic)(t),
            opacity: interpolate(t, [0, 0.1, 0.65, 1], [0, 1, 1, 0]),
            scale: String(interpolate(t, [0, 0.15, 1], [0.4, 1.15, 0.9])),
            rotate: `${side * 12 * t}deg`,
            filter: `drop-shadow(0 0 10px ${KEY_COLORS[n.k]})`,
          }}
        >
          <PixelNote color={KEY_COLORS[n.k]} size={8} />
        </div>
      );
    })}
  </>
);

const Blip: React.FC<{ frame: number }> = ({ frame }) => {
  const s = charState(frame);
  const SIZE = 104;
  const capY = BTN_TOP_Y - BTN_H / 2 + 10;
  const kUnder = Math.round((s.x - TOY_LEFT - BTN_FIRST_X) / BTN_SPACING);
  const sink = s.y === 0 ? press(kUnder, frame) * BTN_SIDE * 0.75 : 0;
  const bob = Math.sin(frame * 0.5) * 3;
  return (
    <>
      {/* shadow on the buttons */}
      <div
        style={{
          position: "absolute",
          left: s.x - 42,
          top: BTN_TOP_Y - 14,
          width: 84,
          height: 26,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.35)",
          scale: String(interpolate(-s.y, [0, 400], [1, 0.35], CLAMP)),
          opacity: frame < START - 14 ? 0 : 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: s.x - SIZE / 2,
          top: capY - SIZE + s.y + sink,
          width: SIZE,
          height: SIZE,
          transformOrigin: "50% 100%",
          scale: `${1 + 0.22 * s.squash} ${1 - 0.22 * s.squash}`,
          rotate: `${s.rot}deg`,
        }}
      >
        {/* antenna */}
        <div
          style={{
            position: "absolute",
            left: SIZE / 2 - 3,
            top: -30 + bob * 0.5,
            width: 6,
            height: 32,
            background: "#c2185b",
            borderRadius: 3,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SIZE / 2 - 12,
            top: -46 + bob,
            width: 24,
            height: 24,
            borderRadius: 12,
            background: "#ffe066",
            boxShadow: "0 0 18px #ffe066",
          }}
        />
        {/* body */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 30,
            background: "linear-gradient(180deg, #ff7aa8 0%, #ff4f8b 70%, #d63a73 100%)",
            boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.15), inset 0 6px 0 rgba(255,255,255,0.35)",
          }}
        />
        {/* eyes */}
        {[30, 74].map((ex) => (
          <div
            key={ex}
            style={{
              position: "absolute",
              left: ex - 15,
              top: 26,
              width: 30,
              height: s.squash > 0.6 ? 10 : 36,
              marginTop: s.squash > 0.6 ? 13 : 0,
              borderRadius: 15,
              background: "white",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 8 + s.dir * 6,
                top: 12,
                width: 14,
                height: 16,
                borderRadius: 8,
                background: "#1b1035",
              }}
            />
          </div>
        ))}
        {/* blush + mouth */}
        {[10, 80].map((bx) => (
          <div
            key={bx}
            style={{
              position: "absolute",
              left: bx,
              top: 66,
              width: 16,
              height: 9,
              borderRadius: 5,
              background: "rgba(255,255,255,0.35)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: SIZE / 2 - 10,
            top: 70,
            width: 20,
            height: 10,
            borderRadius: "0 0 10px 10px",
            background: "#7a1240",
          }}
        />
        {/* feet */}
        {[22, 62].map((fx) => (
          <div
            key={fx}
            style={{
              position: "absolute",
              left: fx,
              top: SIZE - 8,
              width: 22,
              height: 12,
              borderRadius: 6,
              background: "#a8285c",
            }}
          />
        ))}
      </div>
    </>
  );
};

const Deck: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: TOY_LEFT,
        top: DECK_TOP,
        width: TOY_W,
        height: DECK_H,
        borderRadius: "40px 40px 64px 64px",
        background: `${PRINT_LINES}, linear-gradient(180deg, #2fd1bf 0%, #1aa898 60%, #138a7d 100%)`,
        boxShadow:
          "inset 0 8px 0 rgba(255,255,255,0.25), inset 0 -14px 0 rgba(0,0,0,0.2), 0 30px 60px rgba(0,0,0,0.45)",
      }}
    />
    {/* slot above drum */}
    <div
      style={{
        position: "absolute",
        left: TOY_LEFT + 24,
        top: DRUM_TOP - 12,
        width: TOY_W - 48,
        height: DRUM_H + 24,
        borderRadius: 24,
        background: "#0b4f48",
        boxShadow: "inset 0 8px 14px rgba(0,0,0,0.5)",
      }}
    />
    <Drum frame={frame} />
    {KEY_COLORS.map((_, k) => (
      <Button key={k} k={k} frame={frame} />
    ))}
  </>
);

export const FidgetShort: React.FC = () => {
  const frame = useCurrentFrame();
  // camera: settle in, then a tiny punch on each note
  let punch = 0;
  for (const n of NOTES) punch = Math.max(punch, interpolate(frame - n.f, [0, 1, 6], [0, 1, 0], CLAMP));
  const fin = finale(frame);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 42%, #3a2a7a 0%, #1c1440 55%, #0c0820 100%)",
        fontFamily: "'Inter Display', Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("tune.wav")} />
      {/* pixel grid backdrop */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.035) 2px, transparent 2px)",
          backgroundSize: "60px 60px",
          translate: `0px ${frame * 0.6}px`,
        }}
      />
      {/* title */}
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 80,
          right: 80,
          textAlign: "center",
          opacity: interpolate(frame, [4, 16], [0, 1], CLAMP),
          translate: `0px ${interpolate(frame, [4, 16], [30, 0], { ...CLAMP, easing: Easing.out(Easing.cubic) })}px`,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1,
            color: "#fff7e6",
            textShadow: "0 6px 0 #ff4f8b, 0 0 40px rgba(255,79,139,0.5)",
          }}
        >
          CLICK·CLACK
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 46,
            fontWeight: 700,
            color: "#8fe9de",
            letterSpacing: 6,
          }}
        >
          MUSICAL FIDGET
        </div>
      </div>

      <AbsoluteFill
        style={{
          scale: String(
            interpolate(frame, [0, 24], [1.06, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) }) +
              0.008 * punch +
              0.02 * fin,
          ),
          transformOrigin: "50% 55%",
        }}
      >
        {/* floor shadow */}
        <div
          style={{
            position: "absolute",
            left: 90,
            top: DECK_TOP + DECK_H - 10,
            width: 900,
            height: 90,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)",
          }}
        />
        <Screen frame={frame} />
        <Deck frame={frame} />
        <Particles frame={frame} />
        <Blip frame={frame} />
      </AbsoluteFill>

      {/* bottom tag */}
      <div
        style={{
          position: "absolute",
          bottom: 230,
          left: 80,
          right: 80,
          textAlign: "center",
          fontSize: 44,
          fontWeight: 600,
          color: "rgba(255,255,255,0.75)",
          opacity: interpolate(frame, [10, 22], [0, 1], CLAMP),
        }}
      >
        SOUND ON ♪
      </div>
      {/* finale flash */}
      <AbsoluteFill
        style={{ background: "white", opacity: interpolate(frame, [FINAL_LAND, FINAL_LAND + 1, FINAL_LAND + 8], [0, 0.35, 0], CLAMP) }}
      />
    </AbsoluteFill>
  );
};
