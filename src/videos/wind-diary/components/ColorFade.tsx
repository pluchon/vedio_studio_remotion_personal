// 整屏颜色的淡入淡出，用来和前后章节接色：mode 为 in 时从该颜色里显出画面，out 时画面沉进该颜色
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const ColorFade: React.FC<{ color: string; from: number; to: number; mode: "in" | "out" }> = ({ color, from, to, mode }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = mode === "in" ? 1 - p : p;
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ backgroundColor: color, opacity, pointerEvents: "none" }} />;
};
