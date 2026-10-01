// 第四期（光速与事件视界）的常量：物理尺度、取景地点与天球方向、镜头这一路怎么走
import { staticFile } from "remotion";
import * as THREE from "three";

export const asset = (path: string) => `horizon/${path}`;
export const assetUrl = (path: string) => staticFile(asset(path));

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FOV = 40;

// 米
export const C = 299792458;
export const R_EARTH = 6.371e6;
export const R_MOON = 1.7374e6;
export const R_SUN = 6.957e8;
export const MOON_DIST = 3.844e8;
export const AU = 1.495978707e11;
export const LIGHT_YEAR = 9.4607e15;
export const PARSEC = 3.0857e16;
// 旅行者 1 号 2026 年 11 月离地球正好一光日
export const LIGHT_DAY = C * 86400;

export const COLORS = { bg: "#020308", cream: "#efe6d2", soft: "rgba(239, 230, 210, 0.55)", rule: "#e0674f" };

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

// 取景：六月上旬，华北平原麦收时节的一片麦田，当地午夜，满月刚过。
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

// 画面的「上」：天北极方向压到与视线垂直的平面里
const NORTH = new THREE.Vector3(0, 1, 0);
export const upFor = (dir: THREE.Vector3) => NORTH.clone().addScaledVector(dir, -dir.y).normalize();
export const rightFor = (dir: THREE.Vector3) => new THREE.Vector3().crossVectors(upFor(dir), dir).normalize();
export const SCREEN_UP = upFor(ZENITH);
export const SCREEN_RIGHT = rightFor(ZENITH);

// 镜头依次朝这几个方向退出去：
// 先在头顶；再绕到地球背后、离日地连线十来度的地方，月球就在这条路上；
// 然后朝旅行者 1 号飞去的方向（蛇夫座，黄纬 35°，行星轨道在这个角度下展开成椭圆）；最后转向北银极，好从正面看银河
export const DIR_EARTH = ecliptic(SUN_LON + 180 + 11, 4.5);
export const DIR_VOYAGER = equatorial(258, 12);
export const DIR_NGP = equatorial(192.86, 27.13);
export const GALACTIC_CENTER = equatorial(266.405, -28.936);

// 月球：在镜头的路线旁边四千五百公里处，镜头经过时它从画面左侧掠过
export const MOON_POS = DIR_EARTH.clone().multiplyScalar(MOON_DIST).addScaledVector(rightFor(DIR_EARTH), -4.5e6);

// 开头的生成片段：192 帧，按每帧对一帧放（等于 1.25 倍速），放完由 3D 接手
export const CLIP_FRAMES = 192;
const CLIP_END = CLIP_FRAMES / FPS;
// 片段最后一帧画面的实际高度（米），按人的身高估的；3D 里把这一帧贴在地面上
export const PATCH_HEIGHT = 33;
export const START_HEIGHT = PATCH_HEIGHT / 2 / Math.tan((FOV * Math.PI) / 360);

// 时间点（秒）都落在配乐的重音上
export const T = {
  earth: 10.34, // 第一句
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
  end: 42.5, // 配乐第一次全奏
};

// 镜头离取景地的距离（米）取 10 为底的对数，按秒给关键点。到站慢，赶路快
const LEVELS: [number, number][] = [
  [0, Math.log10(START_HEIGHT) - 0.9],
  [CLIP_END, Math.log10(START_HEIGHT)],
  [9.0, 5.6],
  [12.5, 6.9],
  [T.sunrise, 7.2],
  [15.4, 7.55],
  [17.0, Math.log10(MOON_DIST - 6e6)],
  [T.moon, Math.log10(MOON_DIST + 3e6)],
  [18.0, Math.log10(MOON_DIST + 1e7)],
  [18.9, Math.log10(MOON_DIST + 3.2e7)],
  [T.moonOut, Math.log10(MOON_DIST + 1e8)],
  [T.sun, Math.log10(AU)],
  [T.sunOut, Math.log10(AU * 1.9)],
  [26.0, Math.log10(LIGHT_DAY * 0.99)],
  [T.voyager, Math.log10(LIGHT_DAY)],
  [T.voyagerOut, Math.log10(LIGHT_DAY * 1.03)],
  [T.stars, Math.log10(4.3 * LIGHT_YEAR)],
  [T.bubble, Math.log10(250 * LIGHT_YEAR)],
  [T.bubbleOut, Math.log10(330 * LIGHT_YEAR)],
  [T.end, Math.log10(2800 * LIGHT_YEAR)],
];

