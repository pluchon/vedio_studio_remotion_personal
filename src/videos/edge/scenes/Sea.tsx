// 第一幕「岸与顶」：海上的船总能靠岸，山上的人总能到顶；然后镜头退远，整张图只是图册里的一页
import { getLength, getPointAtLength } from "@remotion/paths";
import React from "react";
import { random } from "remotion";
import { Draw, DrawDashed, curve, handLine } from "../ink";
import type { Pt } from "../ink";
import { COLORS, FONT } from "../theme";
import { ease, easeOut, mix, ramp, useT } from "../time";

// 海岸线：从上到下，x 随 y 起伏
const coastX = (y: number) => 1700 + 80 * Math.sin(y / 95) + 38 * Math.sin(y / 37 + 1);
const COAST: Pt[] = Array.from({ length: 27 }, (_, i): Pt => [coastX(-120 + i * 50), -120 + i * 50]);
const COAST_PATH = curve(COAST);

// 山脊：折线
const SKY: Pt[] = [
  [2000, 700], [2150, 520], [2230, 590], [2330, 450], [2420, 545], [2540, 300], [2650, 480], [2760, 460],
  [2840, 520], [2950, 535], [3050, 615], [3120, 585], [3250, 700],
];
const SKY_PATH = `M${SKY.map((p) => p.join(",")).join(" L")}`;
const MAIN_PEAK: Pt = [2540, 300];
// 几座山的暗面：顶、右脚、中线脚
const FACES: { a: Pt; b: Pt; m: Pt }[] = [
  { a: [2540, 300], b: [2790, 705], m: [2540, 705] },
  { a: [2330, 450], b: [2480, 705], m: [2330, 705] },
  { a: [2150, 520], b: [2300, 705], m: [2150, 705] },
  { a: [2760, 460], b: [2950, 705], m: [2760, 705] },
];
const TRAIL: Pt[] = [
  [2330, 695], [2430, 630], [2370, 570], [2470, 515], [2420, 450], [2505, 400], [2475, 350], [2540, 300],
];
const TRAIL_PATH = curve(TRAIL);
const TRAIL_LENGTH = getLength(TRAIL_PATH);

const SEA_FILL = `${COAST_PATH}L${coastX(1180)},1180 L-400,1180 L-400,-120 Z`;
const LAND_FILL = `${COAST_PATH}L${coastX(1180)},1180 L3600,1180 L3600,-120 Z`;
const ROUTE = `M-250,700 Q600,640 ${coastX(760) - 120},760`;

// 小树：圆冠加一根树干
const TREES: Pt[] = Array.from({ length: 34 }, (_, i): Pt => [1860 + random(`tx${i}`) * 1380, 730 + random(`ty${i}`) * 260]);

// 浪纹：每一行拆成几段，长短和间隔随机
const WAVES = Array.from({ length: 25 }, (_, row) => {
  const y = 120 + row * 38;
  const end = coastX(y) - 34;
  const segs: { d: string; x: number }[] = [];
  let x = -380 + random(`ws${row}`) * 120;
  let n = 0;
  while (x < end - 60) {
    const x2 = Math.min(end, x + 160 + random(`wl${row}-${n}`) * 280);
    const pts: Pt[] = [];
    for (let px = x; px <= x2; px += 46) pts.push([px, y + (Math.round((px - x) / 46) % 2 === 0 ? -5 : 5)]);
    segs.push({ d: curve(pts), x });
    x = x2 + 28 + random(`wg${row}-${n}`) * 70;
    n++;
  }
  return segs;
});

export const Ship: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const bob = Math.sin(t * 1.8) * 2.2;
  const lift = Math.sin(t * 1.3) * 3;
  return (
    <g transform={`translate(${x} ${y + lift}) rotate(${bob})`} filter="url(#edge-rough)">
      <path d="M-120,26 Q-60,36 0,28 T130,28" fill="none" stroke={COLORS.ink} strokeWidth={1.5} opacity={0.4} />
      <path d="M-140,40 Q-70,50 0,42 T150,42" fill="none" stroke={COLORS.ink} strokeWidth={1.2} opacity={0.28} />
      <line x1={0} y1={-20} x2={0} y2={-200} stroke={COLORS.ink} strokeWidth={4} />
      <path d="M2,-190 Q78,-160 70,-72 L2,-62 Z" fill={COLORS.paperLight} stroke={COLORS.ink} strokeWidth={2.4} />
      <path d="M-2,-190 Q-66,-150 -58,-74 L-2,-64 Z" fill={COLORS.paperLight} stroke={COLORS.ink} strokeWidth={2.4} />
      <path d="M2,-190 Q40,-170 36,-120" fill="none" stroke={COLORS.ink} strokeWidth={1.2} opacity={0.5} />
      <path d="M0,-200 L42,-190 L0,-180 Z" fill={COLORS.red} stroke={COLORS.ink} strokeWidth={1.4} />
      <path d="M-98,-22 L-74,22 Q0,40 78,22 L104,-34 Q0,-14 -98,-22 Z" fill="#c79a5b" stroke={COLORS.ink} strokeWidth={2.6} />
      <path d="M-86,-4 Q0,10 92,-12" fill="none" stroke={COLORS.ink} strokeWidth={1.4} opacity={0.6} />
      <line x1={0} y1={-200} x2={-98} y2={-22} stroke={COLORS.ink} strokeWidth={1} opacity={0.5} />
      <line x1={0} y1={-200} x2={104} y2={-34} stroke={COLORS.ink} strokeWidth={1} opacity={0.5} />
    </g>
  );
};

