// 第七幕「到不了的边」：有人说宇宙有限，只是边在哪里无从得知；有人说靠近尽头时，时空会扭曲，怎么走都到不了
// 一条小船朝着图的边缘开，格子线越靠近边越挤，边就这样一路退着走
import React from "react";
import { Draw, DrawDashed } from "../ink";
import type { Pt } from "../ink";
import { Big, Tag } from "../labels";
import { COLORS } from "../theme";
import { ease, mix, ramp, useT } from "../time";
import { Ship } from "./Sea";

const CX = 960;
const CY = 530;
const R = 390;

// 靠近边的时候格子被压扁：把点沿半径方向往边上挤
const warp = (x: number, y: number, strength: number): Pt => {
  const dx = x - CX;
  const dy = y - CY;
  const d = Math.hypot(dx, dy);
  if (d < 1) return [x, y];
  const u = d / R;
  // 在 u<1 里，把 u 变成 u^(1+k·u)：越靠外越被拉向边
  const nu = u <= 1 ? Math.pow(u, 1 - strength * 0.55 * (1 - u * 0.4)) : u;
  const k = nu / u;
  return [CX + dx * k, CY + dy * k];
};

export const Edge: React.FC = () => {
  const t = useT();

  // 先是一个有限的圈，圈外无从得知（雾）
  const ring = ease(t, 141.0, 142.6);
  const fog = ramp(t, 145.6, 146.8) * (1 - ease(t, 150.4, 151.2));
  const fogShift = t * 16;

  // 然后格子出现，边随着格子的扭曲退着走
  const grid = ease(t, 152.0, 153.4);
  const bend = ease(t, 153.6, 156.0);

  // 船：一直往边开
  const shipP = ease(t, 151.2, 158.6);
  const shipX = mix(CX - 340, CX + 120, shipP);
  const shipY = CY + 90 - 40 * shipP;
  const shipIn = ramp(t, 151.0, 152.0);

  // 边退了：每次靠近，边都往外挪一点，圈大一圈
  const pushed = 1 + 0.12 * ease(t, 156.0, 159.2);

  const lines: React.ReactNode[] = [];
  const N = 15;
  for (let i = -N; i <= N; i++) {
    const pts: Pt[] = [];
    const pts2: Pt[] = [];
    for (let j = -N * 2; j <= N * 2; j++) {
      const a = CX + i * 56;
      const b = CY + j * 28;
      pts.push(warp(a, b, bend));
      pts2.push(warp(b + CX - CY, CY + i * 28, bend));
    }
    const inside = (p: Pt) => Math.hypot(p[0] - CX, p[1] - CY) <= R * 1.02;
    const clip = (list: Pt[]) => list.filter(inside);
    const c1 = clip(pts);
    const c2 = clip(pts2);
    if (c1.length > 2) lines.push(<path key={`v${i}`} d={`M${c1.map((p) => p.join(",")).join(" L")}`} fill="none" stroke={COLORS.ink} strokeWidth={1.6} opacity={0.38} />);
    if (c2.length > 2) lines.push(<path key={`h${i}`} d={`M${c2.map((p) => p.join(",")).join(" L")}`} fill="none" stroke={COLORS.ink} strokeWidth={1.6} opacity={0.38} />);
  }

  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="edge-edge-disc">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
          <radialGradient id="edge-fog" cx="0.5" cy="0.5" r="0.5">
            <stop offset="55%" stopColor={COLORS.paperLight} stopOpacity={0} />
            <stop offset="85%" stopColor={COLORS.paperLight} stopOpacity={0.92} />
            <stop offset="100%" stopColor={COLORS.paperLight} stopOpacity={0.96} />
          </radialGradient>
        </defs>

        <g transform={`translate(${CX} ${CY}) scale(${pushed}) translate(${-CX} ${-CY})`}>
          {/* 有限的宇宙：一个圈，里面撒着星系 */}
          <g filter="url(#edge-rough)">
            <circle cx={CX} cy={CY} r={R} fill={COLORS.land} fillOpacity={0.5 * ring} />
            <Draw d={`M${CX - R},${CY} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 ${-2 * R},0`} p={ring} width={4.5} />
          </g>
          <g clipPath="url(#edge-edge-disc)" opacity={ring}>
            <g>{lines.length && grid > 0 ? <g opacity={grid}>{lines}</g> : null}</g>
          </g>
          <g filter="url(#edge-rough)">
            <DrawDashed
              d={`M${CX - R - 14},${CY} a${R + 14},${R + 14} 0 1,0 ${2 * (R + 14)},0 a${R + 14},${R + 14} 0 1,0 ${-2 * (R + 14)},0`}
              p={ease(t, 152.4, 154.6)}
              dash="10 12"
              width={4.5}
              color={COLORS.red}
            />
          </g>
          {/* 边外的雾 */}
          <g opacity={fog}>
            <circle cx={CX} cy={CY} r={R + 160} fill="url(#edge-fog)" />
            {Array.from({ length: 22 }, (_, i) => {
              const a = (i / 22) * Math.PI * 2 + fogShift * 0.002;
              const r = R + 36 + (i % 3) * 36;
              return <ellipse key={i} cx={CX + Math.cos(a) * r} cy={CY + Math.sin(a) * r} rx={86} ry={34} fill={COLORS.paperLight} opacity={0.9} transform={`rotate(${(a * 180) / Math.PI + 90} ${CX + Math.cos(a) * r} ${CY + Math.sin(a) * r})`} />;
            })}
          </g>
        </g>

        {/* 船 */}
        <g opacity={shipIn}>
          <g transform={`translate(${shipX} ${shipY}) scale(0.5) translate(${-shipX} ${-shipY})`}>
            <Ship x={shipX} y={shipY} t={t} />
          </g>
          <DrawDashed d={`M${CX - 340},${CY + 90} Q${CX - 120},${CY + 90} ${shipX},${shipY}`} p={1} dash="2 12" width={3.4} color={COLORS.red} opacity={0.8} />
        </g>
      </svg>

      <Big x={CX} y={CY} p={ramp(t, 146.0, 147.0) * (1 - ease(t, 150.2, 151.0))} size={150} color={COLORS.inkSoft} black>
        ？
      </Big>
      <Tag x={CX - R - 230} y={CY - 200} p={ramp(t, 140.8, 141.6)} size={40}>
        有限的宇宙
      </Tag>
      <Tag x={CX + R + 190} y={CY - 140} p={ramp(t, 148.9, 149.8) * (1 - ease(t, 151.0, 151.8))} size={40} red>
        无从得知
      </Tag>
      <Tag x={CX - R - 210} y={CY - 210} p={ramp(t, 154.4, 155.4)} size={38} red>
        时空扭曲
      </Tag>
      <Tag x={CX + R + 200} y={CY + 210} p={ramp(t, 158.2, 159.2)} size={38}>
        怎么走都到不了
      </Tag>
    </>
  );
};

