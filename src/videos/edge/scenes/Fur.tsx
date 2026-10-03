// 第四幕「皮毛上的尘埃」：有人猜，宇宙只是某种生物皮毛上的一粒尘埃——镜头拉远，露出一只睡着的大眼睛；它一抖，尘埃就落下去了
// 然后盖上「毫无科学依据」的章；可探索，恰恰是从这些古怪的猜想开始的——古地图上的海怪，一个个把船引向海的外面
import React from "react";
import { Img, random, staticFile } from "remotion";
import { Draw } from "../ink";
import type { Pt } from "../ink";
import { COLORS, FONT, asset } from "../theme";
import { ease, easeOut, mix, ramp, useT } from "../time";
import { Ship } from "./Sea";

const SPECK_X = 960;
const SPECK_Y = 500;

// 毛：越往外越稀越长
type Hair = { x: number; y: number; a: number; len: number; w: number; bucket: number; phase: number };
const R_MAX = 2600;
const HAIRS: Hair[] = Array.from({ length: 4200 }, (_, i) => {
  const u = random(`hu${i}`);
  const r = 520 * Math.sqrt(Math.exp(u * Math.log(1 + (R_MAX / 520) ** 2)) - 1);
  const th = random(`ht${i}`) * Math.PI * 2;
  return {
    x: SPECK_X + Math.cos(th) * r,
    y: SPECK_Y + Math.sin(th) * r * 0.8,
    a: 1.15 + (random(`ha${i}`) - 0.5) * 0.9,
    len: 52 + r * 0.05 + random(`hl${i}`) * 26,
    w: 2.4 + r * 0.0016 + random(`hw${i}`) * 0.8,
    bucket: i % 4,
    phase: random(`hp${i}`) * Math.PI * 2,
  };
});
const FUR_COLORS = ["#6d4e2f", "#8f6a3b", "#56402a", "#ad8648"];

const furPaths = (t: number, ripple: number, shake: number): string[] => {
  const out = ["", "", "", ""];
  for (const h of HAIRS) {
    const wave = ripple * 0.5 * Math.sin(h.x * 0.0042 + h.y * 0.0021 - (t - 60.9) * 6) + shake * 0.35 * Math.sin(h.phase + t * 40);
    const a = h.a + wave + 0.05 * Math.sin(t * 0.9 + h.phase);
    const mx = h.x + Math.cos(a) * h.len * 0.5 + Math.sin(a) * 6;
    const my = h.y + Math.sin(a) * h.len * 0.5 - Math.cos(a) * 6;
    const ex = h.x + Math.cos(a + 0.2) * h.len;
    const ey = h.y + Math.sin(a + 0.2) * h.len;
    out[h.bucket] += `M${h.x.toFixed(0)},${h.y.toFixed(0)}Q${mx.toFixed(0)},${my.toFixed(0)} ${ex.toFixed(0)},${ey.toFixed(0)}`;
  }
  return out;
};

// 一粒小小的宇宙：金色的旋涡，外面一圈朱砂虚线
const Speck: React.FC<{ spin: number }> = ({ spin }) => (
  <g transform={`rotate(${spin})`}>
    <circle r={16} fill={COLORS.gold} stroke={COLORS.ink} strokeWidth={2} />
    <path d="M0,0 C6,-3 10,2 6,8 M0,0 C-6,3 -10,-2 -6,-8" fill="none" stroke={COLORS.ink} strokeWidth={2} strokeLinecap="round" />
    <circle r={24} fill="none" stroke={COLORS.red} strokeWidth={3} strokeDasharray="6 7" />
  </g>
);

