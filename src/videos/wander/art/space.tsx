// 宇宙里的东西：会流动的星云底、几层会闪的星、带泛光的旋涡星系、椭圆星系、光子
import { BlurMask, Circle, Fill, Group, Path, Points, Shader, Skia, vec } from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { H, NOISE, W, effect, rng } from "./sk";

// ---------- 星云底 ----------
const NEBULA = effect(`
uniform float2 size;
uniform float t;
uniform float2 cam;
uniform float zoom;
uniform float glow;
uniform float3 tintA;
uniform float3 tintB;
${NOISE}
half4 main(float2 p) {
  float2 q = (p - size * 0.5) / size.y / zoom + cam;
  float n = warped(q * 1.9, t);
  float n2 = warped(q * 1.3 + float2(7.3, 2.1), t * 0.7);
  float d = fbm(q * 6.0 + 3.0);
  float y = p.y / size.y;
  float3 c = mix(float3(0.018, 0.022, 0.065), float3(0.045, 0.03, 0.11), y);
  float m1 = smoothstep(0.42, 0.88, n);
  float m2 = smoothstep(0.48, 0.92, n2);
  c += tintA * m1 * 0.5 * glow;
  c += tintB * m2 * 0.32 * glow;
  c += float3(0.85, 0.32, 0.5) * pow(m1, 3.0) * 0.28 * glow;
  c *= 1.0 - 0.55 * smoothstep(0.55, 0.78, d) * (m1 + m2) * 0.8;
  float s = hash12(floor(p / 2.0) + floor(cam * 400.0));
  c += float3(0.85, 0.9, 1.0) * step(0.9986, s) * 0.55;
  return half4(half3(c), 1.0);
}
`);

export const Nebula: React.FC<{ t: number; cam?: [number, number]; zoom?: number; glow?: number; tintA?: [number, number, number]; tintB?: [number, number, number] }> = ({
  t,
  cam = [0, 0],
  zoom = 1,
  glow = 1,
  tintA = [0.42, 0.18, 0.7],
  tintB = [0.06, 0.48, 0.58],
}) => (
  <Fill>
    <Shader source={NEBULA} uniforms={{ size: [W, H], t, cam, zoom, glow, tintA, tintB }} />
  </Fill>
);

// ---------- 星 ----------
type Star = { x: number; y: number; m: number; tw: number; ph: number; c: string };
const STAR_COLORS = ["#eaf2ff", "#bcd4ff", "#ffe2c4", "#ffc4dc"];
const fieldCache = new Map<string, Star[]>();
const field = (seed: number, n: number) => {
  const key = `${seed}:${n}`;
  const hit = fieldCache.get(key);
  if (hit) return hit;
  const r = rng(seed);
  const list = Array.from({ length: n }, () => {
    const c = r();
    return { x: r() * W, y: r() * H, m: Math.pow(r(), 3.2), tw: 0.6 + r() * 2.4, ph: r() * 9, c: STAR_COLORS[c < 0.55 ? 0 : c < 0.8 ? 1 : c < 0.93 ? 2 : 3] };
  });
  fieldCache.set(key, list);
  return list;
};

// 一层星：平移 dx/dy（视差）、绕 (cx, cy) 缩放 zoom；暗星画成点，亮星带柔光和十字芒
export const StarLayer: React.FC<{ t: number; seed: number; n: number; dx?: number; dy?: number; zoom?: number; cx?: number; cy?: number; opacity?: number; spikes?: boolean }> = ({
  t,
  seed,
  n,
  dx = 0,
  dy = 0,
  zoom = 1,
  cx = W / 2,
  cy = H / 2,
  opacity = 1,
  spikes = true,
}) => {
  const list = field(seed, n);
  const bins: { x: number; y: number }[][] = [[], [], []];
  const bright: { x: number; y: number; m: number; a: number; c: string }[] = [];
  list.forEach((s) => {
    let x = (((s.x + dx) % W) + W) % W;
    let y = (((s.y + dy) % H) + H) % H;
    x = cx + (x - cx) * zoom;
    y = cy + (y - cy) * zoom;
    if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
    const a = 0.6 + 0.4 * Math.sin(t * s.tw + s.ph);
    if (s.m > 0.45) bright.push({ x, y, m: s.m, a, c: s.c });
    else bins[s.m > 0.12 ? 0 : s.m > 0.03 ? 1 : 2].push({ x, y });
  });
  const z = Math.min(2.5, Math.sqrt(zoom));
  return (
    <Group opacity={opacity}>
      {bins.map((pts, i) => (
        <Points key={i} points={pts.map((p) => vec(p.x, p.y))} mode="points" color={["#eef4ff", "#c9d8ff", "#9fb2e0"][i]} strokeWidth={[2.6, 1.8, 1.2][i] * z} strokeCap="round" opacity={[0.95, 0.75, 0.5][i]} />
      ))}
      {bright.map((s, i) => {
        const r = (1.6 + s.m * 3.2) * z;
        return (
          <Group key={i} opacity={s.a}>
            <Circle cx={s.x} cy={s.y} r={r * 4} color={s.c} opacity={0.35}>
              <BlurMask blur={r * 3} style="normal" />
            </Circle>
            {spikes ? (
              <Path
                path={`M${s.x - r * 7} ${s.y} L${s.x + r * 7} ${s.y} M${s.x} ${s.y - r * 7} L${s.x} ${s.y + r * 7}`}
                style="stroke"
                strokeWidth={r * 0.35}
                strokeCap="round"
                color={s.c}
                opacity={0.6}
              >
                <BlurMask blur={0.8} style="normal" />
              </Path>
            ) : null}
            <Circle cx={s.x} cy={s.y} r={r} color="#ffffff" />
          </Group>
        );
      })}
    </Group>
  );
};

