// 长卷的底子：海、远山、近处的地面（山的皴线、麦浪、云投在地上的影子），都是淡彩加细墨线
import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { LAND } from "../../theme";
import { REGION, groundY, sampleGround } from "./world";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const HORIZON = 690;

type View = { camX: number; ty: number };

const Svg: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
    {children}
  </svg>
);

// 海：地平线以下的蓝，一道道小浪慢慢往岸边推，偶尔闪一下光
const WAVES = Array.from({ length: 150 }, (_, i) => {
  const r = (k: string) => random(`wave-${i}-${k}`);
  return { x: -300 + r("x") * 2500, y: HORIZON + 12 + Math.pow(r("y"), 1.4) * 380, w: 14 + r("w") * 26 };
});

export const Sea: React.FC<View> = ({ camX, ty }) => {
  const frame = useCurrentFrame();
  return (
    <Svg>
      <defs>
        <linearGradient id="cs-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LAND.sea} />
          <stop offset="1" stopColor={LAND.seaDeep} />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${ty})`}>
        <rect x={0} y={HORIZON} width={1920} height={1080 - HORIZON + 1200} fill="url(#cs-sea)" />
        <line x1={0} y1={HORIZON} x2={1920} y2={HORIZON} stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
        {WAVES.map((w, i) => {
          const depth = (w.y - HORIZON) / 380;
          const x = w.x + frame * 0.3 - camX * (0.45 + depth * 0.55);
          if (x < -60 || x > 1980) return null;
          const s = 0.5 + depth;
          const glint = Math.max(0, Math.sin(frame / 11 + i * 2.3)) ** 8;
          return (
            <path
              key={i}
              d={`M${x} ${w.y} q ${(w.w * s) / 2} ${-6 * s} ${w.w * s} 0`}
              fill="none"
              stroke={`rgba(255, 255, 255, ${0.35 + glint * 0.5})`}
              strokeWidth={1.2 + depth * 1.4}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </Svg>
  );
};

// 远山：视差很慢的一抹灰蓝，离开海面后才显出来
const farY = (x: number) => 610 - 46 * Math.sin(x / 230) - 30 * Math.sin(x / 88 + 2) - 70 * Math.max(0, Math.sin(x / 700));

export const FarHills: React.FC<View> = ({ camX, ty }) => {
  const pts: string[] = [];
  for (let sx = -20; sx <= 1940; sx += 20) pts.push(`${sx},${farY(sx + camX * 0.4).toFixed(1)}`);
  const opacity = interpolate(camX, [700, 1500], [0, 1], clamp);
  return (
    <Svg opacity={opacity}>
      <defs>
        <linearGradient id="cs-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LAND.mountFar} />
          <stop offset="1" stopColor="#dfe5e6" />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${ty * 0.6})`}>
        <path d={`M-20 1500 L${pts.join(" L")} L1940 1500 Z`} fill="url(#cs-far)" />
        <path d={`M${pts.join(" L")}`} fill="none" stroke="rgba(90, 100, 110, 0.25)" strokeWidth={1.4} />
      </g>
    </Svg>
  );
};

// 地面的颜色按段落过渡：山是灰绿，麦田是金黄，草地是嫩绿
const GROUND_STOPS: [number, string][] = [
  [2000, LAND.mount],
  [3950, LAND.mount],
  [4250, LAND.field],
  [5250, LAND.field],
  [5650, LAND.grass],
  [8400, LAND.grass],
];

export const Ground: React.FC<View & { shadowX: number }> = ({ camX, ty, shadowX }) => {
  const frame = useCurrentFrame();
  const pts = sampleGround(camX);
  const ridge = pts.map(([x, y]) => `${(x - camX).toFixed(1)},${y.toFixed(1)}`);
  const area = `M${(pts[0][0] - camX).toFixed(1)} 1500 L${ridge.join(" L")} L1980 1500 Z`;
  const from = GROUND_STOPS[0][0];
  const span = GROUND_STOPS[GROUND_STOPS.length - 1][0] - from;

  // 山坡上的皴线：坡越陡越密
  const hatches: React.ReactNode[] = [];
  for (let x = Math.max(2080, Math.floor(camX / 30) * 30); x <= Math.min(4000, camX + 1960); x += 30) {
    const y = groundY(x);
    const slope = groundY(x + 6) - groundY(x - 6);
    if (Math.abs(slope) < 4) continue;
    const dir = slope > 0 ? -1 : 1;
    for (let k = 0; k < 3; k++) {
      const yy = y + 22 + k * 46;
      hatches.push(
        <line
          key={`${x}-${k}`}
          x1={x - camX}
          y1={yy}
          x2={x - camX + dir * 12}
          y2={yy + 38}
          stroke={LAND.line}
          strokeWidth={1.3}
          opacity={0.45 - k * 0.12}
        />,
      );
    }
  }

  // 麦浪：一行行短笔触顺着一道移动的波摇摆
  const wheat: React.ReactNode[] = [];
  for (let x = Math.max(REGION.fieldFrom, Math.floor(camX / 22) * 22); x <= Math.min(REGION.fieldTo, camX + 1960); x += 22) {
    for (let k = 0; k < 7; k++) {
      const wx = x + (k % 2) * 11;
      const yy = groundY(wx) + 30 + k * 50;
      const sway = 7 * Math.sin(frame / 14 + wx / 110 - k * 0.6);
      wheat.push(
        <line
          key={`${x}-${k}`}
          x1={wx - camX}
          y1={yy}
          x2={wx - camX + sway}
          y2={yy - 18 - k * 2}
          stroke="#b0914c"
          strokeWidth={1.6 + k * 0.25}
          strokeLinecap="round"
          opacity={0.55}
        />,
      );
    }
  }

  const shadowOn = interpolate(shadowX, [3950, 4250, 8000, 8300], [0, 1, 1, 0], clamp);

  return (
    <Svg>
      <defs>
        <linearGradient id="cs-ground" gradientUnits="userSpaceOnUse" x1={from - camX} y1={0} x2={from + span - camX} y2={0}>
          {GROUND_STOPS.map(([x, c]) => (
            <stop key={x} offset={(x - from) / span} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id="cs-ground-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.18} />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#3a3326" stopOpacity={0.22} />
        </linearGradient>
        <filter id="cs-shadow-blur" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={34} />
        </filter>
        <radialGradient id="cs-mist" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f4f6f4" stopOpacity={0.6} />
          <stop offset="0.6" stopColor="#f4f6f4" stopOpacity={0.35} />
          <stop offset="1" stopColor="#f4f6f4" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(0 ${ty})`}>
        <path d={area} fill="url(#cs-ground)" />
        <path d={area} fill="url(#cs-ground-shade)" />
        {hatches}
        {wheat}
        {shadowOn > 0 && (
          <ellipse
            cx={shadowX - camX}
            cy={groundY(shadowX) + 120}
            rx={300}
            ry={50}
            fill="rgba(60, 52, 35, 0.12)"
            opacity={shadowOn}
            filter="url(#cs-shadow-blur)"
          />
        )}
        <path d={`M${ridge.join(" L")}`} fill="none" stroke={LAND.line} strokeWidth={2.2} strokeLinejoin="round" />
        {/* 山脚的一层薄雾，把远近分开 */}
        <rect x={2050 - camX} y={500} width={2100} height={300} fill="url(#cs-mist)" />
      </g>
    </Svg>
  );
};
