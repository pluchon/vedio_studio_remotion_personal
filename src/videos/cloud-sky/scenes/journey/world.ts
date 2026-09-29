// 云的旅程这幅长卷的「世界」：横向的地形（海 → 山 → 麦田 → 村子 → 山谷 → 草地），以及云在世界里走到哪儿
import { interpolate } from "remotion";
import { SEGMENTS, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const t = localTime(SEGMENTS.journey);

// 各段在世界里的横坐标
export const REGION = {
  shore: 1950,
  peak: 3100,
  fieldFrom: 4050,
  fieldTo: 5300,
  village: [5130, 5700] as const,
  valley: 5900,
  meadowFrom: 6450,
  child: 7180,
};

const bump = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

// 地面高度：起伏的底子，减去山，加上山谷，再在草地上鼓起一个小坡；岸线以左是海
export const groundY = (x: number) => {
  const base = 722 + 18 * Math.sin(x / 170) + 9 * Math.sin(x / 61 + 1);
  const mountains =
    120 * bump(x, 2260, 160) +
    270 * bump(x, 2620, 210) +
    470 * bump(x, REGION.peak, 250) +
    300 * bump(x, 3560, 230) +
    150 * bump(x, 3900, 200);
  const y = base - mountains + 80 * bump(x, REGION.valley, 260) - 40 * bump(x, REGION.child, 320);
  return 1300 + (y - 1300) * smooth(REGION.shore - 260, REGION.shore + 200, x);
};

// 云在世界里的位置（关键帧按配乐的秒数），再做一次滑动平均让速度变化柔和
const KEYS: [number, number][] = [
  [17.1, 600],
  [21.8, 1150],
  [23.5, 1700],
  [26.6, 3100],
  [29.0, 3800],
  [32.6, 5150],
  [33.4, 5500],
  [36.5, 5950],
  [38.8, 6900],
  [44.1, 7270],
];
const rawWorldX = (f: number) =>
  interpolate(
    f,
    KEYS.map(([s]) => t(s)),
    KEYS.map(([, x]) => x),
    clamp,
  );
export const cloudWorldX = (f: number) => {
  let sum = 0;
  for (let k = -12; k <= 12; k += 3) sum += rawWorldX(f + k);
  return sum / 9;
};

// 云在画面上的位置：在右半边慢慢往右走，给左上角的字留出地方；刚出生时贴着海面，之后升到天上
export const cloudScreen = (f: number) => ({
  x: interpolate(f, [0, t(44.1)], [1000, 1150], clamp),
  y: interpolate(f, [t(17.1), t(21.6)], [440, 330], clamp) + 10 * Math.sin(f / 50),
});

export const cameraX = (f: number) => cloudWorldX(f) - cloudScreen(f).x;

// 画面可见范围内按步长取样地形
export const sampleGround = (camX: number, step = 20) => {
  const pts: [number, number][] = [];
  for (let x = Math.floor((camX - 60) / step) * step; x <= camX + 1980; x += step) pts.push([x, groundY(x)]);
  return pts;
};
