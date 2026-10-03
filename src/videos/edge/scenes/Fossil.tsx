// 第六幕「化石」：左页是地球的地层，往下是更早的年代，岩石里藏着化石；右页是宇宙的"地层"，越远的星系光越老
// 地球几亿年前发生了什么，靠化石知道；那个最古老的星系，就像宇宙的化石
import React from "react";
import { Img, random, staticFile } from "remotion";
import { Draw } from "../ink";
import type { Pt } from "../ink";
import { curve } from "../ink";
import { Big, Tag } from "../labels";
import { COLORS, FONT, FONT_BLACK, asset } from "../theme";
import { ease, easeOut, mix, ramp, useT } from "../time";

const PW = 760;
const PH = 640;
const LX = 130;
const RX = 1030;
const PY = 150;

const LAYER_COLORS = ["#cfae72", "#bb915a", "#a47b4d", "#8f6c46", "#7d5e3f", "#684f37"];
const BOUNDS = [0, 108, 214, 322, 430, 538, 640];

// 地层的边界线：折叠以后起伏越来越大
const boundary = (k: number, fold: number): Pt[] => {
  const pts: Pt[] = [];
  for (let x = 0; x <= PW + 40; x += 40) {
    const y = BOUNDS[k] + (k === 0 || k === 6 ? 0 : fold * Math.sin(x * 0.011 + k * 1.7) + fold * 0.6 * Math.sin(x * 0.027 + k) + (x - PW / 2) * 0.05 * fold * 0.06 * (k % 2 ? 1 : -1));
    pts.push([x, y]);
  }
  return pts;
};

// 螺旋的菊石
const ammonite = (() => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 80; i++) {
    const th = (i / 80) * Math.PI * 4.2;
    const r = 3 * Math.exp(0.22 * th);
    pts.push([Math.cos(th) * r, Math.sin(th) * r]);
  }
  return curve(pts);
})();
const ribs = Array.from({ length: 22 }, (_, i) => {
  const th = 1.2 + (i / 22) * 3.2 * Math.PI;
  const r0 = 3 * Math.exp(0.22 * th);
  return `M${Math.cos(th) * r0 * 0.8},${Math.sin(th) * r0 * 0.8} L${Math.cos(th) * r0 * 1.12},${Math.sin(th) * r0 * 1.12}`;
}).join(" ");

// 右页的几条带子：从近到远
const BANDS: { u: number; v: number; zoom: number; label: string }[] = [
  { u: 0.75, v: 0.74, zoom: 4.2, label: "" },
  { u: 0.115, v: 0.31, zoom: 4.2, label: "" },
  { u: 0.19, v: 0.775, zoom: 4.2, label: "" },
  { u: 0.38, v: 0.16, zoom: 3.2, label: "" },
  { u: 0.55, v: 0.39, zoom: 3.2, label: "" },
  { u: 0.2595, v: 0.1065, zoom: 6.5, label: "" },
];
const BAND_H = PH / BANDS.length;

const PEBBLES = Array.from({ length: 70 }, (_, i) => ({
  x: random(`px${i}`) * PW,
  y: random(`py${i}`) * PH,
  r: 2 + random(`pr${i}`) * 4,
}));

