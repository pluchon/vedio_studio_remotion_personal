// 恒星和行星：都用着色器画。恒星有米粒组织、临边昏暗、会动的日冕；行星是一颗被侧光照亮的球，
// 海、陆地、云都随着自转走，背光面可以亮起城市的灯，外面一圈大气
import { BlurMask, Circle, Group, Shader } from "@shopify/react-native-skia";
import React from "react";
import { NOISE, effect } from "./sk";

const SUN = effect(`
uniform float2 c;
uniform float R;
uniform float t;
${NOISE}
half4 main(float2 p) {
  float2 d = (p - c) / R;
  float r = length(d);
  float a = atan(d.y, d.x);
  // 日冕：一圈会流动的放射状光芒
  float rays = fbm(float2(a * 5.0, t * 0.25)) * 0.7 + fbm(float2(a * 13.0 + 3.0, t * 0.4)) * 0.4;
  float corona = exp(-(r - 1.0) * (3.2 - rays * 1.6)) * step(1.0, r);
  float3 col = float3(1.0, 0.72, 0.36) * corona * 0.9;
  if (r < 1.0) {
    float z = sqrt(1.0 - r * r);
    float gran = fbm(d * 9.0 + float2(t * 0.06, -t * 0.04));
    float limb = pow(z, 0.45);
    float3 surf = mix(float3(1.0, 0.62, 0.22), float3(1.0, 0.95, 0.78), limb);
    surf *= 0.86 + 0.24 * gran;
    col = surf;
    return half4(half3(col), 1.0);
  }
  float alpha = clamp(corona, 0.0, 1.0);
  return half4(half3(col), alpha);
}
`);

// 一颗恒星：半径 R，外面是日冕和一大团柔光
export const Sun: React.FC<{ x: number; y: number; R: number; t: number; opacity?: number }> = ({ x, y, R, t, opacity = 1 }) => (
  <Group opacity={opacity}>
    <Circle cx={x} cy={y} r={R * 5} color="#ff9a3c" opacity={0.28}>
      <BlurMask blur={R * 2.4} style="normal" />
    </Circle>
    <Circle cx={x} cy={y} r={R * 2.2} color="#ffd38a" opacity={0.45}>
      <BlurMask blur={R * 0.9} style="normal" />
    </Circle>
    <Circle cx={x} cy={y} r={R * 2.6}>
      <Shader source={SUN} uniforms={{ c: [x, y], R, t }} />
    </Circle>
  </Group>
);

const PLANET = effect(`
uniform float2 c;
uniform float R;
uniform float t;
uniform float rot;
uniform float3 light;
uniform float cities;
uniform float clouds;
uniform float3 sea;
uniform float3 land;
uniform float3 air;
uniform float dim;
${NOISE}
half4 main(float2 p) {
  float2 d = (p - c) / R;
  float r2 = dot(d, d);
  float3 L = normalize(light);
  if (r2 > 1.0) {
    // 大气的光晕：受光一侧亮
    float h = sqrt(r2);
    float2 dir = d / h;
    float lit = clamp(dot(float3(dir.x, -dir.y, 0.0), L) * 0.8 + 0.35, 0.0, 1.0);
    float a = exp(-(h - 1.0) * 22.0) * lit * 0.85 * dim;
    return half4(half3(air * a), a);
  }
  float z = sqrt(1.0 - r2);
  float3 n = float3(d.x, -d.y, z);
  float cr = cos(rot);
  float sr = sin(rot);
  float3 q = float3(n.x * cr + n.z * sr, n.y, -n.x * sr + n.z * cr);
  float2 uv = q.xy * 1.6 + q.zx * 1.2;
  float h = fbm(uv * 1.3 + 4.0);
  float isLand = smoothstep(0.5, 0.52, h);
  float coast = smoothstep(0.47, 0.5, h) * (1.0 - isLand);
  float ndl = dot(n, L);
  float day = smoothstep(-0.08, 0.35, ndl);
  float3 ground = mix(land * 0.8, land * 1.15, fbm(uv * 6.0));
  float3 col = mix(sea, ground, isLand);
  col = mix(col, sea * 1.5 + 0.05, coast * 0.6);
  // 云：随时间漂
  float cl = smoothstep(0.55, 0.75, fbm(uv * 2.2 + float2(t * 0.02, 0.0) + 9.0)) * clouds;
  col = mix(col, float3(0.95, 0.97, 1.0), cl * 0.85);
  // 海面的高光
  float3 hv = normalize(L + float3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, hv), 0.0), 60.0) * (1.0 - isLand) * (1.0 - cl);
  col = col * (0.06 + 0.94 * day) + float3(1.0, 0.95, 0.85) * spec * 0.6;
  // 背光面的城市：陆地上一格一格的小灯
  float night = 1.0 - smoothstep(-0.25, 0.08, ndl);
  float2 g = floor(uv * 34.0);
  float cell = hash12(g);
  float2 f = fract(uv * 34.0) - 0.5;
  float lamp = smoothstep(0.32, 0.0, length(f)) * step(1.0 - cities * 0.55, cell) * isLand;
  float haze = smoothstep(0.5, 0.56, h) * cities * 0.25;
  col += float3(1.0, 0.72, 0.35) * (lamp * 1.4 + haze) * night * (1.0 - cl * 0.7);
  // 边缘的大气
  float fres = pow(1.0 - z, 2.5);
  col += air * fres * (0.25 + 0.75 * day);
  return half4(half3(col * dim), 1.0);
}
`);

export type PlanetLook = { sea: [number, number, number]; land: [number, number, number]; air: [number, number, number] };
export const HOME_WORLD: PlanetLook = { sea: [0.06, 0.3, 0.42], land: [0.62, 0.46, 0.26], air: [0.45, 0.75, 1.0] };

// 一颗行星：light 是光照方向（屏幕坐标里 x 向右、y 向上、z 朝外），cities 0..1 夜面的灯
export const Planet: React.FC<{ x: number; y: number; R: number; t: number; rot: number; light: [number, number, number]; cities?: number; clouds?: number; look?: PlanetLook; dim?: number }> = ({
  x,
  y,
  R,
  t,
  rot,
  light,
  cities = 0,
  clouds = 1,
  look = HOME_WORLD,
  dim = 1,
}) => (
  <Circle cx={x} cy={y} r={R * 1.3}>
    <Shader source={PLANET} uniforms={{ c: [x, y], R, t, rot, light, cities, clouds, sea: look.sea, land: look.land, air: look.air, dim }} />
  </Circle>
);
