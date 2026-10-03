// 第五幕「哈勃」：1999 年，一个研究组花两年用哈勃望远镜盯着一小块天，找到了当时已知最古老的星系，约 137 亿光年
// 底片先模糊、曝光，再经计算机处理变清楚；镜头推进去圈出那个星系，再退到整个天空——这只是天上的一个小方格；最后落在宇宙一生的时间轴上
import { makeStar } from "@remotion/shapes";
import React from "react";
import { Img, staticFile } from "remotion";
import { Draw, DrawDashed, circlePath, curve } from "../ink";
import type { Pt } from "../ink";
import { Big, Tag } from "../labels";
import { COLORS, FONT, asset } from "../theme";
import { ease, easeOut, mix, ramp, useT } from "../time";
import { random } from "remotion";
import { RINGS, ringPath } from "./Globe";

// 底片在自己的坐标系里是 1000×1000，中心为原点；那个星系的位置（深空场里一团橙红色的小星系）
const PLATE = 1000;
const GALAXY: Pt = [(519 / 2000 - 0.5) * PLATE, (213 / 2000 - 0.5) * PLATE];

// 镜头：屏幕上的点 = 屏幕中心 + s × (底片点 − 镜头中心)
const lerpLog = (a: number, b: number, p: number) => Math.exp(mix(Math.log(a), Math.log(b), p));
const scaleAt = (t: number) => {
  if (t < 92.0) return 0.6;
  if (t < 94.4) return lerpLog(0.6, 6.2, ease(t, 92.0, 94.2));
  if (t < 100.4) return 6.2 + 0.25 * ramp(t, 94.4, 100.4);
  return lerpLog(6.45, 0.075, ease(t, 100.4, 103.6));
};

