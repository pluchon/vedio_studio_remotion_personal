// 几套常用的参数：行星的配色和大气、恒星
import type { Uniforms } from "./gl/engine";
import type { V3 } from "./shot";

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

// 像地球的海洋行星（大气厚度放大了几倍，好看见边缘那一圈蓝）
export const EARTHLIKE: Uniforms = {
  uSeed: 3.1,
  uSea: 0.53,
  uOcean: [0.003, 0.014, 0.036],
  uLandA: [0.035, 0.06, 0.025],
  uLandB: [0.24, 0.18, 0.11],
  uIceC: [0.75, 0.8, 0.86],
  uIce: 0.8,
  uDesert: 0.6,
  uBetaR: [6.2, 14.4, 35.5],
  uBetaM: 14,
  uAtm: 0.6,
  uCloud: 0.55,
  uLightCol: [1.0, 0.52, 0.17],
  uLava: 0,
  uLastCity: norm([0.35, 0.3, 0.88]),
};

export const sunDir = (v: V3) => norm(v);

// 站在地面：太阳的方位（朝 -z 是海的方向）和高度（度）
export const sunAt = (azDeg: number, elDeg: number): V3 => {
  const a = (azDeg * Math.PI) / 180;
  const e = (elDeg * Math.PI) / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
};

// 夜空里银河的摆法：银心低低地挂在海面左边，银河斜着升上去
const GC = norm([-0.55, 0.22, -0.8]);
const GP0: V3 = [0.75, 0.55, -0.35];
const dotv = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const GP = norm([GP0[0] - GC[0] * dotv(GP0, GC), GP0[1] - GC[1] * dotv(GP0, GC), GP0[2] - GC[2] * dotv(GP0, GC)]);
export const GALAXY_SKY: Uniforms = { uGalCenter: GC, uGalPole: GP };
