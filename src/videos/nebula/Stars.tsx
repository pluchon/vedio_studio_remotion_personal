// 星点：银河、星系群、星团、拉普拉斯的气体云，都是一堆发光的小点（THREE.Points，加法混合）
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { HEIGHT, RENDER_SCALE, WIDTH } from "./theme";
import type { V3 } from "./time";

// ---------- 镜头 ----------
export const Rig: React.FC<{ pos: V3; look: V3; fov: number }> = ({ pos, look, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(...look);
    camera.fov = fov;
    camera.near = 0.01;
    camera.far = 2000;
    camera.updateProjectionMatrix();
  }, [camera, pos, look, fov]);
  return null;
};

// 把一个三维点投到屏幕上（1920×1080 的像素坐标），给标签定位用
export const project = (p: V3, cam: V3, look: V3, fov: number): [number, number, number] => {
  const f = new THREE.Vector3(...look).sub(new THREE.Vector3(...cam)).normalize();
  const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
  const u = new THREE.Vector3().crossVectors(r, f);
  const v = new THREE.Vector3(...p).sub(new THREE.Vector3(...cam));
  const z = v.dot(f);
  const half = Math.tan((fov * Math.PI) / 360);
  const x = v.dot(r) / (z * half * (WIDTH / HEIGHT));
  const y = v.dot(u) / (z * half);
  return [(x * 0.5 + 0.5) * WIDTH, (1 - (y * 0.5 + 0.5)) * HEIGHT, z];
};

// ---------- 数据 ----------
const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const gauss = (r: () => number) => {
  let s = 0;
  for (let i = 0; i < 4; i++) s += r();
  return (s - 2) * 1.732;
};

export type DotData = { position: Float32Array; color: Float32Array; size: Float32Array; reveal: Float32Array; count: number };

const alloc = (n: number): DotData => ({
  position: new Float32Array(n * 3),
  color: new Float32Array(n * 3),
  size: new Float32Array(n),
  reveal: new Float32Array(n),
  count: n,
});

const put = (d: DotData, i: number, p: V3, c: V3, s: number, reveal: number) => {
  d.position.set(p, i * 3);
  d.color.set(c, i * 3);
  d.size[i] = s;
  d.reveal[i] = reveal;
};

// 旋涡星系：核球加两条对数螺旋臂，臂上有些粉红的电离氢区
export const makeGalaxy = (n = 70000, seed = 7): DotData => {
  const r = rng(seed);
  const d = alloc(n);
  const bulge = Math.floor(n * 0.15);
  for (let i = 0; i < n; i++) {
    if (i < bulge) {
      const rad = Math.abs(gauss(r)) * 0.1;
      const th = r() * Math.PI * 2;
      const ph = Math.acos(2 * r() - 1);
      put(d, i, [rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph) * 0.7], [1.0, 0.82, 0.55], 1.4 + r() * 1.0, r());
      continue;
    }
    let rad = -Math.log(1 - r() * 0.985) * 0.3 + 0.05;
    while (rad > 1.1) rad = -Math.log(1 - r() * 0.985) * 0.3 + 0.05;
    const arm = r() < 0.5 ? 0 : 1;
    const th = arm * Math.PI + 3.1 * Math.log(1 + rad * 5.5) + gauss(r) * 0.3 * (1.05 - rad * 0.4);
    const mixC = Math.min(1, rad * 1.1);
    const hii = r() < 0.03 && rad > 0.25;
    const c: V3 = hii ? [1.0, 0.42, 0.6] : [1.0 - 0.35 * mixC, 0.84 - 0.06 * mixC, 0.6 + 0.4 * mixC];
    put(d, i, [rad * Math.cos(th), rad * Math.sin(th), gauss(r) * 0.018 * (1.25 - rad)], c, hii ? 3.0 : 1.1 + r() * 1.2, r());
  }
  return d;
};

