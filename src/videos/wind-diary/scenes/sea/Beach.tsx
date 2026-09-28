// 俯瞰的沙滩：脚印被烫得一路小跑到水边，撑开的伞停在浪里；浪一次次拍上来又退回去，把脚印带走，最后海水漫满画面
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { GravelNoise } from "../cat/Asphalt";
import { DAY, EASE_IN_OUT, EASE_OUT, FONTS } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// 伞撑在水边，平时的浪一拍一拍漫到它脚下
const UMBRELLA = { x: 1190, y: 380 };
const PATH_FROM = { x: 540, y: 1150 };

// 浪的节奏（帧）：静止到 rest，涌到最高 surge 并停到 hold，退回 recede，再涌起 rise，漫满画面 fill
export type Tide = { rest: number; surge: number; hold: number; recede: number; rise: number; fill: number };

const tideBase = (frame: number, tide: Tide, from: number) => {
  const main = interpolate(
    frame,
    [tide.rest, tide.surge, tide.hold, tide.recede, tide.rise, tide.fill],
    [330, 1180, 1180, 360, 360, 1320],
    { ...clamp, easing: EASE_IN_OUT },
  );
  // 平时浪轻轻拍岸，四拍一来回
  const lap = frame < tide.rest ? 26 * Math.sin(((frame - from) / 88) * Math.PI * 2) : 0;
  return main + lap;
};

const shoreY = (x: number, base: number, frame: number) =>
  base + 16 * Math.sin(x / 150 + frame / 18) + 9 * Math.sin(x / 57 - frame / 11) + 5 * Math.sin(x / 23 + frame / 7);

const shorePoints = (base: number, frame: number) => {
  const pts: string[] = [];
  for (let x = -20; x <= 1940; x += 20) pts.push(`${x},${shoreY(x, base, frame).toFixed(1)}`);
  return pts;
};

// 一只脚印：前掌加脚跟，flip 为右脚
const Foot: React.FC<{ flip: boolean }> = ({ flip }) => (
  <g transform={flip ? "scale(-1 1)" : undefined} fill="rgba(150, 112, 66, 0.34)">
    <ellipse cx={-2} cy={-16} rx={14} ry={21} />
    <ellipse cx={2} cy={22} rx={10.5} ry={13} />
    <ellipse cx={-10} cy={-44} rx={5} ry={6} />
  </g>
);

// 俯视的伞：八片伞面交替两色
const Umbrella: React.FC<{ rot: number; scale: number }> = ({ rot, scale }) => (
  <g transform={`translate(${UMBRELLA.x} ${UMBRELLA.y})`}>
    <ellipse cx={34} cy={30} rx={82 * scale} ry={74 * scale} fill="rgba(60, 50, 30, 0.22)" />
    <g transform={`rotate(${rot}) scale(${scale})`}>
      {Array.from({ length: 8 }, (_, i) => {
        const a0 = (i / 8) * Math.PI * 2;
        const a1 = ((i + 1) / 8) * Math.PI * 2;
        const r = 80;
        return (
          <path
            key={i}
            d={`M0 0 L${(r * Math.cos(a0)).toFixed(1)} ${(r * Math.sin(a0)).toFixed(1)} A${r} ${r} 0 0 1 ${(r * Math.cos(a1)).toFixed(1)} ${(r * Math.sin(a1)).toFixed(1)} Z`}
            fill={i % 2 === 0 ? "#fbf4e8" : "#9fd0d6"}
            stroke="rgba(80, 90, 90, 0.25)"
            strokeWidth={1.2}
          />
        );
      })}
      <circle r={6} fill="#6b7d7f" />
    </g>
  </g>
);

