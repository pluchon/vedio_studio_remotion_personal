// 道具：火焰、火星、发光的符号（它们的「字」）、洞壁的岩石、烟、城市天际线、星图网络
import { BlurMask, Circle, Fill, Group, Path, Rect, Shader, Skia } from "@shopify/react-native-skia";
import React from "react";
import { H, NOISE, W, effect, rng } from "./sk";

// ---------- 火 ----------
const FLAME = effect(`
uniform float2 base;
uniform float2 sz;
uniform float t;
uniform float k;
${NOISE}
half4 main(float2 p) {
  float2 q = (p - base) / sz;
  q.y = -q.y;
  float h = clamp(q.y, 0.0, 1.3);
  float n1 = fbm(float2(q.x * 3.5, q.y * 2.6 - t * 2.8));
  float n2 = fbm(float2(q.x * 7.0 + 3.0, q.y * 4.6 - t * 4.2));
  float sway = (n1 - 0.5) * 0.7 * h;
  float width = mix(0.9, 0.06, smoothstep(0.0, 1.0, h));
  float f = 1.0 - abs(q.x + sway) / width;
  f = f - q.y * 0.55 + (n2 - 0.5) * 0.75;
  f *= smoothstep(-0.12, 0.02, q.y) * smoothstep(1.25, 0.85, q.y) * k;
  f = clamp(f, 0.0, 1.0);
  float3 c = mix(float3(0.45, 0.04, 0.0), float3(1.0, 0.32, 0.03), smoothstep(0.02, 0.3, f));
  c = mix(c, float3(1.0, 0.72, 0.28), smoothstep(0.3, 0.55, f));
  c = mix(c, float3(1.0, 0.95, 0.8), smoothstep(0.55, 0.85, f));
  float a = smoothstep(0.0, 0.18, f);
  return half4(half3(c * a), a);
}
`);

// 一团火：底部中心 (x, y)，宽 w、高 h；k 是火势 0..1；外面一大团暖光
export const Flame: React.FC<{ x: number; y: number; w: number; h: number; t: number; k?: number; glow?: number }> = ({ x, y, w, h, t, k = 1, glow = 1 }) => (
  <Group>
    <Circle cx={x} cy={y - h * 0.3} r={h * 2.2} color="#ff7a2a" opacity={0.22 * k * glow}>
      <BlurMask blur={h * 1.2} style="normal" />
    </Circle>
    <Circle cx={x} cy={y - h * 0.25} r={h * 0.8} color="#ffc56b" opacity={0.35 * k * glow}>
      <BlurMask blur={h * 0.5} style="normal" />
    </Circle>
    <Rect x={x - w * 1.2} y={y - h * 1.4} width={w * 2.4} height={h * 1.6}>
      <Shader source={FLAME} uniforms={{ base: [x, y], sz: [w, h], t, k }} />
    </Rect>
  </Group>
);

// 火星：从 (x, y) 往上飘、闪、灭
export const Embers: React.FC<{ x: number; y: number; t: number; n?: number; spread?: number; rise?: number; k?: number; seed?: number }> = ({
  x,
  y,
  t,
  n = 40,
  spread = 60,
  rise = 320,
  k = 1,
  seed = 13,
}) => {
  const r = rng(seed);
  return (
    <Group>
      {Array.from({ length: n }, (_, i) => {
        const life = 1.4 + r() * 1.6;
        const ph = r() * life;
        const ox = (r() - 0.5) * spread;
        const h = rise * (0.6 + r() * 0.8);
        const sw = r() * 9;
        const age = ((t + ph) % life) / life;
        return (
          <Circle key={i} cx={x + ox + Math.sin(t * 3 + sw) * 14 * age} cy={y - age * h} r={2 + (1 - age) * 1.6} color="#ffb85a" opacity={(1 - age) * 0.9 * k}>
            <BlurMask blur={1.5} style="normal" />
          </Circle>
        );
      })}
    </Group>
  );
};

