// 底：奶油色的纸，几团很淡的色块慢慢漂，散着一些小图形；地面是下方一道弧形的色带，上面撒着波点
import { noise2D } from "@remotion/noise";
import { makeCircle, makeStar, makeTriangle } from "@remotion/shapes";
import React, { useId } from "react";
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
  backColor?: string | null; // 远处再垫一道山坡
  bits?: number; // 小图形的浓淡
  dots?: boolean; // 地面上的波点
}> = ({
  t,
  tint = C.paper,
  floor = 1,
  floorColor = C.floor,
  backColor = null,
  bits = 1,
  dots = true,
}) => {
  const id = useId();
  const rise = (1 - floor) * 420;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <pattern id={id} width={84} height={84} patternUnits="userSpaceOnUse">
          <circle cx={20} cy={22} r={9} fill={C.white} opacity={0.3} />
          <circle cx={62} cy={64} r={6} fill={C.white} opacity={0.22} />
        </pattern>
      </defs>
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
      {/* 远处的山坡 */}
      {floor > 0 && backColor ? (
        <ellipse
          cx={WIDTH * 0.3}
          cy={GROUND + 470 + rise}
          rx={1300}
          ry={560}
          fill={backColor}
        />
      ) : null}
      {/* 地面 */}
      {floor > 0 ? (
        <g>
          <ellipse
            cx={WIDTH / 2}
            cy={GROUND + 520 + rise}
            rx={1500}
            ry={560}
            fill={floorColor}
          />
          {dots ? (
            <ellipse
              cx={WIDTH / 2}
              cy={GROUND + 520 + rise}
              rx={1500}
              ry={560}
              fill={`url(#${id})`}
            />
          ) : null}
          <ellipse
            cx={WIDTH / 2}
            cy={GROUND + 520 + rise}
            rx={1496}
            ry={556}
            fill="none"
            stroke={C.white}
            strokeWidth={6}
            opacity={0.45}
          />
        </g>
      ) : null}
    </svg>
  );
};
