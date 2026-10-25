// 六 · 跃迁（185–232，以下是一种想象）：暗的液面醒过来 → 一直铺到地平线的意识之海 → 两个世界连成一个念头 →
// 星图上的网整片亮起 → 两束丝缠在一起 → 两点光合成一点 → 船和文字都散了 → 光之曼陀罗（全曲最高处）→ 前面的路没了
import { glowLine, rng, type P2 } from "../draw";
import { cam, ease, keys, keys3, lin, mix, type Shot } from "../shot";
import { HOME_G, NODES, drawNetwork } from "./expanse";

const SEA_BASE = { uStarsAmt: 0.15, uHorizon: 1 };

// 不再需要飞船，也不再需要文字：那些符号（发着光）一笔笔散成光点，往上飘走
const glyphStrokes: P2[][] = (() => {
  const r = rng(31);
  const out: P2[][] = [];
  for (let k = 0; k < 14; k++) {
    const cx = 260 + (k % 7) * 230 + (r() - 0.5) * 60;
    const cy = 300 + Math.floor(k / 7) * 220 + (r() - 0.5) * 50;
    const kind = k % 4;
    if (kind === 0) {
      for (let i = 0; i < 3; i++) out.push([[cx - 40 + i * 35, cy - 50], [cx - 30 + i * 35, cy + 50]]);
    } else if (kind === 1) {
      out.push(Array.from({ length: 40 }, (_, i) => [cx + Math.cos(i * 0.45) * i * 1.4, cy + Math.sin(i * 0.45) * i * 1.4] as P2));
    } else if (kind === 2) {
      out.push([[cx - 60, cy], [cx - 30, cy - 40], [cx, cy], [cx + 30, cy - 40], [cx + 60, cy]]);
    } else {
      out.push([[cx, cy - 55], [cx, cy + 55]]);
      out.push([[cx, cy], [cx + 40, cy - 40]]);
      out.push([[cx, cy + 20], [cx - 40, cy - 20]]);
    }
  }
  return out;
})();

