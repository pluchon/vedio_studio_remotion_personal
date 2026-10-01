// 银河系和本星系群：我们身在银河里，没有人从外面给它拍过照，这几个星系只能按测量结果重建——
// 位置、大小、倾角是真的，旋臂上的每一个光点是按统计规律撒出来的。每个点 7 个数：x y z 大小（千秒差距）r g b
import React, { useMemo } from "react";
import * as THREE from "three";
import { DIR_NGP, FOCAL, GALACTIC_CENTER, GALAXY_CENTER_POS, GAL_Y, KPC, LMC_POS, M31_POS, M33_POS, SMC_POS } from "../theme";

// 固定种子的随机数：每一帧、每个渲染进程撒出来的都是同一批点
const mulberry = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Spiral = {
  center: THREE.Vector3; // 米
  normal: THREE.Vector3; // 盘面的法线
  along: THREE.Vector3; // 盘面里的一个方向，棒沿着它转过 bar 弧度
  count: number;
  scale: number; // 相对银河系的大小
  arms: number;
  pitch: number; // 旋臂的螺距角（弧度）
  bar: number;
  seed: number;
};

const STRIDE = 7;

const spiral = (out: number[], g: Spiral) => {
  const rand = mulberry(g.seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const ez = g.normal.clone().normalize();
  const ex = g.along.clone().addScaledVector(ez, -g.along.dot(ez)).normalize();
  const ey = new THREE.Vector3().crossVectors(ez, ex);
  const c = g.center.clone().multiplyScalar(1 / KPC);
  const rMax = 17 * g.scale;
  const push = (x: number, y: number, z: number, size: number, r: number, gr: number, b: number) =>
    out.push(c.x + ex.x * x + ey.x * y + ez.x * z, c.y + ex.y * x + ey.y * y + ez.y * z, c.z + ex.z * x + ey.z * y + ez.z * z, size * g.scale, r, gr, b);

  for (let i = 0; i < g.count; i++) {
    const pick = rand();
    if (pick < 0.15) {
      // 核球和棒：一团偏黄的老年恒星
      const bx = gauss() * 1.9 * g.scale;
      const by = gauss() * 0.75 * g.scale;
      const k = 0.28 + 0.24 * rand();
      push(bx * Math.cos(g.bar) - by * Math.sin(g.bar), bx * Math.sin(g.bar) + by * Math.cos(g.bar), gauss() * 0.5 * g.scale, 0.26, 1.0 * k, 0.8 * k, 0.55 * k);
    } else if (pick < 0.4) {
      // 盘：越往外越稀
      const r = Math.min(-2.8 * g.scale * Math.log(1 - rand() * 0.997), rMax);
      const a = rand() * 2 * Math.PI;
      const k = 0.3 + 0.3 * rand();
      push(r * Math.cos(a), r * Math.sin(a), gauss() * 0.22 * g.scale, 0.32, 1.0 * k, 0.88 * k, 0.72 * k);
    } else {
      // 旋臂：对数螺线，年轻的蓝白色恒星，夹着零星发红的星云
      const r = Math.min(3 * g.scale - 4.4 * g.scale * Math.log(1 - rand() * 0.96), rMax);
      const arm = Math.floor(rand() * g.arms);
      const a = (arm * 2 * Math.PI) / g.arms + g.bar + Math.log(r / (3 * g.scale)) / Math.tan(g.pitch) + gauss() * (0.13 + 0.25 * rand() * rand());
      const pink = rand() < 0.06;
      const k = pink ? 1.25 : 0.45 + 0.5 * rand();
      push(r * Math.cos(a), r * Math.sin(a), gauss() * 0.12 * g.scale, pink ? 0.34 : 0.2, (pink ? 1.0 : 0.68) * k, (pink ? 0.42 : 0.82) * k, (pink ? 0.55 : 1.0) * k);
    }
  }
};

// 不规则的矮星系：一团偏蓝的点
const blob = (out: number[], center: THREE.Vector3, sigma: [number, number, number], count: number, seed: number) => {
  const rand = mulberry(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const c = center.clone().multiplyScalar(1 / KPC);
  for (let i = 0; i < count; i++) {
    const k = 0.4 + 0.5 * rand();
    out.push(c.x + gauss() * sigma[0], c.y + gauss() * sigma[1], c.z + gauss() * sigma[2], 0.2, 0.75 * k, 0.85 * k, 1.0 * k);
  }
};

// 一个朝我们倾斜 incline 度的盘面的法线：视线方向转过去 incline 度
const tilted = (center: THREE.Vector3, incline: number, twist: number) => {
  const los = center.clone().normalize();
  const side = new THREE.Vector3().crossVectors(los, DIR_NGP).normalize();
  const other = new THREE.Vector3().crossVectors(los, side);
  const a = (incline * Math.PI) / 180;
  const b = (twist * Math.PI) / 180;
  return los
    .clone()
    .multiplyScalar(Math.cos(a))
    .addScaledVector(side, Math.sin(a) * Math.cos(b))
    .addScaledVector(other, Math.sin(a) * Math.sin(b));
};

let built: Float32Array | null = null;
const build = () => {
  if (built) return built;
  const out: number[] = [];
  // 银河系：四条主旋臂，螺距角十二三度，中间一根朝我们偏开二十多度的棒
  spiral(out, { center: GALAXY_CENTER_POS, normal: DIR_NGP, along: GALACTIC_CENTER, count: 210000, scale: 1, arms: 4, pitch: 0.225, bar: 0.47 + Math.PI, seed: 11 });
  // 仙女座星系：比银河系大，盘面几乎侧对着我们（倾角 77°）
  spiral(out, { center: M31_POS, normal: tilted(M31_POS, 77, 38), along: GAL_Y, count: 170000, scale: 1.35, arms: 2, pitch: 0.17, bar: 0.6, seed: 23 });
  // 三角座星系：小得多，旋臂松散
  spiral(out, { center: M33_POS, normal: tilted(M33_POS, 55, 23), along: GAL_Y, count: 40000, scale: 0.5, arms: 2, pitch: 0.42, bar: 1.4, seed: 37 });
  blob(out, LMC_POS, [2.3, 1.3, 0.8], 16000, 41);
  blob(out, SMC_POS, [1.4, 0.8, 0.7], 7000, 43);
  built = new Float32Array(out);
  return built;
};

// 太远的点压到这个距离上画，只保留方向，免得被远裁剪面切掉
const LIMIT = "4.0e5";

const VERTEX = /* glsl */ `
  attribute float size;
  attribute vec3 tint;
  uniform vec3 eye;   // 镜头位置，千秒差距
  uniform float unit; // 一个渲染单位合多少千秒差距
  uniform float gain;
  varying vec3 vColor;
  void main() {
    vec3 rel = position - eye;
    float d = max(length(rel), 1e-6);
    float px = size / d * ${FOCAL.toFixed(1)};
    gl_PointSize = clamp(px, 1.2, 34.0);
    // 小到不足一个像素时，亮度按面积折算；贴着镜头的大光斑淡掉，免得糊住画面
    float flux = min(1.0, px * px / 1.44);
    float close = smoothstep(1.0, 8.0, d);
    vColor = tint * gain * flux * close;
    vec3 dir = mat3(viewMatrix) * (rel / d);
    gl_Position = projectionMatrix * vec4(dir * min(d / unit, ${LIMIT}), 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor * exp(-r * r * 11.0) * smoothstep(0.5, 0.3, r), 1.0);
  }
`;

export const Island: React.FC<{ eye: THREE.Vector3; metersPerUnit: number; gain: number }> = ({ eye, metersPerUnit, gain }) => {
  const geometry = useMemo(() => {
    const buffer = new THREE.InterleavedBuffer(build(), STRIDE);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.InterleavedBufferAttribute(buffer, 3, 0));
    g.setAttribute("size", new THREE.InterleavedBufferAttribute(buffer, 1, 3));
    g.setAttribute("tint", new THREE.InterleavedBufferAttribute(buffer, 3, 4));
    return g;
  }, []);
  if (gain <= 0) return null;
  const uniforms = { eye: { value: eye.clone().multiplyScalar(1 / KPC) }, unit: { value: metersPerUnit / KPC }, gain: { value: gain } };
  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};
