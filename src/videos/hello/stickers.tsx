// 贴纸式的小零件：白底、深棕描边、底下一道实心的影子
import React from "react";
import { clamp, pop, ramp } from "./motion";
import { C, TEXT } from "./theme";

export type Part = {
  id: string;
  Back: React.FC<{ t: number }>;
  Front?: React.FC<{ t: number }>;
};

export const sticker = (radius = 28, fill = C.white): React.CSSProperties => ({
  background: fill,
  border: `6px solid ${C.ink}`,
  borderRadius: radius,
  boxShadow: "0 9px 0 rgba(58, 42, 38, 0.16)",
  boxSizing: "border-box",
});

// 以 (x, y) 为中心放一个零件：at 时弹出来，out 时收回去
export const Pop: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  turn?: number;
  origin?: string;
  bounce?: number;
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
  children,
}) => {
  const k =
    pop(t, at, bounce) - (out === undefined ? 0 : ramp(t, out, out + 0.25));
  if (t < at || k <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${turn}deg) scale(${k})`,
        transformOrigin: origin,
        opacity: clamp(k * 2),
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
