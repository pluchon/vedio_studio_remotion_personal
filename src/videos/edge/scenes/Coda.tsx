// 第九幕「越走越远」：纸的边框淡去，那条小船驶进韦伯拍下的深空，越走越小；路上有流星，有哈勃和韦伯接力；最后，远处那颗星亮了
import { makeStar } from "@remotion/shapes";
import React from "react";
import { Img, random, staticFile } from "remotion";
import { DrawDashed } from "../ink";
import type { Pt } from "../ink";
import { Tag } from "../labels";
import { COLORS, asset } from "../theme";
import { ease, easeOut, mix, ramp, useT } from "../time";
import { Ship } from "./Sea";

const START: Pt = [330, 860];
const CTRL: Pt = [900, 690];
const END: Pt = [1560, 260];

const bezier = (u: number): Pt => [
  (1 - u) * (1 - u) * START[0] + 2 * (1 - u) * u * CTRL[0] + u * u * END[0],
  (1 - u) * (1 - u) * START[1] + 2 * (1 - u) * u * CTRL[1] + u * u * END[1],
];
const ROUTE = `M${START[0]},${START[1]} Q${CTRL[0]},${CTRL[1]} ${END[0]},${END[1]}`;

// 韦伯的镜面：18 块六边形，中间空着
const HEX_R = 34;
const hexPath = (cx: number, cy: number) =>
  `M${Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (30 + 60 * k);
    return `${(cx + Math.cos(a) * HEX_R).toFixed(1)},${(cy + Math.sin(a) * HEX_R).toFixed(1)}`;
  }).join(" L")}Z`;
const MIRROR: Pt[] = [];
for (let q = -2; q <= 2; q++) {
  for (let r = -2; r <= 2; r++) {
    const s = -q - r;
    const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
    if (ring === 0 || ring > 2) continue;
    MIRROR.push([HEX_R * Math.sqrt(3) * (q + r / 2), HEX_R * 1.5 * r]);
  }
}

const METEORS = Array.from({ length: 7 }, (_, i) => ({
  x: 300 + random(`mx${i}`) * 1500,
  y: 40 + random(`my${i}`) * 500,
  at: 201.8 + random(`mt${i}`) * 2.2,
  len: 160 + random(`ml${i}`) * 180,
}));

export const Coda: React.FC = () => {
  const t = useT();

  const sky = ramp(t, 194.6, 196.4);
  const push = 1.08 + 0.35 * ease(t, 195, 209);

  const u = ease(t, 195.6, 208.4);
  const [shipX, shipY] = bezier(u);
  const shipK = mix(0.8, 0.07, u);
  const rock = Math.sin(t * 3) * 2 + (ramp(t, 201.8, 202.6) * (1 - ramp(t, 204.2, 205)) ? Math.sin(t * 9) * 5 : 0);

  const star = makeStar({ points: 8, innerRadius: 14, outerRadius: 60 });
  const bloom = easeOut(t, 208.3, 210.2);

  const hubble = ease(t, 204.9, 207.2);
  const jwst = ease(t, 206.0, 208.4);

  return (
    <>
      {/* 深空 */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: COLORS.night, opacity: sky }}>
        <Img
          src={staticFile(asset("img/webb.jpg"))}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 2400,
            height: 2449,
            maxWidth: "none",
            transform: `translate(-50%, -50%) scale(${push})`,
            filter: "brightness(0.7) saturate(1.05)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(10,14,28,0) 40%, rgba(10,14,28,0.65) 100%)" }} />
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* 流星：路上不总是好走 */}
        <g opacity={sky}>
          {METEORS.map((m, i) => {
            const p = ramp(t, m.at, m.at + 0.7);
            if (p <= 0 || p >= 1) return null;
            const x = m.x + p * 360;
            const y = m.y + p * 180;
            return <line key={i} x1={x - m.len * 0.9} y1={y - m.len * 0.45} x2={x} y2={y} stroke={COLORS.star} strokeWidth={3} strokeLinecap="round" opacity={0.85 * Math.sin(p * Math.PI)} />;
          })}
        </g>

        {/* 路 */}
        <g filter="url(#edge-rough)" opacity={sky}>
          <DrawDashed d={ROUTE} p={u} dash="3 14" width={4} color={COLORS.gold} opacity={0.95} />
        </g>

        {/* 哈勃与韦伯接力 */}
        {hubble > 0.01 ? (
          <g transform={`translate(${mix(-120, 1000, hubble)} ${mix(330, 300, hubble)}) rotate(-12) scale(0.9)`} opacity={Math.sin(hubble * Math.PI)} style={{ filter: "drop-shadow(0 0 8px rgba(243,233,201,0.6))" }}>
            <rect x={-80} y={-28} width={132} height={56} rx={8} fill={COLORS.paperLight} stroke={COLORS.ink} strokeWidth={3} />
            <rect x={52} y={-32} width={44} height={64} rx={6} fill="#8a7a60" stroke={COLORS.ink} strokeWidth={3} />
            <rect x={-60} y={-92} width={68} height={60} fill="#6f86a6" stroke={COLORS.ink} strokeWidth={3} />
            <rect x={-60} y={32} width={68} height={60} fill="#6f86a6" stroke={COLORS.ink} strokeWidth={3} />
          </g>
        ) : null}
        {jwst > 0.01 ? (
          <g transform={`translate(${mix(2100, 1260, jwst)} ${mix(560, 520, jwst)}) scale(${mix(0.6, 1.1, jwst)})`} opacity={Math.min(1, jwst * 2.5) * (1 - ease(t, 207.8, 208.8))} style={{ filter: "drop-shadow(0 0 14px rgba(243,200,120,0.55))" }}>
            {MIRROR.map(([x, y], i) => (
              <path key={i} d={hexPath(x, y)} fill="#e4b95a" stroke="#6b5326" strokeWidth={2.4} />
            ))}
          </g>
        ) : null}

        {/* 船 */}
        <g opacity={ramp(t, 195.2, 196.2) * (1 - ease(t, 208.0, 209.0))} style={{ filter: "drop-shadow(0 0 10px rgba(243,233,201,0.55))" }}>
          <g transform={`translate(${shipX} ${shipY}) rotate(${rock}) scale(${shipK}) translate(${-shipX} ${-shipY})`}>
            <Ship x={shipX} y={shipY} t={t} />
          </g>
        </g>

        {/* 路的尽头那颗星亮了 */}
        <g transform={`translate(${END[0]} ${END[1]})`}>
          <circle r={mix(0, 320, bloom)} fill="url(#edge-coda-glow)" opacity={0.9 * (1 - ease(t, 210.2, 211.5) * 0.4)} />
          <path
            d={star.path}
            transform={`translate(${(-star.width / 2) * bloom * 2} ${(-star.height / 2) * bloom * 2}) scale(${bloom * 2})`}
            fill={COLORS.star}
            opacity={bloom}
          />
        </g>
        <defs>
          <radialGradient id="edge-coda-glow">
            <stop offset="0%" stopColor="#fff2c8" stopOpacity={0.95} />
            <stop offset="40%" stopColor="#f3d27a" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#f3d27a" stopOpacity={0} />
          </radialGradient>
        </defs>
      </svg>

      <Tag x={440} y={560} p={ramp(t, 201.8, 202.6) * (1 - ease(t, 204.2, 205.0))} size={38} dark>
        也许道路会艰辛而漫长
      </Tag>
    </>
  );
};
