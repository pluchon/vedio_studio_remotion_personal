// 一场雨落进山谷：两道溪从坡上流下来，在谷底汇成河，往右一路奔向海
import React from "react";
import { interpolate } from "remotion";
import { EASE_IN_OUT, LAND } from "../../theme";
import { REGION, groundY } from "./world";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const along = (xs: number[], dy: (x: number) => number) =>
  "M" + xs.map((x) => `${x.toFixed(1)},${(groundY(x) + dy(x)).toFixed(1)}`).join(" L");

const range = (a: number, b: number, step: number) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

// 溪：顺着坡面往谷底走；河：从谷底开始，越往前离地面线越远（越靠近画面下方）
const STREAM_L = along(range(5520, REGION.valley, 20), (x) => 26 + 10 * Math.sin(x / 40));
const STREAM_R = along(range(6300, REGION.valley, -20), (x) => 30 + 8 * Math.sin(x / 35));
const RIVER = along(range(REGION.valley, 8600, 25), (x) => 50 + Math.min(300, (x - REGION.valley) * 0.14) + 14 * Math.sin(x / 120));

export const Water: React.FC<{ camX: number; ty: number; frame: number; streamAt: [number, number]; riverAt: [number, number] }> = ({
  camX,
  ty,
  frame,
  streamAt,
  riverAt,
}) => {
  const stream = interpolate(frame, streamAt, [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const river = interpolate(frame, riverAt, [0, 1], { ...clamp, easing: EASE_IN_OUT });
  if (stream <= 0 || camX > 8700 || camX + 1920 < 5400) return null;
  const draw = (d: string, p: number, width: number, color: string, opacity = 1) => (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - p}
      opacity={opacity}
    />
  );
  // 河面的碎光沿着水流往前挪
  const shimmer = (frame * 0.004) % 1;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${-camX} ${ty})`}>
        {draw(STREAM_L, stream, 7, LAND.river)}
        {draw(STREAM_R, stream, 6, LAND.river)}
        {draw(RIVER, river, 30, LAND.line, 0.5)}
        {draw(RIVER, river, 26, LAND.river)}
        {river > 0.9 && (
          <path
            d={RIVER}
            fill="none"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="0.012 0.03"
            strokeDashoffset={-shimmer}
            opacity={(river - 0.9) * 10}
          />
        )}
      </g>
    </svg>
  );
};
