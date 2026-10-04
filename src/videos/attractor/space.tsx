// 三维的基础件：画布、镜头、银道坐标、天球、地球、星系点云。
// 坐标约定：银道直角坐标 x 朝银心、y 朝 l=90°、z 朝银北极；进 three 时换成 (x, z, −y)，Y 朝上
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HEIGHT, RENDER_SCALE, WIDTH } from "./theme";
import type { V3 } from "./time";

export const gal = (x: number, y: number, z: number): V3 => [x, z, -y];
export const rad = (deg: number) => (deg * Math.PI) / 180;
// 银道坐标（度）→ 单位方向，已换成 three 的坐标
export const dir = (l: number, b: number): V3 => gal(Math.cos(rad(b)) * Math.cos(rad(l)), Math.cos(rad(b)) * Math.sin(rad(l)), Math.sin(rad(b)));

// 画布：按半分辨率渲，再放大到 1920×1080
export const Canvas: React.FC<{ children: React.ReactNode; scale?: number }> = ({ children, scale = RENDER_SCALE }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH * scale, height: HEIGHT * scale, transform: `scale(${1 / scale})`, transformOrigin: "0 0" }}>
    <ThreeCanvas width={WIDTH * scale} height={HEIGHT * scale}>
      {children}
    </ThreeCanvas>
  </div>
);

export const Rig: React.FC<{ pos: V3; look: V3; fov: number; up?: V3; far?: number }> = ({ pos, look, fov, up = [0, 1, 0], far = 4000 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.up.set(...up);
    camera.lookAt(...look);
    camera.fov = fov;
    camera.near = 0.001;
    camera.far = far;
    camera.updateProjectionMatrix();
  }, [camera, pos, look, fov, up, far]);
  return null;
};

// 把一个三维点投到屏幕上（1920×1080 的像素坐标），给标签定位用；第三个数是深度，负的在镜头背后
export const project = (p: V3, cam: V3, look: V3, fov: number, up: V3 = [0, 1, 0]): [number, number, number] => {
  const f = new THREE.Vector3(...look).sub(new THREE.Vector3(...cam)).normalize();
  const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(...up)).normalize();
  const u = new THREE.Vector3().crossVectors(r, f);
  const v = new THREE.Vector3(...p).sub(new THREE.Vector3(...cam));
  const z = v.dot(f);
  const half = Math.tan((fov * Math.PI) / 360);
  const x = v.dot(r) / (z * half * (WIDTH / HEIGHT));
  const y = v.dot(u) / (z * half);
  return [(x * 0.5 + 0.5) * WIDTH, (1 - (y * 0.5 + 0.5)) * HEIGHT, z];
};

// ---------------------------------------------------------------- 伪随机
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

// ---------------------------------------------------------------- 天球：银河贴图 + 随机的星
const SKY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position.z = gl_Position.w;
  }
`;

// 方向 → 银道坐标 (l, b)：three 里的 (x, y, z) 对应银道的 (x, −z, y)
const SKY_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float gain;
  uniform float spin;
  varying vec3 vDir;
  const float PI = 3.14159265;
  void main() {
    vec3 d = normalize(vDir);
    float l = atan(-d.z, d.x) + spin;
    float b = asin(clamp(d.y, -1.0, 1.0));
    vec2 uv = vec2(0.5 - l / (2.0 * PI), 0.5 + b / PI);
    vec3 c = texture2D(map, uv).rgb;
    gl_FragColor = vec4(c * gain, 1.0);
    #include <colorspace_fragment>
  }
`;

export const SkyMap: React.FC<{ map: THREE.Texture; gain?: number; spin?: number }> = ({ map, gain = 3, spin = 0 }) => (
  <mesh renderOrder={-10} frustumCulled={false}>
    <sphereGeometry args={[1, 64, 32]} />
    <shaderMaterial vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} uniforms={{ map: { value: map }, gain: { value: gain }, spin: { value: spin } }} side={THREE.BackSide} depthWrite={false} depthTest={false} />
  </mesh>
);

// 随机的星：数量按银纬聚集，亮度服从幂律；只是背景，不代表任何星表
const makeStarField = (n: number, seed: number) => {
  const r = rng(seed);
  const position = new Float32Array(n * 3);
  const color = new Float32Array(n * 3);
  const size = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let b: number;
    // 一半的星贴着银道面
    if (r() < 0.5) b = (r() + r() + r() - 1.5) * 0.5;
    else b = Math.asin(2 * r() - 1);
    const l = r() * Math.PI * 2;
    const v = dir((l * 180) / Math.PI, (b * 180) / Math.PI);
    position.set(v, i * 3);
    const mag = Math.pow(r(), 3.2);
    const warm = r();
    color.set([0.78 + 0.22 * warm, 0.86 + 0.06 * warm, 1 - 0.28 * warm], i * 3);
    size[i] = 1.1 + mag * 3.2;
  }
  return { position, color, size };
};

