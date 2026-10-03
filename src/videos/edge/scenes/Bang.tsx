// 第八幕「膨胀」：大爆炸之前什么也没有；大爆炸之后，空间本身在变大，星系彼此离得越来越远——不是它们在跑，是格子在被拉长
// 圈一直长到画面外，所以找不到边；等它不再膨胀，镜头退回来，边才被看见
import { makeStar } from "@remotion/shapes";
import React from "react";
import { random } from "remotion";
import { DrawDashed } from "../ink";
import type { Pt } from "../ink";
import { Big, Tag } from "../labels";
import { COLORS, FONT } from "../theme";
import { ease, easeOut, mix, ramp, useT } from "../time";

const CX = 960;
const CY = 520;
const R0 = 420;

// 缩放档位随时间：先猛地长大，再慢慢长，长到出画，然后停住、镜头退回来
const KEYS: [number, number][] = [
  [164.6, 0.02],
  [171.0, 1.0],
  [180.0, 1.2],
  [184.5, 3.0],
  [187.0, 3.5],
  [189.1, 1.15],
];
const scaleAt = (t: number): number => {
  if (t <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 1; i < KEYS.length; i++) {
    if (t <= KEYS[i][0]) {
      const [t0, s0] = KEYS[i - 1];
      const [t1, s1] = KEYS[i];
      const p = (t - t0) / (t1 - t0);
      const e = i === 1 ? 1 - (1 - p) * (1 - p) * (1 - p) : p * p * (3 - 2 * p);
      return Math.exp(mix(Math.log(s0), Math.log(s1), e));
    }
  }
  return KEYS[KEYS.length - 1][1];
};

// 星系们的位置（在圈里的坐标，不随膨胀变）
const OURS: Pt = [-90, 40];
const GALAXIES: Pt[] = Array.from({ length: 80 }, (_, i): Pt => {
  const r = Math.sqrt(random(`bg-r${i}`)) * (R0 - 12);
  const a = random(`bg-a${i}`) * Math.PI * 2;
  return [Math.cos(a) * r, Math.sin(a) * r];
});
const NEIGHBOURS: Pt[] = [
  [150, -120],
  [-230, -170],
  [210, 170],
  [-260, 150],
  [60, 250],
  [260, -10],
];

