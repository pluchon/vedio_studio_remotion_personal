// 图书馆的窗边：米色的墙、被窗框切成一格一格的大窗、窗外远处的楼、木桌上摊开的书；
// sky 画在窗里（窗内坐标），children 画在桌面上并跟着镜头走；camera 以 (fx, fy) 为画面中心放大 s 倍
import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { ROOM } from "../theme";
import { PaperTexture } from "./PaperTexture";

// 窗洞（不含外框）的位置与窗格划分：三列，上面一排矮的气窗，下面两排
export const WIN = { x: 772, y: 86, w: 1068, h: 688 };
const BAR = 16;
const OUTER = 26;
const COL_W = (WIN.w - 2 * BAR) / 3;
const ROWS = [0.24, 0.38, 0.38].map((k) => k * (WIN.h - 2 * BAR));
const colX = (c: number) => c * (COL_W + BAR);
const rowY = (r: number) => ROWS.slice(0, r).reduce((s, h) => s + h + BAR, 0);

// 某一格窗在画面上的中心
export const paneCenter = (col: number, row: number) => ({
  x: WIN.x + colX(col) + COL_W / 2,
  y: WIN.y + rowY(row) + ROWS[row] / 2,
});

export type Camera = { s: number; fx: number; fy: number };

// 远处的楼：窗底一排浅灰蓝的剪影，右边有几栋高的
const BUILDINGS = [
  [0, 120, 90],
  [80, 70, 150],
  [140, 110, 110],
  [240, 60, 190],
  [290, 130, 80],
  [410, 90, 130],
  [490, 70, 100],
  [560, 120, 70],
  [690, 80, 290],
  [770, 60, 230],
  [840, 110, 120],
  [940, 70, 360],
  [1000, 90, 300],
] as const;

// 楼前一排树冠
const TREES = Array.from({ length: 34 }, (_, i) => ({
  x: i * 33 + (i % 3) * 9,
  r: 26 + ((i * 37) % 23),
}));

const Skyline: React.FC<{ color: string; lights: number; trees: string }> = ({ color, lights, trees }) => (
  <svg width={WIN.w} height={WIN.h} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="cs-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity={0.25 * (1 - lights)} />
        <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
      </linearGradient>
    </defs>
    {BUILDINGS.map(([x, w, h], i) => (
      <g key={i} opacity={i % 2 === 0 ? 0.82 : 1}>
        <rect x={x} y={WIN.h - h} width={w} height={h} fill={color} />
        <rect x={x} y={WIN.h - h} width={w} height={h} fill="url(#cs-haze)" />
        <rect x={x + w - 8} y={WIN.h - h} width={8} height={h} fill="rgba(40, 50, 70, 0.08)" />
        {Array.from({ length: Math.floor(h / 26) }, (_, k) => (
          <rect key={`f${k}`} x={x + 6} y={WIN.h - h + 16 + k * 26} width={w - 12} height={1.5} fill="rgba(60, 70, 90, 0.12)" />
        ))}
        {lights > 0 &&
          Array.from({ length: Math.floor(h / 26) }, (_, k) => (
            <rect
              key={k}
              x={x + 10 + ((k * 7 + i * 13) % Math.max(1, w - 24))}
              y={WIN.h - h + 12 + k * 26}
              width={6}
              height={8}
              fill="#ffd9a0"
              opacity={lights * (((k + i) % 3) / 3 + 0.2)}
            />
          ))}
      </g>
    ))}
    {TREES.map((tr, i) => (
      <circle key={`t${i}`} cx={tr.x} cy={WIN.h + 6} r={tr.r} fill={trees} />
    ))}
  </svg>
);

