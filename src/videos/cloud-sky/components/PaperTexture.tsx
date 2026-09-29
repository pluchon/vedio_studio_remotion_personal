// 整幅画面上压一层纸的纤维，让程序画出来的色块像画在纸上的淡彩
import React from "react";
import { AbsoluteFill } from "remotion";

export const PaperTexture: React.FC<{ opacity?: number }> = ({ opacity = 0.22 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "multiply" }}>
      <filter id="cs-paper">
        <feTurbulence type="fractalNoise" baseFrequency="0.018 0.22" numOctaves="3" seed="3" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.57  0 0 0 0 0.5  0 0 0 0.55 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#cs-paper)" />
    </svg>
  </AbsoluteFill>
);
