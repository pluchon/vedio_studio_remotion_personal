// 地上和水里的东西：水下（焦散、光柱）、黄昏的天和海（云、太阳在海面的倒影）、夜空和银河、
// 有光泽的分子、会分裂的细胞、气泡、浮游的微粒、岩石和山的剪影
import { BlurMask, Circle, Fill, Group, Path, RadialGradient, Shader, Skia, SweepGradient, vec } from "@shopify/react-native-skia";
import React from "react";
import { H, NOISE, W, effect, rng } from "./sk";

// ---------- 水下 ----------
const UNDERWATER = effect(`
uniform float2 size;
uniform float t;
uniform float depth;
${NOISE}
half4 main(float2 p) {
  float y = p.y / size.y;
  float3 top = float3(0.06, 0.4, 0.5);
  float3 mid = float3(0.03, 0.17, 0.32);
  float3 bot = float3(0.01, 0.045, 0.11);
  float3 c = mix(top, mid, smoothstep(0.0, 0.55, y));
  c = mix(c, bot, smoothstep(0.45, 1.0, y));
  c = mix(c, bot, depth * 0.55);
  float2 q = p / size.y;
  float n1 = fbm(q * 3.4 + float2(t * 0.12, t * 0.05));
  float n2 = fbm(q * 4.2 + float2(-t * 0.1, t * 0.07) + 5.0);
  float caust = pow(clamp(1.0 - abs(n1 - n2) * 2.2, 0.0, 1.0), 4.0);
  c += float3(0.4, 0.85, 0.9) * caust * 0.12 * pow(1.0 - y, 2.0) * (1.0 - depth * 0.7);
  float x = (p.x + p.y * 0.38) / size.y;
  float sh = fbm(float2(x * 5.0, t * 0.07));
  sh = pow(smoothstep(0.42, 0.86, sh), 2.0);
  c += float3(0.55, 0.88, 0.95) * sh * 0.2 * (1.0 - y * 0.85) * (1.0 - depth * 0.6);
  float m = hash12(floor(p / 3.0));
  c += float3(0.6, 0.9, 1.0) * step(0.9992, m) * 0.3;
  return half4(half3(c), 1.0);
}
`);
export const Underwater: React.FC<{ t: number; depth?: number }> = ({ t, depth = 0 }) => (
  <Fill>
    <Shader source={UNDERWATER} uniforms={{ size: [W, H], t, depth }} />
  </Fill>
);

// ---------- 黄昏的天和海 ----------
const DUSK = effect(`
uniform float2 size;
uniform float t;
uniform float2 sun;
uniform float horizon;
uniform float night;
${NOISE}
half4 main(float2 p) {
  float3 c;
  float d = distance(p, sun) / size.y;
  if (p.y < horizon) {
    float h = clamp((horizon - p.y) / horizon, 0.0, 1.0);
    float3 zen = mix(float3(0.16, 0.13, 0.36), float3(0.02, 0.03, 0.09), night);
    float3 mid = mix(float3(0.62, 0.3, 0.5), float3(0.06, 0.06, 0.16), night);
    float3 hor = mix(float3(1.0, 0.58, 0.34), float3(0.16, 0.12, 0.24), night);
    c = mix(hor, mid, smoothstep(0.0, 0.35, h));
    c = mix(c, zen, smoothstep(0.3, 1.0, h));
    float cl = fbm(float2(p.x / size.y * 1.4 + t * 0.012, p.y / size.y * 5.5));
    float band = smoothstep(0.15, 0.55, h) * (1.0 - smoothstep(0.6, 0.95, h));
    float cloud = smoothstep(0.52, 0.72, cl) * band;
    float3 lit = mix(float3(1.0, 0.62, 0.52), float3(0.18, 0.14, 0.26), night);
    float3 shadow = mix(float3(0.42, 0.22, 0.42), float3(0.04, 0.04, 0.1), night);
    c = mix(c, mix(shadow, lit, smoothstep(0.2, 0.9, 1.0 - h + 0.3 * (1.0 - d))), cloud * 0.85);
    c += float3(1.0, 0.7, 0.4) * exp(-d * 5.0) * 0.55 * (1.0 - night);
  } else {
    float k = clamp((p.y - horizon) / (size.y - horizon), 0.0, 1.0);
    c = mix(mix(float3(0.42, 0.24, 0.36), float3(0.06, 0.05, 0.12), night), mix(float3(0.05, 0.06, 0.16), float3(0.01, 0.015, 0.04), night), pow(k, 0.6));
    float spread = 40.0 + k * 260.0;
    float col = exp(-pow((p.x - sun.x) / spread, 2.0));
    float sh = vnoise(float2(p.x * 0.03, p.y * 0.22 - t * 1.4)) * vnoise(float2(p.x * 0.011 + 3.0, p.y * 0.09 + t * 0.6));
    c += float3(1.0, 0.72, 0.42) * col * smoothstep(0.18, 0.45, sh) * 1.2 * (1.0 - night);
    float w = vnoise(float2(p.x * 0.004 + t * 0.05, p.y * 0.08));
    c += float3(0.9, 0.6, 0.6) * smoothstep(0.6, 0.9, w) * 0.05 * (1.0 - k) * (1.0 - night);
  }
  return half4(half3(c), 1.0);
}
`);
export const DuskWorld: React.FC<{ t: number; sun: [number, number]; horizon: number; night?: number }> = ({ t, sun, horizon, night = 0 }) => (
  <Fill>
    <Shader source={DUSK} uniforms={{ size: [W, H], t, sun, horizon, night }} />
  </Fill>
);

