// 底：奶油色的纸，几团很淡的色块慢慢漂，散着一些小图形；地面是下方一道弧形的色带
import { noise2D } from "@remotion/noise";
import { makeCircle, makeStar, makeTriangle } from "@remotion/shapes";
import React from "react";
import { random } from "remotion";
import { C, GROUND, HEIGHT, WIDTH } from "./theme";

const BITS = [
  makeCircle({ radius: 9 }).path,
  makeStar({ points: 4, innerRadius: 5, outerRadius: 13, cornerRadius: 2 })
    .path,
  makeTriangle({ length: 20, direction: "up", cornerRadius: 4 }).path,
];
const BIT_COLORS = [C.lemon, C.mint, C.lilac, C.sky, C.coralLight];

export const Paper: React.FC<{
  t: number;
  tint?: string; // 这一段的底色
  floor?: number; // 地面升起来的程度，0 到 1
  floorColor?: string;
  bits?: number; // 小图形的浓淡
}> = ({ t, tint = C.paper, floor = 1, floorColor = C.floor, bits = 1 }) => {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <rect width={WIDTH} height={HEIGHT} fill={tint} />
      {/* 三团淡淡的色块 */}
      {[C.lemon, C.coralLight, C.mint].map((color, i) => (
        <circle
          key={color}
          cx={300 + i * 660 + noise2D(`blob-x-${i}`, t * 0.07, 0) * 160}
          cy={300 + (i % 2) * 340 + noise2D(`blob-y-${i}`, 0, t * 0.07) * 120}
          r={360}
          fill={color}
          opacity={0.13}
          style={{ filter: "blur(70px)" }}
        />
      ))}
      {/* 散着的小图形：慢慢漂、慢慢转 */}
      {Array.from({ length: 16 }, (_, i) => {
        const x = random(`bit-x-${i}`) * WIDTH;
        const y = random(`bit-y-${i}`) * (GROUND - 160) + 40;
        const drift = 26;
        return (
          <g
            key={i}
            transform={`translate(${x + noise2D(`bit-dx-${i}`, t * 0.12, 0) * drift} ${
              y + noise2D(`bit-dy-${i}`, 0, t * 0.12) * drift
            }) rotate(${t * (10 + random(`bit-r-${i}`) * 16) * (i % 2 ? 1 : -1)}) scale(${
              0.8 + random(`bit-s-${i}`) * 0.9
            })`}
            opacity={0.5 * bits}
          >
            <path
              d={BITS[i % BITS.length]}
              transform="translate(-10 -10)"
              fill={BIT_COLORS[i % BIT_COLORS.length]}
            />
          </g>
        );
      })}
      {/* 地面 */}
      {floor > 0 ? (
        <ellipse
          cx={WIDTH / 2}
          cy={GROUND + 520 + (1 - floor) * 420}
          rx={1500}
          ry={560}
          fill={floorColor}
        />
      ) : null}
    </svg>
  );
};