export const Fossil: React.FC = () => {
  const t = useT();

  const reveal = ease(t, 115.8, 119.8);
  const fold = ease(t, 122.6, 125.0) * 30;
  const fossilsOn = (i: number) => ease(t, 129.8 + i * 0.28, 130.7 + i * 0.28);
  const years = Math.round(46 * reveal);

  const rightOn = ease(t, 131.0, 133.0);
  const eq = ramp(t, 133.2, 134.0);
  const lens = ease(t, 136.0, 138.4);
  const ripple = (k: number) => ease(t, 137.8 + k * 0.5, 140.2 + k * 0.5);

  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="edge-fossil-left">
            <rect x={0} y={0} width={PW} height={PH * reveal} />
          </clipPath>
        </defs>

        {/* 左页：地球 */}
        <g transform={`translate(${LX} ${PY})`}>
          <rect x={-18} y={-18} width={PW + 36} height={PH + 36} fill={COLORS.paperLight} opacity={0.7 * ramp(t, 115.2, 116.2)} stroke={COLORS.ink} strokeOpacity={0.5} strokeWidth={2} />
          <g clipPath="url(#edge-fossil-left)">
            <g filter="url(#edge-rough)">
              {LAYER_COLORS.map((color, k) => {
                const top = boundary(k, fold);
                const bottom = boundary(k + 1, fold);
                const d = `${curve(top)} L${bottom[bottom.length - 1][0]},${bottom[bottom.length - 1][1]} ${curve([...bottom].reverse()).replace("M", "L")} Z`;
                return <path key={k} d={d} fill={color} stroke={COLORS.ink} strokeWidth={2} strokeOpacity={0.6} />;
              })}
              {PEBBLES.map((p, i) => (
                <ellipse key={i} cx={p.x} cy={p.y} rx={p.r * 1.4} ry={p.r} fill={COLORS.ink} opacity={0.14} />
              ))}
            </g>
          </g>

          {/* 化石 */}
          <g filter="url(#edge-rough)">
            <g transform="translate(250 170) scale(1.15)" opacity={fossilsOn(0)}>
              <Draw d={ammonite} p={fossilsOn(0)} width={3} color="#3a2b1e" />
              <path d={ribs} stroke={COLORS.ink} strokeWidth={1.8} opacity={0.7 * fossilsOn(0)} />
            </g>
            {/* 鱼 */}
            <g transform="translate(470 395)" opacity={fossilsOn(1)}>
              <Draw d="M-100,0 Q-40,-38 40,-6 Q70,0 90,-30 L88,30 Q68,6 40,8 Q-40,36 -100,0 Z" p={fossilsOn(1)} width={3} color="#3a2b1e" fill="#d6bf8c" fillOpacity={0.55} />
              <path d="M-70,0 L60,0" stroke={COLORS.ink} strokeWidth={2.4} opacity={0.8 * fossilsOn(1)} />
              {Array.from({ length: 8 }, (_, i) => (
                <path key={i} d={`M${-60 + i * 16},0 L${-52 + i * 16},${-20 + Math.abs(i - 4) * 2} M${-60 + i * 16},0 L${-52 + i * 16},${20 - Math.abs(i - 4) * 2}`} stroke={COLORS.ink} strokeWidth={1.8} opacity={0.7 * fossilsOn(1)} />
              ))}
              <circle cx={-82} cy={-4} r={4} fill={COLORS.ink} opacity={fossilsOn(1)} />
            </g>
            {/* 三叶虫 */}
            <g transform="translate(250 505) rotate(-8)" opacity={fossilsOn(2)}>
              <Draw d="M-70,0 Q-70,-34 0,-36 Q70,-34 70,0 Q70,34 0,36 Q-70,34 -70,0 Z" p={fossilsOn(2)} width={3} color="#3a2b1e" fill="#d6bf8c" fillOpacity={0.5} />
              <path d="M0,-36 L0,36" stroke={COLORS.ink} strokeWidth={2} opacity={0.8 * fossilsOn(2)} />
              {Array.from({ length: 6 }, (_, i) => (
                <path key={i} d={`M${-48 + i * 17},${-28 + Math.abs(i - 2.5) * 3} Q${-44 + i * 17},0 ${-48 + i * 17},${28 - Math.abs(i - 2.5) * 3}`} fill="none" stroke={COLORS.ink} strokeWidth={1.6} opacity={0.7 * fossilsOn(2)} />
              ))}
            </g>
            {/* 贝壳 */}
            <g transform="translate(600 270)" opacity={fossilsOn(3)}>
              <Draw d="M-50,28 Q-60,-30 0,-44 Q60,-30 50,28 Z" p={fossilsOn(3)} width={3} color="#3a2b1e" fill="#e0c995" fillOpacity={0.55} />
              {[-36, -18, 0, 18, 36].map((x) => (
                <path key={x} d={`M0,28 L${x * 1.1},${-34 + Math.abs(x) * 0.3}`} stroke={COLORS.ink} strokeWidth={1.6} opacity={0.7 * fossilsOn(3)} />
              ))}
            </g>
            {/* 圈出来 */}
            {[
              [250, 170, 100],
              [470, 395, 130],
              [250, 505, 100],
              [600, 270, 80],
            ].map(([x, y, r], i) => (
              <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.78} fill="none" stroke={COLORS.red} strokeWidth={3.4} strokeDasharray="10 8" opacity={0.85 * ease(t, 130.3 + i * 0.28, 130.9 + i * 0.28)} />
            ))}
          </g>

          {/* 年代标尺 */}
          <g filter="url(#edge-rough)">
            <line x1={-46} x2={-46} y1={0} y2={PH * reveal} stroke={COLORS.ink} strokeWidth={3} />
            {Array.from({ length: 12 }, (_, i) => {
              const y = (i / 11) * PH;
              return y <= PH * reveal ? <line key={i} x1={-58} x2={-34} y1={y} y2={y} stroke={COLORS.ink} strokeWidth={2.4} /> : null;
            })}
            <path d={`M-70,${PH * reveal - 14} L-50,${PH * reveal} L-70,${PH * reveal + 14} Z`} fill={COLORS.red} opacity={ramp(t, 115.8, 116.4) * (1 - ease(t, 120.0, 120.6))} />
          </g>
        </g>

        {/* 提问 */}
        <g opacity={ramp(t, 126.2, 127.0) * (1 - ease(t, 129.4, 129.8))} transform={`translate(${LX + 480} ${PY + 560})`}>
          <circle r={64} fill="none" stroke={COLORS.red} strokeWidth={5} />
          <line x1={46} y1={46} x2={104} y2={104} stroke={COLORS.red} strokeWidth={9} strokeLinecap="round" />
        </g>
      </svg>

      <Big x={LX + PW / 2} y={PY + PH / 2} p={ramp(t, 126.4, 127.2) * (1 - ease(t, 129.2, 129.8))} size={170} color={COLORS.red}>
        ?
      </Big>
      <div
        style={{
          position: "absolute",
          left: RX,
          top: PY + 120,
          width: PW,
          textAlign: "center",
          fontFamily: FONT_BLACK,
          color: COLORS.red,
          opacity: ramp(t, 115.9, 116.8) * (1 - ease(t, 130.4, 131.2)),
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 300, letterSpacing: 8 }}>{years}</span>
        <span style={{ fontSize: 92, marginLeft: 16 }}>亿年</span>
        <div style={{ fontFamily: FONT, fontSize: 40, letterSpacing: 10, color: COLORS.inkSoft, marginTop: 6 }}>地球的年龄</div>
      </div>
      <Tag x={LX + PW / 2} y={PY - 52} p={ramp(t, 115.6, 116.4)} size={38}>
        地球 · 地层
      </Tag>
      <Tag x={LX + 56} y={PY + 28} p={ramp(t, 116.0, 116.8)} size={26}>
        现在
      </Tag>
      <Tag x={LX + 100} y={PY + PH - 28} p={ramp(t, 119.0, 119.8)} size={26}>
        约46亿年前
      </Tag>
      <Tag x={LX + 480} y={PY + 40} p={ramp(t, 129.9, 130.7)} size={44} red>
        化石
      </Tag>

      {/* 右页：宇宙 */}
      <div style={{ position: "absolute", left: RX - 18, top: PY - 18, width: PW + 36, height: PH + 36, background: COLORS.paperLight, border: "2px solid rgba(58, 43, 30, 0.5)", opacity: 0.7 * rightOn }} />
      <div style={{ position: "absolute", left: RX, top: PY, width: PW, height: PH, overflow: "hidden", opacity: rightOn, background: COLORS.night }}>
        {BANDS.map((band, i) => {
          const size = PW * band.zoom;
          const on = ease(t, 131.2 + i * 0.28, 132.2 + i * 0.28);
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: i * BAND_H, width: PW, height: BAND_H, overflow: "hidden", borderBottom: "2px solid rgba(243,233,201,0.35)", opacity: on }}>
              <Img
                src={staticFile(asset("img/hudf.jpg"))}
                style={{ position: "absolute", width: size, height: size, left: PW / 2 - band.u * size, top: BAND_H / 2 - band.v * size, maxWidth: "none" }}
              />
            </div>
          );
        })}
        {/* 最远的那条里，圈出那个最古老的 */}
        <div style={{ position: "absolute", left: PW / 2 - 52, top: PH - BAND_H / 2 - 38, width: 104, height: 76, borderRadius: "50%", border: `3.4px solid ${COLORS.red}`, opacity: ease(t, 133.6, 134.4) }} />
      </div>
      <Tag x={RX + PW / 2} y={PY - 52} p={ramp(t, 131.3, 132.1)} size={38}>
        宇宙 · 星系
      </Tag>
      <Tag x={RX + PW - 40} y={PY + 28} p={ramp(t, 132.0, 132.8)} size={26}>
        近
      </Tag>
      <Tag x={RX + PW - 80} y={PY + PH - 28} p={ramp(t, 132.6, 133.4)} size={26}>
        很久以前
      </Tag>
      <Tag x={RX + PW / 2} y={PY + PH + 58} p={ramp(t, 133.6, 134.4)} size={40} red>
        宇宙的化石
      </Tag>

      {/* 两页之间的等号 */}
      <Big x={960} y={PY + PH / 2} p={eq} size={120} color={COLORS.red}>
        ≈
      </Big>

      {/* 破解以后：放大镜扫过去，影响一圈圈扩开 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g filter="url(#edge-rough)" opacity={lens * (1 - ease(t, 139.6, 140.6))}>
          <g transform={`translate(${mix(1200, 1560, ease(t, 136.0, 139.0))} ${PY + PH - BAND_H / 2})`}>
            <circle r={96} fill="rgba(243,233,201,0.18)" stroke={COLORS.gold} strokeWidth={9} />
            <circle r={96} fill="none" stroke={COLORS.ink} strokeWidth={3} />
            <line x1={68} y1={68} x2={150} y2={150} stroke={COLORS.ink} strokeWidth={14} strokeLinecap="round" />
          </g>
        </g>
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={RX + PW / 2} cy={PY + PH / 2} r={mix(80, 1300, easeOut(t, 137.8 + k * 0.5, 140.2 + k * 0.5))} fill="none" stroke={COLORS.red} strokeWidth={3.4} opacity={0.6 * (1 - ripple(k)) * (ripple(k) > 0 ? 1 : 0)} />
        ))}
      </svg>
    </>
  );
};