// ---------- 夜空和银河 ----------
const MILKY = effect(`
uniform float2 size;
uniform float t;
uniform float2 offset;
uniform float angle;
uniform float amount;
${NOISE}
half4 main(float2 p) {
  float2 q = p + offset;
  float ca = cos(angle);
  float sa = sin(angle);
  float2 r = float2(q.x * ca - q.y * sa, q.x * sa + q.y * ca) - float2(size.x * 0.5 * ca, size.x * 0.5 * sa);
  float wob = fbm(float2(r.x * 0.0016, 2.0)) * 220.0 - 110.0;
  float y = r.y - wob - size.y * 0.1;
  float w = 150.0 + fbm(float2(r.x * 0.003, 7.0)) * 120.0;
  float band = exp(-y * y / (2.0 * w * w));
  float2 u = r / size.y;
  float cloud = warped(u * 3.0, t * 0.3);
  float dust = smoothstep(0.52, 0.7, fbm(u * 7.0 + 11.0)) * smoothstep(0.0, 0.7, band);
  float3 c = mix(float3(0.01, 0.014, 0.04), float3(0.025, 0.03, 0.08), clamp(p.y / size.y, 0.0, 1.0));
  float3 glow = mix(float3(0.45, 0.5, 0.8), float3(0.95, 0.78, 0.6), exp(-pow(r.x / (size.x * 0.25), 2.0)));
  c += glow * band * (0.12 + 0.35 * cloud) * (1.0 - dust * 0.85) * amount;
  float2 g = floor(p / 3.0);
  float s = hash12(g + floor(offset / 3.0));
  c += float3(0.85, 0.9, 1.0) * step(1.0 - (0.004 + 0.03 * band * (1.0 - dust)) * amount, s) * 0.7;
  return half4(half3(c), 1.0);
}
`);
export const MilkyWay: React.FC<{ t: number; offset?: [number, number]; angle?: number; amount?: number }> = ({ t, offset = [0, 0], angle = -0.42, amount = 1 }) => (
  <Fill>
    <Shader source={MILKY} uniforms={{ size: [W, H], t, offset, angle, amount }} />
  </Fill>
);

// ---------- 小东西 ----------
// 有光泽的小球（分子）
export const Ball: React.FC<{ x: number; y: number; r: number; color: string; opacity?: number }> = ({ x, y, r, color, opacity = 1 }) => (
  <Group opacity={opacity}>
    <Circle cx={x} cy={y} r={r * 2.2} color={color} opacity={0.22}>
      <BlurMask blur={r * 1.4} style="normal" />
    </Circle>
    <Circle cx={x} cy={y} r={r}>
      <RadialGradient c={vec(x - r * 0.35, y - r * 0.4)} r={r * 1.4} colors={["#ffffff", color, "#0b1830"]} positions={[0, 0.35, 1]} />
    </Circle>
    <Circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.22} color="#ffffff" opacity={0.85} />
  </Group>
);