const STAR_VERTEX = /* glsl */ `
  attribute vec3 color;
  attribute float size;
  uniform float px;
  uniform float time;
  varying vec3 vColor;
  void main() {
    vColor = color * (0.82 + 0.18 * sin(time * (0.6 + size * 0.7) + position.x * 91.0 + position.z * 57.0));
    gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position.z = gl_Position.w * 0.9999;
    gl_PointSize = max(1.0, size * px);
  }
`;
const STAR_FRAGMENT = /* glsl */ `
  uniform float alpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a * a * alpha, 1.0);
  }
`;

let stars: ReturnType<typeof makeStarField> | null = null;
export const StarField: React.FC<{ alpha?: number; time?: number }> = ({ alpha = 1, time = 0 }) => {
  const geometry = useMemo(() => {
    const s = (stars ??= makeStarField(9000, 21));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(s.position, 3));
    g.setAttribute("color", new THREE.BufferAttribute(s.color, 3));
    g.setAttribute("size", new THREE.BufferAttribute(s.size, 1));
    return g;
  }, []);
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={-9}>
      <shaderMaterial vertexShader={STAR_VERTEX} fragmentShader={STAR_FRAGMENT} uniforms={{ px: { value: RENDER_SCALE * 2 }, time: { value: time }, alpha: { value: alpha } }} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// ---------------------------------------------------------------- 地球：白天、夜晚的灯、一圈薄薄的大气
const EARTH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sun;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float lit = dot(normalize(vNormal), sun);
    float day = smoothstep(-0.12, 0.22, lit);
    vec3 d = texture2D(dayMap, vUv).rgb * (0.04 + 0.96 * max(lit, 0.0));
    vec3 n = texture2D(nightMap, vUv).rgb * 1.5;
    vec3 c = mix(n, d, day) + vec3(0.04, 0.07, 0.14) * 0.05;
    // 边缘的大气：背着太阳的一侧只剩一点蓝
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 3.0);
    c += vec3(0.28, 0.5, 1.0) * rim * (0.12 + 0.85 * smoothstep(-0.3, 0.4, lit));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;
const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 sun;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(max(dot(normalize(vNormal), normalize(vView)), 0.0), 3.5);
    float lit = dot(normalize(vNormal), sun);
    gl_FragColor = vec4(vec3(0.3, 0.55, 1.0) * f * (0.1 + 0.9 * smoothstep(-0.4, 0.5, lit)), 1.0);
  }
`;

export const Earth: React.FC<{ day: THREE.Texture; night: THREE.Texture; sun: V3; spin?: number }> = ({ day, night, sun, spin = 0 }) => {
  const s = new THREE.Vector3(...sun).normalize();
  const sunUniform = { value: s };
  return (
    <>
      <mesh rotation={[0, spin, 0]}>
        <sphereGeometry args={[1, 96, 48]} />
        <shaderMaterial vertexShader={EARTH_VERTEX} fragmentShader={EARTH_FRAGMENT} uniforms={{ dayMap: { value: day }, nightMap: { value: night }, sun: sunUniform }} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.045, 64, 32]} />
        <shaderMaterial vertexShader={EARTH_VERTEX} fragmentShader={HALO_FRAGMENT} uniforms={{ sun: sunUniform }} side={THREE.BackSide} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
};

// ---------------------------------------------------------------- 星系点云（2MRS、Cosmicflows-4）
// 2MRS：每个 4 个数 (x y z K星等)，CF4：每个 5 个数 (x y z Vpec Dist)，位置是银道直角坐标，单位 Mpc
const POINT_VERTEX = /* glsl */ `
  attribute float aval;
  uniform float px;
  uniform float unit;     // 一个 Mpc 合多少 three 单位
  uniform float mode;     // 0: 2MRS 按距离上色；1: CF4 按特殊速度上色；2: 单色
  uniform float gain;
  uniform float zone;     // 隐匿带的高亮程度
  uniform float expand;   // 哈勃流：所有点按同一个比例向外
  uniform float flow;     // 特殊速度：沿视线方向多走的 Mpc / (km/s)
  uniform vec3 focusAt;   // 聚焦的球心（three 坐标，Mpc）
  uniform float focusR;   // 聚焦半径（Mpc）；0 表示不聚焦
  uniform float focusDim; // 球外压暗多少 0–1
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 gp = vec3(position.x, -position.z, position.y); // 回到银道坐标
    float dist = length(gp);
    vec3 p = position * expand;
    vec3 c;
    float a = 1.0;
    if (mode > 1.5) {
      c = vec3(0.7, 0.82, 1.0);
      a = 0.5;
    } else if (mode < 0.5) {
      float t = clamp(dist / 260.0, 0.0, 1.0);
      c = mix(vec3(0.75, 0.88, 1.0), vec3(1.0, 0.72, 0.45), t);
      a = 0.75 * pow(1.0 - clamp((aval - 4.0) / 8.5, 0.0, 1.0), 1.6) + 0.2;
    } else {
      float v = aval;
      c = v > 0.0 ? vec3(1.0, 0.72, 0.4) : vec3(0.45, 0.72, 1.0);
      a = 0.35 + 0.65 * clamp(abs(v) / 700.0, 0.0, 1.0);
      p += normalize(position) * v * flow;
    }
    float b = asin(clamp(gp.z / max(dist, 1e-4), -1.0, 1.0));
    float inZone = 1.0 - smoothstep(0.1, 0.2, abs(b));
    c = mix(c, vec3(1.0, 0.38, 0.32), zone * inZone);
    a *= 1.0 + zone * inZone * 1.2;
    if (focusR > 0.0) {
      float inside = 1.0 - smoothstep(focusR * 0.96, focusR * 1.04, length(position - focusAt));
      a *= mix(1.0 - focusDim, 1.0, inside);
    }
    vColor = c * gain;
    vAlpha = a;
    vec4 mv = modelViewMatrix * vec4(p * unit, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, px);
  }
