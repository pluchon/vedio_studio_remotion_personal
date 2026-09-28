// 小猫走进光里：奶白的爪印一步一步印下来，像盖章；越靠近光圈越亮
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { POOL } from "./Lamp";
import { EASE_OUT, NIGHT } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Print = { x: number; y: number; rot: number; at: number };

// 一个爪印，脚趾朝上（-y）：下缘三瓣的掌垫 + 四个脚趾
const Paw: React.FC = () => (
  <g fill={NIGHT.paw}>
    <path d="M 0 -10 C 14 -10, 25 1, 25 12 C 25 21, 18 25, 11 23 C 6 22, 4 19, 0 19 C -4 19, -6 22, -11 23 C -18 25, -25 21, -25 12 C -25 1, -14 -10, 0 -10 Z" />
    <ellipse cx={-26} cy={-13} rx={6.5} ry={8.5} transform="rotate(-32 -26 -13)" />
    <ellipse cx={-10} cy={-27} rx={7} ry={9.5} transform="rotate(-10 -10 -27)" />
    <ellipse cx={10} cy={-27} rx={7} ry={9.5} transform="rotate(10 10 -27)" />
    <ellipse cx={26} cy={-13} rx={6.5} ry={8.5} transform="rotate(32 26 -13)" />
  </g>
);

// 从 from 走到 to：steps 个交替的脚步，最后两只前爪并排站定
export const walkPrints = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps: number,
  times: number[],
): Print[] => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const rot = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const prints: Print[] = [];
  for (let i = 0; i < steps; i++) {
    const p = (i / steps) * 0.85;
    const side = i % 2 === 0 ? 1 : -1;
    prints.push({ x: from.x + dx * p + nx * 20 * side, y: from.y + dy * p + ny * 20 * side, rot, at: times[i] });
  }
  for (const side of [1, -1]) {
    prints.push({ x: to.x + nx * 38 * side, y: to.y + ny * 38 * side, rot, at: times[prints.length] });
  }
  return prints;
};

// dim 区间内爪印退到很淡，给照片和文字让位
export const PawPrints: React.FC<{ prints: Print[]; dim?: [number, number]; out?: number }> = ({ prints, dim, out }) => {
  const frame = useCurrentFrame();
  const fadeOut = out === undefined ? 1 : interpolate(frame, [out, out + 20], [1, 0], clamp);
  const dimmed = dim === undefined ? 1 : interpolate(frame, [dim[0], dim[0] + 15, dim[1], dim[1] + 15], [1, 0.18, 0.18, 1], clamp);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: fadeOut * dimmed }}>
      <defs>
        <filter id="wd-paw-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {prints.map((p, i) => {
        const stamp = interpolate(frame, [p.at, p.at + 7], [0, 1], { ...clamp, easing: EASE_OUT });
        if (stamp <= 0) return null;
        const d = Math.hypot((p.x - POOL.x) / POOL.rx, (p.y - POOL.y) / POOL.ry);
        const lit = interpolate(d, [0.3, 1.3], [1, 0.45], clamp);
        return (
          <g
            key={i}
            transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${1.15 * (1.3 - stamp * 0.3)})`}
            opacity={stamp * lit * 0.92}
            filter="url(#wd-paw-glow)"
          >
            <Paw />
          </g>
        );
      })}
    </svg>
  );
};