export const Bang: React.FC = () => {
  const t = useT();
  const S = scaleAt(t);

  const flash = Math.max(0, Math.min(ramp(t, 164.2, 164.8), 1 - ramp(t, 164.8, 166.0)));
  const burst = easeOut(t, 164.4, 165.6);
  const burstFade = 1 - ease(t, 165.2, 166.6);
  const star = makeStar({ points: 16, innerRadius: 60, outerRadius: 150 });

  const rate = ease(t, 173.4, 174.6) * (1 - ease(t, 185.6, 187.0));
  const gridGold = ease(t, 177.3, 178.0) * (1 - ease(t, 179.6, 180.4));
  const inside = ramp(t, 164.6, 165.4);

  // 格线
  const gridLines: React.ReactNode[] = [];
  for (let i = -9; i <= 9; i++) {
    gridLines.push(
      <line key={`v${i}`} x1={i * 60} x2={i * 60} y1={-R0} y2={R0} stroke={gridGold > 0.01 ? COLORS.gold : COLORS.ink} strokeWidth={(1.4 + 2.2 * gridGold) / S} opacity={0.22 + 0.6 * gridGold} />,
      <line key={`h${i}`} y1={i * 60} y2={i * 60} x1={-R0} x2={R0} stroke={gridGold > 0.01 ? COLORS.gold : COLORS.ink} strokeWidth={(1.4 + 2.2 * gridGold) / S} opacity={0.22 + 0.6 * gridGold} />,
    );
  }

  const arrows = NEIGHBOURS.map(([x, y], i) => {
    const dx = x - OURS[0];
    const dy = y - OURS[1];
    const d = Math.hypot(dx, dy);
    const len = d * S * 0.38 * rate;
    if (len < 6) return null;
    const ux = dx / d;
    const uy = dy / d;
    const sx = CX + x * S;
    const sy = CY + y * S;
    const ex = sx + ux * len;
    const ey = sy + uy * len;
    return (
      <g key={i} stroke={COLORS.red} strokeWidth={4} strokeLinecap="round" fill="none">
        <line x1={sx + ux * 10} y1={sy + uy * 10} x2={ex} y2={ey} />
        <path d={`M${ex - ux * 16 - uy * 10},${ey - uy * 16 + ux * 10} L${ex},${ey} L${ex - ux * 16 + uy * 10},${ey - uy * 16 - ux * 10}`} />
      </g>
    );
  });

  // 出画的边：框边上的红箭头，提示圈还在往外长
  const edgeOut = ramp(t, 183.0, 184.2) * (1 - ease(t, 186.0, 187.0));
  const flag = easeOut(t, 188.2, 188.9);
  const flagAngle = -0.62;
  const flagX = CX + Math.cos(flagAngle) * R0 * S;
  const flagY = CY + Math.sin(flagAngle) * R0 * S;

  return (
    <>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: ramp(t, 160.4, 161.4) * (1 - ease(t, 163.8, 164.4)) }}>
        <div style={{ fontFamily: FONT, fontSize: 56, letterSpacing: 40, paddingLeft: 40, color: COLORS.inkSoft }}>NIHIL</div>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="edge-bang-disc">
            <circle cx={CX} cy={CY} r={R0 * S} />
          </clipPath>
          <radialGradient id="edge-bang-glow">
            <stop offset="0%" stopColor="#f5dc8e" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#f5dc8e" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* 爆发 */}
        <g transform={`translate(${CX} ${CY})`} opacity={burstFade}>
          <circle r={mix(10, 520, burst)} fill="url(#edge-bang-glow)" />
          <path d={star.path} transform={`translate(${-star.width / 2 * burst * 2.2} ${-star.height / 2 * burst * 2.2}) scale(${burst * 2.2}) rotate(${t * 30} ${star.width / 2} ${star.height / 2})`} fill={COLORS.red} stroke={COLORS.ink} strokeWidth={3} opacity={0.9} />
        </g>

        {/* 膨胀中的宇宙 */}
        <g opacity={inside}>
          <circle cx={CX} cy={CY} r={R0 * S} fill={COLORS.land} fillOpacity={0.55} />
          <g clipPath="url(#edge-bang-disc)">
            <g transform={`translate(${CX} ${CY}) scale(${S})`}>
              {gridLines}
              {GALAXIES.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={4.5 / S} fill={COLORS.ink} opacity={0.7} />
              ))}
              {NEIGHBOURS.map(([x, y], i) => (
                <circle key={`n${i}`} cx={x} cy={y} r={9 / S} fill={COLORS.gold} stroke={COLORS.ink} strokeWidth={2 / S} />
              ))}
              <g transform={`translate(${OURS[0]} ${OURS[1]})`}>
                <circle r={13 / S} fill={COLORS.red} stroke={COLORS.ink} strokeWidth={2.4 / S} />
                <circle r={24 / S} fill="none" stroke={COLORS.red} strokeWidth={3 / S} strokeDasharray={`${7 / S} ${6 / S}`} />
              </g>
            </g>
          </g>
          <g filter="url(#edge-rough)">
            <DrawDashed
              d={`M${CX - R0 * S},${CY} a${R0 * S},${R0 * S} 0 1,0 ${2 * R0 * S},0 a${R0 * S},${R0 * S} 0 1,0 ${-2 * R0 * S},0`}
              p={ease(t, 165.0, 167.0)}
              dash="12 12"
              width={4.6}
              color={COLORS.red}
            />
          </g>
        </g>
        {arrows}

        {/* 出画的边 */}
        <g opacity={edgeOut} stroke={COLORS.red} strokeWidth={6} strokeLinecap="round" fill="none">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const a = (k / 8) * Math.PI * 2 + 0.2;
            const px = CX + Math.cos(a) * 820;
            const py = CY + Math.sin(a) * 500;
            const push = (Math.sin(t * 3 + k) * 0.5 + 0.5) * 14;
            return (
              <g key={k} transform={`translate(${px + Math.cos(a) * push} ${py + Math.sin(a) * push}) rotate(${(a * 180) / Math.PI})`}>
                <path d="M-18,-16 L8,0 L-18,16" />
              </g>
            );
          })}
        </g>

        {/* 终于停下的边上，插了一面小旗 */}
        <g opacity={flag} transform={`translate(${flagX} ${flagY})`}>
          <line x1={0} y1={0} x2={0} y2={-96 * flag} stroke={COLORS.ink} strokeWidth={5} />
          <path d={`M0,${-96 * flag} L${58 * flag + Math.sin(t * 5) * 4},${-80 * flag} L0,${-62 * flag} Z`} fill={COLORS.red} stroke={COLORS.ink} strokeWidth={2.4} />
        </g>

        {/* 宇宙之外是什么：边以外的墨又漫上来 */}
        {ramp(t, 193.4, 194.2) > 0.01 ? (
          <path
            d={`M${CX - 3000},${CY - 3000} H${CX + 3000} V${CY + 3000} H${CX - 3000} Z M${CX - R0 * S},${CY} a${R0 * S},${R0 * S} 0 1,0 ${2 * R0 * S},0 a${R0 * S},${R0 * S} 0 1,0 ${-2 * R0 * S},0`}
            fillRule="evenodd"
            fill={COLORS.night}
            filter="url(#edge-ink-soak)"
            opacity={0.96 * ease(t, 193.4, 195.0)}
          />
        ) : null}

        {/* 爆发时整页闪白 */}
        <rect width={1920} height={1080} fill={COLORS.paperLight} opacity={flash * 0.92} />
      </svg>

      <Tag x={CX + 560} y={CY - 380} p={ramp(t, 167.4, 168.2) * (1 - ease(t, 171.8, 172.6))} size={40}>
        所有的一切都在变大
      </Tag>
      <Tag x={CX + OURS[0] * S - 90} y={CY + OURS[1] * S - 70} p={ramp(t, 172.8, 173.6)} size={38} red>
        我们
      </Tag>
      <Tag x={CX + 540} y={CY + 340} p={ramp(t, 175.0, 175.8) * (1 - ease(t, 177.0, 177.8))} size={36}>
        离得越来越远
      </Tag>
      <Tag x={CX + 540} y={CY + 340} p={ramp(t, 178.0, 178.8) * (1 - ease(t, 180.0, 180.8))} size={36} red>
        是空间本身在变大
      </Tag>
      <Big x={CX} y={CY - 10} p={ramp(t, 183.6, 184.4) * (1 - ease(t, 185.6, 186.4))} size={120} color={COLORS.red} black={false} spacing={0.6}>
        边界 ?
      </Big>
      <Tag x={CX} y={CY + 400} p={ramp(t, 187.4, 188.2) * (1 - ease(t, 190.6, 191.4))} size={36}>
        不再膨胀了
      </Tag>
      <Tag x={flagX + 150} y={flagY - 40} p={ramp(t, 189.5, 190.3) * (1 - ease(t, 193.0, 193.8))} size={40} red>
        宇宙的尽头
      </Tag>
      <Big x={CX} y={CY} p={ramp(t, 191.4, 192.2) * (1 - ease(t, 193.2, 193.8))} size={300} color={COLORS.red}>
        ?
      </Big>
      <Big x={CX + 560} y={CY + 330} p={ramp(t, 193.6, 194.4)} size={220} color={COLORS.star}>
        ?
      </Big>
    </>
  );
};
