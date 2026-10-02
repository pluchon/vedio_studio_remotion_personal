// 朱砂色的几笔简图：太阳、山、水，垫在字的后面，提示这个字原本画的是什么；另有一片龟甲的轮廓
import React from "react";
import { evolvePath } from "@remotion/paths";

const wave = (y: number) => `M10 ${y} C 22 ${y - 9}, 32 ${y + 9}, 44 ${y} S 66 ${y - 9}, 78 ${y} S 88 ${y + 6}, 92 ${y}`;

const rays = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `M${50 + Math.cos(a) * 38} ${50 + Math.sin(a) * 38} L${50 + Math.cos(a) * 46} ${50 + Math.sin(a) * 46}`;
});

const SHAPES = {
  sun: ["M50 20 A30 30 0 1 1 49.9 20", ...rays],
  mountain: ["M4 80 L26 40 L36 56 L52 18 L68 54 L78 38 L96 80", "M0 80 L100 80"],
  water: [wave(34), wave(50), wave(66)],
  shell: [
    "M50 4 C 74 4, 88 18, 90 40 C 92 62, 84 86, 50 96 C 16 86, 8 62, 10 40 C 12 18, 26 4, 50 4",
    "M50 4 L50 96",
    "M17 22 C 30 28, 70 28, 83 22",
    "M10 44 C 30 49, 70 49, 90 44",
    "M14 66 C 30 71, 70 71, 86 66",
    "M27 84 C 38 87, 62 87, 73 84",
  ],
};

export type SketchKind = keyof typeof SHAPES;

export const Sketch: React.FC<{
  kind: SketchKind;
  x: number;
  y: number;
  size: number;
  // 0 到 1：一笔一笔画出来
  draw: number;
  opacity: number;
  color: string;
  stroke?: number;
}> = ({ kind, x, y, size, draw, opacity, color, stroke = 0.6 }) => {
  if (opacity <= 0 || draw <= 0) return null;
  const paths = SHAPES[kind];
  // 第一笔先画，其余的笔画稍后一起跟上
  const main = Math.min(1, draw * 1.6);
  const rest = Math.max(0, Math.min(1, draw * 1.6 - 0.6));

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity, overflow: "visible" }}
    >
      {paths.map((d, i) => {
        const { strokeDasharray, strokeDashoffset } = evolvePath(i === 0 ? main : rest, d);
        return (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        );
      })}
    </svg>
  );
};
