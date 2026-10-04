// 「叶子与水流」的二维版：一片叶子顺着水流散开（哈勃流），旁边出现一个漩涡，把附近的叶子轻轻扯过去（特殊速度）。
// 这是示意，不是数据；数据版在后半（Leaves.tsx 里的 Cosmicflows-4）
import React, { useLayoutEffect, useRef } from "react";
import { rng } from "../space";
import { ramp, useT } from "../time";

const W = 1920;
const H = 1080;
const N = 760;
const C: [number, number] = [W / 2, H / 2];
const A: [number, number] = [1330, 400]; // 漩涡的位置

type Leaf = { x: number; y: number; size: number; hue: number; spin: number };
let leaves: Leaf[] | null = null;
const makeLeaves = (): Leaf[] => {
  const r = rng(77);
  return Array.from({ length: N }, () => {
    const ang = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 1250;
    return { x: C[0] + Math.cos(ang) * rad * 1.05, y: C[1] + Math.sin(ang) * rad * 0.62, size: 4 + r() * 8, hue: r(), spin: (r() - 0.5) * 2 };
  });
};

const T0 = 97.5; // 设计时间：从这里开始积分
const HUBBLE = 0.045; // 1/秒：整体散开的快慢
const DT = 0.12;

// 漩涡的力：靠近时强，远了很快消失；带一点旋转
const pull = (x: number, y: number, g: number): [number, number] => {
  const dx = A[0] - x;
  const dy = A[1] - y;
  const d = Math.hypot(dx, dy) + 1e-3;
  const m = g * Math.exp(-d / 380);
  return [(dx / d) * m + (-dy / d) * m * 0.55, (dy / d) * m + (dx / d) * m * 0.55];
};

const strength = (t: number) => 190 * ramp(t, 106, 116);

export const Stream: React.FC = () => {
  const t = useT();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (t < 97.5 || t > 121.5) {
      ctx.clearRect(0, 0, W, H);
      return;
    }
    leaves ??= makeLeaves();
    // 背景：深蓝绿的水，漩涡处略亮
    const bg = ctx.createRadialGradient(C[0], C[1], 100, C[0], C[1], 1300);
    bg.addColorStop(0, "#0b1a26");
    bg.addColorStop(1, "#04080f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ramp(t, 108, 114);
    if (glow > 0) {
      const g = ctx.createRadialGradient(A[0], A[1], 0, A[0], A[1], 330);
      g.addColorStop(0, `rgba(240,197,138,${0.28 * glow})`);
      g.addColorStop(1, "rgba(240,197,138,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // 水纹：几圈很淡的弧线随时间飘
    ctx.strokeStyle = "rgba(160,200,230,0.05)";
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 24) {
        const y = 120 + k * 150 + Math.sin(x * 0.006 + t * 0.5 + k) * 18 + Math.sin(x * 0.017 - t * 0.3 + k * 2) * 6;
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const fade = ramp(t, 97.8, 100) * (1 - ramp(t, 117, 121));
    const steps = Math.max(0, Math.round((t - T0) / DT));
    for (const leaf of leaves) {
      let x = leaf.x;
      let y = leaf.y;
      let px = x;
      let py = y;
      const trail: [number, number][] = [];
      for (let i = 0; i < steps; i++) {
        const tt = T0 + i * DT;
        const [ax, ay] = pull(x, y, strength(tt));
        const vx = HUBBLE * (x - C[0]) + ax;
        const vy = HUBBLE * (y - C[1]) + ay;
        px = x;
        py = y;
        x += vx * DT;
        y += vy * DT;
        if (i >= steps - 7) trail.push([x, y]);
      }
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      const heading = Math.atan2(y - py, x - px);
      const shade = leaf.hue;
      const col = shade < 0.55 ? "240,197,138" : shade < 0.8 ? "232,143,166" : "150,205,215";
      // 拖尾
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0][0], trail[0][1]);
        for (const [tx, ty] of trail) ctx.lineTo(tx, ty);
        ctx.strokeStyle = `rgba(${col},${0.22 * fade})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      // 叶子：一个细长的椭圆，顺着速度方向
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(heading + leaf.spin * 0.4);
      ctx.fillStyle = `rgba(${col},${0.82 * fade})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [t]);
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H }} />;
};