const Climber: React.FC<{ p: number }> = ({ p }) => {
  const pt = getPointAtLength(TRAIL_PATH, TRAIL_LENGTH * p) ?? { x: 0, y: 0 };
  const step = Math.sin(p * 90) * 2;
  return (
    <g transform={`translate(${pt.x} ${pt.y})`}>
      <circle cx={0} cy={-26} r={6} fill={COLORS.ink} />
      <path
        d={`M0,-20 L0,-4 M0,-4 L${-5 + step},8 M0,-4 L${5 - step},8 M0,-16 L10,-8`}
        stroke={COLORS.ink}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <line x1={10} y1={-8} x2={14} y2={10} stroke={COLORS.ink} strokeWidth={2} />
    </g>
  );
};

export const Sea: React.FC = () => {
  const t = useT();

  // 镜头：先看海，6.4 秒起向右看到山，13.9 秒起拉远，最后缩成一张小卡片
  const panned = ease(t, 6.4, 8.4);
  const back = ease(t, 13.9, 17.2);
  const shrink = ease(t, 17.4, 19.6);
  const scale = mix(1, 0.41, back) * mix(1, 0.19, shrink);
  const wx = mix(mix(960, 1960, panned), 1480, back);
  const wy = mix(540, 560, back);
  const ax = mix(960, 1130, shrink);
  const ay = mix(540, 470, shrink);

  const shipX = mix(-300, 1470, ease(t, 2.6, 6.5));
  const shipY = 760 - 18 * Math.sin(ramp(t, 2.6, 6.5) * Math.PI);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <clipPath id="edge-sea-sheet">
          <rect x={-340} y={-60} width={3880} height={1180} />
        </clipPath>
        <clipPath id="edge-sea-wash">
          <rect x={-420} y={-160} width={2620 * easeOut(t, 0.2, 2.6)} height={1400} />
        </clipPath>
      </defs>
      <g transform={`translate(${ax} ${ay}) scale(${scale}) translate(${-wx} ${-wy})`}>
        <g clipPath="url(#edge-sea-sheet)">
        {/* 海的底色，从左向右洇开 */}
        <g clipPath="url(#edge-sea-wash)">
          <path d={SEA_FILL} fill={COLORS.sea} opacity={0.6} />
        </g>

        {/* 陆地与岸边的水线 */}
        <g opacity={ramp(t, 3.8, 5.6)}>
          <path d={LAND_FILL} fill={COLORS.land} />
          {[1, 2, 3].map((k) => (
            <path
              key={k}
              d={curve(COAST.map(([x, y]): Pt => [x - 16 * k, y]))}
              fill="none"
              stroke={COLORS.ink}
              strokeWidth={1.6 - k * 0.25}
              opacity={0.5 - k * 0.12}
            />
          ))}
        </g>
        <g filter="url(#edge-rough)">
          <Draw d={COAST_PATH} p={ease(t, 3.8, 6)} width={3} />
        </g>

        {/* 浪纹 */}
        <g filter="url(#edge-rough)">
          {WAVES.map((segs, row) => (
            <g key={row}>
              {segs.map((seg, n) => (
                <g key={n} transform={`translate(${Math.sin(t * 0.7 + row * 0.9 + n) * 7} 0)`}>
                  <Draw
                    d={seg.d}
                    p={ramp(t, 0.4 + row * 0.045 + (seg.x + 380) / 9000, 1.9 + row * 0.045 + (seg.x + 380) / 9000)}
                    width={1.7}
                    opacity={0.5}
                  />
                </g>
              ))}
            </g>
          ))}
        </g>

        {/* 老地图上海的名字 */}
        <text x={150} y={470} fontFamily={FONT} fontSize={74} letterSpacing={44} fill={COLORS.ink} opacity={0.34 * ramp(t, 1.0, 2.6)}>
          OCEANVS
        </text>

        {/* 罗盘 */}
        <g transform="translate(360 245)" opacity={ramp(t, 3.4, 4.6)}>
          <g filter="url(#edge-rough)">
            <circle r={78} fill="none" stroke={COLORS.ink} strokeWidth={2.2} />
            <circle r={62} fill="none" stroke={COLORS.ink} strokeWidth={1.2} opacity={0.6} />
            <path d="M0,-96 L14,-14 L96,0 L14,14 L0,96 L-14,14 L-96,0 L-14,-14 Z" fill={COLORS.paperLight} stroke={COLORS.ink} strokeWidth={2} />
            <path d="M0,-96 L14,-14 L0,0 Z" fill={COLORS.red} opacity={0.85} />
            <path d="M0,-96 L-14,-14 L0,0 Z" fill={COLORS.ink} opacity={0.55} />
          </g>
          <text y={-112} textAnchor="middle" fontFamily={FONT} fontSize={26} fill={COLORS.ink}>
            N
          </text>
        </g>

        {/* 航线 */}
        <g filter="url(#edge-rough)">
          <DrawDashed d={ROUTE} p={ease(t, 3.5, 5.6)} dash="2 14" width={3.4} color={COLORS.red} opacity={0.85} />
        </g>

        {/* 岸上的小旗 */}
        <g transform={`translate(${coastX(760) - 70} 770)`} opacity={ramp(t, 6.1, 6.6)}>
          <line x1={0} y1={0} x2={0} y2={-82} stroke={COLORS.ink} strokeWidth={3} />
          <path d={`M0,-82 L${46 + Math.sin(t * 5) * 4},-70 L0,-58 Z`} fill={COLORS.red} stroke={COLORS.ink} strokeWidth={1.5} />
        </g>

        <Ship x={shipX} y={shipY} t={t} />

        {/* 山 */}
        <g filter="url(#edge-rough)">
          <path d={`${SKY_PATH} L3250,700 Z`} fill={COLORS.land} opacity={ramp(t, 7.4, 8.6)} />
          <Draw d={SKY_PATH} p={ease(t, 7.0, 9.6)} width={3.2} />
          {FACES.map((face, fi) =>
            Array.from({ length: 14 }, (_, k) => {
              const u = 0.08 + (k / 13) * 0.92;
              const a: Pt = [mix(face.a[0], face.b[0], u), mix(face.a[1], face.b[1], u)];
              const w = Math.max(0, u - 0.3);
              const b: Pt = [mix(face.a[0], face.m[0], w), mix(face.a[1], face.m[1], w)];
              return (
                <Draw
                  key={`${fi}-${k}`}
                  d={handLine(a, b, `h${fi}${k}`, 1.6, 90)}
                  p={ease(t, 8.0 + fi * 0.3 + k * 0.03, 9.8 + fi * 0.3 + k * 0.03)}
                  width={1.5}
                  opacity={0.5}
                />
              );
            }),
          )}
        </g>
        <text x={2300} y={780} fontFamily={FONT} fontSize={52} letterSpacing={30} fill={COLORS.ink} opacity={0.3 * ramp(t, 9.0, 10.4)}>
          MONTES
        </text>

        {/* 树 */}
        <g filter="url(#edge-rough)" opacity={ramp(t, 8.6, 10.4)}>
          {TREES.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${0.8 + random(`ts${i}`) * 0.5})`}>
              <line x1={0} y1={0} x2={0} y2={22} stroke={COLORS.ink} strokeWidth={2.4} />
              <circle cx={0} cy={-6} r={15} fill="#8da36a" fillOpacity={0.6} stroke={COLORS.ink} strokeWidth={1.8} />
            </g>
          ))}
        </g>

        {/* 攀登 */}
        <g filter="url(#edge-rough)">
          <DrawDashed d={TRAIL_PATH} p={ramp(t, 9.6, 11.4)} dash="2 12" width={3.2} color={COLORS.red} opacity={0.9} />
          {t > 9.5 ? <Climber p={ramp(t, 9.6, 11.4)} /> : null}
        </g>

        {/* 山顶的旗和迸出来的光 */}
        <g transform={`translate(${MAIN_PEAK[0]} ${MAIN_PEAK[1]})`} opacity={ramp(t, 11.5, 12.1)}>
          <line x1={0} y1={0} x2={0} y2={-104} stroke={COLORS.ink} strokeWidth={4} />
          <path
            d={`M0,-104 Q34,${-112 + Math.sin(t * 6) * 4} 70,${-96 + Math.sin(t * 6 + 1) * 6} Q34,${-84 + Math.sin(t * 6 + 2) * 4} 0,-78 Z`}
            fill={COLORS.red}
            stroke={COLORS.ink}
            strokeWidth={2}
          />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r0 = 34 + 90 * easeOut(t, 11.6, 12.4);
            const r1 = r0 + 22;
            return (
              <line
                key={i}
                x1={Math.cos(a) * r0}
                y1={-60 + Math.sin(a) * r0}
                x2={Math.cos(a) * r1}
                y2={-60 + Math.sin(a) * r1}
                stroke={COLORS.gold}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={1 - ramp(t, 11.8, 12.8)}
              />
            );
          })}
        </g>

        </g>
        {/* 拉远以后，这张图自己也有一圈边 */}
        <g filter="url(#edge-rough)">
          <Draw d="M-400,-120 L3600,-120 L3600,1180 L-400,1180 Z" p={ease(t, 14.4, 17.2)} width={9} />
          <Draw d="M-340,-60 L3540,-60 L3540,1120 L-340,1120 Z" p={ease(t, 14.8, 17.4)} width={3.4} opacity={0.7} />
        </g>
      </g>
    </svg>
  );
};
