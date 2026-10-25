// 七 · 熄灭（232–251）和尾 · 星海（251–296）：同步的闪烁越来越慢 → 母星的夜面一片片暗下去 → 先是远疆、再是航道、最后是母星 →
// 最后一点火苗在配乐静下来的那一刻（4:07.6）熄灭 → 黑暗里，行星还在，星系还在，光子还在路上 → 退回星海，落回第一帧的超深场
import type { Uniforms } from "../gl/engine";
import { EARTHLIKE, sunDir } from "../presets";
import { BEAT } from "../theme";
import { cam, ease, keys, keys3, lin, mix, type Shot, type V3 } from "../shot";
import { HOME_G, NODES, drawNetwork } from "./expanse";

const galaxyBase: Uniforms = { uSpin: 0.9, uExpo: 0.9, uBg: 0.6, uDive: 0, uWarm: 0, uWarmAt: HOME_G, uCanvasGain: 1.6 };
const pulseCam = (t: number) => cam(keys3(t, [[232.4, [1.3, 0.9, 1.8]], [237.2, [1.2, 0.85, 1.7]]]), [0.42, -0.02, 0.2], 40);
const outCam = (t: number) => cam(keys3(t, [[240.6, [1.0, 0.62, 1.3]], [246, [0.9, 0.5, 1.1]]]), [0.48, -0.02, 0.26], 40);

// 和序里同一个光子：还在走那几百万年的路
const A: V3 = [0, 0, 0];
const B: V3 = [7.5, 2.2, -10];
const along = (s: number): V3 => [mix(A[0], B[0], s), mix(A[1], B[1], s), mix(A[2], B[2], s)];
const dirAB: V3 = (() => {
  const d: V3 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
  const l = Math.hypot(...d);
  return [d[0] / l, d[1] / l, d[2] / l];
})();

const NIGHT_PLANET: Uniforms = {
  ...EARTHLIKE,
  uSunCol: [8, 7.7, 7.1],
  uSunSize: 0.01,
  uCloudT: 0,
  uLightAmt: 1,
  uLaunch: [0, 0, 0, 0],
  uStarsAmt: 0.12,
  uFlare: 0.35,
  uCanvasGain: 0,
};

