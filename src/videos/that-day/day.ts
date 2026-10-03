// 由参数算出整支片子要用的数据：那天的日出日落、天空这一段每一帧对应几点钟、月亮、全年的昼长、地球的位置
import {
  AU_KM,
  dayLengths,
  dayOfYear,
  earthAt,
  gmst,
  moonAt,
  sunAt,
  sunTimes,
  weekday,
} from "./astro";
import type { Place } from "./astro";
import { FPS, PARTS } from "./theme";
import type { Props } from "./theme";

export type Day = ReturnType<typeof readDay>;

// 天空这一段从几点演到几点（当地时间，分钟）
const FROM = 5 * 60;
const TO = 23 * 60 + 30;

export const readDay = (props: Props) => {
  const place: Place = {
    lat: props.lat,
    lon: props.lon,
    utcOffset: props.utcOffset,
  };
  const year = Number(props.date.slice(0, 4));
  const times = sunTimes(props.date, place);
  const rise = times.rise ?? FROM + 60;
  const set = times.set ?? TO - 120;

  // 每一帧对应几点：日出、正午、日落前后走得慢，其余时候快；把「速度」积分起来再拉伸到这一段的长度
  const frames = Math.round((PARTS.moon - PARTS.sky) * FPS);
  const slow = (m: number) =>
    1 -
    0.75 * Math.exp(-(((m - rise) / 40) ** 2)) -
    0.75 * Math.exp(-(((m - set) / 40) ** 2)) -
    0.3 * Math.exp(-(((m - times.noon) / 60) ** 2));
  const steps = 2000;
  const cumulative = [0];
  for (let i = 1; i <= steps; i++) {
    const m = FROM + ((TO - FROM) * (i - 0.5)) / steps;
    cumulative.push(cumulative[i - 1] + slow(m));
  }
  const total = cumulative[steps];
  const clockAt: number[] = [];
  let j = 0;
  for (let f = 0; f < frames; f++) {
    const target = (f / (frames - 1)) * total;
    while (j < steps && cumulative[j + 1] < target) j++;
    const part =
      (target - cumulative[j]) /
      Math.max(1e-9, cumulative[j + 1] - cumulative[j]);
    clockAt.push(FROM + ((TO - FROM) * (j + part)) / steps);
  }

  const moonTonight = moonAt(props.date, 22 * 60, place);
  // 日落以后月亮什么时候升起（这一段演到的时间里没升起就是 null）
  let moonrise: number | null = null;
  for (let m = set; m <= TO; m += 2) {
    if (
      moonAt(props.date, m - 2, place).alt < 0 &&
      moonAt(props.date, m, place).alt >= 0
    ) {
      moonrise = m;
      break;
    }
  }
  // 太阳一整天的轨迹，每十分钟一个点
  const path: { minutes: number; alt: number; az: number }[] = [];
  for (let m = Math.floor((rise - 30) / 10) * 10; m <= set + 30; m += 10) {
    const { alt, az } = sunAt(props.date, m, place);
    path.push({ minutes: m, alt, az });
  }
  const lengths = dayLengths(year, place);
  const index = dayOfYear(props.date);
  const earth = earthAt(props.date, 12 * 60, props.utcOffset);
  const newYear = earthAt(`${year}-01-01`, 0, props.utcOffset);

  // 从那天到 asOf 一共多少天，地球绕了几圈
  const [ay, am, ad] = props.asOf.split("-").map(Number);
  const [dy, dm, dd] = props.date.split("-").map(Number);
  const days = Math.round(
    (Date.UTC(ay, am - 1, ad) - Date.UTC(dy, dm - 1, dd)) / 86400000,
  );

  return {
    date: props.date,
    dateLabel: `${Number(props.date.slice(5, 7))} 月 ${Number(props.date.slice(8, 10))} 日`,
    city: props.city,
    place,
    siderealAt: (minutes: number) => gmst(props.date, minutes, props.utcOffset),
    moonrise,
    path,
    year,
    weekday: weekday(props.date),
    rise,
    set,
    noon: times.noon,
    clockAt,
    moon: moonTonight,
    lengths,
    index,
    earth,
    newYear,
    distanceKm: earth.distance * AU_KM,
    days,
    orbits: days / 365.25636,
  };
};
