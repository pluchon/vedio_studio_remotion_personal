// 一 · 微光（36–61）：一颗寻常的行星 → 海里会复制自己的分子 → 水下看见光 → 走上岸，天黑下来，抬头看见星空
import { EARTHLIKE, GALAXY_SKY, sunAt, sunDir } from "../presets";
import { cam, ease, keys, keys3, type Shot } from "../shot";

export const DAWN: Shot[] = [
  {
    // 从恒星的白光里出来：恒星在左，年轻的海洋行星在右，镜头慢慢靠近
    prog: "planet",
    from: 36.2,
    to: 42.2,
    fade: 0.5,
    u: ({ lt }) => ({
      ...EARTHLIKE,
      uSea: 0.6,
      uCloud: 0.4,
      uDesert: 0.9,
      uLandA: [0.12, 0.08, 0.05],
      uLandB: [0.3, 0.18, 0.1],
      ...cam(keys3(lt, [[0, [-0.6, 0.35, 4.6]], [6, [-0.3, 0.25, 3.4]]]), keys3(lt, [[0, [-1.25, 0.1, 0]], [6, [-1.15, 0.1, 0]]]), 34),
      uSun: sunDir([-1, 0.12, -0.55]),
      uSunCol: [8, 7.6, 7.0],
      uSunSize: 0.012,
      uSpinA: 1.2 + lt * 0.01,
      uCloudT: lt * 0.003,
      uCity: 0,
      uOff: 0,
      uLightAmt: 0,
      uLaunch: [0, 0, 0, 0],
      uHalo: 0,
      uStarsAmt: 0.35,
      uFlare: 1,
      uCanvasGain: 0,
    }),
    post: ({ lt }) => ({ exposure: 1 + 3 * (1 - ease(lt, 0, 1.2)) }),
  },
  {
    // 海里的分子：一条发光的螺旋，副本的横档一格格扣上去
    prog: "cells",
    from: 41.6,
    to: 47.6,
    fade: 0.6,
    u: ({ lt }) => ({
      ...cam(keys3(lt, [[0, [-1.15, 0.32, 1.05]], [5.8, [-0.1, 0.18, 0.95]]]), keys3(lt, [[0, [-0.55, 0, 0]], [5.8, [0.35, -0.02, 0]]]), 30, -0.12),
      uCopy: keys(lt, [[0.4, -1.4], [5.8, 0.75]]),
      uFocus: keys(lt, [[0, 1.2], [5.8, 1.0]]),
      uAperture: 0.03,
      uGlow: 1.0,
      uMerge: 0,
      uTintA: [1.0, 0.5, 0.18],
      uTintB: [1.0, 0.62, 0.28],
    }),
    post: { bloom: 0.7, grain: 0.04 },
  },
  {
    // 水下往上看：它看见光。镜头慢慢往上浮
    prog: "under",
    from: 46.8,
    to: 50.0,
    fade: 0.6,
    u: ({ t }) => {
      const y = keys(t, [[46.8, -7.5], [50.0, -2.6]]);
      return {
        ...cam([0, y, 0], [0.3, y + 6, -4.2], 52, 0.05),
        ...GALAXY_SKY,
        uSunDir: sunAt(-4, 6),
        uSunI: 22,
        uMilky: 0,
        uNightStars: 0,
        uWaveT: t,
        uExpo: keys(t, [[46.8, 1.1], [48.8, 1.4], [50.0, 7]]),
      };
    },
    post: { bloom: 0.8 },
  },
  {
    // 走上岸：贴着水面往岸上滑，太阳从岸后的山上落下去
    prog: "land",
    from: 49.6,
    to: 53.6,
    fade: 0.4,
    u: ({ t }) => ({
      ...cam(keys3(t, [[49.4, [2.6, 0.25, 6]], [53.6, [1.8, 0.9, -1.5]]]), keys3(t, [[49.4, [0.2, 0.9, -40]], [53.6, [-0.5, 2.2, -40]]]), 38),
      ...GALAXY_SKY,
      uSunDir: sunAt(-4, keys(t, [[49.4, 4.2], [53.6, 1.2]])),
      uSunI: 22,
      uMilky: 0,
      uNightStars: 0,
      uFire: [0, 0, 0, 0],
      uFigures: 0,
      uTown: 0,
      uDishes: 0,
      uWaveT: t,
      uSeaAmt: 1,
        uMoon: [0, 1, 0, 0],
      uExpo: 0.5,
    }),
  },
  {
    // 站上岩石看海：天黑下来，星星一颗颗出来，抬头看见银河
    prog: "land",
    from: 53.0,
    to: 61.8,
    fade: 0.8,
    u: ({ t }) => {
      const pitch = keys(t, [[53, 0.02], [55.2, 0.04], [59.2, 0.34], [61.8, 0.37]]);
      const yaw = keys(t, [[53, 0.1], [59.2, -0.22], [61.8, -0.26]]);
      const pos: [number, number, number] = [1.8, 3.4, -18.5];
      const tgt: [number, number, number] = [pos[0] + Math.sin(yaw) * 10, pos[1] + Math.tan(pitch) * 10, pos[2] - Math.cos(yaw) * 10];
      return {
        ...cam(pos, tgt, 42),
        ...GALAXY_SKY,
        uSunDir: sunAt(10, keys(t, [[53, -1.5], [56.5, -8], [59.5, -15], [61.8, -19]])),
        uSunI: 22,
        uMilky: ease(t, 55.5, 59.5),
        uNightStars: ease(t, 55, 59) * 0.2,
        uFire: [0, 0, 0, 0],
        uFigures: 0,
        uTown: 0,
        uDishes: 0,
        uWaveT: t,
        uSeaAmt: 1,
        uMoon: [0, 1, 0, 0],
        uExpo: keys(t, [[53, 0.9], [55, 2.2], [57, 2.4], [59, 1.8], [61.8, 1.8]]),
      };
    },
    post: ({ t }) => ({ tint: [1 - 0.12 * ease(t, 55, 59), 1 - 0.03 * ease(t, 55, 59), 1 + 0.1 * ease(t, 55, 59)] }),
  },
];