// 过关键点的单调三次插值：不会冲过头，速度连续
const SLOPES = (() => {
  const n = LEVELS.length;
  const secant: number[] = [];
  for (let i = 0; i < n - 1; i++) secant.push((LEVELS[i + 1][1] - LEVELS[i][1]) / (LEVELS[i + 1][0] - LEVELS[i][0]));
  const m: number[] = [secant[0]];
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

// 镜头朝哪个方向退：几个方向之间沿大圆转过去
const DIRS: [number, THREE.Vector3][] = [
  [9.0, ZENITH],
  [13.4, DIR_EARTH],
  [T.moonOut, DIR_EARTH],
  [25.6, DIR_VOYAGER],
  [30.0, DIR_VOYAGER],
  [T.end + 8, DIR_NGP],
];

const slerp = (a: THREE.Vector3, b: THREE.Vector3, k: number) => {
  const angle = a.angleTo(b);
  if (angle < 1e-6) return a.clone();
  const s = Math.sin(angle);
  return a
    .clone()
    .multiplyScalar(Math.sin((1 - k) * angle) / s)
    .addScaledVector(b, Math.sin(k * angle) / s);
};

export const directionAt = (frame: number) => {
  const t = frame / FPS;
  if (t <= DIRS[0][0]) return DIRS[0][1].clone();
  for (let i = 1; i < DIRS.length; i++) {
    if (t <= DIRS[i][0]) {
      const k = (t - DIRS[i - 1][0]) / (DIRS[i][0] - DIRS[i - 1][0]);
      return slerp(DIRS[i - 1][1], DIRS[i][1], k * k * (3 - 2 * k));
    }
  }
  return DIRS[DIRS.length - 1][1].clone();
};

// 这一帧镜头的全部参数。世界按 1 / meters 缩小，所以镜头总在离取景地一个单位远的地方
export type Shot = {
  meters: number;
  level: number;
  speed: number;
  dir: THREE.Vector3;
  up: THREE.Vector3;
  // 镜头盯着哪里（已按 1 / meters 缩小）：近处盯取景地，离开地球以后盯地心
  target: THREE.Vector3;
  // 近裁剪面：掠过月球时它离镜头不到百分之二个单位，要放近
  near: number;
};

export const shotAt = (frame: number): Shot => {
  const level = levelAt(frame);
  const meters = 10 ** level;
  const dir = directionAt(frame);
  const toCenter = THREE.MathUtils.smoothstep(level, 5.2, 7);
  return {
    meters,
    level,
    speed: speedAt(frame),
    dir,
    up: upFor(dir),
    target: EARTH_CENTER.clone().multiplyScalar(toCenter / meters),
    near: level > 8.4 && level < 8.9 ? 0.004 : 0.05,
  };
};

const fixed = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));

// 距离写成光走过的时间；太近的地方用米和公里
export const lightDistance = (meters: number): { value: string; unit: string } => {
  const s = meters / C;
  if (meters < 1000) return { value: meters.toFixed(0), unit: "米" };
  if (s < 0.1) return { value: fixed(meters / 1000), unit: "公里" };
  if (s < 60) return { value: fixed(s), unit: "光秒" };
  if (s < 3600) return { value: fixed(s / 60), unit: "光分" };
  if (s < 86400) return { value: fixed(s / 3600), unit: "光时" };
  const years = s / 31557600;
  if (years < 1) return { value: fixed(s / 86400), unit: "光日" };
  if (years < 10000) return { value: fixed(years), unit: "光年" };
  return { value: fixed(years / 10000), unit: "万光年" };
};

// 同一段距离换个说法：这束光是多久以前出发的。还没用上光的单位时不显示
export const lookback = (meters: number): { value: string; unit: string } | null => {
  const d = lightDistance(meters);
  return d.unit.includes("光") ? { value: d.value, unit: `${d.unit.replace("光", "")}前` } : null;
};