// 睡着的大眼睛，被惊醒，睁圆，再眯成生气的样子
const Eye: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const appear = ramp(t, 58.6, 59.8);
  const open = ease(t, 60.85, 61.25) * (1 - 0.25 * ease(t, 62.0, 62.4));
  const angry = ease(t, 61.4, 62.0);
  const blink = 1 - 0.9 * Math.max(0, 1 - Math.abs(t - 65.9) / 0.12);
  const openness = open * blink;
  const fade = 1 - ramp(t, 69.6, 70.8);
  if (appear <= 0 || fade <= 0) return null;
  const lidY = mix(-70, -8, angry);
  return (
    <g transform={`translate(${x} ${y})`} opacity={appear * fade}>
      <ellipse rx={250} ry={170} fill="#5d4129" opacity={0.28} />
      <ellipse rx={205} ry={125} fill="#7a5832" opacity={0.2} />
      <g filter="url(#edge-rough)">
        {/* 眉毛 */}
        <path d={`M-200,${-96 + angry * 24} Q-20,${-150 + angry * 30} 190,${-70 + angry * 66}`} fill="none" stroke="#3d2c1a" strokeWidth={14} strokeLinecap="round" />
        {openness < 0.04 ? (
          <>
            <path d="M-130,0 Q0,46 130,0" fill="none" stroke={COLORS.ink} strokeWidth={7} strokeLinecap="round" />
            {[-90, -45, 0, 45, 90].map((lx) => (
              <path key={lx} d={`M${lx},${20 - Math.abs(lx) * 0.1} l${lx * 0.14},20`} stroke={COLORS.ink} strokeWidth={4} strokeLinecap="round" />
            ))}
          </>
        ) : (
          <g transform={`scale(1 ${openness})`}>
            <clipPath id="edge-eye-clip">
              <path d="M-132,0 Q0,-88 132,0 Q0,84 -132,0 Z" />
            </clipPath>
            <path d="M-132,0 Q0,-88 132,0 Q0,84 -132,0 Z" fill="#f1e6c4" stroke={COLORS.ink} strokeWidth={6} />
            <g clipPath="url(#edge-eye-clip)">
              <circle cx={Math.sin(t * 2) * 6} cy={-2} r={56} fill="#9a3a24" stroke={COLORS.ink} strokeWidth={3} />
              <circle cx={Math.sin(t * 2) * 6} cy={-2} r={38} fill="#c9792f" opacity={0.7} />
              <ellipse cx={Math.sin(t * 2) * 6} cy={-2} rx={9} ry={50} fill="#16100a" />
              <circle cx={-16} cy={-22} r={8} fill="#fff6dd" />
              {/* 生气的上眼睑 */}
              <path d={`M-140,${lidY - 40} L140,${lidY + 30 * angry - 40} L140,-120 L-140,-120 Z`} fill="#6d4e2f" stroke={COLORS.ink} strokeWidth={5} />
            </g>
          </g>
        )}
      </g>
    </g>
  );
};

const PLATES: { src: string; x: number; y: number; w: number; h: number; rot: number; at: number }[] = [
  { src: "monster-serpent.jpg", x: 470, y: 400, w: 500, h: 448, rot: -4, at: 72.1 },
  { src: "monster-spiny.jpg", x: 1000, y: 340, w: 460, h: 352, rot: 3, at: 74.4 },
  { src: "monster-balena.jpg", x: 1470, y: 430, w: 540, h: 426, rot: -2, at: 76.4 },
];

// 一条条浪纹，给小船垫底
const WAVE_ROWS: Pt[][] = Array.from({ length: 4 }, (_, row) => {
  const pts: Pt[] = [];
  for (let x = -100; x <= 2020; x += 50) pts.push([x, 770 + row * 34 + (Math.round(x / 50) % 2 === 0 ? -5 : 5)]);
  return pts;
});

