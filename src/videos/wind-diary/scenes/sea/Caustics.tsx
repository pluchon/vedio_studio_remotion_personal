// 水底的光：阳光落进浅水里，在沙底晃成一张碎碎的金色的网。逐帧在小画布上算，再放大铺满
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DAY } from "../../theme";

const W = 384;
const H = 216;
const TAU = Math.PI * 2;
const [GR, GG, GB] = DAY.gold.split(",").map(Number);

// 经典的水面焦散迭代（每个像素迭代 5 次），t 为时间（秒）
const drawCaustics = (ctx: CanvasRenderingContext2D, t: number) => {
  const img = ctx.createImageData(W, H);
  const data = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = ((x / H) * TAU * 1.5) % TAU - 250;
      const py = ((y / H) * TAU * 1.5) % TAU - 250;
      let ix = px;
      let iy = py;
      let c = 1;
      const inten = 0.005;
      for (let n = 0; n < 5; n++) {
        const tt = t * (1 - 3.5 / (n + 1));
        const nx = px + Math.cos(tt - ix) + Math.sin(tt + iy);
        const ny = py + Math.sin(tt - iy) + Math.cos(tt + ix);
        ix = nx;
        iy = ny;
        c += 1 / Math.hypot(px / (Math.sin(ix + tt) / inten), py / (Math.cos(iy + tt) / inten));
      }
      c /= 5;
      c = 1.17 - Math.pow(c, 1.4);
      const v = Math.min(1, Math.pow(Math.abs(c), 8));
      // 浅水的青绿底色，越靠下越偏沙色
      const k = y / H;
      const br = 96 + 90 * k;
      const bg = 186 + 30 * k;
      const bb = 196 - 20 * k;
      const i = (y * W + x) * 4;
      data[i] = br + (GR - br) * v;
      data[i + 1] = bg + (GG - bg) * v;
      data[i + 2] = bb + (GB - bb) * v;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
};

export const Caustics: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const visible = frame >= from - 1 && frame <= to + 1;

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (visible && ctx) drawCaustics(ctx, 20 + frame / 30 * 0.55);
  }, [frame, visible]);

  if (!visible) return null;
  const opacity = interpolate(frame, [from, from + 18, to - 10, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity }}>
      <canvas ref={ref} width={W} height={H} style={{ width: 1920, height: 1080, filter: "blur(2px) saturate(1.1)" }} />
    </AbsoluteFill>
  );
};
