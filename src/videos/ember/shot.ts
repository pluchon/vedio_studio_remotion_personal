// 镜头表的类型和工具：每个镜头 = 一个场景着色器 + 一段时间 + 按时间算的 uniform（相机、参数）+ 可选的 Canvas 叠加和调色
import { DEFAULT_POST, type Layer, type Post, type Uniforms } from "./gl/engine";
import { PIC_H, PIC_W } from "./theme";

export type V3 = [number, number, number];

export type Ctx = {
  t: number; // 整片秒数
  lt: number; // 镜头内秒数
  p: number; // 镜头进度 0..1
};

export type Shot = {
  prog: string;
  from: number;
  to: number;
  fade: number; // 叠在上一个镜头上淡入的秒数（0 硬切）
  out?: number; // 结尾淡到黑的秒数
  u?: (c: Ctx) => Uniforms;
  draw?: (g: CanvasRenderingContext2D, c: Ctx) => void;
  post?: Partial<Post> | ((c: Ctx) => Partial<Post>);
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lin = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const ease = (t: number, a: number, b: number) => {
  const p = lin(t, a, b);
  return p * p * (3 - 2 * p);
};
export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const mix3 = (a: V3, b: V3, p: number): V3 => [mix(a[0], b[0], p), mix(a[1], b[1], p), mix(a[2], b[2], p)];

// 关键帧：两帧之间用三次缓动；值可以是数或三维向量
export function keys(t: number, ks: [number, number][]): number {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, v0] = ks[i - 1];
      const [t1, v1] = ks[i];
      return mix(v0, v1, easeInOut((t - t0) / (t1 - t0)));
    }
  }
  return ks[ks.length - 1][1];
}
export function keys3(t: number, ks: [number, V3][]): V3 {
  return [0, 1, 2].map((i) => keys(t, ks.map(([k, v]) => [k, v[i]] as [number, number]))) as V3;
}

// 相机：位置、看向、竖直视角（度）、绕视线转（弧度）
export const cam = (pos: V3, tgt: V3, fovDeg: number, roll = 0, up: V3 = [0, 1, 0]): Uniforms => ({
  uCam: pos,
  uTgt: tgt,
  uFoc: 1 / Math.tan((fovDeg * Math.PI) / 360),
  uRoll: roll,
  uUp: up,
});

// 和着色器里 camRay 完全一样的投影：返回画幅像素坐标（y 向下）和深度，在相机后面返回 null
export function project(u: Uniforms, p: V3): [number, number, number] | null {
  const c = u.uCam as V3;
  const g = u.uTgt as V3;
  const foc = u.uFoc as number;
  const roll = (u.uRoll as number) ?? 0;
  const upv = (u.uUp as V3) ?? [0, 1, 0];
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const f = norm(sub(g, c));
  const r0 = norm(cross(f, upv));
  const u0 = cross(r0, f);
  const cs = Math.cos(roll);
  const sn = Math.sin(roll);
  const r: V3 = [r0[0] * cs + u0[0] * sn, r0[1] * cs + u0[1] * sn, r0[2] * cs + u0[2] * sn];
  const up: V3 = [u0[0] * cs - r0[0] * sn, u0[1] * cs - r0[1] * sn, u0[2] * cs - r0[2] * sn];
  const d = sub(p, c);
  const z = dot(d, f);
  if (z <= 1e-4) return null;
  const sx = (dot(d, r) / z) * foc;
  const sy = (dot(d, up) / z) * foc;
  return [(sx * PIC_H + PIC_W) / 2, (PIC_H - sy * PIC_H) / 2, z];
}

const POST_KEYS = ["exposure", "bloom", "threshold", "grain", "vignette", "sat", "lift", "ca", "fade", "raw"] as const;

// 当前时刻的图层：在时间里的镜头按顺序叠，后一个按淡入透明度盖在前一个上
export function layersAt(shots: Shot[], t: number, canvases: HTMLCanvasElement[]): { layers: Layer[]; post: Post } {
  const live = shots.filter((s) => t >= s.from && t < s.to);
  const layers: Layer[] = [];
  const post: Post = { ...DEFAULT_POST, tint: [...DEFAULT_POST.tint] as [number, number, number] };
  live.forEach((s, i) => {
    const lt = t - s.from;
    const c: Ctx = { t, lt, p: lt / (s.to - s.from) };
    let alpha = s.fade > 0 && i > 0 ? ease(t, s.from, s.from + s.fade) : 1;
    if (i === 0 && s.fade > 0 && live.length === 1) alpha = ease(t, s.from, s.from + s.fade);
    if (s.out) alpha *= 1 - ease(t, s.to - s.out, s.to);
    const u = s.u ? s.u(c) : {};
    u.uLocal = lt;
    u.uProg = c.p;
    let canvas: HTMLCanvasElement | undefined;
    if (s.draw) {
      canvas = canvases[i % canvases.length];
      const g = canvas.getContext("2d")!;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      s.draw(g, c);
    }
    layers.push({ prog: s.prog, alpha, u, canvas });
    const sp = typeof s.post === "function" ? s.post(c) : s.post;
    if (sp) {
      const w = i === 0 ? 1 : alpha;
      for (const k of POST_KEYS) if (sp[k] !== undefined) post[k] = mix(post[k], sp[k]!, w);
      if (sp.tint) post.tint = [0, 1, 2].map((j) => mix(post.tint[j], sp.tint![j], w)) as [number, number, number];
    }
  });
  return { layers, post };
}
