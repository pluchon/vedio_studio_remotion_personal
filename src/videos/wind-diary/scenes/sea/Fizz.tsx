// 拧开可乐「呲」的一声：气泡从底部涌上来铺满画面
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const BUBBLES = Array.from({ length: 140 }, (_, i) => {
  const r = (k: string) => random(`fizz-${i}-${k}`);
  return {
    x: r("x") * 1920,
    size: 6 + r("s") ** 2 * 46,
    speed: 14 + r("v") * 26,
    delay: r("d") * 40,
    wobble: r("w") * Math.PI * 2,
  };
});

export const Fizz: React.FC<{ at: number; duration: number }> = ({ at, duration }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > duration) return null;
  const fade = interpolate(t, [0, 6, duration - 12, duration], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {BUBBLES.map((bub, i) => {
        const life = t - bub.delay;
        if (life < 0) return null;
        const y = 1120 - life * bub.speed;
        if (y < -60) return null;
        const x = bub.x + Math.sin(life / 4 + bub.wobble) * 8;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - bub.size / 2,
              top: y - bub.size / 2,
              width: bub.size,
              height: bub.size,
              borderRadius: "50%",
              border: "2px solid rgba(255, 255, 255, 0.85)",
              background: "radial-gradient(circle at 32% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.15) 28%, rgba(255,255,255,0.05) 100%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