export const Beach: React.FC<{ from: number; to: number; tide: Tide; steps: number[]; umbrellaAt: number }> = ({
  from,
  to,
  tide,
  steps,
  umbrellaAt,
}) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 1) return null;

  const base = tideBase(frame, tide, from);
  let reached = 0;
  for (let f = from; f <= frame; f++) reached = Math.max(reached, tideBase(f, tide, from));
  const shore = shorePoints(base, frame);
  const wet = shorePoints(reached + 30, frame / 3);

  // 脚印：沿路径不均匀地一路小跑
  const dx = UMBRELLA.x - PATH_FROM.x;
  const dy = UMBRELLA.y + 70 - PATH_FROM.y;
  const len = Math.hypot(dx, dy);
  const rot = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const offsets = [0, 0.1, 0.17, 0.3, 0.36, 0.48, 0.53, 0.66, 0.72, 0.84, 0.9, 1];
  const feet = steps.map((at, i) => {
    const p = offsets[i] ?? 1;
    const side = i % 2 === 0 ? 1 : -1;
    const x = PATH_FROM.x + dx * p + (-dy / len) * 24 * side;
    const y = PATH_FROM.y + dy * p + (dx / len) * 24 * side;
    let covered = Infinity;
    for (let f = from; f <= frame; f++) {
      if (tideBase(f, tide, from) + 20 >= y) {
        covered = f;
        break;
      }
    }
    const erased = Number.isFinite(covered) ? interpolate(frame, [covered, covered + 16], [1, 0], clamp) : 1;
    const opacity = interpolate(frame, [at, at + 4], [0, 1], clamp) * erased;
    return { x, y, flip: side < 0, opacity, at };
  });

  const umbrellaIn = interpolate(frame, [umbrellaAt, umbrellaAt + 14], [0, 1], { ...clamp, easing: EASE_OUT });
  const opacity = interpolate(frame, [from, from + 14], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${DAY.sandWet} 0%, ${DAY.sand} 40%, #ead2a8 100%)` }}>
        <GravelNoise id="wd-sand" rgb={[0.7, 0.58, 0.4]} cut={0.52} style={{ opacity: 0.45 }} />
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="wd-water" x1={0} y1={0} x2={0} y2={Math.max(base, 400)} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={DAY.seaDeep} />
            <stop offset="45%" stopColor={DAY.sea} />
            <stop offset="100%" stopColor="rgba(120, 206, 212, 0.72)" />
          </linearGradient>
          <filter id="wd-foam-blur">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {/* 浪到过的地方，沙子颜色深一些 */}
        <polygon points={`-20,-20 ${wet.join(" ")} 1940,-20`} fill={DAY.sandWet} opacity={0.5} />
        {feet.map((ft, i) =>
          ft.opacity > 0 ? (
            <g key={i} transform={`translate(${ft.x} ${ft.y}) rotate(${rot})`} opacity={ft.opacity}>
              <Foot flip={ft.flip} />
            </g>
          ) : null,
        )}
        {/* 小跑时写在一旁的「烫」 */}
        {[2, 5, 8].map((idx, n) => {
          const ft = feet[idx];
          if (!ft) return null;
          const pop = interpolate(frame, [ft.at, ft.at + 6, ft.at + 26, ft.at + 38], [0, 1, 1, 0], clamp);
          if (pop <= 0) return null;
          return (
            <text
              key={idx}
              x={ft.x + (n % 2 === 0 ? 70 : -110)}
              y={ft.y - 10}
              fontFamily={FONTS.hand}
              fontSize={46 + n * 6}
              fill="#e0703c"
              opacity={pop}
              transform={`rotate(${-12 + random(`hot-${n}`) * 24} ${ft.x} ${ft.y})`}
            >
              烫
            </text>
          );
        })}
        <polygon points={`-20,-20 ${shore.join(" ")} 1940,-20`} fill="url(#wd-water)" />
        <polyline points={shore.join(" ")} fill="none" stroke={DAY.foam} strokeWidth={16} opacity={0.75} filter="url(#wd-foam-blur)" />
        <polyline points={shore.join(" ")} fill="none" stroke={DAY.foam} strokeWidth={3} opacity={0.9} />
        {umbrellaIn > 0 && <Umbrella rot={-20 + 7 * Math.sin(frame / 13)} scale={0.6 + umbrellaIn * 0.4} />}
      </svg>
    </AbsoluteFill>
  );
};
