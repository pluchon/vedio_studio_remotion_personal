// 傍晚的海：天色由浅蓝渐到橙粉，太阳斜到远山上，海面拖着一道碎金
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const HORIZON = 640;
// 太阳偏右，让开左边的照片
const SUN_X = 1380;

const GLITTER = Array.from({ length: 70 }, (_, i) => ({
  y: HORIZON + 8 + random(`glit-y-${i}`) ** 1.4 * 420,
  w: 10 + random(`glit-w-${i}`) * 50,
  phase: random(`glit-p-${i}`) * Math.PI * 2,
  jitter: random(`glit-j-${i}`) - 0.5,
}));

export const Sunset: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 1) return null;
  const t = frame - from;
  const sunY = interpolate(t, [0, to - from], [520, 600], clamp);
  const opacity = interpolate(frame, [from, from + 16], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, #8fb0cf 0%, #d9b9b2 38%, #f3b98c ${(HORIZON / 1080) * 100}%, #6f7fa0 ${(HORIZON / 1080) * 100}%, #3f4d72 100%)` }} />
      {/* 太阳和它的光晕 */}
      <div style={{ position: "absolute", left: SUN_X - 300, top: sunY - 300, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 214, 160, 0.75) 0%, rgba(255, 190, 140, 0.25) 30%, rgba(255, 190, 140, 0) 70%)" }} />
      <div style={{ position: "absolute", left: SUN_X - 46, top: sunY - 46, width: 92, height: 92, borderRadius: "50%", backgroundColor: "#fff0d2", boxShadow: "0 0 40px rgba(255, 220, 170, 0.9)" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* 远处的岛 */}
        <path d={`M0 ${HORIZON} L0 ${HORIZON - 30} Q 120 ${HORIZON - 70} 260 ${HORIZON - 36} T 520 ${HORIZON - 22} L 620 ${HORIZON} Z`} fill="#5d5f78" />
        <path d={`M1240 ${HORIZON} Q 1380 ${HORIZON - 48} 1520 ${HORIZON - 30} T 1920 ${HORIZON - 40} L1920 ${HORIZON} Z`} fill="#62637b" />
        {/* 海面碎金：一道道短横在太阳下方闪动 */}
        {GLITTER.map((g, i) => {
          const spread = 30 + (g.y - HORIZON) * 0.45;
          const x = SUN_X + g.jitter * spread * 2;
          const flick = 0.35 + 0.65 * Math.max(0, Math.sin(frame / 3 + g.phase));
          return <rect key={i} x={x - g.w / 2} y={g.y} width={g.w} height={3} rx={1.5} fill="#ffe2b0" opacity={flick * 0.8} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
