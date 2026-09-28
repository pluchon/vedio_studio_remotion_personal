// 胶片颗粒与暗角：颗粒每两帧换一次种子，让画面有呼吸感
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Grain: React.FC<{ opacity?: number; vignette?: number }> = ({ opacity = 0.08, vignette = 0.55 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 97;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay" }}>
        <filter id="wd-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#wd-grain)" />
      </svg>
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)` }}
      />
    </AbsoluteFill>
  );
};