// 窗框：外框加竖梃横梃，每根朝光的一侧有一道浅色的倒角
const Frame: React.FC<{ color: string; light: string }> = ({ color, light }) => {
  const bars: [number, number, number, number][] = [
    [-OUTER, -OUTER, WIN.w + OUTER * 2, OUTER],
    [-OUTER, WIN.h, WIN.w + OUTER * 2, OUTER],
    [-OUTER, 0, OUTER, WIN.h],
    [WIN.w, 0, OUTER, WIN.h],
    [colX(1) - BAR, 0, BAR, WIN.h],
    [colX(2) - BAR, 0, BAR, WIN.h],
    [0, rowY(1) - BAR, WIN.w, BAR],
    [0, rowY(2) - BAR, WIN.w, BAR],
  ];
  return (
    <svg width={WIN.w + OUTER * 2} height={WIN.h + OUTER * 2} style={{ position: "absolute", left: WIN.x - OUTER, top: WIN.y - OUTER }}>
      <g transform={`translate(${OUTER} ${OUTER})`}>
        {bars.map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill={color} />
            <rect x={x} y={y} width={w > h ? w : 3} height={w > h ? 3 : h} fill={light} opacity={0.7} />
          </g>
        ))}
      </g>
    </svg>
  );
};

// 桌面：木纹、窗格投下的光斑、摊开的书、一支笔、一摞书
const Desk: React.FC<{ sun: number }> = ({ sun }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="cs-desk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ROOM.desk} />
        <stop offset="1" stopColor={ROOM.deskDeep} />
      </linearGradient>
    </defs>
    {/* 窗台 */}
    <rect x={WIN.x - 70} y={WIN.y + WIN.h + OUTER - 4} width={WIN.w + 140} height={20} fill="#dccfb9" />
    <rect x={WIN.x - 70} y={WIN.y + WIN.h + OUTER + 16} width={WIN.w + 140} height={10} fill="rgba(60, 45, 30, 0.18)" />
    <rect x={0} y={830} width={1920} height={250} fill="url(#cs-desk)" />
    {Array.from({ length: 7 }, (_, i) => (
      <path
        key={i}
        d={`M0 ${862 + i * 32} C 500 ${852 + i * 34}, 1200 ${872 + i * 30}, 1920 ${858 + i * 33}`}
        stroke="rgba(90, 60, 35, 0.12)"
        strokeWidth={2}
        fill="none"
      />
    ))}
    {/* 三列窗格投在桌上的光 */}
    {[0, 1, 2].map((c) => {
      const x0 = WIN.x + colX(c) + 30;
      const x1 = x0 + COL_W - 40;
      return (
        <polygon
          key={c}
          points={`${x0},836 ${x1},836 ${x1 + 260},1080 ${x0 + 200},1080`}
          fill={`rgba(${ROOM.sun}, 0.34)`}
          opacity={sun}
          style={{ mixBlendMode: "screen" }}
        />
      );
    })}
    {/* 摊开的书 */}
    <g>
      <path d="M840 1052 L880 900 Q 990 884 1100 902 L1100 1046 Q 970 1030 840 1052 Z" fill={ROOM.paper} stroke="rgba(80, 70, 60, 0.35)" />
      <path d="M1100 902 Q 1210 884 1320 900 L1368 1052 Q 1230 1030 1100 1046 Z" fill="#f3ecdd" stroke="rgba(80, 70, 60, 0.35)" />
      <path d="M1100 902 L1100 1046" stroke="rgba(80, 70, 60, 0.35)" strokeWidth={2} />
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} stroke="rgba(80, 80, 90, 0.28)" strokeWidth={2}>
          <path d={`M${896 - i * 6} ${926 + i * 20} Q 990 ${914 + i * 19} ${1082} ${926 + i * 20}`} fill="none" />
          <path d={`M1118 ${926 + i * 20} Q 1210 ${914 + i * 19} ${1304 + i * 6} ${926 + i * 20}`} fill="none" />
        </g>
      ))}
    </g>
    {/* 笔 */}
    <g transform="translate(1180 1010) rotate(-14)">
      <rect x={0} y={-5} width={230} height={10} rx={4} fill="#2f3440" />
      <rect x={-26} y={-3} width={28} height={6} fill="#b9b1a4" />
    </g>
    {/* 一摞书 */}
    <g>
      <path d="M1500 944 L1520 884 L1780 884 L1768 944 Z" fill="#7d8ea0" />
      <path d="M1500 944 L1768 944 L1768 962 L1500 962 Z" fill="#5f6f80" />
      <path d="M1512 884 L1530 836 L1760 836 L1750 884 Z" fill="#b39473" />
      <path d="M1512 884 L1750 884 L1750 900 L1512 900 Z" fill="#8f7355" />
    </g>
  </svg>
);

