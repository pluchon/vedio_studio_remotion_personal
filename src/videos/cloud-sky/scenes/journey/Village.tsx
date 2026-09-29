// 麦田里抬头的农人、坡上的一排屋子；炊烟往上升，与路过的云擦肩
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { LAND } from "../../theme";
import { groundY } from "./world";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 屋子：世界横坐标、宽、墙高、有没有烟囱
const HOUSES = [
  { x: 5180, w: 110, h: 62, chimney: true },
  { x: 5300, w: 86, h: 54, chimney: false },
  { x: 5420, w: 124, h: 70, chimney: true },
  { x: 5560, w: 96, h: 58, chimney: false },
  { x: 5660, w: 104, h: 60, chimney: true },
];

const FARMER_X = 4720;

// 一缕炊烟：一串越升越大、越淡的小团，边升边被风带向右
const Smoke: React.FC<{ x: number; y: number; frame: number; seed: number }> = ({ x, y, frame, seed }) => (
  <g filter="url(#cs-smoke)">
    {Array.from({ length: 16 }, (_, k) => {
      const age = (frame + k * 11 + seed * 37) % 176;
      const p = age / 176;
      return (
        <circle
          key={k}
          cx={x + p * 120 + 8 * Math.sin(age / 12 + seed)}
          cy={y - p * 380}
          r={5 + p * 26}
          fill="#f4f1ea"
          opacity={0.55 * Math.sin(p * Math.PI) ** 0.8}
        />
      );
    })}
  </g>
);

export const Village: React.FC<{ camX: number; ty: number; cloudX: number }> = ({ camX, ty, cloudX }) => {
  const frame = useCurrentFrame();
  if (camX > 5900 || camX + 1920 < 4500) return null;
  // 云的影子掠过时，农人抬一下头，又低下去
  const look = interpolate(cloudX, [FARMER_X - 380, FARMER_X - 120, FARMER_X + 180, FARMER_X + 420], [0, 1, 1, 0], clamp);
  const fy = groundY(FARMER_X) + 60;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id="cs-smoke">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <g transform={`translate(${-camX} ${ty})`}>
        {/* 农人：戴斗笠，弯着腰；抬头时身子直起来一点 */}
        <g transform={`translate(${FARMER_X} ${fy})`} stroke={LAND.line} strokeWidth={2.4} strokeLinecap="round" fill="none">
          <path d={`M0 0 L${-4 + look * 3} -40`} />
          <path d="M0 0 L-10 26 M0 0 L10 26" />
          <path d={`M-2 -30 L-18 ${-12 + look * -6} M-2 -30 L16 -14`} />
          <g transform={`translate(${-4 + look * 3} -50) rotate(${-look * 24})`}>
            <circle r={9} fill="#efe3cc" />
            <path d="M-20 -2 L0 -18 L20 -2 Z" fill="#c9a86a" />
          </g>
        </g>
        {HOUSES.map((h, i) => {
          const y = groundY(h.x + h.w / 2) + 8;
          const roofTop = y - h.h - h.w * 0.42;
          return (
            <g key={i}>
              {h.chimney && <Smoke x={h.x + h.w * 0.72 + 8} y={y - h.h - h.w * 0.3} frame={frame} seed={i} />}
              {h.chimney && (
                <rect x={h.x + h.w * 0.66} y={y - h.h - h.w * 0.34} width={16} height={h.w * 0.3} fill={LAND.roof} stroke={LAND.line} strokeWidth={1.4} />
              )}
              <rect x={h.x} y={y - h.h} width={h.w} height={h.h} fill={LAND.house} stroke={LAND.line} strokeWidth={1.8} />
              <path
                d={`M${h.x - 12} ${y - h.h} L${h.x + h.w / 2} ${roofTop} L${h.x + h.w + 12} ${y - h.h} Z`}
                fill={LAND.roof}
                stroke={LAND.line}
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
              <rect x={h.x + h.w * 0.2} y={y - h.h * 0.62} width={h.w * 0.2} height={h.h * 0.3} fill="#e7cf9a" stroke={LAND.line} strokeWidth={1.2} />
              <rect x={h.x + h.w * 0.56} y={y - h.h * 0.55} width={h.w * 0.22} height={h.h * 0.55} fill="#b89a7b" stroke={LAND.line} strokeWidth={1.2} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};
