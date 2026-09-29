// 一朵云：若干「团」叠在一起，每团亮面在左上、背光在右下；整体再加一点毛边和柔化。
// 各种形状（水汽、积云、被撕开的几缕、羊、龙）都是同样多的团并按 x 排好序，按序号配对就能互相形变
import React from "react";
import { interpolate, random } from "remotion";
import { EASE_IN_OUT } from "../theme";

export type Puff = { x: number; y: number; r: number; a: number; sx: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const byX = (list: Puff[]) => [...list].sort((p, q) => p.x - q.x);
const puff = (x: number, y: number, r: number, a = 1, sx = 1): Puff => ({ x, y, r, a, sx });

// 积云：半椭圆的轮廓里堆 n 团，越靠中间越高越大；原点在云底中央。grain 小于 1 时团更小更密，适合大朵的云
export const cumulus = (seed: string, n: number, w: number, h: number, grain = 1): Puff[] =>
  byX(
    Array.from({ length: n }, (_, i) => {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      const u = r("u") * 2 - 1;
      const env = Math.sqrt(Math.max(0, 1 - u * u));
      return puff(u * w * 0.42, -Math.pow(r("v"), 0.8) * h * 0.66 * env, h * (0.15 + 0.14 * r("r")) * (0.5 + 0.5 * env) * grain);
    }),
  );

// 把一组团整体挪开，用来把几座积云拼成高低错落的一大朵
export const shift = (list: Puff[], dx: number, dy: number): Puff[] => list.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));

// 海面上的水汽：稀稀落落、很小很淡的一片，还没有形状
export const vapor = (seed: string, n: number, w: number, h: number): Puff[] =>
  byX(
    Array.from({ length: n }, (_, i) => {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      return puff((r("x") - 0.5) * w, (r("y") - 0.2) * h, 10 + r("r") * 14, 0.25 + r("a") * 0.3, 1.6);
    }),
  );

// 被山撕成几缕：按序号分进三条横向拉长的带，上下错开
export const tear = (base: Puff[]): Puff[] =>
  byX(
    base.map((p, i) => {
      const band = i % 3;
      return puff(p.x * 1.5 + [-150, 20, 170][band], [-70, 5, 70][band] + p.y * 0.25, p.r * 0.55, 0.7, 2.4);
    }),
  );

// 一只羊：椭圆的身子、朝左的头和耳朵、四条腿、一小撮尾巴，共 36 团
export const SHEEP: Puff[] = byX([
  ...Array.from({ length: 14 }, (_, i) => {
    const t = (i / 14) * Math.PI * 2;
    return puff(128 * Math.cos(t), -12 + 66 * Math.sin(t), 44);
  }),
  ...Array.from({ length: 8 }, (_, i) => puff(-90 + i * 26, -18 + (i % 2) * 22, 50)),
  puff(-178, -46, 36),
  puff(-205, -24, 26),
  puff(-160, -18, 28),
  puff(-196, -84, 15),
  puff(-148, -86, 15),
  ...[-92, -38, 44, 98].flatMap((x) => [puff(x, 70, 19), puff(x + 2, 104, 15)]),
  puff(160, -40, 24),
]);

// 一条龙：从尾巴（左）到脖子（右）一串蜿蜒、越来越粗的身子，背上一排小鳍，昂起的头、两只角、一缕须、四只爪，共 36 团
const dragonBody = (x: number) => -62 * Math.sin((x + 400) / 110);
const DRAGON_SPINE = Array.from({ length: 22 }, (_, i) => {
  const x = -400 + (i / 21) * 690;
  return puff(x, dragonBody(x), 12 + (i / 21) * 30);
});
export const DRAGON: Puff[] = byX([
  ...DRAGON_SPINE,
  ...[6, 10, 14, 18].map((i) => puff(DRAGON_SPINE[i].x, DRAGON_SPINE[i].y - DRAGON_SPINE[i].r - 4, 10)),
  puff(340, -44, 42),
  puff(394, -30, 28),
  puff(368, -6, 22),
  puff(322, -96, 12),
  puff(358, -102, 12),
  puff(436, -50, 8),
  ...[-200, -100, 60, 170].map((x) => puff(x, dragonBody(x) + 46, 15)),
]);

// 从 from 形变到 to；spread 大于 0 时各团先后到位，像水汽一点点聚过来
export const morph = (from: Puff[], to: Puff[], p: number, spread = 0, seed = "morph"): Puff[] =>
  from.map((a, i) => {
    const b = to[i];
    const d = random(`${seed}-${i}`) * spread;
    const k = EASE_IN_OUT(Math.min(1, Math.max(0, (p - d) / (1 - spread))));
    const mix = (u: number, v: number) => u + (v - u) * k;
    return { x: mix(a.x, b.x), y: mix(a.y, b.y), r: mix(a.r, b.r), a: mix(a.a, b.a), sx: mix(a.sx, b.sx) };
  });

