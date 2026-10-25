// 序 · 星海（0–31）和 0:31 的冲刺：超深场原图 → 三维星系场 → 一个旋涡星系（一镜到底：拉远、看见另一个星系和路上的光子、静止、冲进旋臂）
import { cam, ease, keys, keys3, mix, type Shot, type V3 } from "../shot";

// 第二个星系的位置和光子的路
const A: V3 = [0, 0, 0];
const B: V3 = [7.5, 2.2, -10];
const along = (s: number): V3 => [mix(A[0], B[0], s), mix(A[1], B[1], s), mix(A[2], B[2], s)];
const dirAB: V3 = (() => {
  const d: V3 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
  const l = Math.hypot(...d);
  return [d[0] / l, d[1] / l, d[2] / l];
})();

export const PROLOGUE: Shot[] = [
  {
    // 超深场原图，慢慢化进程序画的星系场，镜头开始往里飞
    prog: "deep",
    from: 0,
    to: 14.4,
    fade: 0,
    u: ({ lt }) => ({
      ...cam([0.5, 0.5, 2.5 - Math.pow(Math.max(lt - 2.5, 0), 1.6) * 0.09], [0.65, 0.55, -10], 46),
      uPhoto: 1 - ease(lt, 3.6, 8.0),
      uZoom: 1 + lt * 0.006 + Math.pow(Math.max(lt - 3, 0), 2) * 0.004,
      uPan: [0, 0],
      uField: ease(lt, 3.6, 8.0),
      uFieldExpo: 1,
    }),
    post: ({ lt }) => ({ raw: 1 - ease(lt, 3.4, 7.5), bloom: mix(0, 0.5, ease(lt, 3.4, 7.5)), vignette: mix(0, 0.35, ease(lt, 3.4, 7.5)), grain: 0.02, ca: mix(0, 0.6, ease(lt, 3.4, 7.5)) }),
  },
  {
    // 一镜到底：旋涡星系
    prog: "galaxy",
    from: 12.8,
    to: 36.6,
    fade: 1.6,
    u: ({ t }) => {
      const pos = keys3(t, [
        [12.8, [1.15, 0.62, 1.75]],
        [17.6, [1.9, 1.05, 2.9]],
        [22.4, [-0.6, 3.2, 8.6]],
        [27.4, [-1.8, 3.9, 10.6]],
        [31.0, [-1.9, 4.0, 10.8]],
        [34.2, [0.2, 0.5, 1.6]],
        [36.6, [0.58, 0.012, 0.36]],
      ]);
      const tgt = keys3(t, [
        [12.8, [0.05, -0.05, 0]],
        [17.6, [0.1, -0.1, 0]],
        [22.4, [2.6, 0.6, -4.2]],
        [27.4, [3.0, 0.75, -4.6]],
        [31.0, [3.0, 0.75, -4.6]],
        [33.6, [0.5, 0.0, 0.2]],
        [36.6, [0.9, 0.02, 0.0]],
      ]);
      const fov = keys(t, [
        [12.8, 40],
        [31.0, 40],
        [34.5, 52],
        [36.6, 64],
      ]);
      const s = keys(t, [
        [21.5, 0.0],
        [36.6, 0.42],
      ]);
      return {
        ...cam(pos, tgt, fov),
        uSpin: t * 0.006,
        uExpo: 1,
        uBg: keys(t, [
          [12.8, 0.6],
          [20, 1.2],
        ]),
        uDive: ease(t, 33, 36.6),
        uG2: [...B, keys(t, [
          [17, 0],
          [22, 0.85],
        ])],
        uG2n: [0.35, 0.8, 0.48],
        uPh: [...along(0.05 + s), ease(t, 21.8, 23.2) * (1 - ease(t, 32, 33))],
        uPhDir: dirAB,
        uStar: [0.9, 0.02, 0.0, ease(t, 34.5, 36.6) * 3],
        uWarm: 0,
        uWarmAt: [0, 0, 0],
        uCanvasGain: 0,
      };
    },
  },
];