// 星系群：许多小亮点，成团成丝地撒在一大块空间里
export const makeField = (n = 3200, seed = 11): DotData => {
  const r = rng(seed);
  const d = alloc(n);
  const centres: V3[] = Array.from({ length: 60 }, () => [(r() - 0.5) * 100, (r() - 0.5) * 100, (r() - 0.5) * 100]);
  for (let i = 0; i < n; i++) {
    let p: V3;
    if (r() < 0.7) {
      const c = centres[Math.floor(r() * centres.length)];
      p = [c[0] + gauss(r) * 4.5, c[1] + gauss(r) * 4.5, c[2] + gauss(r) * 4.5];
    } else {
      p = [(r() - 0.5) * 110, (r() - 0.5) * 110, (r() - 0.5) * 110];
    }
    const warm = r();
    put(d, i, p, [1.0, 0.86 + 0.1 * warm, 0.7 + 0.3 * warm], 2.0 + r() * 3.0, r());
  }
  return d;
};

// 星团：Plummer 球，中间密、外面疏
export const makeCluster = (n = 9000, seed = 5): DotData => {
  const r = rng(seed);
  const d = alloc(n);
  const a = 0.42;
  for (let i = 0; i < n; i++) {
    const u = Math.min(0.995, Math.max(0.002, r()));
    const rad = a / Math.sqrt(Math.pow(u, -2 / 3) - 1);
    const th = r() * Math.PI * 2;
    const ph = Math.acos(2 * r() - 1);
    const t = r();
    const c: V3 = t < 0.12 ? [1.0, 0.62, 0.4] : t < 0.3 ? [0.7, 0.8, 1.0] : [1.0, 0.92, 0.8];
    put(d, i, [rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph)], c, 1.0 + r() * 2.4, r());
  }
  return d;
};

// 一圈圈天球上的点：星表里一万多个条目
export const makeSphereDots = (n = 13000, seed = 3): DotData => {
  const r = rng(seed);
  const d = alloc(n);
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI * 2;
    const z = 2 * r() - 1;
    const s = Math.sqrt(1 - z * z);
    const R = 9;
    const t = r();
    const c: V3 = t < 0.35 ? [1.0, 0.55, 0.65] : t < 0.7 ? [0.6, 0.78, 1.0] : [1.0, 0.92, 0.8];
    put(d, i, [R * s * Math.cos(th), R * z, R * s * Math.sin(th)], c, 1.2 + r() * 1.4, r());
  }
  return d;
};

// ---------- 渲染 ----------
const DOT_VERTEX = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  attribute float reveal;
  uniform float uPx;
  uniform float uTime;
  uniform float uReveal;
  varying vec3 vColor;
  varying float vShow;
  void main() {
    vColor = color;
    float tw = 0.88 + 0.12 * sin(uTime * (0.5 + reveal * 2.0) + reveal * 60.0);
    vShow = smoothstep(reveal, reveal + 0.04, uReveal) * tw;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, size * uPx);
  }
`;

const DOT_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vShow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vColor, a * uAlpha * vShow);
    #include <colorspace_fragment>
  }
`;

const geometryOf = (data: DotData) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(data.position, 3));
  g.setAttribute("color", new THREE.BufferAttribute(data.color, 3));
  g.setAttribute("size", new THREE.BufferAttribute(data.size, 1));
  g.setAttribute("reveal", new THREE.BufferAttribute(data.reveal, 1));
  return g;
};