// 按关键帧在一串形状之间形变：在 f 帧时正好是 shape，两帧之间按缓动过渡
export type ShapeKey = { f: number; shape: Puff[]; spread?: number };
export const shapeAt = (frame: number, keys: ShapeKey[]): Puff[] => {
  if (frame <= keys[0].f) return keys[0].shape;
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i].f) {
      const p = interpolate(frame, [keys[i - 1].f, keys[i].f], [0, 1], clamp);
      return morph(keys[i - 1].shape, keys[i].shape, p, keys[i].spread ?? 0, `k${i}`);
    }
  }
  return keys[keys.length - 1].shape;
};

// 整朵云从上到下的明暗：顶上可以染一层光（黄昏时的金、橘、粉），底下沉进背光色
export type Tint = { top: string; topOpacity: number; bottomOpacity: number };

export const Cloud: React.FC<{
  id: string;
  puffs: Puff[];
  x: number;
  y: number;
  scale?: number;
  light: string;
  mid: string;
  shade: string;
  tint?: Tint;
  base?: number;
  glow?: string;
  glowOpacity?: number;
  opacity?: number;
  fluff?: number;
  soft?: number;
}> = ({ id, puffs, x, y, scale = 1, light, mid, shade, tint, base, glow, glowOpacity = 0, opacity = 1, fluff = 12, soft = 2 }) => {
  // 下面的团先画，上面的团压在它们的背光边上，形成一层层的鼓包
  const ordered = [...puffs].sort((p, q) => q.y - p.y);
  const minX = Math.min(...puffs.map((p) => p.x - p.r * p.sx)) - 20;
  const maxX = Math.max(...puffs.map((p) => p.x + p.r * p.sx)) + 20;
  const minY = Math.min(...puffs.map((p) => p.y - p.r)) - 20;
  const maxY = Math.max(...puffs.map((p) => p.y + p.r)) + 20;
  const bottom = base === undefined ? maxY : Math.min(maxY, base);
  const shading = tint ?? { top: light, topOpacity: 0, bottomOpacity: 0.5 };
  const ellipses = (fill: string, alpha = 1, dy = 0, grow = 1) =>
    ordered.map((p, i) => (
      <ellipse key={i} cx={p.x} cy={p.y + p.r * dy} rx={p.r * p.sx * grow} ry={p.r * grow} fill={fill} opacity={p.a * alpha} />
    ));

  return (
    <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity, pointerEvents: "none" }}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.4" cy="0.3" r="0.75">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={light} />
          <stop offset="0.9" stopColor={mid} />
          <stop offset="1" stopColor={mid} />
        </radialGradient>
        <linearGradient id={`${id}-v`} gradientUnits="userSpaceOnUse" x1={0} y1={minY} x2={0} y2={bottom}>
          <stop offset="0" stopColor={shading.top} stopOpacity={shading.topOpacity} />
          <stop offset="0.45" stopColor={shading.top} stopOpacity={0} />
          <stop offset="0.62" stopColor={shade} stopOpacity={0} />
          <stop offset="1" stopColor={shade} stopOpacity={shading.bottomOpacity} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={minX} y={minY} width={maxX - minX} height={maxY - minY}>
          {ellipses("#fff")}
        </mask>
        <clipPath id={`${id}-c`}>
          <rect x={minX - 40} y={minY - 40} width={maxX - minX + 80} height={bottom - minY + 40} />
        </clipPath>
        <filter id={`${id}-f`} x="-30%" y="-40%" width="160%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale={fluff} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation={soft} />
        </filter>
        <filter id={`${id}-glow`} x="-60%" y="-80%" width="220%" height="260%">
          <feGaussianBlur stdDeviation={40} />
        </filter>
      </defs>
      <g transform={`scale(${scale})`}>
        {glow && glowOpacity > 0 && (
          <g filter={`url(#${id}-glow)`} opacity={glowOpacity}>
            {ellipses(glow, 1, 0, 1.2)}
          </g>
        )}
        <g filter={`url(#${id}-f)`}>
          <g clipPath={`url(#${id}-c)`}>
            {/* 每个鼓包下沿投在下一层上的淡影 */}
            {ellipses(shade, 0.32, 0.3)}
            {ellipses(`url(#${id}-g)`)}
            <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill={`url(#${id}-v)`} mask={`url(#${id}-m)`} />
          </g>
        </g>
      </g>
    </svg>
  );
};
