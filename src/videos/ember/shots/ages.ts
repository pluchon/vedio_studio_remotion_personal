// 四 · 时间的尘埃（125–155）：配乐抽空。一艘孤零零的船 → 两颗星之间，年份跳得飞快、船几乎不动 →
// 回信的光环还在路上，写信的那盏灯先暗了 → 洞壁上的符号落满灰 → 古老的星图里找母星 → 星系里很小很小的一点暖光
import { glowDot, glowLine, rng, type P2 } from "../draw";
import { cam, ease, keys3, lin, mix, type Shot, type V3 } from "../shot";
import { FONT } from "../theme";

const DUSTY = { sat: 0.55, lift: 0.06, grain: 0.05, tint: [1.0, 0.98, 0.95] as [number, number, number] };
const BOARD_BG = { uStarsAmt: 0.1, uPaper: 0, uDust: 0, uBgTint: [0.002, 0.0025, 0.004], uCanvasGain: 2.0 };
const flat = cam([0, 0, 3], [0, 0, 0], 40);

const HOME: P2 = [430, 420];
const AWAY: P2 = [1500, 380];

export function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, alpha: number) {
  g.font = `${size}px "${FONT}"`;
  g.textAlign = "center";
  g.fillStyle = `rgba(220,228,240,${alpha})`;
  g.fillText(text, x, y);
}

// 两颗星之间：年份跳得飞快，船几乎不动
function drawVoyage(g: CanvasRenderingContext2D, lt: number) {
  const a = ease(lt, 0, 0.8);
  glowDot(g, HOME[0], HOME[1], 6, [1, 0.8, 0.55], 0.9 * a);
  glowDot(g, AWAY[0], AWAY[1], 6, [0.8, 0.88, 1], 0.9 * a);
  const pts: P2[] = [];
  for (let i = 0; i <= 120; i += 2) {
    const s = i / 120;
    pts.push([mix(HOME[0], AWAY[0], s), mix(HOME[1], AWAY[1], s)]);
  }
  for (let i = 0; i < pts.length - 1; i += 2) glowLine(g, [pts[i], pts[i + 1]], [0.7, 0.75, 0.85], 1, 0.25 * a);
  const year = Math.max(1, Math.round(Math.pow(lin(lt, 0.6, 5.4), 1.3) * 64));
  const s = (year / 300) * 1.0;
  const x = mix(HOME[0], AWAY[0], s);
  const y = mix(HOME[1], AWAY[1], s);
  glowDot(g, x, y, 3, [1, 0.75, 0.45], a);
  label(g, `第 ${year} 年`, x, y - 26, 22, 0.75 * a);
}

// 回信的光环：从远处那颗星慢慢扩开；家里那盏灯在它到之前先暗了
function drawLetter(g: CanvasRenderingContext2D, lt: number) {
  const a = ease(lt, 0, 0.6);
  glowDot(g, AWAY[0], AWAY[1], 6, [0.8, 0.88, 1], 0.9 * a);
  const home = 1 - ease(lt, 3.2, 4.4);
  glowDot(g, HOME[0], HOME[1], 6, [1, 0.8, 0.55], 0.95 * a * home + 0.06 * a);
  const d = Math.hypot(AWAY[0] - HOME[0], AWAY[1] - HOME[1]);
  const r = mix(d * 0.35, d * 1.05, lin(lt, 0, 5.8));
  for (let k = 0; k < 3; k++) {
    const rr = r - k * 7;
    g.beginPath();
    g.arc(AWAY[0], AWAY[1], Math.max(rr, 1), 0, Math.PI * 2);
    g.strokeStyle = `rgba(200,215,240,${(0.5 - k * 0.15) * a})`;
    g.lineWidth = k === 0 ? 1.6 : 1;
    g.stroke();
  }
}

