// 情绪的小零件：颜文字气泡，头顶冒出来的符号，落地的灰尘，一圈迸开的彩色碎片
import { makeCircle, makeStar, makeTriangle } from "@remotion/shapes";
import React from "react";
import { random } from "remotion";
import { clamp, EASE, pop, ramp } from "./motion";
import { C, KAO } from "./theme";

const SPARKLE = makeStar({
  points: 4,
  innerRadius: 4.5,
  outerRadius: 15,
  cornerRadius: 1.5,
}).path;

// 颜文字里的 ✧ 字体里没有，换成自己画的小星星
const KaoText: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <>
    {text.split("✧").map((part, i) => (
      <React.Fragment key={i}>
        {i > 0 ? (
          <svg
            width={size * 0.72}
            height={size * 0.72}
            viewBox="0 0 30 30"
            style={{ verticalAlign: "-6%" }}
          >
            <path d={SPARKLE} fill={C.lemonDeep} />
          </svg>
        ) : null}
        {part}
      </React.Fragment>
    ))}
  </>
);

// 颜文字气泡：at 时弹出来，out 时收回去；平时轻轻地浮
export const Kao: React.FC<{
  t: number;
  at: number;
  out: number;
  x: number;
  y: number;
  text: string;
  size?: number;
  turn?: number;
  fill?: string;
  bare?: boolean; // 不要气泡，只有字
  color?: string;
}> = ({
  t,
  at,
  out,
  x,
  y,
  text,
  size = 42,
  turn = -4,
  fill = C.white,
  bare = false,
  color = C.ink,
}) => {
  if (t < at || t > out + 0.3) return null;
  const k = pop(t, at, 1.25) - ramp(t, out, out + 0.25, EASE.in);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + Math.sin((t - at) * 3.2) * 5,
        transform: `translate(-50%, -50%) rotate(${turn + Math.sin((t - at) * 2.3) * 2}deg) scale(${k})`,
        opacity: clamp(k * 2),
        padding: bare ? 0 : "8px 26px 10px",
        borderRadius: 999,
        background: bare ? "transparent" : fill,
        border: bare ? "none" : `5px solid ${C.ink}`,
        boxShadow: bare ? "none" : "0 7px 0 rgba(58, 42, 38, 0.16)",
        fontFamily: KAO,
        fontSize: size,
        lineHeight: 1.25,
        color,
        whiteSpace: "nowrap",
      }}
    >
      <KaoText text={text} size={size} />
    </div>
  );
};

