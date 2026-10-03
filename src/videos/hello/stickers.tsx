// 贴纸式的小零件：白底、深棕描边、底下一道实心的影子
import React from "react";
import { clamp, EASE, pop, ramp, settle } from "./motion";
import { C, TEXT } from "./theme";

export const sticker = (radius = 28, fill = C.white): React.CSSProperties => ({
  background: fill,
  border: `6px solid ${C.ink}`,
  borderRadius: radius,
  boxShadow: "0 9px 0 rgba(58, 42, 38, 0.16)",
  boxSizing: "border-box",
});

// 以 (x, y) 为中心放一个零件：at 时弹出来，out 时退场
// from 是进场时从哪个方向滑过来（相对位移），to 是退场时往哪边去；float 是停着时上下浮动的幅度
export const Pop: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  turn?: number;
  origin?: string;
  bounce?: number;
  from?: [number, number];
  to?: [number, number];
  float?: number;
  children: React.ReactNode;
}> = ({
  t,
  at,
  out,
  x,
  y,
  turn = 0,
  origin = "50% 50%",
  bounce = 1,
  from,
  to = [0, 60],
  float = 0,
  children,
}) => {
  if (t < at) return null;
  const leave = out === undefined ? 0 : ramp(t, out, out + 0.32, EASE.in);
  if (leave >= 1) return null;
  const k = pop(t, at, bounce);
  const come = from ? 1 - settle(t, at, 0.55) : 0;
  const bob = float ? Math.sin((t - at) * 2.4) * float : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x + (from ? from[0] * come : 0) + to[0] * leave,
        top: y + (from ? from[1] * come : 0) + to[1] * leave + bob,
        transform: `translate(-50%, -50%) rotate(${turn + (from ? come * 14 : 0) + leave * 10}deg) scale(${
          (from ? 0.6 + 0.4 * k : k) * (1 - 0.3 * leave)
        })`,
        transformOrigin: origin,
        opacity: clamp(k * 2) * (1 - leave),
        fontFamily: TEXT,
        color: C.ink,
      }}
    >
      {children}
    </div>
  );
};

// 一个打叉或打勾的圆章
export const Mark: React.FC<{ ok: boolean; size?: number }> = ({
  ok,
  size = 110,
}) => (
  <svg width={size} height={size} viewBox="0 0 110 110">
    <circle
      cx={55}
      cy={55}
      r={48}
      fill={ok ? C.mint : C.coral}
      stroke={C.ink}
      strokeWidth={6}
    />
    <path
      d={ok ? "M 31 57 L 48 73 L 80 39" : "M 36 36 L 74 74 M 74 36 L 36 74"}
      stroke={C.white}
      strokeWidth={12}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// 一枚小标签：圆角、带颜色，放一两个词
export const Tag: React.FC<{
  fill?: string;
  size?: number;
  children: React.ReactNode;
}> = ({ fill = C.lemon, size = 48, children }) => (
  <div
    style={{
      padding: `${size * 0.22}px ${size * 0.7}px ${size * 0.28}px`,
      fontSize: size,
      whiteSpace: "nowrap",
      ...sticker(size * 0.8, fill),
    }}
  >
    {children}
  </div>
);
