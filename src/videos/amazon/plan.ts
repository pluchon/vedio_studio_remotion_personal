// 镜头怎么走：主河道是一条从源头到入海口的线，镜头沿着它飞。走到哪儿由一串「几秒时速度多少」决定，
// 盯着的点和朝向都取河道抹平之后的走势，免得镜头跟着每一个河弯晃
import { FPS, type View } from "./theme";

export type Spot = { lon: number; lat: number; down: number; flow: number; elev: number };

export type Route = {
  // 全长（公里）
  total: number;
  // 离源头 s 公里处的那一点
  at: (s: number) => Spot;
  // 以 s 为中心、前后各 window 公里抹平之后的位置
  smooth: (s: number, window: number) => { lon: number; lat: number };
  // 抹平之后的走向：方位角，正北为 0，顺时针
  bearing: (s: number, window: number) => number;
};

export const makeRoute = (data: Float32Array): Route => {
  const count = data.length / 5;
  const total = data[2];
  const along = new Float64Array(count);
  const elev = new Float64Array(count);
  let lowest = Infinity;
  for (let i = 0; i < count; i++) {
    along[i] = total - data[i * 5 + 2];
    // 高程是按格子取的，河谷里会忽高忽低；水只往低处流，读数取一路上的最低值
    lowest = Math.min(lowest, data[i * 5 + 4]);
    elev[i] = lowest;
  }

  const at = (s: number): Spot => {
    const clamped = Math.min(Math.max(s, 0), total);
    let lo = 0;
    let hi = count - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (along[mid] <= clamped) lo = mid;
      else hi = mid;
    }
    const span = along[hi] - along[lo];
    const k = span > 0 ? (clamped - along[lo]) / span : 0;
    const mix = (field: number) => data[lo * 5 + field] + (data[hi * 5 + field] - data[lo * 5 + field]) * k;
    return { lon: mix(0), lat: mix(1), down: mix(2), flow: mix(3), elev: elev[lo] + (elev[hi] - elev[lo]) * k };
  };

  const smooth = (s: number, window: number) => {
    let lon = 0;
    let lat = 0;
    let weight = 0;
    for (let i = -8; i <= 8; i++) {
      const w = Math.exp(-((i / 4) ** 2));
      const p = at(s + (i / 8) * window);
      lon += p.lon * w;
      lat += p.lat * w;
      weight += w;
    }
    return { lon: lon / weight, lat: lat / weight };
  };

  const bearing = (s: number, window: number) => {
    const a = smooth(s - window * 0.3, window);
    const b = smooth(s + window * 0.3, window);
    const east = (b.lon - a.lon) * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
    return (Math.atan2(east, b.lat - a.lat) * 180) / Math.PI;
  };

  return { total, at, smooth, bearing };
};

export type Keys = [number, number][];

// 过一串关键值的平滑曲线：每一段是三次曲线，接头处的斜率取前后两段的平均，所以不会一顿一顿
export const curve = (keys: Keys, t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys.length - 1;
  if (t >= keys[last][0]) return keys[last][1];
  let i = 0;
  while (keys[i + 1][0] < t) i++;
  const [t0, v0] = keys[i];
  const [t1, v1] = keys[i + 1];
  const slope = (j: number) => {
    if (j <= 0 || j >= last) return 0;
    return (keys[j + 1][1] - keys[j - 1][1]) / (keys[j + 1][0] - keys[j - 1][0]);
  };
  const h = t1 - t0;
  const u = (t - t0) / h;
  const m0 = slope(i) * h;
  const m1 = slope(i + 1) * h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * m1;
};

// 一段旅程：各项都是「第几秒，取多少」
export type Journey = {
  seconds: number;
  // 一段段赶路：第 from 秒起步，第 arrive 秒到达离源头 to 公里处；两段之间停着不动
  legs: { from: number; arrive: number; to: number }[];
  // 镜头离盯着的那一点多远（公里）、俯角多大（度）
  distance: Keys;
  pitch: Keys;
  // 盯着的点比水流到的地方靠前多少公里
  lead: Keys;
  // 高程夸大多少倍
  relief: Keys;
  // 镜头朝向跟不跟河道的走势：0 是始终上北下南，1 是完全跟着转
  turn: Keys;
  // 盯着的点取多长一段河道的平均位置（公里）：越短，线头越稳稳地留在画面中间
  steady: number;
  // 太阳：在哪个地方看、方位和高度
  sun: { lon: number; lat: number; azimuth: number; elevation: number };
  // 结尾：镜头不再盯着线头，慢慢移去看整个流域的中心
  finale: { from: number; to: number; lon: number; lat: number };
};

// 一段路走了几成：起步和收尾各占三成时间慢慢加速、减速，中间匀速
const RAMP = 0.3;
const pace = (u: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (u < RAMP) return (u * u) / (2 * RAMP * (1 - RAMP));
  if (u > 1 - RAMP) return 1 - ((1 - u) * (1 - u)) / (2 * RAMP * (1 - RAMP));
  return (u - RAMP / 2) / (1 - RAMP);
};

// 每一帧走到了离源头多少公里
export const travel = (journey: Journey) => {
  const frames = Math.round(journey.seconds * FPS) + 1;
  const table = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    const t = f / FPS;
    let s = 0;
    for (const leg of journey.legs) {
      if (t < leg.from) break;
      s += (leg.to - s) * pace((t - leg.from) / (leg.arrive - leg.from));
    }
    table[f] = s;
  }
  return table;
};

export const viewAt = (route: Route, journey: Journey, table: Float64Array, frame: number) => {
  const t = frame / FPS;
  const s = table[Math.min(Math.max(Math.round(frame), 0), table.length - 1)];
  const lead = curve(journey.lead, t);
  const tip = route.smooth(s + lead, journey.steady);
  const k = Math.min(Math.max((t - journey.finale.from) / (journey.finale.to - journey.finale.from), 0), 1);
  const away = k * k * (3 - 2 * k);
  const view: View = {
    lon: tip.lon + (journey.finale.lon - tip.lon) * away,
    lat: tip.lat + (journey.finale.lat - tip.lat) * away,
    azimuth: route.bearing(s + lead, 1100) * curve(journey.turn, t),
    pitch: curve(journey.pitch, t),
    distance: curve(journey.distance, t),
    sunAzimuth: journey.sun.azimuth,
    sunElevation: journey.sun.elevation,
    relief: curve(journey.relief, t),
  };
  return { view, here: route.at(s), s };
};
