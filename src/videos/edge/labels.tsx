// 图上的小标签和公式：带细框的纸条，随念白淡入
import React from "react";
import { COLORS, FONT, FONT_BLACK } from "./theme";

// 一张纸条标签；x、y 是中心点
export const Tag: React.FC<{
  x: number;
  y: number;
  p: number;
  size?: number;
  red?: boolean;
  dark?: boolean;
  children: React.ReactNode;
}> = ({ x, y, p, size = 34, red = false, dark = false, children }) => {
  if (p <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 10}px)`,
        opacity: p,
        padding: `${size * 0.16}px ${size * 0.6}px ${size * 0.2}px`,
        background: dark ? "rgba(10, 14, 28, 0.78)" : "rgba(243, 235, 210, 0.92)",
        border: `1.6px solid ${red ? COLORS.red : dark ? "rgba(243,233,201,0.6)" : COLORS.ink}`,
        color: red ? COLORS.red : dark ? COLORS.star : COLORS.ink,
        fontFamily: FONT,
        fontSize: size,
        letterSpacing: size * 0.12,
        whiteSpace: "nowrap",
        boxShadow: dark ? "none" : "0 8px 20px -12px rgba(30, 20, 10, 0.55)",
      }}
    >
      {children}
    </div>
  );
};

// 不带框的大字，用于数字和年份
export const Big: React.FC<{
  x: number;
  y: number;
  p: number;
  size?: number;
  color?: string;
  black?: boolean;
  spacing?: number;
  children: React.ReactNode;
}> = ({ x, y, p, size = 96, color = COLORS.ink, black = true, spacing = 0.08, children }) => {
  if (p <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 14}px)`,
        opacity: p,
        fontFamily: black ? FONT_BLACK : FONT,
        fontSize: size,
        letterSpacing: size * spacing,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

// 分数：上下两行夹一条横线
export const Frac: React.FC<{ top: React.ReactNode; bottom: React.ReactNode }> = ({ top, bottom }) => (
  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", margin: "0 0.2em", lineHeight: 1.05 }}>
    <span style={{ padding: "0 0.2em" }}>{top}</span>
    <span style={{ alignSelf: "stretch", borderTop: "0.06em solid currentColor" }} />
    <span style={{ padding: "0 0.2em" }}>{bottom}</span>
  </span>
);