// 头顶冒出来的符号：! ? ♪ ♡ 之类，或者一滴汗
export const Emote: React.FC<{
  t: number;
  at: number;
  out: number;
  x: number;
  y: number;
  kind: "!" | "?" | "♪" | "♡" | "…" | "sweat" | "spark";
  size?: number;
  color?: string;
}> = ({ t, at, out, x, y, kind, size = 64, color = C.coral }) => {
  if (t < at || t > out + 0.3) return null;
  const k = pop(t, at, 1.4) - ramp(t, out, out + 0.25, EASE.in);
  const drift = (t - at) * (kind === "♪" || kind === "♡" ? 26 : 0);
  return (
    <div
      style={{
        position: "absolute",
        left: x + (kind === "♪" ? Math.sin((t - at) * 4) * 10 : 0),
        top: y - drift,
        transform: `translate(-50%, -50%) rotate(${kind === "sweat" ? 0 : 10}deg) scale(${k})`,
        opacity: clamp(k * 2),
        fontFamily: KAO,
        fontSize: size,
        lineHeight: 1,
        color,
        WebkitTextStroke: `7px ${C.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      {kind === "sweat" ? (
        <svg width={size * 0.7} height={size} viewBox="0 0 42 60">
          <path
            d="M 21 4 C 30 22 38 30 38 40 C 38 50 30 56 21 56 C 12 56 4 50 4 40 C 4 30 12 22 21 4 Z"
            fill={C.sky}
            stroke={C.ink}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        </svg>
      ) : kind === "spark" ? (
        <svg width={size} height={size} viewBox="0 0 30 30">
          <path
            d={SPARKLE}
            fill={C.lemon}
            stroke={C.ink}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        kind
      )}
    </div>
  );
};

const BITS = [
  makeCircle({ radius: 10 }).path,
  makeStar({ points: 5, innerRadius: 6, outerRadius: 13, cornerRadius: 2 })
    .path,
  makeTriangle({ length: 22, direction: "up", cornerRadius: 4 }).path,
  makeStar({ points: 4, innerRadius: 4, outerRadius: 13, cornerRadius: 1.5 })
    .path,
];
const BIT_COLORS = [C.lemon, C.mint, C.lilac, C.sky, C.coral, C.pink];

// 一圈迸开的彩色碎片，外加一道扩出去的光环。放在 <svg> 里用
export const Burst: React.FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  count?: number;
  reach?: number;
  seconds?: number;
  ring?: string | null;
  seed?: string;
}> = ({
  t,
  at,
  x,
  y,
  count = 14,
  reach = 320,
  seconds = 0.85,
  ring = C.lemon,
  seed = "burst",
}) => {
  if (t < at || t > at + seconds) return null;
  const p = ramp(t, at, at + seconds, EASE.out);
  return (
    <g transform={`translate(${x} ${y})`}>
      {ring ? (
        <circle
          r={reach * (0.15 + 0.85 * p)}
          fill="none"
          stroke={ring}
          strokeWidth={22 * (1 - p)}
          opacity={1 - p}
        />
      ) : null}
      {Array.from({ length: count }, (_, i) => {
        const angle =
          (i / count) * Math.PI * 2 + random(`${seed}-a-${i}`) * 0.5;
        const far = reach * (0.75 + random(`${seed}-d-${i}`) * 0.6) * p;
        return (
          <g
            key={i}
            transform={`translate(${Math.cos(angle) * far} ${Math.sin(angle) * far * 0.8 + 150 * p * p}) rotate(${
              p * 300 * (i % 2 ? 1 : -1)
            }) scale(${(1 + random(`${seed}-s-${i}`) * 0.8) * (1 - p ** 3)})`}
          >
            <path
              d={BITS[i % BITS.length]}
              transform="translate(-11 -11)"
              fill={BIT_COLORS[i % BIT_COLORS.length]}
              stroke={C.ink}
              strokeWidth={3.5}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </g>
  );
};

// 落地、急停时脚边扬起的几团灰。放在 <svg> 里用
export const Puff: React.FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  size?: number;
  color?: string;
}> = ({ t, at, x, y, size = 1, color = C.white }) => {
  if (t < at || t > at + 0.6) return null;
  const p = ramp(t, at, at + 0.6, EASE.out);
  return (
    <g opacity={0.85 * (1 - p)}>
      {[-1, -0.45, 0.45, 1].map((side, i) => (
        <circle
          key={i}
          cx={x + side * (70 + 90 * p) * size}
          cy={y - (8 + 30 * p * (i % 2 ? 1.4 : 0.8)) * size}
          r={(20 - 6 * Math.abs(side) + 10 * p) * size}
          fill={color}
          stroke={C.ink}
          strokeWidth={4}
          strokeOpacity={0.35}
        />
      ))}
    </g>
  );
};

// 几颗一闪一闪的小星星，围在某样东西周围。放在 <svg> 里用
export const Twinkles: React.FC<{
  t: number;
  at: number;
  out: number;
  x: number;
  y: number;
  spread: number;
  count?: number;
  seed?: string;
  color?: string;
}> = ({
  t,
  at,
  out,
  x,
  y,
  spread,
  count = 5,
  seed = "twinkle",
  color = C.lemon,
}) => {
  if (t < at || t > out) return null;
  const show = pop(t, at) - ramp(t, out - 0.25, out);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const angle =
          (i / count) * Math.PI * 2 + random(`${seed}-a-${i}`) * 1.2;
        const far = spread * (0.75 + random(`${seed}-d-${i}`) * 0.5);
        const beat = 0.5 + 0.5 * Math.sin(t * 5 + i * 2.1);
        return (
          <g
            key={i}
            transform={`translate(${x + Math.cos(angle) * far} ${y + Math.sin(angle) * far * 0.7}) scale(${
              show * (0.6 + 0.9 * beat)
            }) rotate(${t * 40}) translate(-15 -15)`}
          >
            <path
              d={SPARKLE}
              fill={color}
              stroke={C.ink}
              strokeWidth={2.4}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </g>
  );
};
