// Skia 的公用件：编译着色器、常用噪声、整片统一的后期（泛光、颗粒、暗角）、可复现的随机数
import { SkiaCanvas } from "@remotion/skia";
import { Blur, ColorMatrix, Fill, Group, Paint, RadialGradient, Rect, Shader, Skia, vec } from "@shopify/react-native-skia";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const W = 1920;
export const H = 1080;

export const effect = (source: string) => {
  const made = Skia.RuntimeEffect.Make(source);
  if (!made) throw new Error(`着色器编译失败：${source.slice(0, 120)}`);
  return made;
};

// SkSL 里通用的噪声：hash、值噪声、分形噪声、带扭曲的分形噪声
export const NOISE = `
float hash12(float2 p) {
  float3 p3 = fract(float3(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + float2(1.0, 0.0));
  float c = hash12(i + float2(0.0, 1.0));
  float d = hash12(i + float2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(float2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + float2(17.1, 9.7);
    a *= 0.5;
  }
  return s;
}
float warped(float2 p, float t) {
  float2 q = float2(fbm(p + float2(0.0, t * 0.05)), fbm(p + float2(5.2, 1.3) - t * 0.04));
  return fbm(p + 1.8 * q);
}
`;

export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const smooth = (a: number, b: number, x: number) => {
  const p = clamp01((x - a) / (b - a));
  return p * p * (3 - 2 * p);
};
// 弹一下：0→1，略冲过头再回来
export const pop = (a: number, dur: number, x: number) => {
  const p = clamp01((x - a) / dur);
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
};

const HASH = Array.from({ length: 256 }, (_, i) => rng(i * 7919 + 13)());
export const noise1 = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = HASH[((i % 256) + 256) % 256];
  const b = HASH[(((i + 1) % 256) + 256) % 256];
  return a + (b - a) * u;
};

// 泛光：亮的部分（阈值以上）模糊后再叠加回去
const bright = (threshold: number, gain: number) => {
  const k = gain / (1 - threshold);
  const o = -threshold * k;
  // 先按亮度取出亮部，再乘回颜色
  return [k, 0, 0, 0, o, 0, k, 0, 0, o, 0, 0, k, 0, o, 0, 0, 0, 1, 0];
};

export const Bloom: React.FC<{ children: React.ReactNode; radius?: number; strength?: number; threshold?: number }> = ({
  children,
  radius = 24,
  strength = 0.9,
  threshold = 0.55,
}) => (
  <>
    {children}
    <Group
      layer={
        <Paint blendMode="plus" opacity={strength}>
          <Blur blur={radius}>
            <ColorMatrix matrix={bright(threshold, 1.6)} />
          </Blur>
        </Paint>
      }
    >
      {children}
    </Group>
  </>
);

const GRAIN = effect(`
uniform float seed;
half4 main(float2 p) {
  float n = fract(sin(dot(floor(p / 1.5) + seed, float2(12.9898, 78.233))) * 43758.5453);
  return half4(half3(n), 1.0);
}
`);

// 整片的后期：颗粒（叠加混合）和暗角
export const Finish: React.FC<{ seed: number; grain?: number; vignette?: number }> = ({ seed, grain = 0.06, vignette = 0.55 }) => (
  <>
    <Fill blendMode="overlay" opacity={grain}>
      <Shader source={GRAIN} uniforms={{ seed: (seed % 97) * 3.17 }} />
    </Fill>
    <Rect x={0} y={0} width={W} height={H}>
      <RadialGradient c={vec(W / 2, H / 2)} r={W * 0.72} colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", `rgba(0,0,0,${vignette})`]} positions={[0, 0.55, 1]} />
    </Rect>
  </>
);

// 一个镜头的画布
export const Canvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SkiaCanvas width={W} height={H}>
    {children}
  </SkiaCanvas>
);

// 一个镜头：整屏画布，最后叠上颗粒和暗角
export const Shot: React.FC<{ children: React.ReactNode; grain?: number; vignette?: number }> = ({ children, grain, vignette }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas>
        {children}
        <Finish seed={frame} grain={grain} vignette={vignette} />
      </Canvas>
    </AbsoluteFill>
  );
};

// 给颜色乘个透明度
export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