// ---------- 符号：它们的「字」，十二个，都画在 40×40 的格子里 ----------
export const GLYPHS = [
  "M8 20 A12 12 0 1 1 32 20 A8 8 0 1 1 16 20 A4 4 0 1 1 24 20", // 螺旋
  "M12 8 Q30 14 12 20 Q30 26 12 32", // 回折
  "M8 26 Q20 6 32 26 M20 26 L20 34", // 拱和柱
  "M20 8 A12 12 0 1 0 20.1 8 M20 18 L20 22", // 圈和点
  "M8 14 Q14 8 20 14 T32 14 M8 26 Q14 20 20 26 T32 26", // 双波
  "M20 6 L32 30 L8 30 Z M20 21 L20 25", // 三角和点
  "M10 10 Q20 22 30 10 M10 30 Q20 18 30 30", // 相对的弧
  "M6 20 Q20 4 34 20 Q20 36 6 20 M20 16 L20 24", // 眼
  "M12 8 L12 32 M12 20 Q26 12 28 22 Q28 30 20 30", // 钩
  "M20 20 m-10 0 a10 10 0 1 0 20 0 M20 4 L20 10 M20 30 L20 36 M4 20 L10 20 M30 20 L36 20", // 太阳
  "M8 32 Q20 0 32 32 M14 26 Q20 16 26 26", // 套拱
  "M20 6 Q8 14 20 20 Q32 26 20 34 M10 20 L30 20", // 盘
];

// 一个发光的符号：draw 0..1 一笔笔画出来；size 是边长
export const Glyph: React.FC<{ i: number; x: number; y: number; size?: number; draw?: number; color?: string; glow?: number; opacity?: number; width?: number }> = ({
  i,
  x,
  y,
  size = 60,
  draw = 1,
  color = "#ffd08a",
  glow = 1,
  opacity = 1,
  width = 3,
}) => {
  const s = size / 40;
  const tr = [{ translateX: x - size / 2 }, { translateY: y - size / 2 }, { scale: s }];
  const d = GLYPHS[((i % GLYPHS.length) + GLYPHS.length) % GLYPHS.length];
  return (
    <Group transform={tr} opacity={opacity}>
      <Path path={d} style="stroke" strokeWidth={(width * 3) / s} strokeCap="round" strokeJoin="round" color={color} opacity={0.35 * glow} end={draw}>
        <BlurMask blur={4 / s} style="normal" />
      </Path>
      <Path path={d} style="stroke" strokeWidth={width / s} strokeCap="round" strokeJoin="round" color="#fff2d6" end={draw} />
    </Group>
  );
};

// ---------- 洞壁：被一个点光源（火）照着的粗糙石面 ----------
const ROCK = effect(`
uniform float2 size;
uniform float2 light;
uniform float k;
uniform float t;
${NOISE}
float hgt(float2 p) {
  return fbm(p * 0.006) * 0.7 + fbm(p * 0.03) * 0.25 + vnoise(p * 0.12) * 0.05;
}
half4 main(float2 p) {
  float e = 2.0;
  float hx = hgt(p + float2(e, 0.0)) - hgt(p - float2(e, 0.0));
  float hy = hgt(p + float2(0.0, e)) - hgt(p - float2(0.0, e));
  float3 n = normalize(float3(-hx * 60.0, -hy * 60.0, 1.0));
  float3 l = normalize(float3(light - p, 260.0));
  float diff = max(dot(n, l), 0.0);
  float dist = length(light - p);
  float fall = exp(-dist / 620.0);
  float flick = 0.9 + 0.1 * sin(t * 11.0) * sin(t * 6.3 + 1.0);
  float strata = smoothstep(0.45, 0.55, fbm(float2(p.x * 0.002, p.y * 0.012) + 5.0));
  float3 base = mix(float3(0.16, 0.1, 0.08), float3(0.3, 0.2, 0.15), hgt(p)) * (0.8 + 0.3 * strata);
  float fall2 = exp(-dist / 1100.0);
  float3 c = base * (0.22 + 1.5 * diff * fall2 * flick * k);
  c += float3(1.0, 0.45, 0.15) * diff * fall * 0.3 * k * flick;
  return half4(half3(c), 1.0);
}
`);
export const CaveWall: React.FC<{ light: [number, number]; t: number; k?: number }> = ({ light, t, k = 1 }) => (
  <Fill>
    <Shader source={ROCK} uniforms={{ size: [W, H], light, k, t }} />
  </Fill>
);

