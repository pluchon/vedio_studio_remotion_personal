// 水珠：轮廓不是正圆，里面像透镜一样倒映着窗外的灯，上缘暗、下缘亮
import React from "react";
import { noise2D } from "@remotion/noise";
import { BEAD, DUSK, HEIGHT, WIDTH } from "../theme";
import { LAMPS } from "./Outside";

// 水珠的轮廓：下半边更沉，边缘各处鼓出一点，随时间微微晃
export const blob = (x: number, y: number, rx: number, ry: number, seed: string, seconds: number) => {
  const COUNT = 9;
  const points = new Array(COUNT).fill(0).map((_, k) => {
    const angle = (k / COUNT) * Math.PI * 2;
    const bulge = 1 + noise2D(`blob-${seed}`, k * 1.7, seconds * 0.35) * 0.13 + Math.sin(angle) * 0.07;
    return { x: x + Math.cos(angle) * rx * bulge, y: y + Math.sin(angle) * ry * bulge };
  });
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(points[COUNT - 1], points[0]);
  const parts = [`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`];
  points.forEach((point, k) => {
    const next = mid(point, points[(k + 1) % COUNT]);
    parts.push(`Q ${point.x.toFixed(1)} ${point.y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`);
  });
  return `${parts.join(" ")} Z`;
};

// 全片共用的渐变，以及水珠里倒映的那幅小小的窗外。放在画面最底下，只挂一次
export const RainDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <linearGradient id="rain-bead" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={BEAD.dark} />
        <stop offset="58%" stopColor={BEAD.mid} />
        <stop offset="100%" stopColor={BEAD.bright} />
      </linearGradient>
      <linearGradient id="rain-speck" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(8, 20, 30, 0.8)" />
        <stop offset="56%" stopColor="rgba(96, 136, 150, 0.3)" />
        <stop offset="100%" stopColor="rgba(236, 246, 242, 0.8)" />
      </linearGradient>
      <linearGradient id="rain-rim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(6, 14, 20, 0.75)" />
        <stop offset="60%" stopColor="rgba(40, 62, 72, 0.25)" />
        <stop offset="100%" stopColor="rgba(244, 250, 248, 0.8)" />
      </linearGradient>
      <radialGradient id="rain-bead-shine">
        <stop offset="0%" stopColor="rgba(255, 240, 214, 0.6)" />
        <stop offset="100%" stopColor="rgba(255, 240, 214, 0)" />
      </radialGradient>
      <linearGradient id="rain-mini-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={DUSK.top} />
        <stop offset="55%" stopColor={DUSK.mid} />
        <stop offset="100%" stopColor={DUSK.low} />
      </linearGradient>
      <g id="rain-mini">
        <rect x={-WIDTH} y={-HEIGHT} width={WIDTH * 3} height={HEIGHT * 3} fill="url(#rain-mini-sky)" />
        {LAMPS.filter((lamp, i) => lamp.near || i % 3 === 0).map((lamp, i) => (
          <circle key={i} cx={lamp.x} cy={lamp.y} r={lamp.r * 1.3} fill={lamp.color} opacity={lamp.alpha} />
        ))}
      </g>
    </defs>
  </svg>
);

// lens：倒映有多清楚，0 就只剩一颗灰亮的水珠
export const Bead: React.FC<{ id: string; x: number; y: number; rx: number; ry: number; seconds: number; lens?: number; opacity?: number }> = ({
  id,
  x,
  y,
  rx,
  ry,
  seconds,
  lens = 0.7,
  opacity = 1,
}) => {
  if (rx < 0.5 || ry < 0.5) {
    return null;
  }
  const d = blob(x, y, rx, ry, id, seconds);
  // 透镜把整幅窗外倒过来缩进水珠里
  const k = (rx * 3.4) / WIDTH;
  return (
    <g opacity={opacity}>
      <ellipse cx={x + rx * 0.1} cy={y + ry * 0.95} rx={rx * 0.9} ry={ry * 0.34} fill="url(#rain-bead-shine)" opacity={0.5} />
      <clipPath id={`rain-clip-${id}`}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#rain-clip-${id})`} opacity={lens}>
        <use href="#rain-mini" transform={`translate(${x} ${y}) scale(${k} ${-k}) translate(${-WIDTH / 2} ${-HEIGHT * 0.6})`} />
      </g>
      <path d={d} fill="url(#rain-bead)" stroke="url(#rain-rim)" strokeWidth={1.6} />
      <ellipse cx={x} cy={y + ry * 0.52} rx={rx * 0.6} ry={ry * 0.3} fill="url(#rain-bead-shine)" />
      <ellipse
        cx={x - rx * 0.36}
        cy={y - ry * 0.46}
        rx={rx * 0.13}
        ry={ry * 0.07}
        fill={BEAD.glint}
        transform={`rotate(-30 ${x - rx * 0.36} ${y - ry * 0.46})`}
      />
    </g>
  );
};
