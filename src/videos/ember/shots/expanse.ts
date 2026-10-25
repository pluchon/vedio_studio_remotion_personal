// 五 · 疆域（155–186）：整个频段回来。一队队飞船从母星出发 → 一颗，十颗，一千颗 → 四个陌生的家园 →
// 收拢整颗恒星的光（戴森云）→ 疆域辽阔，一道光从一端走到另一端 → 航线像光脉
import type { Uniforms } from "../gl/engine";
import { glowDot, glowLine, projectLine, rng } from "../draw";
import { EARTHLIKE, sunDir } from "../presets";
import { cam, ease, keys, keys3, lin, mix, project, type Shot, type V3 } from "../shot";

// 母星在星系盘上的位置（和「自己很小」那一镜的暖光同一处）
export const HOME_G: V3 = [0.55, 0.004, 0.32];

// 文明的星图：一千多颗星，按离母星的远近排出点亮顺序，每颗连到比它先亮、离它最近的那颗
type Node = { p: V3; parent: number; d: number };
export const NODES: Node[] = (() => {
  const r = rng(99);
  const pts: V3[] = [HOME_G];
  while (pts.length < 1400) {
    const a = r() * Math.PI * 2;
    const rr = Math.pow(r(), 0.6) * 0.32;
    const p: V3 = [HOME_G[0] + Math.cos(a) * rr * 1.3, (r() - 0.5) * 0.012, HOME_G[2] + Math.sin(a) * rr * 0.9];
    pts.push(p);
  }
  const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // 离母星近的先亮，加一点随机
  const order = pts.map((p, i) => ({ p, k: i === 0 ? -1 : dist(p, HOME_G) * (0.75 + r() * 0.5) })).sort((a, b) => a.k - b.k);
  const out: Node[] = [];
  order.forEach(({ p }, i) => {
    let best = -1;
    let bd = 1e9;
    for (let j = Math.max(0, i - 400); j < i; j++) {
      const d = dist(p, out[j].p);
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    out.push({ p, parent: best, d: dist(p, HOME_G) });
  });
  return out;
})();

const WARM: V3 = [1.0, 0.62, 0.28];

// 画到画幅上：前 count 颗亮着（小数部分是正在亮的那颗）；fade(i) 控制每颗的亮度（熄灭时用）
export function drawNetwork(g: CanvasRenderingContext2D, u: Uniforms, count: number, opts: { links?: number; dot?: number; fade?: (i: number, n: Node) => number; pulse?: (n: Node) => number } = {}) {
  const n = Math.min(NODES.length, Math.ceil(count));
  const proj = NODES.slice(0, n).map((nd) => project(u, nd.p));
  const links = opts.links ?? 1;
  const dot = opts.dot ?? 1;
  for (let i = 1; i < n; i++) {
    const a = proj[i];
    const pi = NODES[i].parent;
    const b = pi >= 0 ? proj[pi] : null;
    const f = (opts.fade ? opts.fade(i, NODES[i]) : 1) * (i === n - 1 ? count - Math.floor(count) || 1 : 1);
    if (a && b && links > 0) glowLine(g, [[a[0], a[1]], [b[0], b[1]]], WARM, 0.8, 0.22 * links * f);
  }
  for (let i = 0; i < n; i++) {
    const a = proj[i];
    if (!a) continue;
    const f = (opts.fade ? opts.fade(i, NODES[i]) : 1) * (i === n - 1 ? count - Math.floor(count) || 1 : 1);
    const pulse = opts.pulse ? opts.pulse(NODES[i]) : 0;
    const big = i === 0 ? 1.6 : 1;
    g.fillStyle = `rgba(255,${Math.round(170 + pulse * 60)},${Math.round(90 + pulse * 90)},${Math.min(1, (0.85 + pulse) * f * dot)})`;
    g.beginPath();
    g.arc(a[0], a[1], (1.4 + pulse * 1.5) * big, 0, Math.PI * 2);
    g.fill();
    if (i < 12 || pulse > 0.1) glowDot(g, a[0], a[1], 3 * big + pulse * 3, WARM, 0.35 * f * dot);
  }
}

// 「一颗，十颗，一千颗」：数目在对数刻度上走，三个词出现时正好是 1、10、1000
const countAt = (t: number) => {
  const k = keys(t, [
    [159.4, 0],
    [160.1, 1],
    [160.9, 3],
    [163.6, 3.12],
  ]);
  return Math.pow(10, k);
};

const galaxyU = (u: Uniforms): Uniforms => ({ uSpin: 0, uExpo: 0.9, uBg: 0.6, uDive: 0, uWarm: 0, uWarmAt: HOME_G, uCanvasGain: 2.2, ...u });

// 出发的船队：从行星边缘射向四面八方的星
const fleetCam = (t: number) => cam(keys3(t, [[154.8, [0.3, 0.6, 3.6]], [159.8, [0.6, 0.9, 5.4]]]), [0, 0, 0], 40);
const fleet = (() => {
  const r = rng(5);
  return Array.from({ length: 34 }, () => {
    const d: V3 = [r() * 2 - 1, r() * 1.2 - 0.6, r() * 2 - 1.3];
    const l = Math.hypot(...d);
    return { d: [d[0] / l, d[1] / l, d[2] / l] as V3, start: r() * 2.6, speed: 0.6 + r() * 0.8 };
  });
})();

// 四个陌生的家园
const HOMES: Uniforms[] = [
  { uSeed: 7.7, uSea: 0.3, uOcean: [0.05, 0.025, 0.01], uLandA: [0.42, 0.2, 0.08], uLandB: [0.6, 0.36, 0.16], uIceC: [0.8, 0.75, 0.7], uIce: 0.97, uDesert: 1, uBetaR: [9, 8, 7], uBetaM: 30, uAtm: 0.6, uCloud: 0.0, uLightCol: [1, 0.55, 0.25] },
  { uSeed: 12.1, uSea: 0.45, uOcean: [0.01, 0.03, 0.05], uLandA: [0.5, 0.55, 0.6], uLandB: [0.7, 0.75, 0.8], uIceC: [0.85, 0.9, 0.95], uIce: 0.2, uDesert: 0, uBetaR: [5, 12, 30], uBetaM: 10, uAtm: 0.5, uCloud: 0.3, uLightCol: [1, 0.7, 0.4] },
  { uSeed: 4.4, uSea: 0.66, uOcean: [0.002, 0.02, 0.03], uLandA: [0.03, 0.07, 0.04], uLandB: [0.1, 0.12, 0.06], uIceC: [0.8, 0.85, 0.9], uIce: 0.85, uDesert: 0.2, uBetaR: [5, 14, 36], uBetaM: 14, uAtm: 0.7, uCloud: 0.65, uLightCol: [1, 0.6, 0.3] },
  { uSeed: 9.2, uSea: 0.5, uOcean: [0.01, 0.005, 0.004], uLandA: [0.18, 0.06, 0.04], uLandB: [0.3, 0.1, 0.06], uIceC: [0.6, 0.6, 0.65], uIce: 0.7, uDesert: 0.8, uBetaR: [12, 8, 6], uBetaM: 22, uAtm: 0.6, uCloud: 0.2, uLightCol: [1, 0.5, 0.2] },
];
const homeShot = (i: number, from: number): Shot => ({
  prog: "planet",
  from,
  to: from + 1.75,
  fade: 0.2,
  u: ({ lt }) => {
    const sun: V3 = i === 3 ? [-1, 0.05, -0.3] : [-1, 0.2, -0.5 + i * 0.3];
    return {
      ...EARTHLIKE,
      ...HOMES[i],
      ...cam([mix(-0.4, -0.2, lt / 1.75) + i * 0.1, 0.25 - i * 0.12, 2.6 - lt * 0.08], [0.25, 0, 0], 40),
      uSun: sunDir(sun),
      uSunCol: i === 3 ? [9, 5, 3] : [8, 7.7, 7.1],
      uSunSize: 0.01,
      uSpinA: i * 1.7 + lt * 0.02,
      uCloudT: lt * 0.002,
      uCity: ease(lt, 0.1, 1.3),
      uOff: 0,
      uLightAmt: 1.2,
      uLaunch: [0, 0, 0, 0],
      uHalo: i === 2 ? 0.6 : 0,
      uStarsAmt: 0.12,
      uFlare: 0.4,
      uCanvasGain: 0,
    };
  },
});

export const EXPANSE: Shot[] = [
  {
    // 可它们没有停步：一道道光从母星出发，射向四面八方
    prog: "planet",
    from: 154.8,
    to: 159.8,
    fade: 0.4,
    u: ({ t }) => ({
      ...EARTHLIKE,
      ...fleetCam(t),
      uSun: sunDir([1, 0.15, -0.35]),
      uSunCol: [8, 7.7, 7.1],
      uSunSize: 0.008,
      uSpinA: 0.9,
      uCloudT: 0,
      uCity: 1,
      uOff: 0,
      uLightAmt: 1,
      uLaunch: [0, 0, 0, 0],
      uHalo: 1,
      uStarsAmt: 0.15,
      uFlare: 0.5,
      uCanvasGain: 2.0,
    }),
    draw: (g, { t, lt }) => {
      const u = fleetCam(t);
      for (const f of fleet) {
        const s = (lt - f.start) * f.speed;
        if (s <= 0) continue;
        const pts: V3[] = [];
        for (let k = 0; k <= 16; k++) {
          const q = Math.max(0, s - 1.2) + (Math.min(s, 1.2) * k) / 16;
          const r = 1.15 + q * 3;
          pts.push([f.d[0] * r, f.d[1] * r, f.d[2] * r]);
        }
        const line = projectLine(u, pts);
        // 尾巴越往后越淡
        for (let k = 0; k + 1 < line.length; k++) glowLine(g, [line[k], line[k + 1]], [1, 0.75, 0.45], 0.9, 0.55 * ((k + 1) / line.length) ** 1.5);
        const head = projectLine(u, [pts[pts.length - 1]])[0];
        if (head) glowDot(g, head[0], head[1], 2.5, [1, 0.85, 0.65], 0.9);
      }
    },
  },
  {
    // 一颗，十颗，一千颗：星系盘上，文明的灯从母星一颗颗跳出去
    prog: "galaxy",
    from: 159.4,
    to: 163.8,
    fade: 0.4,
    u: ({ t }) =>
      galaxyU({
        ...cam(
          keys3(t, [[159.4, [HOME_G[0] + 0.03, 0.035, HOME_G[2] + 0.06]], [160.4, [HOME_G[0] + 0.06, 0.09, HOME_G[2] + 0.15]], [163.8, [HOME_G[0] + 0.25, 0.42, HOME_G[2] + 0.62]]]),
          HOME_G,
          40,
        ),
        uSpin: 0.9,
      }),
    draw: (g, { t }) => {
      const u = cam(
        keys3(t, [[159.4, [HOME_G[0] + 0.03, 0.035, HOME_G[2] + 0.06]], [160.4, [HOME_G[0] + 0.06, 0.09, HOME_G[2] + 0.15]], [163.8, [HOME_G[0] + 0.25, 0.42, HOME_G[2] + 0.62]]]),
        HOME_G,
        40,
      );
      drawNetwork(g, u, countAt(t));
    },
  },
  homeShot(0, 163.6),
  homeShot(1, 165.2),
  homeShot(2, 166.8),
  homeShot(3, 168.4),
  {
    // 它们收拢整颗恒星的光：一层层的板把恒星包起来，恒星暗下去
    prog: "star",
    from: 169.8,
    to: 175.6,
    fade: 0.4,
    u: ({ t }) => ({
      ...cam(keys3(t, [[169.8, [1.2, 0.8, 5.6]], [175.6, [-0.4, 1.1, 6.2]]]), [0, 0, 0], 42),
      uSwarm: keys(t, [[170, 0.15], [174.8, 0.97]]),
      uStarI: 1.1,
      uExpo: 1,
      uStarsAmt: 0.12,
      uRotT: t,
    }),
  },
  {
    // 疆域辽阔：退远，一大片暖光铺在旋臂上，一道光从一端慢慢走到另一端
    prog: "galaxy",
    from: 175.2,
    to: 181.8,
    fade: 0.6,
    u: ({ t }) => galaxyU({ ...cam(keys3(t, [[175.2, [0.95, 0.5, 1.15]], [181.8, [1.25, 0.75, 1.6]]]), [0.42, -0.02, 0.2], 40), uSpin: 0.9 }),
    draw: (g, { t, lt }) => {
      const u = cam(keys3(t, [[175.2, [0.95, 0.5, 1.15]], [181.8, [1.25, 0.75, 1.6]]]), [0.42, -0.02, 0.2], 40);
      const front = mix(0, 0.42, lin(lt, 0.4, 6.4));
      drawNetwork(g, u, NODES.length, { links: 0.7, dot: 0.8, pulse: (n) => Math.exp(-Math.pow((n.d - front) / 0.012, 2)) });
    },
  },
  {
    // 航线像光脉：贴近看，一条条连线在流动
    prog: "galaxy",
    from: 181.4,
    to: 186.8,
    fade: 0.6,
    u: ({ t }) => galaxyU({ ...cam(keys3(t, [[181.4, [HOME_G[0] + 0.12, 0.07, HOME_G[2] + 0.2]], [186.8, [HOME_G[0] + 0.02, 0.05, HOME_G[2] + 0.1]]]), [HOME_G[0] - 0.08, 0, HOME_G[2] - 0.05], 46), uSpin: 0.9, uCanvasGain: 2.6 }),
    draw: (g, { t, lt }) => {
      const u = cam(keys3(t, [[181.4, [HOME_G[0] + 0.12, 0.07, HOME_G[2] + 0.2]], [186.8, [HOME_G[0] + 0.02, 0.05, HOME_G[2] + 0.1]]]), [HOME_G[0] - 0.08, 0, HOME_G[2] - 0.05], 46);
      drawNetwork(g, u, NODES.length, { links: 1.6, dot: 0.9, pulse: (n) => 0.5 + 0.5 * Math.sin(n.d * 140 - lt * 4) });
    },
  },
];