export const Dots: React.FC<{
  data: DotData;
  alpha: number;
  time: number;
  reveal?: number;
  position?: V3;
  rotation?: V3;
  scale?: number;
  pixel?: number;
}> = ({ data, alpha, time, reveal = 1, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, pixel = 1 }) => {
  const geometry = useMemo(() => geometryOf(data), [data]);
  if (alpha <= 0.002) return null;
  const uniforms = {
    uPx: { value: RENDER_SCALE * 2 * pixel },
    uTime: { value: time },
    uReveal: { value: reveal },
    uAlpha: { value: alpha },
  };
  return (
    <points geometry={geometry} position={position} rotation={rotation} scale={scale} frustumCulled={false} renderOrder={5}>
      <shaderMaterial vertexShader={DOT_VERTEX} fragmentShader={DOT_FRAGMENT} uniforms={uniforms} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// ---------- 拉普拉斯的气体云：一团球形的云收缩、转快、压扁，中间亮起来，外面落成一圈圈行星 ----------
type Collapsing = { position: Float32Array; aux: Float32Array; color: Float32Array; size: Float32Array; count: number };

const makeCollapse = (n = 26000, seed = 9): Collapsing => {
  const r = rng(seed);
  const core = 2600;
  const planets = 7;
  const total = n + core + planets;
  const out: Collapsing = { position: new Float32Array(total * 3), aux: new Float32Array(total * 3), color: new Float32Array(total * 3), size: new Float32Array(total), count: total };
  for (let i = 0; i < n; i++) {
    const rad = Math.cbrt(r()) * 1.1;
    const th = r() * Math.PI * 2;
    const ph = Math.acos(2 * r() - 1);
    out.position.set([rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph)], i * 3);
    out.aux.set([0, r(), 0], i * 3);
    const m = Math.min(1, rad / 1.1);
    out.color.set([1.0, 0.7 + 0.15 * m, 0.55 + 0.3 * m], i * 3);
    out.size[i] = 2.4 + r() * 2.4;
  }
  for (let k = 0; k < core; k++) {
    const i = n + k;
    const rad = Math.abs(gauss(r)) * 0.07;
    const th = r() * Math.PI * 2;
    const ph = Math.acos(2 * r() - 1);
    out.position.set([rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph)], i * 3);
    out.aux.set([1, r(), 0], i * 3);
    out.color.set([1.0, 0.9, 0.7], i * 3);
    out.size[i] = 4 + r() * 3.5;
  }
  for (let k = 0; k < planets; k++) {
    const i = n + core + k;
    out.position.set([0, 0, 0], i * 3);
    out.aux.set([2, 0.22 + k * 0.13, r() * 6.28], i * 3);
    out.color.set(k % 2 ? [0.7, 0.85, 1.0] : [1.0, 0.8, 0.55], i * 3);
    out.size[i] = 12 + r() * 6;
  }
  return out;
};

const COLLAPSE_VERTEX = /* glsl */ `
  attribute vec3 aux;
  attribute float size;
  attribute vec3 color;
  uniform float uPx;
  uniform float uS;
  uniform float uTau;
  varying vec3 vColor;
  varying float vShow;
  void main() {
    vColor = color;
    vec3 p = position;
    float kind = aux.x;
    vShow = 1.0;
    if (kind < 0.5) {
      float r0 = length(p.xy);
      float shrink = mix(1.0, 0.45 + 0.4 * aux.y, uS);
      float squash = mix(1.0, 0.03, uS);
      float ang = uTau * (0.25 + 0.9 / (0.18 + r0)) * uS;
      float c = cos(ang);
      float s = sin(ang);
      p = vec3((p.x * c - p.y * s) * shrink, (p.x * s + p.y * c) * shrink, p.z * squash);
    } else if (kind < 1.5) {
      vShow = uS * uS;
    } else {
      float ang = aux.z + uTau * 0.9 / (0.3 + aux.y);
      p = vec3(cos(ang), sin(ang), 0.0) * aux.y * 1.15;
      vShow = smoothstep(0.78, 0.95, uS);
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, size * uPx);
  }
`;

const COLLAPSE_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vShow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vColor, a * uAlpha * vShow);
    #include <colorspace_fragment>
  }
`;

export const Collapse: React.FC<{ s: number; tau: number; alpha: number; rotation?: V3 }> = ({ s, tau, alpha, rotation = [0, 0, 0] }) => {
  const geometry = useMemo(() => {
    const data = makeCollapse();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.position, 3));
    g.setAttribute("aux", new THREE.BufferAttribute(data.aux, 3));
    g.setAttribute("color", new THREE.BufferAttribute(data.color, 3));
    g.setAttribute("size", new THREE.BufferAttribute(data.size, 1));
    return g;
  }, []);
  if (alpha <= 0.002) return null;
  const uniforms = { uPx: { value: RENDER_SCALE * 2 }, uS: { value: s }, uTau: { value: tau }, uAlpha: { value: alpha } };
  return (
    <points geometry={geometry} rotation={rotation} frustumCulled={false} renderOrder={5}>
      <shaderMaterial vertexShader={COLLAPSE_VERTEX} fragmentShader={COLLAPSE_FRAGMENT} uniforms={uniforms} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// 模块里算一次，所有幕共用
let galaxy: DotData | null = null;
let field: DotData | null = null;
let cluster: DotData | null = null;
let sphere: DotData | null = null;
export const GALAXY = () => (galaxy ??= makeGalaxy());
export const FIELD = () => (field ??= makeField());
export const CLUSTER = () => (cluster ??= makeCluster());
export const SPHERE = () => (sphere ??= makeSphereDots());
