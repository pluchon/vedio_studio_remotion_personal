// 夜里的柏油路：深色底 + 细碎的砂石颗粒
import React from "react";
import { AbsoluteFill } from "remotion";
import { NIGHT } from "../../theme";

// 砂石颗粒：只保留噪声里较亮的点，color 为颗粒颜色（0~1 的 RGB）
export const GravelNoise: React.FC<{ id: string; rgb: [number, number, number]; cut?: number; style?: React.CSSProperties }> = ({
  id,
  rgb,
  cut = 0.55,
  style,
}) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, ...style }}>
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="7" />
      <feColorMatrix type="matrix" values={`0 0 0 0 ${rgb[0]}  0 0 0 0 ${rgb[1]}  0 0 0 0 ${rgb[2]}  2.4 0 0 0 ${-cut * 2.4}`} />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

export const Asphalt: React.FC = () => (
  <AbsoluteFill
    style={{ background: `radial-gradient(ellipse 90% 80% at 50% 62%, ${NIGHT.ground} 0%, ${NIGHT.groundDeep} 100%)` }}
  >
    <GravelNoise id="wd-gravel" rgb={[0.55, 0.56, 0.62]} style={{ opacity: 0.22 }} />
  </AbsoluteFill>
);