export const Fur: React.FC = () => {
  const t = useT();
  const zoom = mix(1.7, 0.5, ease(t, 55.4, 60.2));
  const hideIn = ramp(t, 55.1, 57.4);
  const hideOut = 1 - ease(t, 69.8, 71.4);

  const ripple = ease(t, 60.85, 61.5) * (1 - ease(t, 63.0, 63.4));
  const tau = t - 63.5;
  const shakeAmp = tau > 0 && tau < 1.7 ? Math.exp(-tau * 2.1) : 0;
  const dx = Math.sin(tau * 36) * 26 * shakeAmp;
  const dr = Math.sin(tau * 30 + 1) * 1.6 * shakeAmp;
  const dy = Math.sin(tau * 44) * 8 * shakeAmp;

  // 尘埃：先跟着毛抖，被甩起来，再落下去
  const launch = 64.6;
  const s = t - launch;
  const flying = s > 0;
  const speckX = flying ? SPECK_X + dx + 150 * s : SPECK_X + dx;
  const speckY = flying ? SPECK_Y - 420 * s + 750 * s * s : SPECK_Y + dy;
  const speckSpin = flying ? s * 360 : 0;
  const speckOn = 1 - ramp(t, 66.7, 67.0);

  const furD = furPaths(t, ripple, shakeAmp);

  // 尘埃的尾巴
  const trail = flying && s < 2
    ? Array.from({ length: 10 }, (_, k) => {
        const ss = s - k * 0.045;
        if (ss <= 0) return null;
        return { x: SPECK_X + 150 * ss + dx * 0, y: SPECK_Y - 420 * ss + 750 * ss * ss, o: (1 - k / 10) * 0.6 * speckOn };
      })
    : [];

  const night = 0.55 * Math.max(0, Math.min(ramp(t, 67.3, 68.2), 1 - ramp(t, 68.8, 69.8)));

  const stampIn = easeOut(t, 69.9, 70.4);
  const stampOut = 1 - ramp(t, 71.6, 72.2);

  const hideAll = hideIn * hideOut;
  const platesOn = ramp(t, 71.9, 72.6);

  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* 兽皮的颜色 */}
        <rect width={1920} height={1080} fill="#bfa070" opacity={0.55 * hideAll} style={{ mixBlendMode: "multiply" }} />
        <g transform={`translate(${SPECK_X} ${SPECK_Y}) scale(${zoom}) translate(${-SPECK_X} ${-SPECK_Y})`} opacity={hideAll}>
          <g transform={`translate(${dx} ${dy}) rotate(${dr} ${SPECK_X} ${SPECK_Y})`}>
            {furD.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={FUR_COLORS[i]} strokeWidth={3.2} strokeLinecap="round" opacity={0.78} />
            ))}
          </g>
          {trail.map((p, k) =>
            p ? <circle key={k} cx={p.x} cy={p.y} r={7 - k * 0.5} fill={COLORS.gold} opacity={p.o} /> : null,
          )}
          {speckOn > 0.01 ? (
            <g transform={`translate(${speckX} ${speckY}) scale(${Math.max(1, 1.15 / zoom)})`} opacity={speckOn * ramp(t, 55.0, 55.8)}>
              <circle r={34} fill={COLORS.paperLight} opacity={0.75} />
              <Speck spin={speckSpin} />
            </g>
          ) : null}
        </g>
        <Eye x={1560} y={235} t={t} />
        {/* 「毁灭」那一下，画面暗下去 */}
        <rect width={1920} height={1080} fill={COLORS.night} opacity={night} />
        {night > 0.05 ? (
          <g opacity={night / 0.55} transform="translate(960 560)">
            {Array.from({ length: 14 }, (_, i) => {
              const a = (i / 14) * Math.PI * 2;
              const r = 40 + 220 * easeOut(t, 67.4, 68.9);
              return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r * 0.6} r={4 + (i % 3) * 2} fill={COLORS.star} opacity={0.7 * (1 - ramp(t, 68.4, 69.6))} />;
            })}
          </g>
        ) : null}
      </svg>

      {/* 红章 */}
      {stampIn > 0.01 && stampOut > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 330,
            transform: `translate(-50%, -50%) rotate(-5deg) scale(${mix(2.1, 1, stampIn)})`,
            opacity: stampIn * stampOut,
            border: `7px solid ${COLORS.red}`,
            color: COLORS.red,
            fontFamily: FONT,
            fontSize: 108,
            letterSpacing: 18,
            padding: "14px 30px 14px 48px",
            whiteSpace: "nowrap",
            filter: "url(#edge-rough)",
            mixBlendMode: "multiply",
            background: "rgba(179, 56, 44, 0.06)",
          }}
        >
          毫无科学依据
        </div>
      ) : null}

      {/* 古地图上的海怪：这些猜想把船引向了海的外面 */}
      {platesOn > 0.01 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} opacity={platesOn}>
            <g filter="url(#edge-rough)">
              {WAVE_ROWS.map((pts, row) => (
                <Draw
                  key={row}
                  d={`M${pts.map((p) => p.join(",")).join(" L")}`}
                  p={ease(t, 72.2 + row * 0.2, 74.4 + row * 0.2)}
                  width={1.8}
                  opacity={0.4}
                />
              ))}
            </g>
            {[
              { from: -260, to: 760, y: 790, delay: 0, k: 0.5 },
              { from: -620, to: 1260, y: 850, delay: 0.5, k: 0.42 },
              { from: -980, to: 1760, y: 810, delay: 1.0, k: 0.36 },
            ].map((ship, i) => {
              const x = mix(ship.from, ship.to, ease(t, 72.4 + ship.delay, 78.8));
              return (
                <g key={i} transform={`translate(${x} ${ship.y}) scale(${ship.k}) translate(${-x} ${-ship.y})`}>
                  <Ship x={x} y={ship.y} t={t + i} />
                </g>
              );
            })}
          </svg>
          {PLATES.map((plate, i) => {
            const p = easeOut(t, plate.at, plate.at + 0.9);
            if (p <= 0.01) return null;
            const sway = Math.sin(t * 1.1 + i * 2) * 1.2;
            return (
              <div
                key={plate.src}
                style={{
                  position: "absolute",
                  left: plate.x,
                  top: plate.y,
                  width: plate.w,
                  height: plate.h,
                  transform: `translate(-50%, -50%) rotate(${plate.rot + sway}deg) scale(${mix(0.8, 1, p)}) translateY(${(1 - p) * 30}px)`,
                  opacity: p * (1 - ramp(t, 78.4, 79.4)),
                  padding: 12,
                  boxSizing: "content-box",
                  background: COLORS.paperLight,
                  border: "1px solid rgba(58, 43, 30, 0.4)",
                  boxShadow: "0 30px 50px -28px rgba(40, 28, 14, 0.7)",
                }}
              >
                <Img src={staticFile(asset(`img/${plate.src}`))} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "sepia(0.18) saturate(1.05)" }} />
              </div>
            );
          })}
        </>
      ) : null}
    </>
  );
};
