// 宣纸：暖白底上几块淡淡的水渍、细密的纤维，四角略暗
import React from "react";
import { AbsoluteFill } from "remotion";
import { PAPER } from "../theme";

export const Xuan: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER.base }}>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <filter id="lu-xuan-mottle" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0032" numOctaves="3" seed="7" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.49  0 0 0 0 0.3  1.3 0 0 0 -0.52" />
      </filter>
      <filter id="lu-xuan-fiber" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.011 0.16" numOctaves="2" seed="3" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.24  2.2 0 0 0 -1.25" />
      </filter>
      <filter id="lu-xuan-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="11" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0 0.16  0.9 0 0 0 -0.38" />
      </filter>
      <rect width="100%" height="100%" filter="url(#lu-xuan-mottle)" opacity={0.28} />
      <rect width="100%" height="100%" filter="url(#lu-xuan-fiber)" opacity={0.22} />
      <rect width="100%" height="100%" filter="url(#lu-xuan-grain)" opacity={0.18} />
    </svg>
    <AbsoluteFill
      style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(120, 90, 50, 0) 60%, rgba(120, 90, 50, 0.22) 100%)" }}
    />
  </AbsoluteFill>
);