// 哈勃：筒身、镜口、两块太阳能板
const Telescope: React.FC<{ x: number; y: number; rot: number; k: number }> = ({ x, y, rot, k }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`} filter="url(#edge-rough)">
    {[-1, 1].map((side) => (
      <g key={side} transform={`translate(-26 ${side * 62})`}>
        <rect x={-34} y={-34} width={68} height={68} fill="#6f86a6" stroke={COLORS.ink} strokeWidth={3} />
        {[-17, 0, 17].map((g) => (
          <React.Fragment key={g}>
            <line x1={-34} x2={34} y1={g} y2={g} stroke={COLORS.ink} strokeWidth={1.2} opacity={0.6} />
            <line y1={-34} y2={34} x1={g} x2={g} stroke={COLORS.ink} strokeWidth={1.2} opacity={0.6} />
          </React.Fragment>
        ))}
        <line x1={0} y1={-side * 34} x2={0} y2={-side * 62} stroke={COLORS.ink} strokeWidth={3} />
      </g>
    ))}
    <rect x={-80} y={-28} width={132} height={56} rx={8} fill={COLORS.paperLight} stroke={COLORS.ink} strokeWidth={3.4} />
    <rect x={52} y={-32} width={44} height={64} rx={6} fill="#8a7a60" stroke={COLORS.ink} strokeWidth={3.4} />
    <path d="M96,-32 L126,-58 L126,-6 L96,-12 Z" fill="#8a7a60" stroke={COLORS.ink} strokeWidth={3} />
    <circle cx={-80} cy={0} r={12} fill={COLORS.gold} stroke={COLORS.ink} strokeWidth={3} />
  </g>
);

// 月份格：24 个，两行
const MONTHS = Array.from({ length: 24 }, (_, i) => ({ x: 960 + ((i % 12) - 5.5) * 54, y: 190 + Math.floor(i / 12) * 58 }));

const STARS = Array.from({ length: 1800 }, (_, i) => ({
  x: (random(`sx${i}`) - 0.5) * 24000,
  y: (random(`sy${i}`) - 0.5) * 14000,
  r: 4 + random(`sr${i}`) * 12,
  o: 0.35 + random(`so${i}`) * 0.6,
}));

const BAR_X0 = 220;
const BAR_X1 = 1700;
const BAR_Y = 500;

export const Hubble: React.FC = () => {
  const t = useT();

  // 底片的位置：先在右边，推进去以后居中
  const shift = ease(t, 91.4, 92.4);
  const sx = mix(1390, 960, shift);
  const sy = mix(430, 500, shift);
  const s = scaleAt(t);
  const focus = ease(t, 92.0, 94.2) * (1 - ease(t, 100.4, 103.6));
  const cx = GALAXY[0] * focus;
  const cy = GALAXY[1] * focus;

  const plateIn = easeOut(t, 86.0, 87.6);
  const exposure = ease(t, 86.4, 89.4);
  const sweep = ease(t, 89.7, 91.2);
  const plateOn = plateIn * (1 - ease(t, 104.4, 105.4));
  const sky = ramp(t, 100.2, 101.4) * (1 - ease(t, 104.0, 105.2));

  // 地球与哈勃
  const orbitA = mix(-2.45, -1.72, ease(t, 78.6, 88.0));
  const earthOn = ramp(t, 78.4, 79.4) * (1 - ease(t, 91.0, 92.0));
  const ex = 960;
  const ey = 1400;
  const er = 780;
  const tx = ex + Math.cos(orbitA) * (er + 90);
  const ty = ey + Math.sin(orbitA) * (er + 90);
  const trot = (orbitA * 180) / Math.PI + 90 - 38 * ease(t, 85.5, 87.5);

  // 距离读数
  const dist = Math.round(137 * easeOut(t, 95.2, 98.6));

  // 时间轴
  const barP = ease(t, 105.0, 106.8);
  const pinX = BAR_X0 + 0.05 * (BAR_X1 - BAR_X0);
  const lightP = ease(t, 107.4, 109.6);
  const star = makeStar({ points: 9, innerRadius: 16, outerRadius: 40 });
  const arc = curve([
    [pinX, BAR_Y - 40],
    [(pinX + BAR_X1) / 2, BAR_Y - 190],
    [BAR_X1, BAR_Y - 40],
  ]);

  return (
    <>
      {/* 地球、轨道与哈勃 */}
      {earthOn > 0.01 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} opacity={earthOn}>
          <defs>
            <clipPath id="edge-hub-earth">
              <circle cx={ex} cy={ey} r={er} />
            </clipPath>
          </defs>
          <g filter="url(#edge-rough)">
            <circle cx={ex} cy={ey} r={er} fill={COLORS.sea} fillOpacity={0.75} />
            <g clipPath="url(#edge-hub-earth)">
              {RINGS.map((ring, i) => {
                const d = ringPath(ring, 60 + t * 1.5, er, ex, ey);
                return d ? <path key={i} d={d} fill={COLORS.land} stroke={COLORS.ink} strokeWidth={2} strokeLinejoin="round" /> : null;
              })}
            </g>
            <circle cx={ex} cy={ey} r={er} fill="none" stroke={COLORS.ink} strokeWidth={4} />
            <DrawDashed d={circlePath(ex, ey, er + 90, "orbit", 0, 60)} p={ease(t, 78.8, 80.6)} dash="3 14" width={3} color={COLORS.red} opacity={0.8} />
          </g>
          <Telescope x={tx} y={ty} rot={trot} k={0.8} />
          {/* 看向一小块天的虚线 */}
          <DrawDashed d={`M${tx + 70},${ty - 60} L1090,440`} p={ease(t, 86.2, 87.8)} dash="3 12" width={3} color={COLORS.red} opacity={0.8} />
        </svg>
      ) : null}

      <Big x={440} y={300} p={ramp(t, 78.7, 79.6) * (1 - ease(t, 82.6, 83.4))} size={150}>
        1999
      </Big>
      <Tag x={960} y={350} p={ramp(t, 80.4, 81.4) * (1 - ease(t, 86.0, 86.8))} size={36}>
        一个研究组 · 两年时间
      </Tag>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} opacity={(1 - ease(t, 86.0, 86.8))}>
        <g filter="url(#edge-rough)">
          {MONTHS.map((m, i) => {
            const fill = ramp(t, 82.0 + i * 0.15, 82.35 + i * 0.15);
            return (
              <g key={i} opacity={ramp(t, 81.6, 82.4)}>
                <rect x={m.x - 22} y={m.y - 22} width={44} height={44} fill="none" stroke={COLORS.ink} strokeWidth={2} />
                <rect x={m.x - 22} y={m.y - 22} width={44 * fill} height={44} fill={COLORS.red} opacity={0.6} />
              </g>
            );
          })}
        </g>
      </svg>

      {/* 天上的底片：曝光、处理、推进、拉远都在这一个坐标系里 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `translate(${sx}px, ${sy}px) scale(${s}) translate(${-cx}px, ${-cy}px)`,
          opacity: Math.max(plateOn, sky),
        }}
      >
        {/* 整个天空 */}
        {sky > 0.01 ? (
          <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: sky }}>
            <rect x={-14000} y={-8000} width={28000} height={16000} fill={COLORS.night} />
            {STARS.map((st, i) => (
              <circle key={i} cx={st.x} cy={st.y} r={st.r} fill={COLORS.star} opacity={st.o} />
            ))}
            {/* 天空被分成同样大的小方格，哈勃看的只是其中一格 */}
            <g opacity={1 - ramp(s, 0.12, 0.4)}>
              {Array.from({ length: 27 }, (_, i) => (
                <line key={`v${i}`} x1={(i - 13) * PLATE - PLATE / 2} x2={(i - 13) * PLATE - PLATE / 2} y1={-8000} y2={8000} stroke={COLORS.star} strokeWidth={2.2 / s} opacity={0.3} />
              ))}
              {Array.from({ length: 17 }, (_, i) => (
                <line key={`h${i}`} y1={(i - 8) * PLATE - PLATE / 2} y2={(i - 8) * PLATE - PLATE / 2} x1={-14000} x2={14000} stroke={COLORS.star} strokeWidth={2.2 / s} opacity={0.3} />
              ))}
            </g>
          </svg>
        ) : null}

        {/* 底片的卡纸 */}
        <div
          style={{
            position: "absolute",
            left: -PLATE / 2 - 22,
            top: -PLATE / 2 - 22,
            width: PLATE + 44,
            height: PLATE + 44,
            background: COLORS.paperLight,
            border: "2px solid rgba(58, 43, 30, 0.5)",
            boxShadow: "0 40px 70px -40px rgba(30, 20, 10, 0.8)",
            opacity: plateIn,
          }}
        />
        <div style={{ position: "absolute", left: -PLATE / 2, top: -PLATE / 2, width: PLATE, height: PLATE, overflow: "hidden", background: COLORS.night, opacity: plateIn }}>
          {/* 先是糊的、暗的底片 */}
          <Img
            src={staticFile(asset("img/hudf.jpg"))}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              filter: `brightness(${mix(0.05, 0.8, exposure)}) blur(${mix(9, 3, exposure) * (1 - sweep)}px) saturate(${mix(0.2, 0.9, exposure)})`,
            }}
          />
          {/* 处理过的清晰版本，从左到右扫出来 */}
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 * (1 - sweep)}% 0 0)` }}>
            <Img src={staticFile(asset("img/hudf.jpg"))} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          </div>
          {/* 噪点：处理前很重，处理后散去 */}
          <svg width={PLATE} height={PLATE} style={{ position: "absolute", inset: 0, opacity: 0.55 * (1 - sweep) * ramp(t, 86.2, 87.2), mixBlendMode: "screen" }}>
            <filter id="edge-plate-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(t * 12) % 40} />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width={PLATE} height={PLATE} filter="url(#edge-plate-noise)" />
          </svg>
          {sweep > 0.01 && sweep < 0.995 ? (
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sweep * 100}%`, width: 5, background: COLORS.red, boxShadow: `0 0 28px 8px ${COLORS.red}` }} />
          ) : null}
        </div>
      </div>

      <Tag x={sx} y={150} p={ramp(t, 89.6, 90.4) * (1 - ease(t, 91.8, 92.4))} size={36}>
        计算机处理
      </Tag>

      {/* 圈出最古老的那个星系 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g filter="url(#edge-rough)">
          <Draw d={circlePath(960, 500, 92, "gal", 3, 22)} p={ease(t, 94.2, 95.0) * (1 - ease(t, 100.4, 101.0))} width={6} color={COLORS.red} />
          <Draw
            d={`M${960 + 92},${500 - 20} Q${1160},${380} 1260,${340}`}
            p={ease(t, 95.0, 95.8) * (1 - ease(t, 100.4, 101.0))}
            width={4}
            color={COLORS.red}
          />
        </g>
      </svg>
      <Tag x={1480} y={330} p={ramp(t, 92.9, 93.9) * (1 - ease(t, 100.4, 101.0))} size={40} red dark>
        最古老的星系
      </Tag>
      <div
        style={{
          position: "absolute",
          left: 1260,
          top: 396,
          opacity: ramp(t, 95.2, 96.0) * (1 - ease(t, 100.4, 101.0)),
          fontFamily: FONT,
          color: COLORS.star,
          background: "rgba(10, 14, 28, 0.74)",
          border: `1.6px solid ${COLORS.red}`,
          padding: "12px 34px 16px",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 40, letterSpacing: 6 }}>距离地球约</span>
        <div style={{ fontSize: 108, lineHeight: 1.1, letterSpacing: 4 }}>
          {dist}
          <span style={{ fontSize: 48, marginLeft: 12, letterSpacing: 6 }}>亿光年</span>
        </div>
      </div>

      <Tag x={960} y={760} p={ramp(t, 102.0, 103.0) * (1 - ease(t, 103.8, 104.6))} size={38} dark>
        哈勃看的，只是天上的这一小方格
      </Tag>

      {/* 宇宙的一生：左边是大爆炸，右边是今天 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g filter="url(#edge-rough)">
          <rect x={BAR_X0} y={BAR_Y - 12} width={(BAR_X1 - BAR_X0) * barP} height={24} fill={COLORS.gold} opacity={0.45} />
          <Draw d={`M${BAR_X0},${BAR_Y - 12} L${BAR_X1},${BAR_Y - 12} L${BAR_X1},${BAR_Y + 12} L${BAR_X0},${BAR_Y + 12} Z`} p={barP} width={3.4} />
          {barP > 0.05 ? (
            <g transform={`translate(${BAR_X0 - 70} ${BAR_Y})`} opacity={ramp(t, 105.4, 106.2)}>
              <path d={star.path} transform={`translate(${-40} ${-40}) rotate(${t * 20} 40 40)`} fill={COLORS.red} stroke={COLORS.ink} strokeWidth={3} opacity={0.9} />
            </g>
          ) : null}
          {barP > 0.05 ? (
            <g opacity={ramp(t, 106.0, 106.8)}>
              <circle cx={BAR_X1 + 70} cy={BAR_Y} r={36} fill={COLORS.sea} stroke={COLORS.ink} strokeWidth={3} />
              {RINGS.map((ring, i) => {
                const d = ringPath(ring, 100, 36, BAR_X1 + 70, BAR_Y);
                return d ? <path key={i} d={d} fill={COLORS.land} stroke={COLORS.ink} strokeWidth={1} /> : null;
              })}
            </g>
          ) : null}
          {/* 这个星系：靠近大爆炸那一头的红点 */}
          <g opacity={ramp(t, 106.6, 107.4)}>
            <line x1={pinX} x2={pinX} y1={BAR_Y - 14} y2={BAR_Y - 84} stroke={COLORS.red} strokeWidth={4} />
            <circle cx={pinX} cy={BAR_Y - 92} r={14} fill={COLORS.red} stroke={COLORS.ink} strokeWidth={2.4} />
          </g>
          <DrawDashed d={arc} p={lightP} dash="3 13" width={4} color={COLORS.red} opacity={0.9} />
        </g>
      </svg>
      <Tag x={pinX} y={BAR_Y - 150} p={ramp(t, 107.0, 107.8) * (1 - ease(t, 114.6, 115.4))} size={32} red>
        这个星系
      </Tag>
      <Tag x={BAR_X0 - 70} y={BAR_Y + 80} p={ramp(t, 106.0, 106.8)} size={32}>
        大爆炸
      </Tag>
      <Tag x={BAR_X1 + 70} y={BAR_Y + 80} p={ramp(t, 106.4, 107.2)} size={32}>
        今天
      </Tag>
      <Tag x={(pinX + BAR_X1) / 2} y={BAR_Y - 220} p={ramp(t, 108.2, 109.0)} size={32}>
        光走了很久才到
      </Tag>
      <Tag x={BAR_X0 + 190} y={BAR_Y + 160} p={ramp(t, 110.3, 111.1)} size={44} red>
        起源
      </Tag>
      <Tag x={960} y={BAR_Y + 160} p={ramp(t, 112.2, 113.0)} size={44} red>
        演化
      </Tag>
      <Tag x={BAR_X1 - 190} y={BAR_Y + 160} p={ramp(t, 113.3, 114.1)} size={44} red>
        发展
      </Tag>
    </>
  );
};
