// Canvas 2D 的小工具：发光的折线、光点、三维点投影到画幅上（和着色器的相机一致）
import type { Uniforms } from "./gl/engine";
import { project, type V3 } from "./shot";

export type P2 = [number, number];

// 两遍：宽而淡的晕 + 细而亮的芯；颜色是 0..1 的 rgb
export function glowLine(g: CanvasRenderingContext2D, pts: P2[], rgb: V3, width: number, alpha: number) {
  if (pts.length < 2 || alpha <= 0.002) return;
  const c = rgb.map((v) => Math.round(Math.min(1, v) * 255)).join(",");
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const [w, a] of [
    [width * 4, alpha * 0.12],
    [width, alpha],
  ] as const) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.strokeStyle = `rgba(${c},${a})`;
    g.lineWidth = w;
    g.stroke();
  }
}

export function glowDot(g: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: V3, alpha: number) {
  if (alpha <= 0.002) return;
  const c = rgb.map((v) => Math.round(Math.min(1, v) * 255)).join(",");
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 4);
  gr.addColorStop(0, `rgba(${c},${alpha})`);
  gr.addColorStop(0.25, `rgba(${c},${alpha * 0.35})`);
  gr.addColorStop(1, `rgba(${c},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
}

// 一串三维点投影成画幅上的折线（在相机后面的点断开）
export function projectLine(u: Uniforms, pts: V3[]): P2[] {
  const out: P2[] = [];
  for (const p of pts) {
    const s = project(u, p);
    if (s) out.push([s[0], s[1]]);
  }
  return out;
}

// 可复现的随机数
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
