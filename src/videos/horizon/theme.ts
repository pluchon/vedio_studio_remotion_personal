// 《光到不了的地方》的常量：取景地点与天球方向、镜头这一路怎么走、读数怎么写
import { staticFile } from "remotion";
import * as THREE from "three";
import { PARTICLE_HORIZON } from "./cosmology";
import { AU, C, GLY, KPC, LIGHT_DAY, LIGHT_YEAR, MOON_DIST, R_EARTH, YEAR } from "./units";

export * from "./units";

export const asset = (path: string) => `horizon/${path}`;
export const assetUrl = (path: string) => staticFile(asset(path));

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FOV = 40;
// 一个渲染单位远处的一个单位长，在画面上是多少像素
export const FOCAL = HEIGHT / 2 / Math.tan((FOV * Math.PI) / 360);

export const COLORS = { bg: "#020308", cream: "#efe6d2", soft: "rgba(239, 230, 210, 0.55)", rule: "#e0674f" };
export const FONT = "Horizon Song";

const RAD = Math.PI / 180;

// 世界坐标是赤道坐标系，Y 朝天北极：赤经 ra、赤纬 dec（度）→ 单位向量
export const equatorial = (ra: number, dec: number) =>
  new THREE.Vector3(Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.sin(dec * RAD), -Math.cos(dec * RAD) * Math.sin(ra * RAD));

// 黄道坐标：黄经 lon、黄纬 lat（度）→ 单位向量。黄赤交角 23.44°
const OBLIQUITY = 23.44 * RAD;
export const ecliptic = (lon: number, lat = 0) => {
  const l = lon * RAD;
  const b = lat * RAD;
  const x = Math.cos(b) * Math.cos(l);
  const y = Math.cos(b) * Math.sin(l) * Math.cos(OBLIQUITY) - Math.sin(b) * Math.sin(OBLIQUITY);
  const z = Math.cos(b) * Math.sin(l) * Math.sin(OBLIQUITY) + Math.sin(b) * Math.cos(OBLIQUITY);
  return new THREE.Vector3(x, z, -y);
};
export const ECLIPTIC_NORMAL = ecliptic(0, 90);

// 银道坐标：北银极、银心方向，以及银经 90° 的方向
export const DIR_NGP = equatorial(192.85948, 27.12825);
export const GAL_Y = new THREE.Vector3().crossVectors(DIR_NGP, equatorial(266.40499, -28.93617)).normalize();
export const GALACTIC_CENTER = new THREE.Vector3().crossVectors(GAL_Y, DIR_NGP).normalize();
export const galactic = (l: number, b: number) =>
  GALACTIC_CENTER.clone()
    .multiplyScalar(Math.cos(b * RAD) * Math.cos(l * RAD))
    .addScaledVector(GAL_Y, Math.cos(b * RAD) * Math.sin(l * RAD))
    .addScaledVector(DIR_NGP, Math.sin(b * RAD));

// 取景：六月上旬，华北平原麦收时节的一片麦田，当地午夜。
// 太阳在黄经 80°，正好在脚下那一侧；镜头退到地球背后，太阳会从地球边缘露出来
const SUN_LON = 80;
export const SUN_DIR = ecliptic(SUN_LON);
const ANTISOLAR_RA = (Math.atan2(SUN_DIR.z, -SUN_DIR.x) / RAD + 360) % 360;
export const SITE = { lat: 35, lon: 115 };
export const ZENITH = equatorial(ANTISOLAR_RA, SITE.lat);
// 地球绕自转轴转过的角度：让取景地正好朝着 ZENITH
export const EARTH_SPIN = (ANTISOLAR_RA - SITE.lon) * RAD;
export const EARTH_CENTER = ZENITH.clone().multiplyScalar(-R_EARTH);
export const SUN_POS = SUN_DIR.clone().multiplyScalar(AU);

// 画面的「上」：把一个参考方向（默认天北极）压到与视线垂直的平面里
const NORTH = new THREE.Vector3(0, 1, 0);
export const upFor = (dir: THREE.Vector3, ref: THREE.Vector3 = NORTH) => ref.clone().addScaledVector(dir, -dir.dot(ref)).normalize();
export const rightFor = (dir: THREE.Vector3, ref: THREE.Vector3 = NORTH) => new THREE.Vector3().crossVectors(upFor(dir, ref), dir).normalize();
export const SCREEN_UP = upFor(ZENITH);
export const SCREEN_RIGHT = rightFor(ZENITH);