// 窗边一盆绿萝：几片长叶从盆里伸出来，随风轻轻晃
const LEAVES = [
  [-62, 150, 0.9],
  [-40, 220, 1],
  [-18, 260, 1.1],
  [4, 230, 1],
  [24, 200, 0.95],
  [46, 170, 0.9],
  [-80, 120, 0.8],
  [70, 140, 0.85],
  [-5, 170, 0.9],
] as const;

const Plant: React.FC<{ dim: number }> = ({ dim }) => {
  const frame = useCurrentFrame();
  const leaf = interpolateColors(dim, [0, 1], ["#7f9b6a", "#1f2a26"]);
  const vein = interpolateColors(dim, [0, 1], ["#5b7650", "#141a18"]);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <g transform="translate(640 830)">
        {LEAVES.map(([angle, len, w], i) => {
          const sway = 2.2 * Math.sin(frame / 40 + i * 1.3);
          return (
            <g key={i} transform={`rotate(${angle + sway})`}>
              <path d={`M0 0 Q ${-26 * w} ${-len * 0.55} 0 ${-len} Q ${26 * w} ${-len * 0.55} 0 0 Z`} fill={leaf} />
              <path d={`M0 0 L0 ${-len * 0.92}`} stroke={vein} strokeWidth={2} />
            </g>
          );
        })}
      </g>
      <path d="M590 826 L690 826 L676 906 L604 906 Z" fill={interpolateColors(dim, [0, 1], ["#e9e2d6", "#2a2c34"])} />
      <rect x={584} y={818} width={112} height={14} rx={3} fill={interpolateColors(dim, [0, 1], ["#d8cfbf", "#23252d"])} />
    </svg>
  );
};

export const WindowView: React.FC<{
  sky: React.ReactNode;
  camera?: Camera;
  sun?: number;
  dim?: number;
  children?: React.ReactNode;
}> = ({ sky, camera = { s: 1, fx: 960, fy: 540 }, sun = 1, dim = 0, children }) => {
  const frameColor = interpolateColors(dim, [0, 1], [ROOM.frame, "#15171f"]);
  const frameLight = interpolateColors(dim, [0, 1], [ROOM.frameLight, "#2a2d38"]);
  const skyline = interpolateColors(dim, [0, 1], ["#bfcbd8", "#262c42"]);
  const trees = interpolateColors(dim, [0, 1], ["#8ea487", "#1b2230"]);

  return (
    <AbsoluteFill style={{ backgroundColor: ROOM.wall, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: `translate(${960 - camera.fx * camera.s}px, ${540 - camera.fy * camera.s}px) scale(${camera.s})`,
        }}
      >
        {/* 墙：纸一样的纤维 */}
        <AbsoluteFill style={{ backgroundColor: ROOM.wall }} />
        <PaperTexture opacity={0.3} />
        {/* 午后的光从窗子斜进来，墙上靠窗一侧亮一些 */}
        <AbsoluteFill
          style={{ background: `radial-gradient(ellipse 45% 70% at 42% 40%, rgba(${ROOM.sun}, ${0.28 * sun}) 0%, rgba(${ROOM.sun}, 0) 100%)` }}
        />
        <AbsoluteFill style={{ backgroundColor: ROOM.night, opacity: dim * 0.72 }} />

        <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, overflow: "hidden" }}>
          {sky}
          <Skyline color={skyline} lights={dim} trees={trees} />
        </div>
        <Frame color={frameColor} light={frameLight} />
        <div style={{ position: "absolute", inset: 0 }}>
          <Desk sun={sun * (1 - dim)} />
          <AbsoluteFill style={{ backgroundColor: ROOM.night, opacity: dim * 0.6, clipPath: "inset(800px 0 0 0)" }} />
        </div>
        <Plant dim={dim} />
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