// ---------- 旋涡星系 ----------
type GDot = { r: number; th: number; s: number; c: string; knot: boolean };
const gCache = new Map<number, GDot[]>();
const ARMS = 4.0;
const armTh = (rad: number, arm: number) => arm * Math.PI + ARMS * Math.log(1 + rad * 4);
const gDots = (seed: number) => {
  const hit = gCache.get(seed);
  if (hit) return hit;
  const r = rng(seed);
  const dots: GDot[] = [];
  for (let i = 0; i < 900; i++) {
    const rad = Math.pow(r(), 0.7);
    const inArm = r() < 0.8;
    const th = inArm ? armTh(rad, r() < 0.5 ? 0 : 1) + (r() - 0.5) * 0.5 * (1.15 - rad * 0.5) : r() * Math.PI * 2;
    const knot = inArm && r() < 0.05 && rad > 0.25;
    const c = r();
    dots.push({ r: rad, th, s: 0.6 + Math.pow(r(), 3) * 2.2, c: knot ? "#ffb3d6" : c < 0.6 ? "#cfe0ff" : c < 0.85 ? "#ffffff" : "#ffe0b8", knot });
  }
  gCache.set(seed, dots);
  return dots;
};

const spiral = (R: number, arm: number, spin: number, from = 0.05, to = 1) => {
  const p = Skia.Path.Make();
  for (let k = 0; k <= 60; k++) {
    const rad = from + ((to - from) * k) / 60;
    const th = armTh(rad, arm) + spin;
    const x = Math.cos(th) * rad * R;
    const y = Math.sin(th) * rad * R;
    if (k === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
};

// 半径 R 的旋涡星系；form 0→1 时星点从外面旋进来聚成形；cold 0→1 让整体从金黄变成冷白
export const SpiralGalaxy: React.FC<{ x: number; y: number; R: number; spin: number; tilt?: number; angle?: number; seed?: number; form?: number; opacity?: number; warmth?: number }> = ({
  x,
  y,
  R,
  spin,
  tilt = 0.5,
  angle = -20,
  seed = 3,
  form = 1,
  opacity = 1,
  warmth = 1,
}) => {
  const dots = gDots(seed);
  const bandA = useMemo(() => spiral(R, 0, 0), [R]);
  const bandB = useMemo(() => spiral(R, 1, 0), [R]);
  const dust = useMemo(() => spiral(R, 0.12, 0, 0.12, 0.85), [R]);
  const pts: { x: number; y: number }[][] = [[], [], [], []];
  const knots: { x: number; y: number; s: number }[] = [];
  dots.forEach((d, i) => {
    const gather = Math.min(1, Math.max(0, form * 1.35 - (i % 9) * 0.04));
    const th = d.th + (1 - gather) * 2.6;
    const rad = d.r * R * (1 + (1 - gather) * 1.4);
    const px = Math.cos(th) * rad;
    const py = Math.sin(th) * rad;
    if (d.knot) knots.push({ x: px, y: py, s: d.s });
    else pts[d.c === "#cfe0ff" ? 0 : d.c === "#ffffff" ? 1 : 2].push({ x: px, y: py });
  });
  const dotSize = Math.max(1.2, Math.min(4.5, R / 150));
  const core = warmth > 0.5 ? "#ffd99a" : "#e8f0ff";
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angle * Math.PI) / 180 }, { scaleY: tilt }]} opacity={opacity}>
      <Circle cx={0} cy={0} r={R * 1.05} color="#6a4fc0" opacity={0.18 * form}>
        <BlurMask blur={R * 0.5} style="normal" />
      </Circle>
      <Group transform={[{ rotate: spin }]}>
        {[bandA, bandB].map((b, i) => (
          <Group key={i} opacity={form}>
            <Path path={b} style="stroke" strokeWidth={R * 0.3} strokeCap="round" color="#8fb4ff" opacity={0.16}>
              <BlurMask blur={R * 0.12} style="normal" />
            </Path>
            <Path path={b} style="stroke" strokeWidth={R * 0.1} strokeCap="round" color="#dfe8ff" opacity={0.28}>
              <BlurMask blur={R * 0.04} style="normal" />
            </Path>
          </Group>
        ))}
        <Path path={dust} style="stroke" strokeWidth={R * 0.05} strokeCap="round" color="#120a24" opacity={0.45 * form}>
          <BlurMask blur={R * 0.02} style="normal" />
        </Path>
      </Group>
      <Group transform={[{ rotate: spin }]}>
        {pts.map((p, i) =>
          p.length ? <Points key={i} points={p.map((q) => vec(q.x, q.y))} mode="points" color={["#cfe0ff", "#ffffff", "#ffe0b8"][i]} strokeWidth={dotSize * [1, 0.8, 0.9][i]} strokeCap="round" opacity={0.85} /> : null,
        )}
        {knots.map((k, i) => (
          <Circle key={i} cx={k.x} cy={k.y} r={dotSize * 1.6} color="#ff9fcf" opacity={0.85}>
            <BlurMask blur={dotSize * 1.2} style="normal" />
          </Circle>
        ))}
      </Group>
      <Circle cx={0} cy={0} r={Math.min(R * 0.42, 260)} color={core} opacity={0.55 * form}>
        <BlurMask blur={Math.min(R * 0.3, 180)} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={Math.min(R * 0.14, 70)} color="#fff6e6" opacity={form}>
        <BlurMask blur={Math.min(R * 0.06, 30)} style="normal" />
      </Circle>
    </Group>
  );
};

