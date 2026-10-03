// 彩纸屑：在代码里直接拼出 Lottie 的 JSON。每片纸是一个小矩形或小圆，从顶上打着转飘下来
import type { LottieAnimationData } from "@remotion/lottie";
import { random } from "remotion";
import { C, FPS, HEIGHT, WIDTH } from "./theme";

export const CONFETTI_FRAMES = Math.round(3.6 * FPS);

const COLORS = [C.coral, C.lemon, C.mint, C.lilac, C.sky, C.blush];

const rgb = (hex: string) => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
  1,
];

// 越落越快
const FALL = { i: { x: [0.8], y: [0.75] }, o: { x: [0.35], y: [0] } };
const EVEN = { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] } };

const piece = (index: number) => {
  const born = Math.round(random(`confetti-b-${index}`) * 0.9 * FPS);
  const life = Math.round((1.7 + random(`confetti-l-${index}`) * 0.9) * FPS);
  const x = random(`confetti-x-${index}`) * WIDTH;
  const drift = (random(`confetti-d-${index}`) - 0.5) * 320;
  const turns = (random(`confetti-r-${index}`) - 0.5) * 1400;
  const round = index % 3 === 0;
  const size = 16 + random(`confetti-s-${index}`) * 14;
  return {
    ddd: 0,
    ind: index + 1,
    ty: 4,
    nm: `纸屑${index + 1}`,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: {
        a: 1,
        k: [
          { t: born, s: [0], ...EVEN },
          { t: born + life, s: [turns] },
        ],
      },
      p: {
        a: 1,
        k: [
          { t: born, s: [x, -40, 0], ...FALL },
          { t: born + life, s: [x + drift, HEIGHT + 60, 0] },
        ],
      },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          round
            ? {
                ty: "el",
                d: 1,
                s: { a: 0, k: [size, size] },
                p: { a: 0, k: [0, 0] },
              }
            : {
                ty: "rc",
                d: 1,
                s: { a: 0, k: [size * 1.5, size * 0.8] },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 4 },
              },
          {
            ty: "fl",
            c: { a: 0, k: rgb(COLORS[index % COLORS.length]) },
            o: { a: 0, k: 100 },
            r: 1,
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: born,
    op: born + life,
    st: 0,
    bm: 0,
  };
};

export const CONFETTI: LottieAnimationData = {
  v: "5.7.0",
  fr: FPS,
  ip: 0,
  op: CONFETTI_FRAMES,
  w: WIDTH,
  h: HEIGHT,
  nm: "彩纸屑",
  ddd: 0,
  assets: [],
  layers: Array.from({ length: 70 }, (_, i) => piece(i)),
};