export const CODA: Shot[] = [
  {
    // 没有交火，也没有挣扎：所有的灯一起闪，越闪越慢
    prog: "galaxy",
    from: 232.6,
    to: 237.2,
    fade: 0.8,
    u: ({ t }) => ({ ...galaxyBase, ...pulseCam(t) }),
    draw: (g, { t, lt }) => {
      // 相位：频率从 1.6 Hz 慢慢降到 0.3 Hz
      const phase = lt * 2 * Math.PI * mix(1.6, 0.3, lin(lt, 0, 4.6)) * 0.7;
      const p = 0.5 + 0.5 * Math.sin(phase);
      drawNetwork(g, pulseCam(t), NODES.length, { links: 0.55, dot: 0.45 + 0.35 * p, pulse: () => p * 0.25 });
    },
  },
  {
    // 那些灯火，只是不必再亮着了：母星的夜面一片片暗下去
    prog: "planet",
    from: 236.8,
    to: 241.2,
    fade: 0.6,
    u: ({ t }) => ({
      ...NIGHT_PLANET,
      ...cam(keys3(t, [[236.8, [0.0, 0.25, 2.9]], [241.2, [0.05, 0.27, 2.75]]]), [0, 0.05, 0], 42),
      uSun: sunDir([0.12, 0.08, -1]),
      uSpinA: 0.75,
      uCity: 1,
      uOff: keys(t, [[237.0, 0], [241.2, 0.62]]),
      uHalo: 1 - ease(t, 237, 239),
    }),
  },
  {
    // 先是远疆，再是航道，最后是母星：星图从边上往回熄
    prog: "galaxy",
    from: 240.8,
    to: 246.0,
    fade: 0.6,
    u: ({ t }) => ({ ...galaxyBase, ...outCam(t) }),
    draw: (g, { t }) => {
      // 边疆线从最远处退回母星；航线比星先灭；母星最后
      const front = keys(t, [[241.0, 0.34], [244.6, 0.01], [245.6, 0]]);
      const homeLeft = 1 - ease(t, 245.0, 245.9);
      drawNetwork(g, outCam(t), NODES.length, {
        links: 1,
        dot: 1,
        fade: (i, n) => (i === 0 ? homeLeft : ease(front + 0.02 - n.d, 0, 0.02)),
      });
    },
  },
  {
    // 最后一盏灯：一点小火苗缩成余烬，在配乐静下来的那一刻熄灭，留下一缕烟
    prog: "fire",
    from: 245.6,
    to: 251.2,
    fade: 0.6,
    out: 1.2,
    u: ({ t }) => ({
      ...cam([0, 0.16, 0.9], [0, 0.1, 0], 34),
      uIgnite: 1,
      uDie: keys(t, [[245.8, 0.74], [247.0, 0.9], [BEAT.silent, 1.0]]),
      uSmoke: ease(t, BEAT.silent - 0.2, BEAT.silent + 0.8) * (1 - ease(t, 249.5, 251)),
      uLogs: 0,
      uExpo: 1,
    }),
  },
  {
    // 宇宙还是原来的样子：黑暗里，行星还在，被它的恒星照出一弯；镜头慢慢退开
    prog: "planet",
    from: 251.0,
    to: 259.0,
    fade: 1.8,
    u: ({ t }) => {
      const d = keys(t, [[251, 2.6], [259, 9]]);
      const dir: V3 = [-0.45, 0.22, 0.86];
      return {
        ...NIGHT_PLANET,
        ...cam([dir[0] * d, dir[1] * d, dir[2] * d], [mix(0, -1.2, ease(t, 252, 259)), 0, 0], 40),
        uSun: sunDir([1, 0.1, 0.15]),
        uSpinA: 1.0,
        uCity: 1,
        uOff: 1,
        uHalo: 0,
      } as Uniforms;
    },
  },
  {
    // 光从一条星河出发，还在走那几百万年的路：回到序里那两个星系，光子还在路上；镜头一直往后退
    prog: "galaxy",
    from: 258.0,
    to: 276.6,
    fade: 1.6,
    u: ({ t }) => ({
      ...cam(
        keys3(t, [[258, [1.6, 0.9, 2.6]], [264, [-0.6, 3.2, 8.6]], [270, [-3, 6.5, 18]], [276.6, [-5, 10, 30]]]),
        keys3(t, [[258, [0.1, -0.05, 0]], [264, [2.6, 0.6, -4.2]], [276.6, [3.2, 1.0, -5]]]),
        40,
      ),
      uSpin: t * 0.006,
      uExpo: 1,
      uBg: 1.2,
      uDive: 0,
      uG2: [...B, 0.85],
      uG2n: [0.35, 0.8, 0.48],
      uPh: [...along(0.47 + lin(t, 258, 276.6) * 0.02), ease(t, 259, 260.5) * (1 - ease(t, 270, 272))],
      uPhDir: dirAB,
      uStar: [0, 0, 0, 0],
      uWarm: 0,
      uWarmAt: [0, 0, 0],
      uCanvasGain: 0,
    }),
  },
  {
    // 星海很亮，也很安静：星系场里慢慢往后飘，最后落回第一帧那张超深场
    prog: "deep",
    from: 275.0,
    to: 284.4,
    fade: 1.6,
    out: 0.6,
    u: ({ t }) => {
      const k = ease(t, 278.6, 282.6);
      return {
        ...cam([0.5, 0.5, -10 + lin(t, 275, 283) * 7.2 + Math.pow(1 - lin(t, 275, 283), 2) * -4], [0.65, 0.55, -24], 46),
        uPhoto: k,
        uZoom: mix(1.05, 1.0, ease(t, 277, 283)),
        uPan: [0, 0],
        uField: 1 - ease(t, 279.5, 283),
        uFieldExpo: 1,
      };
    },
    post: ({ t }) => {
      const k = ease(t, 279, 283);
      return { raw: k, bloom: mix(0.5, 0, k), vignette: mix(0.35, 0, k), grain: 0.02, ca: mix(0.3, 0, k) };
    },
  },
];
