// 三 · 宏伟（89–126）：夜面的灯火一点点铺开 → 背阴的半球满是灯火 → 星辰的轨道、原子的径迹、自己的双螺旋 →
// 飞船第一次离开 → 最骄傲的时刻（轨道上的光环、日出） → 一排射电望远镜对着银河 → 退远，行星缩成一个点
import type { Uniforms } from "../gl/engine";
import { glowDot, glowLine, projectLine, rng, type P2 } from "../draw";
import { EARTHLIKE, GALAXY_SKY, sunAt, sunDir } from "../presets";
import { cam, ease, keys, keys3, lin, mix, type Shot, type V3 } from "../shot";

const NIGHT_LIGHTS = {
  ...EARTHLIKE,
  uSunCol: [8, 7.7, 7.1],
  uSunSize: 0.01,
  uCloudT: 0,
  uOff: 0,
  uLightAmt: 1,
  uLaunch: [0, 0, 0, 0],
  uHalo: 0,
  uStarsAmt: 0.12,
  uFlare: 1,
  uCanvasGain: 0,
};

const GOLD: V3 = [1.0, 0.72, 0.38];
const PALE: V3 = [0.75, 0.85, 1.0];

// 星辰的轨道：一颗恒星，几圈倾斜的椭圆被一笔笔画出来，行星在上面走
const orbitCam = (lt: number) => cam([0, 1.3 + lt * 0.05, 3.2 - lt * 0.12], [0, 0, 0], 40);
function drawOrbits(g: CanvasRenderingContext2D, lt: number) {
  const u = orbitCam(lt);
  const c = projectLine(u, [[0, 0, 0]])[0];
  if (c) glowDot(g, c[0], c[1], 7, [1, 0.85, 0.6], 0.9);
  for (let k = 0; k < 5; k++) {
    const a = 0.45 + k * 0.32;
    const e = 0.12 + 0.05 * k;
    const tilt = 0.08 * k;
    const drawn = lin(lt, 0.1 + k * 0.18, 0.9 + k * 0.22);
    const pts: V3[] = [];
    const n = Math.max(2, Math.floor(160 * drawn));
    for (let i = 0; i <= n; i++) {
      const th = (i / 160) * Math.PI * 2;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(th));
      pts.push([r * Math.cos(th), r * Math.sin(th) * Math.sin(tilt), r * Math.sin(th) * Math.cos(tilt)]);
    }
    glowLine(g, projectLine(u, pts), GOLD, 1.3, 0.55);
    if (drawn > 0.99) {
      const th = lt * (1.4 / Math.pow(a, 1.5)) + k * 2;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(th));
      const pp = projectLine(u, [[r * Math.cos(th), r * Math.sin(th) * Math.sin(tilt), r * Math.sin(th) * Math.cos(tilt)]])[0];
      if (pp) glowDot(g, pp[0], pp[1], 3, PALE, 0.9);
    }
  }
}

// 拆开原子：气泡室里的粒子径迹，从一点炸开，一条条螺旋卷进去
function drawTracks(g: CanvasRenderingContext2D, lt: number) {
  const r = rng(77);
  const cx = 960;
  const cy = 400;
  for (let k = 0; k < 26; k++) {
    const dir = r() * Math.PI * 2;
    const len = 120 + r() * 520;
    const curl = (r() < 0.5 ? -1 : 1) * (0.004 + r() * 0.012);
    const grow = lin(lt, 0.05 + r() * 0.25, 0.6 + r() * 0.5);
    const pts: P2[] = [];
    let x = cx;
    let y = cy;
    let a = dir;
    let step = 6;
    const n = Math.floor((len / step) * grow);
    for (let i = 0; i < n; i++) {
      pts.push([x, y]);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      a += curl * (1 + i * 0.03);
      step *= 0.993;
    }
    glowLine(g, pts, k % 5 === 0 ? GOLD : PALE, 1.1, 0.5);
  }
  glowDot(g, cx, cy, 6, [1, 0.9, 0.7], ease(lt, 0, 0.3) * (1 - ease(lt, 0.4, 1.6)));
}