// 镜头依次朝这几个方向退出去：
// 先在头顶；再绕到地球背后、离日地连线十来度的地方，月球就在这条路上；
// 然后朝旅行者 1 号飞去的方向（蛇夫座，黄纬 35°，行星轨道在这个角度下展开成椭圆）；
// 再到银盘上方、朝反银心一侧偏开三十度，能看见整个银河；最后绕到侧面，巡天的两个扇面一上一下
export const DIR_EARTH = ecliptic(SUN_LON + 180 + 11, 4.5);
export const DIR_VOYAGER = equatorial(258, 12);
export const DIR_GALAXY = DIR_NGP.clone()
  .multiplyScalar(Math.cos(32 * RAD))
  .addScaledVector(GALACTIC_CENTER, -Math.sin(32 * RAD));
export const DIR_GROUP = galactic(250, 48);
export const DIR_SIDE = galactic(95, 14);

// 月球：在镜头的路线旁边四千五百公里处，镜头经过时它从画面左侧掠过
export const MOON_POS = DIR_EARTH.clone().multiplyScalar(MOON_DIST).addScaledVector(rightFor(DIR_EARTH), -4.5e6);

// 片头标题占掉配乐最安静的头四秒半；然后是生成的那段麦田，135 帧，每帧对一帧，放完由 3D 接手
export const TITLE_END = 4.5;
export const CLIP_START = Math.round(TITLE_END * FPS);
export const CLIP_FRAMES = 135;
export const CLIP_END_FRAME = CLIP_START + CLIP_FRAMES;
const CLIP_END = CLIP_END_FRAME / FPS;
// 片段最后一帧画面的实际高度（米），按人的身高估的；3D 里把这一帧贴在地面上
export const PATCH_HEIGHT = 33;
export const START_HEIGHT = PATCH_HEIGHT / 2 / Math.tan((FOV * Math.PI) / 360);

// 时间点（秒）都落在配乐的重音上
export const T = {
  earth: 12.14, // 第一句
  sunrise: 14.4, // 太阳从地球边缘露出来
  moon: 17.4, // 掠过月球
  moonOut: 19.8,
  sun: 22.0, // 一个天文单位
  sunOut: 23.6,
  voyager: 26.4, // 旅行者 1 号
  voyagerOut: 29.6,
  stars: 33.0, // 配乐抬起来：最近的恒星
  bubble: 38.0, // 人类的无线电传到的范围
  bubbleOut: 39.8,
  galaxy: 42.45, // 配乐第一次全奏：银河系
  galaxyHold: 45.0,
  galaxyOut: 50.5,
  group: 51.65, // 本星系群，仙女座
  groupOut: 57.2,
  web: 58.5, // 近邻宇宙的网
  webOut: 65.5,
  deep: 67.05, // 巡天的扇面
  deepOut: 72.8,
  earthBorn: 75.9, // 四十六亿年前出发的光
  far: 80.25,
  edge: 84.0, // 配乐再加厚：退到可观测宇宙之外，哈勃球
  horizon: 97.5, // 事件视界
  whole: 104.5, // 最早的光
  forward: 110.0, // 顶点：时间快进
  dark: 119.4, // 配乐骤停，全黑
  now: 123.0, // 回到此刻，斯隆长城
  question: 128.4,
  end: 132.0,
};
export const TOTAL_FRAMES = Math.round(T.end * FPS);

const lg = (meters: number) => Math.log10(meters);

// 镜头离取景地的距离（米）取 10 为底的对数，按秒给关键点。到站慢，赶路快
const LEVELS: [number, number][] = [
  [CLIP_END, lg(START_HEIGHT)],
  [11.2, 5.6],
  [13.2, 6.9],
  [T.sunrise, 7.2],
  [15.4, 7.55],
  [17.0, lg(MOON_DIST - 6e6)],
  [T.moon, lg(MOON_DIST + 3e6)],
  [18.0, lg(MOON_DIST + 1e7)],
  [18.9, lg(MOON_DIST + 3.2e7)],
  [T.moonOut, lg(MOON_DIST + 1e8)],
  [T.sun, lg(AU)],
  [T.sunOut, lg(AU * 1.9)],
  [26.0, lg(LIGHT_DAY * 0.99)],
  [T.voyager, lg(LIGHT_DAY)],
  [T.voyagerOut, lg(LIGHT_DAY * 1.03)],
  [T.stars, lg(4.3 * LIGHT_YEAR)],
  [T.bubble, lg(250 * LIGHT_YEAR)],
  [T.bubbleOut, lg(330 * LIGHT_YEAR)],
  [T.galaxy, lg(2800 * LIGHT_YEAR)],
  [43.6, lg(6e4 * LIGHT_YEAR)],
  [T.galaxyHold, lg(1.3e5 * LIGHT_YEAR)],
  [T.galaxyOut, lg(2.1e5 * LIGHT_YEAR)],
  [T.group, lg(3.4e6 * LIGHT_YEAR)],
  [T.groupOut, lg(6.5e6 * LIGHT_YEAR)],
  [T.web, lg(1.0 * GLY)],
  [T.webOut, lg(1.5 * GLY)],
  [T.deep, lg(3.3 * GLY)],
  [T.deepOut, lg(4.3 * GLY)],
  [T.earthBorn, lg(5.45 * GLY)],
  [T.far, lg(9 * GLY)],
  [82.6, lg(12 * GLY)],
  [T.edge, lg(52 * GLY)],
  [T.horizon, lg(66 * GLY)],
  [T.whole, lg(125 * GLY)],
  [T.forward, lg(150 * GLY)],
  // 时间快进时镜头缓缓往回收，灯灭到最后，画面里只剩家附近
  [T.dark, lg(60 * GLY)],
  [T.end, lg(56 * GLY)],
];

