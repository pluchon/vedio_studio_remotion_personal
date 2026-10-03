// 墨线工具：手抖的折线、一笔一笔画出来的路径、虚线、印章，以及整幅画共用的「毛边」滤镜
import { noise2D } from "@remotion/noise";
import React, { useId } from "react";
import { COLORS } from "./theme";

export type Pt = [number, number];

// 过这些点的平滑曲线（Catmull-Rom 转三次贝塞尔）
export const curve = (pts: Pt[], closed = false): string => {
  const n = pts.length;
  if (n < 2) return "";
  const at = (i: number): Pt => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return closed ? `${d}Z` : d;
};

// 给点加一点手抖
export const wobble = (pts: Pt[], amp: number, seed: string): Pt[] =>
  pts.map(([x, y], i) => [x + noise2D(seed, i * 0.83, 0.5) * amp, y + noise2D(seed, i * 0.83, 7.5) * amp]);

// 两点之间补出 n 段，再加手抖，得到一条不那么直的线
export const handLine = (a: Pt, b: Pt, seed: string, amp = 2.5, step = 70): string => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.round(len / step));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  return curve(wobble(pts, amp, seed));
};

// 椭圆弧的点列
export const arcPoints = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 24): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
};

export const circlePath = (cx: number, cy: number, r: number, seed: string, amp = 1.6, n = 28): string => {
  const pts = arcPoints(cx, cy, r, r, 0, Math.PI * 2, n).slice(0, n);
  return curve(wobble(pts, amp, seed), true);
};

// 毛边滤镜：一次定义，整幅画里的墨线用 filter="url(#edge-rough)"
export const RoughDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="edge-rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={3} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
      </filter>
      <filter id="edge-ink-soak" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={7} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="140" />
      </filter>
    </defs>
  </svg>
);

// 一笔一笔画出来：p 从 0 到 1
export const Draw: React.FC<{
  d: string;
  p: number;
  color?: string;
  width?: number;
  opacity?: number;
  fill?: string;
  fillOpacity?: number;
  cap?: "round" | "butt";
}> = ({ d, p, color = COLORS.ink, width = 2.4, opacity = 1, fill = "none", fillOpacity = 1, cap = "round" }) => {
  if (p <= 0.0005 || opacity <= 0) return null;
  return (
    <>
      {fill !== "none" ? <path d={d} fill={fill} fillOpacity={fillOpacity * p} stroke="none" /> : null}
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap={cap}
        strokeLinejoin="round"
        strokeDasharray="1 2"
        strokeDashoffset={1 - Math.min(1, p)}
        opacity={opacity}
      />
    </>
  );
};

// 虚线也要一段段画出来：用一条同路径的粗线当遮罩来揭开
export const DrawDashed: React.FC<{
  d: string;
  p: number;
  dash: string;
  color?: string;
  width?: number;
  opacity?: number;
}> = ({ d, p, dash, color = COLORS.ink, width = 2.4, opacity = 1 }) => {
  const id = useId();
  if (p <= 0.0005 || opacity <= 0) return null;
  return (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9000} height={9000}>
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke="#fff"
          strokeWidth={width + 12}
          strokeLinecap="butt"
          strokeDasharray="1 2"
          strokeDashoffset={1 - Math.min(1, p)}
        />
      </mask>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash}
        opacity={opacity}
        mask={`url(#${id})`}
      />
    </>
  );
};

// 朱砂印章：方的，里面两个字
export const Seal: React.FC<{ x: number; y: number; size: number; text: string; rotate?: number; opacity?: number; font: string }> = ({
  x,
  y,
  size,
  text,
  rotate = -6,
  opacity = 1,
  font,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      boxSizing: "border-box",
      border: `${Math.max(3, size * 0.05)}px solid ${COLORS.red}`,
      color: COLORS.red,
      fontFamily: font,
      fontSize: size * 0.4,
      lineHeight: 1.05,
      display: "flex",
      flexWrap: "wrap",
      alignContent: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: size * 0.06,
      transform: `rotate(${rotate}deg)`,
      opacity,
      filter: "url(#edge-rough)",
      mixBlendMode: "multiply",
    }}
  >
    {text}
  </div>
);
