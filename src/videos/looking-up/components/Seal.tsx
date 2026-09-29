// 朱砂印：方印白字，边缘和印面带一点斑驳；盖下去时由大到小、略一歪
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, FONTS, PAPER } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Seal: React.FC<{ text: string; at: number; size?: number; color?: string; style?: React.CSSProperties }> = ({
  text,
  at,
  size = 72,
  color = PAPER.cinnabar,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 9], [0, 1], { ...clamp, easing: EASE_OUT });
  if (p <= 0) return null;
  const chars = [...text];
  const cell = size / Math.max(1, chars.length);

  return (
    <svg
      width={size}
      height={size}
      style={{ position: "absolute", overflow: "visible", opacity: Math.min(1, p * 1.6) * 0.92, scale: `${1.35 - 0.35 * p}`, rotate: `${-3 * p}deg`, ...style }}
    >
      <filter id="lu-seal-rough" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="9" result="speck" />
        <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.2" result="holes" />
        <feComposite in="d" in2="holes" operator="in" />
      </filter>
      <g filter="url(#lu-seal-rough)">
        <rect x={1} y={1} width={size - 2} height={size - 2} rx={3} fill={color} />
        {chars.map((ch, i) => (
          <text
            key={i}
            x={size / 2}
            y={cell * i + cell * 0.8 + 2}
            textAnchor="middle"
            fontFamily={FONTS.songBlack}
            fontSize={cell * 0.86}
            fill={PAPER.base}
          >
            {ch}
          </text>
        ))}
      </g>
    </svg>
  );
};