// 细胞膜：一圈彩虹色的薄膜，里面半透明
export const Membrane: React.FC<{ x: number; y: number; rx: number; ry: number; t: number; opacity?: number }> = ({ x, y, rx, ry, t, opacity = 1 }) => {
  const p = Skia.Path.Make();
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 1 + 0.025 * Math.sin(a * 5 + t * 2.2) + 0.02 * Math.sin(a * 3 - t * 1.4);
    const px = x + Math.cos(a) * rx * wob;
    const py = y + Math.sin(a) * ry * wob;
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
  p.close();
  return (
    <Group opacity={opacity}>
      <Path path={p} color="#7fe8d0" opacity={0.1} />
      <Path path={p} style="stroke" strokeWidth={14} color="#9ff0e0" opacity={0.25}>
        <BlurMask blur={10} style="normal" />
      </Path>
      <Path path={p} style="stroke" strokeWidth={4}>
        <SweepGradient c={vec(x, y)} colors={["#9ff0e0", "#ffd2f0", "#a8c8ff", "#fff1b8", "#9ff0e0"]} />
      </Path>
    </Group>
  );
};

// 气泡：慢慢往上，左右轻轻晃
export const Bubbles: React.FC<{ t: number; seed: number; n: number; speed?: number; opacity?: number }> = ({ t, seed, n, speed = 1, opacity = 1 }) => {
  const r = rng(seed);
  const list = Array.from({ length: n }, () => ({ x: r() * W, s: 3 + Math.pow(r(), 2) * 14, v: 30 + r() * 70, o: r() * H, ph: r() * 9 }));
  return (
    <Group opacity={opacity}>
      {list.map((b, i) => {
        const y = H + 40 - ((t * b.v * speed + b.o) % (H + 80));
        const x = b.x + Math.sin(t * 1.6 + b.ph) * 10;
        return (
          <Group key={i}>
            <Circle cx={x} cy={y} r={b.s} style="stroke" strokeWidth={1.6} color="#c8f4ff" opacity={0.45} />
            <Circle cx={x - b.s * 0.35} cy={y - b.s * 0.35} r={b.s * 0.25} color="#ffffff" opacity={0.6} />
          </Group>
        );
      })}
    </Group>
  );
};

// 浮游的微粒/尘埃：带一点景深模糊的光点
export const Motes: React.FC<{ t: number; seed: number; n: number; color?: string; size?: number; blur?: number; drift?: [number, number]; opacity?: number }> = ({
  t,
  seed,
  n,
  color = "#d8f4ff",
  size = 3,
  blur = 2,
  drift = [6, -10],
  opacity = 1,
}) => {
  const r = rng(seed);
  const list = Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, s: size * (0.5 + r()), ph: r() * 9, a: 0.3 + r() * 0.7 }));
  return (
    <Group opacity={opacity}>
      {list.map((m, i) => {
        const x = (((m.x + t * drift[0] + Math.sin(t * 0.7 + m.ph) * 14) % W) + W) % W;
        const y = (((m.y + t * drift[1] + Math.cos(t * 0.6 + m.ph) * 10) % H) + H) % H;
        return (
          <Circle key={i} cx={x} cy={y} r={m.s} color={color} opacity={m.a * (0.6 + 0.4 * Math.sin(t * 2 + m.ph))}>
            <BlurMask blur={blur} style="normal" />
          </Circle>
        );
      })}
    </Group>
  );
};

// 一条起伏的剪影（山、岩石、岸）：上沿带一线受光
export const Ridge: React.FC<{ pts: [number, number][]; color: string; rim?: string; rimWidth?: number; bottom?: number }> = ({ pts, color, rim, rimWidth = 3, bottom = H + 10 }) => {
  const p = Skia.Path.Make();
  p.moveTo(pts[0][0], bottom);
  pts.forEach(([x, y]) => p.lineTo(x, y));
  p.lineTo(pts[pts.length - 1][0], bottom);
  p.close();
  const top = Skia.Path.Make();
  pts.forEach(([x, y], i) => (i ? top.lineTo(x, y) : top.moveTo(x, y)));
  return (
    <Group>
      <Path path={p} color={color} />
      {rim ? (
        <Path path={top} style="stroke" strokeWidth={rimWidth} color={rim} opacity={0.8}>
          <BlurMask blur={1.5} style="normal" />
        </Path>
      ) : null}
    </Group>
  );
};

// 用一维噪声生成一条起伏线
export const ridgeLine = (x0: number, x1: number, base: number, amp: number, seed: number, step = 24): [number, number][] => {
  const r = rng(seed);
  const ph = r() * 100;
  const out: [number, number][] = [];
  for (let x = x0; x <= x1; x += step) {
    const n = Math.sin(x * 0.004 + ph) * 0.5 + Math.sin(x * 0.011 + ph * 2) * 0.3 + Math.sin(x * 0.029 + ph * 3) * 0.2;
    out.push([x, base - n * amp]);
  }
  return out;
};