`;
const POINT_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
  }
`;

export const Galaxies: React.FC<{
  data: Float32Array;
  stride: 4 | 5;
  mode: 0 | 1 | 2;
  unit?: number;
  gain?: number;
  pixel?: number;
  zone?: number;
  expand?: number;
  flow?: number;
  limit?: number; // 只画 Dist 小于这个值的（Mpc）
  focus?: { at: V3; radius: number; dim: number }; // 球里亮，球外压暗
}> = ({ data, stride, mode, unit = 1, gain = 1, pixel = 2, zone = 0, expand = 1, flow = 0, limit = 1e9, focus }) => {
  const geometry = useMemo(() => {
    const count = data.length / stride;
    const position: number[] = [];
    const val: number[] = [];
    for (let i = 0; i < count; i++) {
      const x = data[i * stride];
      const y = data[i * stride + 1];
      const z = data[i * stride + 2];
      if (Math.hypot(x, y, z) > limit) continue;
      position.push(...gal(x, y, z));
      val.push(data[i * stride + 3]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(position), 3));
    g.setAttribute("aval", new THREE.BufferAttribute(new Float32Array(val), 1));
    return g;
  }, [data, stride, limit]);
  if (gain <= 0.002) return null;
  const uniforms = {
    px: { value: RENDER_SCALE * pixel },
    unit: { value: unit },
    mode: { value: mode },
    gain: { value: gain },
    zone: { value: zone },
    expand: { value: expand },
    flow: { value: flow },
    focusAt: { value: new THREE.Vector3(...(focus?.at ?? [0, 0, 0])) },
    focusR: { value: focus?.radius ?? 0 },
    focusDim: { value: focus?.dim ?? 0 },
  };
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial vertexShader={POINT_VERTEX} fragmentShader={POINT_FRAGMENT} uniforms={uniforms} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// 细线：一段一段，端点用银道坐标给；颜色按列表给
export const Segments: React.FC<{ from: V3[]; to: V3[]; color: V3[]; alpha: number }> = ({ from, to, color, alpha }) => {
  const geometry = useMemo(() => {
    const pos = new Float32Array(from.length * 6);
    const col = new Float32Array(from.length * 6);
    for (let i = 0; i < from.length; i++) {
      pos.set(from[i], i * 6);
      pos.set(to[i], i * 6 + 3);
      col.set(color[i], i * 6);
      col.set(color[i], i * 6 + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [from, to, color]);
  if (alpha <= 0.002) return null;
  return (
    <lineSegments geometry={geometry} frustumCulled={false} renderOrder={4}>
      <lineBasicMaterial vertexColors transparent opacity={alpha} depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
};

// Mollweide 投影（椭圆全天图）：银道坐标（度）→ 归一化位置 nx、ny ∈ [−1, 1]；银经向左增加，银心在正中
export const mollweide = (l: number, b: number): [number, number] => {
  let lon = -l;
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  const phi = (b * Math.PI) / 180;
  let th = phi;
  for (let i = 0; i < 20; i++) th -= (2 * th + Math.sin(2 * th) - Math.PI * Math.sin(phi)) / (2 + 2 * Math.cos(2 * th) || 1e-6);
  return [(lon / 180) * Math.cos(th), Math.sin(th)];
};