// 古老的星图：坐标圈、放射线、刻出来的星和连线；最后一个小圈圈住母星
const chartStars = (() => {
  const r = rng(2024);
  return Array.from({ length: 520 }, () => ({ x: r() * 2600 - 340, y: r() * 1300 - 250, m: Math.pow(r(), 3) }));
})();
function drawChart(g: CanvasRenderingContext2D, lt: number) {
  const ox = -lt * 26;
  const oy = -lt * 6;
  const cx = 1100 + ox;
  const cy = 520 + oy;
  const ink: V3 = [0.95, 0.75, 0.45];
  for (let k = 1; k <= 7; k++) {
    g.beginPath();
    g.arc(cx, cy, k * 140, 0, Math.PI * 2);
    g.strokeStyle = `rgba(240,190,120,${k % 2 ? 0.14 : 0.08})`;
    g.lineWidth = 1;
    g.stroke();
  }
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    glowLine(g, [[cx, cy], [cx + Math.cos(a) * 1100, cy + Math.sin(a) * 1100]], ink, 0.6, 0.08);
  }
  for (const s of chartStars) {
    const x = s.x + ox;
    const y = s.y + oy;
    g.beginPath();
    g.arc(x, y, 0.8 + s.m * 4, 0, Math.PI * 2);
    g.fillStyle = `rgba(245,205,140,${0.3 + s.m * 0.6})`;
    g.fill();
  }
  for (let i = 0; i < 60; i += 4) {
    const a = chartStars[i];
    const b = chartStars[i + 1];
    const c = chartStars[i + 2];
    glowLine(g, [[a.x + ox, a.y + oy], [b.x + ox, b.y + oy], [c.x + ox, c.y + oy]], ink, 0.7, 0.18);
  }
  // 母星：一颗很不起眼的小点，被圈出来
  const hx = 820 + ox;
  const hy = 470 + oy;
  g.beginPath();
  g.arc(hx, hy, 1.4, 0, Math.PI * 2);
  g.fillStyle = "rgba(255,210,150,0.8)";
  g.fill();
  const found = ease(lt, 2.6, 3.6);
  if (found > 0) {
    g.beginPath();
    g.arc(hx, hy, 16 + (1 - found) * 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * found);
    g.strokeStyle = `rgba(255,190,120,${0.8 * found})`;
    g.lineWidth = 1.4;
    g.stroke();
    label(g, "母星", hx, hy - 30, 18, 0.7 * ease(lt, 3.2, 4.0));
  }
}

export const AGES: Shot[] = [
  {
    // 可宇宙并不急着回答：一艘船在空无里慢慢漂过
    prog: "ship",
    from: 125.4,
    to: 131.0,
    fade: 1.0,
    u: ({ t }) => ({
      ...cam([0, 1.2, 20], [0, 0, 0], 38),
      uShipPos: keys3(t, [[125.4, [16, -0.5, -4]], [131, [-4, 0.5, -10]]]),
      uShipRot: t * 0.05,
      uKey: [0.9, 0.35, -0.4],
      uExpo: 1,
      uStarsAmt: 0.06,
      uEngine: 0.6,
    }),
    post: DUSTY,
  },
  {
    prog: "board",
    from: 130.6,
    to: 136.2,
    fade: 0.6,
    u: () => ({ ...flat, ...BOARD_BG }),
    draw: (g, { lt }) => drawVoyage(g, lt),
    post: DUSTY,
  },
  {
    prog: "board",
    from: 135.8,
    to: 141.6,
    fade: 0.6,
    u: () => ({ ...flat, ...BOARD_BG }),
    draw: (g, { lt }) => drawLetter(g, lt),
    post: DUSTY,
  },
  {
    // 时间落满万物：洞壁上的符号褪了色，一束冷光斜进来，尘埃在里面飘
    prog: "cave",
    from: 141.2,
    to: 146.6,
    fade: 0.8,
    u: ({ t }) => ({
      ...cam(keys3(t, [[141.2, [-0.6, 0.7, 1.9]], [146.6, [-0.2, 0.6, 1.6]]]), keys3(t, [[141.2, [-0.7, 0.6, 0]], [146.6, [-0.25, 0.55, 0]]]), 42),
      uFireAmt: 0.0,
      uShadows: 0,
      uTalk: 0,
      uMarks: 1,
      uFaded: 0.65,
      uBeam: 1,
      uBeamAt: [-0.45, 0.6],
      uExpo: 1.1,
    }),
    post: DUSTY,
  },
  {
    // 连母星的方位，都得翻找古老的星图
    prog: "board",
    from: 146.0,
    to: 150.9,
    fade: 0.6,
    u: () => ({ ...flat, uStarsAmt: 0, uPaper: 1, uDust: 1, uBgTint: [0.004, 0.003, 0.002], uCanvasGain: 1.0 }),
    draw: (g, { lt }) => drawChart(g, lt),
    post: DUSTY,
  },
  {
    // 它们第一次觉得，自己很小：星系里很小很小的一点暖光
    prog: "galaxy",
    from: 150.6,
    to: 155.8,
    fade: 0.8,
    u: ({ t }) => ({
      ...cam(keys3(t, [[150.6, [0.9, 0.55, 1.3]], [155.8, [1.25, 0.85, 2.1]]]), [0.12, -0.02, 0.1], 40),
      uSpin: t * 0.006,
      uExpo: 0.9,
      uBg: 0.6,
      uDive: 0,
      uWarm: 0.6 + 0.4 * Math.sin(t * 2.0),
      uWarmAt: [0.55, 0.004, 0.32],
    }),
    post: { sat: 0.7, lift: 0.04, grain: 0.045 },
  },
];

