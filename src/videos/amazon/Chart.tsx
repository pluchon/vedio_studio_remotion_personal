// 右上角的水系小图：和大画面同一个规矩，离海比水头更远的河段都画出来，整个水系随着水往下流一点点长全
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { BOX, COLORS, DEM_SIZE, FONT, SEA } from "./theme";

const WIDTH = 432;
const HEIGHT = 300;
// 画布按两倍像素画，线才细而不糊
const SCALE = 2;
// 小图里只画流量够大的河
const MIN_FLOW = 110;

type Stroke = { down: Float32Array; lines: Float32Array; width: number; alpha: number };

const project = (lon: number, lat: number): [number, number] => [
  ((lon - BOX.west) / (BOX.east - BOX.west)) * WIDTH,
  ((BOX.north - lat) / (BOX.north - BOX.south)) * HEIGHT,
];

// 把河段按粗细分成几档，每档里按离海的距离从远到近排好：画的时候只要取前面一截
const sortStrokes = (rivers: Float32Array): Stroke[] => {
  const levels = [
    { test: (flow: number, kind: number) => kind < 1.5 && flow < 900, width: 0.55, alpha: 0.5 },
    { test: (flow: number, kind: number) => kind < 1.5 && flow >= 900 && flow < 8000, width: 0.9, alpha: 0.72 },
    { test: (flow: number, kind: number) => kind < 1.5 && flow >= 8000, width: 1.4, alpha: 0.9 },
    { test: (_: number, kind: number) => kind > 1.5, width: 2.1, alpha: 1 },
  ];
  return levels.map(({ test, width, alpha }) => {
    const picked: number[] = [];
    for (let i = 0; i < rivers.length; i += 8) {
      const flow = rivers[i + 4];
      const kind = rivers[i + 7];
      if (kind > 0.5 && flow >= MIN_FLOW && test(flow, kind)) picked.push(i);
    }
    picked.sort((a, b) => rivers[b + 5] - rivers[a + 5]);
    const down = new Float32Array(picked.length);
    const lines = new Float32Array(picked.length * 4);
    picked.forEach((i, n) => {
      down[n] = rivers[i + 5];
      const [x1, y1] = project(rivers[i], rivers[i + 1]);
      const [x2, y2] = project(rivers[i + 2], rivers[i + 3]);
      lines.set([x1, y1, x2, y2], n * 4);
    });
    return { down, lines, width, alpha };
  });
};

// 陆地的轮廓：高程里不是海的格子涂一层很淡的底色
const paintLand = (meters: Int16Array) => {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const image = ctx.createImageData(WIDTH, HEIGHT);
  const step = DEM_SIZE.width / WIDTH;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const land = meters[Math.floor(y * step) * DEM_SIZE.width + Math.floor(x * step)] > SEA / 2;
      const p = (y * WIDTH + x) * 4;
      image.data[p] = 232;
      image.data[p + 1] = 226;
      image.data[p + 2] = 208;
      image.data[p + 3] = land ? 34 : 0;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
};

export const Chart: React.FC<{
  rivers: Float32Array;
  meters: Int16Array;
  // 水现在流到了离海多远的地方，以及那里的经纬度
  head: number;
  lon: number;
  lat: number;
  opacity?: number;
}> = ({ rivers, meters, head, lon, lat, opacity = 1 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useMemo(() => sortStrokes(rivers), [rivers]);
  const land = useMemo(() => paintLand(meters), [meters]);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(land, 0, 0);
    ctx.lineCap = "round";
    for (const { down, lines, width, alpha } of strokes) {
      // 排在前面的离海更远；找到第一个还没轮到的
      let lo = 0;
      let hi = down.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (down[mid] >= head) lo = mid + 1;
        else hi = mid;
      }
      ctx.beginPath();
      for (let n = 0; n < lo; n++) {
        ctx.moveTo(lines[n * 4], lines[n * 4 + 1]);
        ctx.lineTo(lines[n * 4 + 2], lines[n * 4 + 3]);
      }
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(214, 232, 250, ${alpha})`;
      ctx.stroke();
    }
    // 水头
    const [x, y] = project(lon, lat);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    glow.addColorStop(0.3, "rgba(214, 232, 250, 0.5)");
    glow.addColorStop(1, "rgba(214, 232, 250, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }, [strokes, land, head, lon, lat]);

  return (
    <div style={{ position: "absolute", right: 64, top: 56, width: WIDTH, opacity, color: COLORS.soft }}>
      <canvas
        ref={ref}
        width={WIDTH * SCALE}
        height={HEIGHT * SCALE}
        style={{ width: WIDTH, height: HEIGHT, display: "block", background: "rgba(3, 9, 20, 0.8)", border: "1px solid rgba(239, 230, 210, 0.16)" }}
      />
      <div style={{ marginTop: 10, textAlign: "right", fontFamily: FONT, fontSize: 15, letterSpacing: "0.5em", textShadow: "0 0 12px rgba(0, 8, 20, 0.9)" }}>亚马逊河水系</div>
    </div>
  );
};
