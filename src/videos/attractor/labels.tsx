// 画面上的小标注：很小、很淡，只在需要点一下的时候出现
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
  chip?: boolean;
}> = ({ x, y, p, children, sub, size = 30, color = COLORS.text, align = "center", chip = false }) => {
  if (p <= 0.003) return null;
  const shift = align === "center" ? "-50%" : align === "left" ? "0%" : "-100%";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${shift}, -50%) translateY(${(1 - p) * 6}px)`,
        opacity: p * 0.9,
        fontFamily: FONT,
        fontSize: size,
        letterSpacing: size * 0.14,
        color,
        textAlign: align,
        whiteSpace: "pre",
        textShadow: "0 0 12px rgba(2,4,11,0.9), 0 0 3px rgba(2,4,11,0.9)",
        lineHeight: 1.5,
        ...(chip ? { background: "rgba(2,4,11,0.66)", padding: "8px 22px 10px", borderRadius: 8 } : null),
      }}
    >
      {children}
      {sub ? <div style={{ fontSize: size * 0.58, letterSpacing: size * 0.1, color: COLORS.soft, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
};

// 一个小圈 + 一条细线连到文字：给照片、星图上的东西做标注
export const Callout: React.FC<{
  x: number;
  y: number; // 被指的点
  tx: number;
  ty: number; // 文字中心
  p: number;
  children: React.ReactNode;
  sub?: string;
  r?: number;
  color?: string;
  size?: number;
  align?: "center" | "left" | "right";
}> = ({ x, y, tx, ty, p, children, sub, r = 16, color = COLORS.amber, size = 28, align = "center" }) => {
  if (p <= 0.003) return null;
  const dx = tx - x;
  const dy = ty - y;
  const len = Math.hypot(dx, dy) || 1;
  const x1 = x + (dx / len) * r;
  const y1 = y + (dy / len) * r;
  const ax = align === "left" ? tx - 8 : align === "right" ? tx + 8 : tx;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: p }}>
        <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={1.8} />
        <line x1={x1} y1={y1} x2={ax} y2={ty + (dy > 0 ? -size * 0.9 : size * 0.9)} stroke={color} strokeWidth={1.2} strokeOpacity={0.8} />
      </svg>
      <Tag x={tx} y={ty} p={p} size={size} sub={sub} color={color} align={align} chip>
        {children}
      </Tag>
    </>
  );
};

// 论文页上的高亮框：x、y、w、h 是在页面图片自己的像素坐标里
export const Box: React.FC<{ x: number; y: number; w: number; h: number; p: number; color?: string }> = ({ x, y, w, h, p, color = COLORS.amber }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w * Math.min(1, p * 1.3),
      height: h,
      background: `${color}22`,
      borderBottom: `2px solid ${color}`,
      opacity: Math.min(1, p * 2),
    }}
  />
);

// 来源小字，贴在画面右下角
export const Credit: React.FC<{ children: React.ReactNode; p?: number; x?: number; y?: number; align?: "left" | "right" }> = ({ children, p = 1, x = 1880, y = 1030, align = "right" }) => (
  <div style={{ position: "absolute", left: align === "right" ? undefined : x, right: align === "right" ? 1920 - x : undefined, top: y, fontFamily: FONT, fontSize: 17, letterSpacing: 1.6, color: COLORS.soft, opacity: 0.7 * p, textShadow: "0 0 8px rgba(2,4,11,0.95)", whiteSpace: "pre", textAlign: align }}>
    {children}
  </div>
);

// 一句论文原话：英文原句 + 小字中文
export const Quote: React.FC<{ x: number; y: number; w: number; p: number; en: string; zh: string; source?: string }> = ({ x, y, w, p, en, zh, source }) => {
  if (p <= 0.003) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: p, transform: `translateY(${(1 - p) * 8}px)`, fontFamily: FONT, textShadow: "0 0 12px rgba(2,4,11,0.95)" }}>
      <div style={{ fontSize: 25, lineHeight: 1.55, color: COLORS.text, fontStyle: "italic", letterSpacing: 0.6 }}>“{en}”</div>
      <div style={{ fontSize: 24, lineHeight: 1.6, color: COLORS.amber, marginTop: 10, letterSpacing: 3 }}>{zh}</div>
      {source ? <div style={{ fontSize: 17, color: COLORS.soft, marginTop: 8, letterSpacing: 1.6 }}>{source}</div> : null}
    </div>
  );
};
