// 二 · 火（61–91）：火种燃起 → 星空下旷野里的一堆篝火 → 洞壁上的影子在说话 → 留在石壁上的符号 → 远处亮起聚落的灯火
import { GALAXY_SKY, sunAt } from "../presets";
import { cam, keys, keys3, type Shot } from "../shot";

const NIGHT = {
  ...GALAXY_SKY,
  uSunDir: sunAt(10, -24),
  uSunI: 22,
  uMilky: 1,
  uNightStars: 0.2,
  uDishes: 0,
};

export const HEARTH: Shot[] = [
  {
    // 黑暗里迸出火星，火苗窜起来
    prog: "fire",
    from: 61.0,
    to: 66.0,
    fade: 0.8,
    u: ({ t }) => ({
      ...cam(keys3(t, [[61, [0, 0.55, 2.6]], [66, [0.25, 0.48, 1.9]]]), [0, 0.42, 0], 34),
      uIgnite: keys(t, [[61.8, 0], [64.2, 1]]),
      uDie: 0,
      uSmoke: 0,
      uLogs: 1,
      uExpo: 1,
    }),
    post: { bloom: 0.7 },
  },
  {
    // 星空下的旷野：很小的一堆火，围坐着几个身影
    prog: "land",
    from: 65.4,
    to: 71.0,
    fade: 0.8,
    u: ({ t }) => {
      const fire: [number, number, number] = [0, 0, -30];
      return {
        ...NIGHT,
        ...cam(keys3(t, [[65.4, [3.6, 1.3, -21.5]], [71, [7.5, 2.4, -7]]]), keys3(t, [[65.4, [0, 0.9, -30]], [71, [-1, 6.5, -32]]]), 38),
        uFire: [fire[0], 0.4, fire[2], 1.0],
        uFigures: 1,
        uTown: 0,
        uWaveT: t,
        uSeaAmt: 0,
        uExpo: 1.7,
      };
    },
    post: { tint: [0.92, 0.97, 1.08] },
  },
  {
    // 洞壁上的影子：两个生灵在说话，光点从一个的头传到另一个
    prog: "cave",
    from: 70.6,
    to: 75.6,
    fade: 0.7,
    u: ({ t }) => ({
      ...cam(keys3(t, [[70.6, [-0.1, 0.2, 3.3]], [75.6, [0.05, 0.3, 2.8]]]), [-0.1, 0.15, 0], 42),
      uFireAmt: 1,
      uShadows: 1,
      uTalk: keys(t, [[71.2, 0], [75.6, 1.6]]),
      uMarks: 0,
      uFaded: 0,
      uBeam: 0,
      uExpo: 1.1,
    }),
  },
  {
    // 符号一个个画到石壁上
    prog: "cave",
    from: 75.2,
    to: 80.2,
    fade: 0.7,
    u: ({ t }) => ({
      ...cam(keys3(t, [[75.2, [-0.9, 0.9, 1.5]], [80.2, [0.4, 0.75, 1.4]]]), keys3(t, [[75.2, [-0.9, 0.8, 0]], [80.2, [0.4, 0.7, 0]]]), 40),
      uFireAmt: 1,
      uShadows: keys(t, [[75.2, 0.5], [77, 0]]),
      uTalk: 0,
      uMarks: keys(t, [[75.2, 0.1], [80.2, 0.45]]),
      uFaded: 0,
      uBeam: 0,
      uExpo: 1.2,
    }),
  },
  {
    // 退远：整面墙都是符号——一代代的念头留了下来
    prog: "cave",
    from: 79.8,
    to: 85.4,
    fade: 0.8,
    u: ({ t }) => ({
      ...cam(keys3(t, [[79.8, [0.2, 0.6, 2.2]], [85.4, [0.0, 0.4, 6.2]]]), [0.0, 0.5, 0], 44),
      uFireAmt: 1.6,
      uShadows: 0,
      uTalk: 0,
      uMarks: keys(t, [[79.8, 0.45], [84.5, 1.0]]),
      uFaded: 0,
      uBeam: 0,
      uExpo: keys(t, [[79.8, 1.2], [85.4, 1.6]]),
    }),
  },
  {
    // 它们开始记得：海边的夜，远处岬角下亮起一片聚落的灯火
    prog: "land",
    from: 84.8,
    to: 92.0,
    fade: 1.0,
    u: ({ t }) => ({
      ...NIGHT,
      ...cam(keys3(t, [[84.8, [1.8, 3.4, -18.5]], [92, [1.8, 3.6, -19.5]]]), keys3(t, [[84.8, [-4.5, 3.4, -28]], [92, [-4.9, 3.6, -28]]]), 26),
      uFire: [0, 0, 0, 0],
      uFigures: 0,
      uTown: keys(t, [[85.6, 0], [91.5, 1]]),
      uWaveT: t,
      uSeaAmt: 1,
        uMoon: [0, 1, 0, 0],
      uExpo: 1.7,
    }),
    post: { tint: [0.92, 0.97, 1.08] },
  },
];