// 椭圆星系：一团柔和的暖光
export const EllipticalGalaxy: React.FC<{ x: number; y: number; R: number; tilt?: number; angle?: number; opacity?: number; warm?: boolean }> = ({
  x,
  y,
  R,
  tilt = 0.6,
  angle = 0,
  opacity = 1,
  warm = true,
}) => (
  <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angle * Math.PI) / 180 }, { scaleY: tilt }]} opacity={opacity}>
    <Circle cx={0} cy={0} r={R} color={warm ? "#ffb870" : "#a9c4ff"} opacity={0.45}>
      <BlurMask blur={R * 0.6} style="normal" />
    </Circle>
    <Circle cx={0} cy={0} r={R * 0.3} color={warm ? "#ffe7c2" : "#eef3ff"}>
      <BlurMask blur={R * 0.2} style="normal" />
    </Circle>
  </Group>
);

// 光子：亮点拖着一条渐隐的尾巴，周围几粒闪光
export const Photon: React.FC<{ x: number; y: number; dir: number; len?: number; opacity?: number; t: number }> = ({ x, y, dir, len = 220, opacity = 1, t }) => {
  const dx = Math.cos(dir);
  const dy = Math.sin(dir);
  const sparks = Array.from({ length: 6 }, (_, i) => {
    const k = (t * 0.9 + i / 6) % 1;
    return { x: x - dx * len * k + Math.sin(i * 7 + t * 3) * 10 * k, y: y - dy * len * k + Math.cos(i * 5 + t * 2) * 10 * k, a: 1 - k };
  });
  return (
    <Group opacity={opacity}>
      <Path path={`M${x - dx * len} ${y - dy * len} L${x} ${y}`} style="stroke" strokeWidth={10} strokeCap="round" color="#ffe2a8" opacity={0.25}>
        <BlurMask blur={8} style="normal" />
      </Path>
      <Path path={`M${x - dx * len * 0.45} ${y - dy * len * 0.45} L${x} ${y}`} style="stroke" strokeWidth={4} strokeCap="round" color="#fff6e0" opacity={0.8}>
        <BlurMask blur={1.5} style="normal" />
      </Path>
      {sparks.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={2.2} color="#ffe9c0" opacity={s.a * 0.9} />
      ))}
      <Circle cx={x} cy={y} r={34} color="#ffc66b" opacity={0.5}>
        <BlurMask blur={22} style="normal" />
      </Circle>
      <Circle cx={x} cy={y} r={7} color="#ffffff">
        <BlurMask blur={2} style="normal" />
      </Circle>
    </Group>
  );
};