// 过关键点的单调三次插值：不会冲过头，速度连续
const SLOPES = (() => {
  const n = LEVELS.length;
  const secant: number[] = [];
  for (let i = 0; i < n - 1; i++) secant.push((LEVELS[i + 1][1] - LEVELS[i][1]) / (LEVELS[i + 1][0] - LEVELS[i][0]));
  // 起步的速度接着生成片段里镜头上升的速度
  const m: number[] = [0.15];
  for (let i = 1; i < n - 1; i++) {
    const a = secant[i - 1];
    const b = secant[i];
    m.push(a * b <= 0 ? 0 : (2 * a * b) / (a + b));
  }
  m.push(secant[n - 2]);
  return m;
})();

export const levelAt = (frame: number) => {
  const t = frame / FPS;
  if (t <= LEVELS[0][0]) return LEVELS[0][1];
  const last = LEVELS.length - 1;
  if (t >= LEVELS[last][0]) return LEVELS[last][1];
  let i = 0;
  while (t > LEVELS[i + 1][0]) i++;
  const [t0, v0] = LEVELS[i];
  const [t1, v1] = LEVELS[i + 1];
  const h = t1 - t0;
  const s = (t - t0) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * h * SLOPES[i] + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * h * SLOPES[i + 1];
};

// 后退得有多快：每秒几个数量级
export const speedAt = (frame: number) => (levelAt(frame + 0.5) - levelAt(frame - 0.5)) * FPS;

const slerp = (a: THREE.Vector3, b: THREE.Vector3, k: number) => {
  const angle = a.angleTo(b);
  if (angle < 1e-6) return a.clone();
  const s = Math.sin(angle);
  return a
    .clone()
    .multiplyScalar(Math.sin((1 - k) * angle) / s)
    .addScaledVector(b, Math.sin(k * angle) / s);
};

// 一串「到某一秒指向某个方向」的关键点，之间沿大圆缓进缓出地转过去
const turning = (keys: [number, THREE.Vector3][]) => (frame: number) => {
  const t = frame / FPS;
  if (t <= keys[0][0]) return keys[0][1].clone();
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const k = (t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      return slerp(keys[i - 1][1], keys[i][1], k * k * (3 - 2 * k));
    }
  }
  return keys[keys.length - 1][1].clone();
};

// 镜头朝哪个方向退
export const directionAt = turning([
  [11.0, ZENITH],
  [13.6, DIR_EARTH],
  [T.moonOut, DIR_EARTH],
  [25.6, DIR_VOYAGER],
  [30.0, DIR_VOYAGER],
  [44.6, DIR_GALAXY],
  [T.galaxyOut, DIR_GALAXY],
  [T.group + 0.6, DIR_GROUP],
  [T.groupOut, DIR_GROUP],
  [T.web + 1, DIR_SIDE],
]);

// 画面的「上」参照谁：太阳系里是天北极，离开银河系以后换成北银极
const upRefAt = turning([
  [T.galaxyOut, NORTH],
  [T.web, DIR_NGP],
]);

// 这一帧镜头的全部参数。世界按 1 / meters 缩小，所以镜头总在离取景地一个单位远的地方
export type Shot = {
  meters: number;
  level: number;
  // 每秒退几个数量级
  speed: number;
  // 每秒退多少米
  velocity: number;
  dir: THREE.Vector3;
  up: THREE.Vector3;
  right: THREE.Vector3;
  // 镜头盯着哪里（已按 1 / meters 缩小）：近处盯取景地，离开地球以后盯地心
  target: THREE.Vector3;
  // 近裁剪面：掠过月球时它离镜头不到百分之二个单位，要放近
  near: number;
};

