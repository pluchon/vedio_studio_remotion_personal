// 光谱条：按真实波长画。恒星的光是一条彩虹上嵌着暗线；发光气体的光是黑底上几条明线
import React from "react";
import { COLORS, FONT } from "./theme";
import { ramp } from "./time";

const LO = 400;
const HI = 700;

// 波长（纳米）换成颜色（Bruton 近似）
export const wavelengthColor = (w: number): [number, number, number] => {
  let r = 0;
  let g = 0;
  let b = 0;
  if (w >= 380 && w < 440) {
    r = -(w - 440) / 60;
    b = 1;
  } else if (w < 490) {
    g = (w - 440) / 50;
    b = 1;
  } else if (w < 510) {
    g = 1;
    b = -(w - 510) / 20;
  } else if (w < 580) {
    r = (w - 510) / 70;
    g = 1;
  } else if (w < 645) {
    r = 1;
    g = -(w - 645) / 65;
  } else if (w <= 780) {
    r = 1;
  }
  const f = w < 420 ? 0.3 + (0.7 * (w - 380)) / 40 : w > 700 ? 0.3 + (0.7 * (780 - w)) / 80 : 1;
  return [r * f, g * f, b * f];
};
const css = (c: [number, number, number], k = 1) => `rgb(${Math.min(255, Math.round(c[0] * 255 * k))},${Math.min(255, Math.round(c[1] * 255 * k))},${Math.min(255, Math.round(c[2] * 255 * k))})`;

// 恒星光谱里的几条暗线、星云里的几条明线（真实的波长）
const DARK: { nm: number; name: string; strength: number }[] = [
  { nm: 410.2, name: "Hδ", strength: 0.7 },
  { nm: 434.0, name: "Hγ", strength: 0.8 },
  { nm: 486.1, name: "Hβ", strength: 0.9 },
  { nm: 517.3, name: "Mg", strength: 0.7 },
  { nm: 589.3, name: "Na", strength: 0.75 },
  { nm: 656.3, name: "Hα", strength: 0.95 },
];
const BRIGHT: { nm: number; name: string; strength: number }[] = [
  { nm: 434.0, name: "Hγ", strength: 0.35 },
  { nm: 486.1, name: "Hβ", strength: 0.8 },
  { nm: 495.9, name: "O III", strength: 0.75 },
  { nm: 500.7, name: "O III", strength: 1.0 },
  { nm: 656.3, name: "Hα", strength: 0.95 },
  { nm: 658.3, name: "N II", strength: 0.4 },
];

export const Spectrum: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "absorption" | "emission";
  p: number;
  name?: string;
  labels?: boolean;
}> = ({ x, y, w, h, kind, p, name, labels = true }) => {
  if (p <= 0.003) return null;
  const X = (nm: number) => ((nm - LO) / (HI - LO)) * w;
  const id = `nebula-spec-${kind}-${Math.round(y)}`;
  const stops = Array.from({ length: 61 }, (_, i) => {
    const nm = LO + (i / 60) * (HI - LO);
    return <stop key={i} offset={i / 60} stopColor={css(wavelengthColor(nm), 0.95)} />;
  });
  const lines = kind === "absorption" ? DARK : BRIGHT;
  return (
    <g transform={`translate(${x} ${y})`} opacity={p}>
      <defs>
        <linearGradient id={id}>{stops}</linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={kind === "absorption" ? 1.4 : 5} />
        </filter>
      </defs>
      <rect width={w} height={h} fill={kind === "absorption" ? `url(#${id})` : "#04050c"} opacity={kind === "absorption" ? 0.92 : 1} />
      {lines.map((l, i) => {
        const a = ramp(p, 0.15 + i * 0.1, 0.45 + i * 0.1);
        const c = wavelengthColor(l.nm);
        if (kind === "absorption") {
          return <rect key={i} x={X(l.nm) - 2.6} y={0} width={5.2} height={h} fill="#05060c" opacity={0.88 * l.strength * a} filter={`url(#${id}-glow)`} />;
        }
        return (
          <g key={i} opacity={a}>
            <rect x={X(l.nm) - 7} y={0} width={14} height={h} fill={css(c, 1.1)} opacity={0.55 * l.strength} filter={`url(#${id}-glow)`} />
            <rect x={X(l.nm) - 2} y={0} width={4} height={h} fill={css(c, 1.25)} opacity={0.95 * l.strength} />
          </g>
        );
      })}
      <rect width={w} height={h} fill="none" stroke={COLORS.soft} strokeOpacity={0.35} strokeWidth={1.4} />
      {labels
        ? (kind === "absorption" ? DARK : BRIGHT)
            .filter((l, i, arr) => arr.findIndex((o) => o.name === l.name) === i && l.strength >= 0.7)
            .map((l, i) => (
              <text key={i} x={X(l.nm)} y={h + 26} textAnchor="middle" fontFamily={FONT} fontSize={18} fill={COLORS.soft} opacity={ramp(p, 0.6, 0.9) * 0.9} letterSpacing={1}>
                {l.name}
              </text>
            ))
        : null}
      {name ? (
        <text x={0} y={-14} fontFamily={FONT} fontSize={24} fill={COLORS.text} opacity={0.9} letterSpacing={4}>
          {name}
        </text>
      ) : null}
      <text x={0} y={h + 54} fontFamily={FONT} fontSize={15} fill={COLORS.soft} opacity={0.6} letterSpacing={2}>
        400 nm
      </text>
      <text x={w} y={h + 54} textAnchor="end" fontFamily={FONT} fontSize={15} fill={COLORS.soft} opacity={0.6} letterSpacing={2}>
        700 nm
      </text>
    </g>
  );
};