// 读懂自己的来历：双螺旋，和海里那条分子是同一个样子
const helixCam = (lt: number) => cam([Math.sin(lt * 0.25) * 0.4, 0.15, 1.7], [0, 0, 0], 40, 0.25);
function drawHelix(g: CanvasRenderingContext2D, lt: number) {
  const u = helixCam(lt);
  const spin = lt * 0.7;
  const shown = lin(lt, 0, 1.2);
  const A: V3[] = [];
  const B: V3[] = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const x = (s - 0.5) * 3.2;
    const a = x * 6.98 + spin;
    A.push([x, Math.cos(a) * 0.14, Math.sin(a) * 0.14]);
    B.push([x, Math.cos(a + 2.6) * 0.14, Math.sin(a + 2.6) * 0.14]);
  }
  const m = Math.floor(N * shown) + 1;
  glowLine(g, projectLine(u, A.slice(0, m)), GOLD, 2, 0.75);
  glowLine(g, projectLine(u, B.slice(0, m)), GOLD, 2, 0.75);
  for (let i = 0; i < m; i += 3) {
    const seg = projectLine(u, [A[i], B[i]]);
    glowLine(g, seg, [1, 0.6, 0.3], 1.2, 0.45);
  }
}

// 发射：从夜面的城市升起
// 发射点在右边那块大陆的海岸上（自转角 0.75 时的世界坐标；着色器要的是行星本地坐标）
const LAUNCH_LOCAL: V3 = [0.934, 0.3, 0.196];
const LAUNCH_SITE: V3 = (() => {
  const v: V3 = [0.55, 0.3, 0.78];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
const EAST: V3 = (() => {
  const v: V3 = [LAUNCH_SITE[2], 0, -LAUNCH_SITE[0]];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
const along = (a: number, b: number, c: number): V3 => [0, 1, 2].map((i) => LAUNCH_SITE[i] * a + EAST[i] * b + (i === 1 ? c : 0)) as V3;

export const RISE: Shot[] = [
  {
    // 地面亮起一座座城：贴着夜面飞，灯火沿着海岸一点点铺开
    prog: "planet",
    from: 90.6,
    to: 96.4,
    fade: 1.4,
    u: ({ t }) => ({
      ...NIGHT_LIGHTS,
      ...cam(keys3(t, [[90.6, [0.697, 0.223, 0.989]], [96.4, [0.69, 0.3, 0.97]]]), keys3(t, [[90.6, [0.477, 0.561, 0.677]], [96.4, [0.45, 0.62, 0.64]]]), 52, 0, [0.55, 0.3, 0.78]),
      uSun: sunDir([-0.544, 0.332, -0.771]),
      uFlare: 0.3,
      uSpinA: 0.75,
      uCity: keys(t, [[90.6, 0.3], [96.4, 0.9]]),
    }),
  },
  {
    // 背阴的半球，渐渐满是灯火：太阳躲在行星背后，大气亮成一圈
    prog: "planet",
    from: 95.8,
    to: 99.0,
    fade: 0.6,
    u: ({ t }) => ({
      ...NIGHT_LIGHTS,
      ...cam(keys3(t, [[95.8, [0.0, 0.25, 3.0]], [99, [0.15, 0.3, 2.75]]]), [0, 0.05, 0], 42),
      uSun: sunDir([0.12, 0.08, -1]),
      uFlare: 0.35,
      uSpinA: 0.75,
      uCity: keys(t, [[95.8, 0.85], [99, 1]]),
      uSunCol: [14, 13.4, 12.4],
    }),
  },
  {
    prog: "board",
    from: 98.6,
    to: 100.4,
    fade: 0.3,
    u: ({ lt }) => ({ ...orbitCam(lt), uStarsAmt: 0.15, uPaper: 0, uDust: 0, uBgTint: [0.002, 0.003, 0.006], uCanvasGain: 2.2 }),
    draw: (g, { lt }) => drawOrbits(g, lt),
  },
  {
    prog: "board",
    from: 100.2,
    to: 102.0,
    fade: 0.2,
    u: () => ({ ...cam([0, 0, 3], [0, 0, 0], 40), uStarsAmt: 0, uPaper: 0, uDust: 0, uBgTint: [0.002, 0.003, 0.005], uCanvasGain: 2.2 }),
    draw: (g, { lt }) => drawTracks(g, lt),
  },
  {
    prog: "board",
    from: 101.8,
    to: 103.8,
    fade: 0.2,
    u: ({ lt }) => ({ ...helixCam(lt), uStarsAmt: 0.08, uPaper: 0, uDust: 0, uBgTint: [0.003, 0.002, 0.002], uCanvasGain: 2.2 }),
    draw: (g, { lt }) => drawHelix(g, lt),
  },
  {
    // 飞船第一次驶离母星：一道光从夜面的城市里升起，弯向东边，穿过大气
    prog: "planet",
    from: 103.4,
    to: 109.6,
    fade: 0.5,
    u: ({ t }) => ({
      ...NIGHT_LIGHTS,
      ...cam(keys3(t, [[103.4, along(1.07, -0.2, 0)], [109.6, along(1.09, -0.22, 0.01)]]), keys3(t, [[103.4, along(1.08, 0.5, 0)], [109.6, along(1.2, 0.5, 0.05)]]), 50, 0, LAUNCH_SITE),
      uSun: sunDir(along(-0.25, 1, 0)),
      uFlare: 0.3,
      uSpinA: 0.75,
      uCity: 1,
      uLaunch: [...LAUNCH_LOCAL, keys(t, [[103.8, 0], [109.6, 1]])],
    }),
  },
  {
    // 这是它们最骄傲的时刻：整颗行星，夜面满是灯火，轨道上一圈细碎的光；太阳从边缘升起
    prog: "planet",
    from: 109.2,
    to: 114.8,
    fade: 0.8,
    u: ({ t }) => ({
      ...NIGHT_LIGHTS,
      ...cam(keys3(t, [[109.2, [-1.2, 0.55, 2.6]], [114.8, [-0.6, 0.45, 2.9]]]), [0.15, 0.0, 0], 44),
      uSun: sunDir(keys3(t, [[109.2, [0.42, 0.02, -1]], [114.8, [0.62, 0.08, -0.85]]])),
      uSunCol: [10, 9.6, 8.9],
      uFlare: 0.6,
      uSpinA: 0.9 + t * 0.004,
      uCity: 1,
      uHalo: ease(t, 109.6, 111.5),
    }),
  },
  {
    // 它们觉得，宇宙终于有了能读懂它的存在：一排射电望远镜对着银河
    prog: "land",
    from: 114.4,
    to: 120.8,
    fade: 0.8,
    u: ({ t }) => ({
      ...GALAXY_SKY,
      ...cam(keys3(t, [[114.4, [10, 1.6, 6]], [120.8, [6, 1.8, 4]]]), keys3(t, [[114.4, [-30, 15, -44]], [120.8, [-32, 19, -46]]]), 46),
      uSunDir: sunAt(10, -24),
      uSunI: 22,
      uMilky: 1,
      uNightStars: 0.2,
      uDishes: 1,
      uFire: [-10, 0, -200, 0],
      uFigures: 0,
      uTown: 0,
      uWaveT: t,
      uSeaAmt: 0,
      uMoon: [0.6, 0.35, 0.5, 0.05],
      uExpo: 1.7,
    }),
    post: { tint: [0.92, 0.97, 1.08] },
  },
  {
    // 退远：行星缩成一个点
    prog: "planet",
    from: 120.4,
    to: 126.6,
    fade: 1.0,
    u: ({ t }) => {
      const d = keys(t, [[120.4, 3.2], [126.6, 48]]);
      const dir: V3 = [-0.45, 0.22, 0.86];
      return {
        ...NIGHT_LIGHTS,
        ...cam([dir[0] * d, dir[1] * d, dir[2] * d], [mix(0, -6, ease(t, 121, 126.6)), 0, mix(0, 4, ease(t, 121, 126.6))], 40),
        uSun: sunDir([1, 0.1, 0.15]),
        uSunCol: [10, 9.6, 8.9],
        uSunSize: 0.008,
        uFlare: 0.5,
        uSpinA: 1.0,
        uCity: 1,
        uHalo: 1,
        uStarsAmt: 0.25,
      } as Uniforms;
    },
  },
];