function drawDissolve(g: CanvasRenderingContext2D, lt: number) {
  const r = rng(8);
  glyphStrokes.forEach((st, si) => {
    const start = 0.6 + (si / glyphStrokes.length) * 2.2;
    const k = lin(lt, start, start + 1.6);
    if (k < 1) glowLine(g, st, [1, 0.62, 0.3], 2, 0.75 * (1 - k));
    for (let i = 0; i < st.length; i++) {
      for (let j = 0; j < 3; j++) {
        const [x, y] = st[i];
        const dx = (r() - 0.5) * 120 * k;
        const dy = -k * (60 + r() * 220);
        const a = Math.sin(Math.PI * Math.min(1, k * 1.2)) * 0.8;
        if (a <= 0.01) continue;
        g.fillStyle = `rgba(255,190,120,${a})`;
        g.beginPath();
        g.arc(x + dx, y + dy, 1.3, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

const netCam = (t: number) => cam(keys3(t, [[203.4, [0.95, 0.5, 1.15]], [208, [1.4, 1.0, 1.9]]]), [0.42, -0.02, 0.2], 40);

export const ASCEND: Shot[] = [
  {
    // 唤醒一种新物质：暗的液面，一滴滴落下去，底下慢慢长出暖光的脉络
    prog: "sea",
    from: 185.6,
    to: 192.8,
    fade: 1.2,
    u: ({ t }) => ({
      ...SEA_BASE,
      ...cam(keys3(t, [[185.6, [0, 1.2, 4]], [192.8, [0, 1.6, 0]]]), keys3(t, [[185.6, [0, 0.2, -8]], [192.8, [0, 0.3, -12]]]), 40),
      uAwake: keys(t, [[186.6, 0.02], [192.8, 0.45]]),
      uDrops: t - 186.2,
      uFlow: t,
      uExpo: 1.4,
    }),
  },
  {
    // 意识之海：一直铺到地平线的光
    prog: "sea",
    from: 192.4,
    to: 198.8,
    fade: 0.8,
    u: ({ t }) => ({
      ...SEA_BASE,
      ...cam(keys3(t, [[192.4, [0, 2.2, 0]], [198.8, [0, 3.0, -9]]]), keys3(t, [[192.4, [0, 1.0, -30]], [198.8, [0, 1.6, -40]]]), 46),
      uAwake: keys(t, [[192.4, 0.5], [196, 1]]),
      uDrops: 0,
      uFlow: t,
      uExpo: 1.2,
    }),
  },
  {
    // 相隔几千光年的两个世界，连成了同一个念头
    prog: "flow",
    from: 198.4,
    to: 203.8,
    fade: 0.6,
    u: ({ t }) => ({
      ...cam([0, 0, 3], [0, 0, 0], 40),
      uMode: 0,
      uGrow: keys(t, [[198.8, 0], [201.6, 1]]),
      uSync: ease(t, 201.4, 203.2),
      uMerge: ease(t, 201.8, 203.8) * 0.8,
      uFade: 0,
      uExpo: 1,
      uStarsAmt: 0.12,
    }),
  },
  {
    // 有人说，这是文明最后的跃迁：星图上的网整片亮起来，一起脉动
    prog: "galaxy",
    from: 203.4,
    to: 208.0,
    fade: 0.6,
    u: ({ t }) => ({
      ...netCam(t),
      uSpin: 0.9,
      uExpo: 0.9,
      uBg: 0.6,
      uDive: 0,
      uWarm: 0,
      uWarmAt: HOME_G,
      uCanvasGain: 1.6,
    }),
    draw: (g, { t, lt }) => {
      const sync = 0.5 + 0.5 * Math.sin(lt * 3.2);
      drawNetwork(g, netCam(t), NODES.length, { links: mix(0.6, 1.3, ease(lt, 0, 3)), dot: 0.8, pulse: () => sync * 0.6 * ease(lt, 0.5, 2.5) });
    },
  },
  {
    // 彼此的念头再也无法剥离：两束丝缠在一起，颜色变成一样
    prog: "flow",
    from: 207.6,
    to: 212.8,
    fade: 0.6,
    u: ({ t }) => ({
      ...cam([0, 0, 3], [0, 0, 0], 40),
      uMode: 1,
      uGrow: keys(t, [[207.6, 0.2], [209.6, 1]]),
      uSync: 1,
      uMerge: keys(t, [[209.2, 0], [212.8, 1]]),
      uFade: 0,
      uExpo: 1,
      uStarsAmt: 0.1,
    }),
  },
  {
    // 没有了「你」和「我」的分别：两点光靠近，合成一点（和海里那条分子一分为二正好反过来）
    prog: "cells",
    from: 212.4,
    to: 216.8,
    fade: 0.6,
    u: ({ t }) => ({
      ...cam([0, 0.1, 2.4], [0, 0, 0], 38),
      uCopy: 0,
      uFocus: 2.4,
      uAperture: 0.02,
      uGlow: 1.3,
      uMerge: keys(t, [[212.4, 0.02], [216.2, 1]]),
      uTintA: [1.0, 0.6, 0.26],
      uTintB: [1.0, 0.45, 0.42],
    }),
    post: { bloom: 0.8 },
  },
  {
    // 不再需要飞船，也不再需要文字
    prog: "board",
    from: 216.2,
    to: 220.8,
    fade: 0.5,
    u: () => ({ ...cam([0, 0, 3], [0, 0, 0], 40), uStarsAmt: 0.1, uPaper: 0, uDust: 0, uBgTint: [0.002, 0.002, 0.003], uCanvasGain: 2.0 }),
    draw: (g, { lt }) => drawDissolve(g, lt),
  },
  {
    // 当一切都已通晓：光之曼陀罗，全曲最高处
    prog: "flow",
    from: 220.4,
    to: 226.2,
    fade: 0.6,
    u: ({ t }) => ({
      ...cam([0, 0, 3], [0, 0, 0], 40),
      uMode: 2,
      uGrow: keys(t, [[220.4, 0.1], [223.5, 1]]),
      uSync: 1,
      uMerge: 1,
      uFade: 0,
      uExpo: 1,
      uStarsAmt: 0.06,
    }),
  },
  {
    // 继续向前走，突然失去了意义：一条光路伸向远方，前面一段段没了，镜头停下来
    prog: "flow",
    from: 225.6,
    to: 232.8,
    fade: 0.8,
    u: ({ t }) => ({
      ...cam(keys3(t, [[225.6, [0, 1.0, 0]], [229.5, [0, 1.0, -6]], [232.8, [0, 1.0, -6.3]]]), keys3(t, [[225.6, [0, 0.55, -30]], [229.5, [0, 0.55, -36]], [232.8, [0, 0.55, -36.3]]]), 50),
      uMode: 3,
      uGrow: 1,
      uSync: 1,
      uMerge: 1,
      uFade: keys(t, [[225.6, 220], [228.0, 120], [232.4, 8]]),
      uExpo: 1,
      uStarsAmt: 0.12,
    }),
  },
];
