// 画面上的小标签：很小、很淡，只在需要点一下的时候出现
import React from "react";
import { COLORS, FONT } from "./theme";

// 一行小字，可以带第二行更小的说明；x、y 是中心点（像素）
export const Tag: React.FC<{
  x: number;
  y: number;
  p: number;
  children: React.ReactNode;
  sub?: string;
  size?: number;
  color?: string;
  align?: "center" | "left" | "right";
}> = ({ x, y, p, children, sub, size = 30, color = COLORS.text, align = "center" }) => {
  if (p <= 0.003) return null;
  const shift = align === "center" ? "-50%" : align === "left" ? "0%" : "-100%";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${shift}, -50%) translateY(${(1 - p) * 6}px)`,
        opacity: p * 0.88,
        fontFamily: FONT,
        fontSize: size,
        letterSpacing: size * 0.18,
        color,
        textAlign: align,
        whiteSpace: "pre",
        textShadow: "0 0 12px rgba(2,3,10,0.9), 0 0 3px rgba(2,3,10,0.9)",
        lineHeight: 1.5,
      }}
    >
      {children}
      {sub ? <div style={{ fontSize: size * 0.58, letterSpacing: size * 0.14, color: COLORS.soft, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
};

// 目镜：圆形的视场，外面是黑的；里面的画面由 children 自己放
export const Eyepiece: React.FC<{ p: number; radius?: number; cx?: number; cy?: number }> = ({ p, radius = 440, cx = 960, cy = 520 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity: p,
      background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(0,0,0,0) ${radius - 6}px, rgba(0,0,0,0.78) ${radius + 1}px, rgb(0,0,0) ${radius + 26}px)`,
      pointerEvents: "none",
    }}
  />
);