export const shotAt = (frame: number): Shot => {
  const level = levelAt(frame);
  const meters = 10 ** level;
  const dir = directionAt(frame);
  const ref = upRefAt(frame);
  const speed = speedAt(frame);
  const toCenter = THREE.MathUtils.smoothstep(level, 5.2, 7);
  // 看银河的时候，镜头往银心那边偏过去一些，整个星系才在画面里
  const toGalaxy = 0.62 * THREE.MathUtils.smoothstep(level, 19.7, 20.7) * (1 - THREE.MathUtils.smoothstep(level, 21.6, 22.3));
  return {
    meters,
    level,
    speed,
    velocity: meters * Math.LN10 * speed,
    dir,
    up: upFor(dir, ref),
    right: rightFor(dir, ref),
    target: EARTH_CENTER.clone()
      .multiplyScalar(toCenter / meters)
      .addScaledVector(GALACTIC_CENTER, (toGalaxy * 8.2 * KPC) / meters),
    near: level > 8.4 && level < 8.9 ? 0.004 : 0.05,
  };
};

const fixed = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
export type Figure = { value: string; unit: string };

// 年数：一万以上写成「万」，一亿以上写成「亿」
const bigYears = (years: number, unit: string): Figure => {
  if (years < 1e4) return { value: fixed(years), unit };
  if (years < 1e8) return { value: fixed(years / 1e4), unit: `万${unit}` };
  return { value: fixed(years / 1e8), unit: `亿${unit}` };
};

// 多长的时间：一年以内用秒、分、时、日
const span = (seconds: number, suffix: string): Figure => {
  if (seconds < 60) return { value: fixed(seconds), unit: `秒${suffix}` };
  if (seconds < 3600) return { value: fixed(seconds / 60), unit: `分${suffix}` };
  if (seconds < 86400) return { value: fixed(seconds / 3600), unit: `时${suffix}` };
  if (seconds < YEAR) return { value: fixed(seconds / 86400), unit: `日${suffix}` };
  return bigYears(seconds / YEAR, `年${suffix}`);
};

// 距离写成光走过的时间；太近的地方用米和公里。超出可观测宇宙就停在它的半径上
export const lightDistance = (meters: number): Figure => {
  const m = Math.min(meters, PARTICLE_HORIZON);
  if (m < 1000) return { value: m.toFixed(0), unit: "米" };
  if (m / C < 0.1) return { value: fixed(m / 1000), unit: "公里" };
  const f = span(m / C, "");
  return { value: f.value, unit: f.unit.endsWith("年") ? f.unit.replace("年", "光年") : `光${f.unit}` };
};

// 你看到的是多久以前：years 是回溯时间。还没用上光的单位时不显示
export const lookbackFigure = (meters: number, years: number): Figure | null => (meters / C < 0.1 ? null : span(years * YEAR, "前"));

// 镜头后退的速度：比光慢得多时写每秒多少公里，否则写成光速的多少倍
export const speedFigure = (velocity: number): Figure & { faster: boolean } => {
  const v = Math.abs(velocity);
  const ratio = v / C;
  if (ratio < 0.01) {
    const km = v / 1000;
    return km < 1e4 ? { value: fixed(km), unit: "公里每秒", faster: false } : { value: fixed(km / 1e4), unit: "万公里每秒", faster: false };
  }
  const faster = ratio >= 1;
  if (ratio < 1e4) return { value: fixed(ratio), unit: "倍光速", faster };
  if (ratio < 1e8) return { value: fixed(ratio / 1e4), unit: "万倍光速", faster };
  if (ratio < 1e12) return { value: fixed(ratio / 1e8), unit: "亿倍光速", faster };
  if (ratio < 1e16) return { value: fixed(ratio / 1e12), unit: "万亿倍光速", faster };
  return { value: fixed(ratio / 1e16), unit: "亿亿倍光速", faster };
};

// 本星系群里几个星系的位置（银经、银纬、距离）
export const M31_POS = galactic(121.17, -21.57).multiplyScalar(765 * KPC);
export const M33_POS = galactic(133.61, -31.33).multiplyScalar(870 * KPC);
export const LMC_POS = galactic(280.47, -32.89).multiplyScalar(50 * KPC);
export const SMC_POS = galactic(302.8, -44.3).multiplyScalar(62 * KPC);
export const GALAXY_CENTER_POS = GALACTIC_CENTER.clone().multiplyScalar(8.2 * KPC);
