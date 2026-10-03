// 一小群鸟的 Lottie 动画：每只鸟是一笔「人」字形的线，翅膀上下扇；在代码里直接拼出 Lottie 的 JSON，不依赖外面的素材
import type { LottieAnimationData } from "@remotion/lottie";

const FRAMES = 24;

// 翅膀抬起、放平、压下三个姿势：三个点（左翼尖、身子、右翼尖）加上曲线的控制柄
const wing = (lift: number) => ({
  c: false,
  v: [
    [-22, -lift],
    [0, 0],
    [22, -lift],
  ],
  i: [
    [0, 0],
    [-8, -lift * 0.6],
    [6, -lift * 0.2],
  ],
  o: [
    [6, -lift * 0.2],
    [8, -lift * 0.6],
    [0, 0],
  ],
});

const ease = { i: { x: [0.45], y: [1] }, o: { x: [0.55], y: [0] } };

const bird = (index: number, x: number, y: number, scale: number) => {
  // 各只鸟从扇翅的不同位置开始，免得整齐划一
  const cycle = [10, 1, -6, 1];
  const poses = cycle.map((_, i) => cycle[(i + index) % cycle.length]);
  return {
    ddd: 0,
    ind: index + 1,
    ty: 4,
    nm: `鸟${index + 1}`,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: {
        a: 1,
        k: [
          { t: 0, s: [x, y, 0], ...ease },
          { t: FRAMES / 2, s: [x, y + 4, 0], ...ease },
          { t: FRAMES, s: [x, y, 0] },
        ],
      },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [scale, scale, 100] },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "sh",
            ks: {
              a: 1,
              k: [
                ...poses.map((lift, i) => ({
                  t: (i * FRAMES) / poses.length,
                  s: [wing(lift)],
                  ...ease,
                })),
                { t: FRAMES, s: [wing(poses[0])] },
              ],
            },
          },
          {
            ty: "st",
            c: { a: 0, k: [0.08, 0.09, 0.12, 1] },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 3.2 },
            lc: 2,
            lj: 2,
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
    ip: 0,
    op: FRAMES,
    st: 0,
    bm: 0,
  };
};

const FLOCK: [number, number, number][] = [
  [80, 120, 100],
  [150, 90, 80],
  [205, 140, 90],
  [270, 105, 70],
  [330, 150, 75],
];

export const BIRDS: LottieAnimationData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: FRAMES,
  w: 420,
  h: 240,
  nm: "birds",
  ddd: 0,
  assets: [],
  layers: FLOCK.map(([x, y, s], i) => bird(i, x, y, s)),
};