// ---------- 烟：一串慢慢变大、变淡的圆 ----------
export const Smoke: React.FC<{ x: number; y: number; t: number; n?: number; color?: string; spread?: number; rise?: number; seed?: number; opacity?: number }> = ({
  x,
  y,
  t,
  n = 18,
  color = "#b8b0c8",
  spread = 160,
  rise = 300,
  seed = 7,
  opacity = 1,
}) => {
  const r = rng(seed);
  return (
    <Group opacity={opacity}>
      {Array.from({ length: n }, (_, i) => {
        const life = 2.4 + r() * 1.6;
        const ph = r() * life;
        const dir = (r() - 0.5) * 2;
        const age = ((t + ph) % life) / life;
        const rad = 30 + age * 120;
        return (
          <Circle key={i} cx={x + dir * spread * age} cy={y - age * rise * (0.4 + r() * 0.6)} r={rad} color={color} opacity={(1 - age) * 0.35}>
            <BlurMask blur={rad * 0.5} style="normal" />
          </Circle>
        );
      })}
    </Group>
  );
};

// ---------- 城市天际线：一排圆顶和高塔，窗灯按时间一盏盏亮/灭 ----------
type Bldg = { x: number; w: number; h: number; dome: boolean; spire: boolean; wins: [number, number, number][] };
const skylineCache = new Map<string, Bldg[]>();
export const makeSkyline = (seed: number, x0: number, x1: number, minH: number, maxH: number) => {
  const key = `${seed}:${x0}:${x1}:${minH}:${maxH}`;
  const hit = skylineCache.get(key);
  if (hit) return hit;
  const r = rng(seed);
  const out: Bldg[] = [];
  let x = x0;
  while (x < x1) {
    const w = 40 + r() * 90;
    const h = minH + Math.pow(r(), 1.6) * (maxH - minH);
    const wins: [number, number, number][] = [];
    for (let wy = 18; wy < h - 14; wy += 18) for (let wx = 9; wx < w - 9; wx += 15) if (r() < 0.42) wins.push([wx, wy, r()]);
    out.push({ x, w, h, dome: r() < 0.3, spire: r() < 0.18, wins });
    x += w + 4 + r() * 18;
  }
  skylineCache.set(key, out);
  return out;
};

// grow 0..1：楼从地面长出来；lit 0..1：窗灯亮了多少（按每扇窗自己的阈值）；off 0..1：从上往下熄灭
export const Skyline: React.FC<{ seed: number; base: number; x0: number; x1: number; minH: number; maxH: number; grow?: number; lit?: number; off?: number; color?: string; window?: string; rim?: string }> = ({
  seed,
  base,
  x0,
  x1,
  minH,
  maxH,
  grow = 1,
  lit = 1,
  off = 0,
  color = "#120c22",
  window = "#ffcf7a",
  rim,
}) => {
  const list = makeSkyline(seed, x0, x1, minH, maxH);
  const body = Skia.Path.Make();
  const lights = Skia.Path.Make();
  list.forEach((b, i) => {
    const g = Math.min(1, Math.max(0, grow * 1.4 - (i % 7) * 0.06));
    const h = b.h * g;
    if (h < 2) return;
    body.addRect(Skia.XYWHRect(b.x, base - h, b.w, h));
    if (b.dome) body.addOval(Skia.XYWHRect(b.x, base - h - b.w * 0.45, b.w, b.w * 0.9));
    if (b.spire) {
      body.moveTo(b.x + b.w / 2 - 4, base - h);
      body.lineTo(b.x + b.w / 2, base - h - b.h * 0.5 * g);
      body.lineTo(b.x + b.w / 2 + 4, base - h);
      body.close();
    }
    b.wins.forEach(([wx, wy, k]) => {
      if (wy > h - 10) return;
      const on = k < lit && (1 - wy / b.h) * 0.8 + k * 0.2 > off;
      if (on) lights.addRect(Skia.XYWHRect(b.x + wx, base - wy - 6, 5, 7));
    });
  });
  return (
    <Group>
      <Path path={body} color={color} />
      {rim ? <Path path={body} style="stroke" strokeWidth={1.5} color={rim} opacity={0.35} /> : null}
      <Path path={lights} color={window} opacity={0.4}>
        <BlurMask blur={6} style="normal" />
      </Path>
      <Path path={lights} color={window} />
    </Group>
  );
};

