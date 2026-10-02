// 一个墨写的字：在两个字形之间按比例混合「离边缘的距离」，混出来的形状自然地从一个化成另一个，笔画数目不同也不会撕裂
import React, { useLayoutEffect, useRef } from "react";
import type { Glyphs } from "./glyphs";

type Props = {
  glyphs: Glyphs;
  from: string;
  to?: string;
  // 0 是 from，1 是 to
  mix?: number;
  // 0 到 1：笔画从中线长到完整的粗细，同时自上而下出现
  reveal?: number;
  // 画出来的边长（像素）
  size: number;
  color: [number, number, number];
  opacity?: number;
  // 整体加粗或减细（格）
  weight?: number;
  // 大于 0 时再叠一层「旧字收细、新字长粗」，数值是收到多细（格）；只做线性混合的话，对不上的细笔画会断成碎片
  rewrite?: number;
  style?: React.CSSProperties;
};

// 没写完的笔画最多缩进去多少格
const THIN = 9;
// 平滑并集的过渡宽度（1/64 格）
const SMOOTH = 10 * 64;

export const Ink: React.FC<Props> = ({ glyphs, from, to, mix = 0, reveal = 1, size, color, opacity = 1, weight = 0, rewrite = 0, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const grid = glyphs.size;
    const a = glyphs.get(from);
    const b = to && mix > 0 ? glyphs.get(to) : null;
    const image = ctx.createImageData(size, size);
    const data = image.data;
    // 一格对应多少个屏幕像素
    const zoom = size / grid;
    const step = grid / size;
    const shrink = (1 - reveal) * THIN - weight;
    const ease = mix * mix * (3 - 2 * mix);
    const fadeA = rewrite * ease * 64;
    const fadeB = rewrite * (1 - ease) * 64;
    // 自上而下出现的那条线，带一段过渡
    const front = reveal >= 1 ? Infinity : reveal * 1.5 * size;
    const soft = size * 0.32;

    for (let y = 0; y < size; y++) {
      const gy = Math.min(grid - 1.001, Math.max(0, (y + 0.5) * step - 0.5));
      const y0 = Math.floor(gy);
      const fy = gy - y0;
      const veil = front === Infinity ? 1 : Math.min(1, Math.max(0, (front - y) / soft));
      if (veil <= 0) continue;
      for (let x = 0; x < size; x++) {
        const gx = Math.min(grid - 1.001, Math.max(0, (x + 0.5) * step - 0.5));
        const x0 = Math.floor(gx);
        const fx = gx - x0;
        const i = y0 * grid + x0;
        const w00 = (1 - fx) * (1 - fy);
        const w10 = fx * (1 - fy);
        const w01 = (1 - fx) * fy;
        const w11 = fx * fy;
        let d = a[i] * w00 + a[i + 1] * w10 + a[i + grid] * w01 + a[i + grid + 1] * w11;
        if (b) {
          const e = b[i] * w00 + b[i + 1] * w10 + b[i + grid] * w01 + b[i + grid + 1] * w11;
          const blend = d + (e - d) * mix;
          if (rewrite > 0) {
            // 两个字各自收细后取并集，交界处用平滑的最小值糊在一起
            const u = d + fadeA;
            const v = e + fadeB;
            const h = Math.max(0, 1 - Math.abs(u - v) / SMOOTH);
            const joined = Math.min(u, v) - h * h * SMOOTH * 0.25;
            d = Math.min(blend, joined);
          } else {
            d = blend;
          }
        }
        // 换成屏幕像素：边缘上半个像素的过渡
        const edge = 0.5 - (d / 64 + shrink) * zoom;
        if (edge <= 0) continue;
        const p = (y * size + x) * 4;
        data[p] = color[0];
        data[p + 1] = color[1];
        data[p + 2] = color[2];
        data[p + 3] = 255 * Math.min(1, edge) * veil * opacity;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [glyphs, from, to, mix, reveal, size, color, opacity, weight, rewrite]);

  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size, ...style }} />;
};