// ---------- 星图网络：一片星点，文明一颗颗点亮、航线连起来 ----------
export type Net = { x: number; y: number; parent: number }[];
const netCache = new Map<number, Net>();
// 在一块区域里撒点，从 home 开始按「离已亮的最近」排出点亮顺序
export const makeNet = (seed: number, n: number, home: [number, number], box: [number, number, number, number]) => {
  const hit = netCache.get(seed);
  if (hit) return hit;
  const r = rng(seed);
  const pts: [number, number][] = [home];
  while (pts.length < n) {
    const x = box[0] + r() * box[2];
    const y = box[1] + r() * box[3];
    if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > 16)) pts.push([x, y]);
  }
  const lit = new Array(n).fill(false);
  const best = new Array(n).fill(Infinity);
  const par = new Array(n).fill(-1);
  const order: number[] = [];
  let cur = 0;
  for (let k = 0; k < n; k++) {
    lit[cur] = true;
    order.push(cur);
    for (let j = 0; j < n; j++) {
      if (lit[j]) continue;
      const d = Math.hypot(pts[j][0] - pts[cur][0], pts[j][1] - pts[cur][1]) * (0.8 + 0.4 * ((j * 7919) % 97) / 97);
      if (d < best[j]) {
        best[j] = d;
        par[j] = cur;
      }
    }
    let nb = -1;
    for (let j = 0; j < n; j++) if (!lit[j] && (nb < 0 || best[j] < best[nb])) nb = j;
    if (nb < 0) break;
    cur = nb;
  }
  const rank = new Array(n).fill(0);
  order.forEach((idx, k) => (rank[idx] = k));
  const net: Net = order.map((idx) => ({ x: pts[idx][0], y: pts[idx][1], parent: par[idx] >= 0 ? rank[par[idx]] : -1 }));
  netCache.set(seed, net);
  return net;
};

// count：点亮了几颗（可以是小数，最后一颗正在路上）；dim：熄灭（编号大的先灭，母星最后）0..1
export const NetMap: React.FC<{ net: Net; count: number; dim?: number; scale?: number; home?: number; dot?: number; within?: [number, number, number, number] }> = ({
  net,
  count,
  dim = 0,
  scale = 1,
  home = 1,
  dot = 1,
  within,
}) => {
  const routes = Skia.Path.Make();
  const ships: [number, number][] = [];
  const lights: { x: number; y: number; a: number; flash: number }[] = [];
  const n = net.length;
  net.forEach((s, i) => {
    if (within && Math.hypot((s.x - within[0]) / within[2], (s.y - within[1]) / within[3]) > 1) return;
    const on = Math.min(1, Math.max(0, count - i));
    // 熄灭：dim 从 0 到 1，编号大的先灭；母星最后
    const gone = i === 0 ? Math.min(1, Math.max(0, (dim - 0.97) / 0.03)) : Math.min(1, Math.max(0, dim * 1.08 * n - (n - i)) / (n * 0.04));
    const a = on * (1 - gone);
    if (i > 0 && s.parent >= 0 && on > 0) {
      const p = net[s.parent];
      const k = Math.min(1, on * 1.6);
      if (a > 0.02) {
        routes.moveTo(p.x, p.y);
        routes.lineTo(p.x + (s.x - p.x) * k, p.y + (s.y - p.y) * k);
      }
      if (on < 0.62) ships.push([p.x + (s.x - p.x) * k, p.y + (s.y - p.y) * k]);
    }
    if (on >= 0.62 && a > 0.01) lights.push({ x: s.x, y: s.y, a, flash: Math.max(0, 1 - (count - i - 0.62) * 2) });
  });
  return (
    <Group>
      <Path path={routes} style="stroke" strokeWidth={1.4 * scale} color="#ffb26b" opacity={0.45}>
        <BlurMask blur={1} style="normal" />
      </Path>
      {lights.map((l, i) => (
        <Group key={i} opacity={l.a}>
          <Circle cx={l.x} cy={l.y} r={(i === 0 ? 22 : 9) * scale * dot * (1 + l.flash)} color="#ff9a3c" opacity={0.45 * dot * (i === 0 ? home : 1)}>
            <BlurMask blur={(i === 0 ? 16 : 7) * scale * dot} style="normal" />
          </Circle>
          <Circle cx={l.x} cy={l.y} r={(i === 0 ? 4.5 : 2.4) * scale * Math.max(0.5, dot)} color="#fff0cc" />
        </Group>
      ))}
      {ships.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2.6 * scale} color="#ffffff">
          <BlurMask blur={2} style="normal" />
        </Circle>
      ))}
    </Group>
  );
};
