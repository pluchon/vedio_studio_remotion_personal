// 天文计算：太阳和月亮在某地某时的高度和方位、日出日落、月相、地球在轨道上的位置
// 太阳用 NOAA 的算法，月亮用 Meeus《天文算法》里的低精度公式，误差都在零点几度以内，画画足够
const RAD = Math.PI / 180;
const sin = (d: number) => Math.sin(d * RAD);
const cos = (d: number) => Math.cos(d * RAD);
const wrap = (d: number) => ((d % 360) + 360) % 360;

export type Place = { lat: number; lon: number; utcOffset: number };

// 某地当地时间的儒略日：date 是 "YYYY-MM-DD"，minutes 是当地午夜起的分钟数
export const julian = (date: string, minutes: number, utcOffset: number) => {
  const [y, m, d] = date.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + (minutes - utcOffset * 60) * 60000;
  return ms / 86400000 + 2440587.5;
};

// 太阳的黄经、赤纬、日地距离、时差
const solar = (jd: number) => {
  const t = (jd - 2451545) / 36525;
  const l0 = wrap(280.46646 + t * (36000.76983 + t * 0.0003032));
  const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const c =
    sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    sin(2 * m) * (0.019993 - 0.000101 * t) +
    sin(3 * m) * 0.000289;
  const longitude = l0 + c;
  const anomaly = m + c;
  const distance = (1.000001018 * (1 - e * e)) / (1 + e * cos(anomaly));
  const omega = 125.04 - 1934.136 * t;
  const lambda = longitude - 0.00569 - 0.00478 * sin(omega);
  const eps0 =
    23 +
    (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * cos(omega);
  const decl = Math.asin(sin(eps) * sin(lambda)) / RAD;
  const ra = wrap(Math.atan2(cos(eps) * sin(lambda), cos(lambda)) / RAD);
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eot =
    (4 / RAD) *
    (y * sin(2 * l0) -
      2 * e * sin(m) +
      4 * e * y * sin(m) * cos(2 * l0) -
      0.5 * y * y * sin(4 * l0) -
      1.25 * e * e * sin(2 * m));
  return { longitude: wrap(longitude), decl, ra, distance, eot, eps };
};

// 格林尼治恒星时（度）
const sidereal = (jd: number) => {
  const t = (jd - 2451545) / 36525;
  return wrap(
    280.46061837 +
      360.98564736629 * (jd - 2451545) +
      t * t * (0.000387933 - t / 38710000),
  );
};

// 赤经赤纬换成某地的高度和方位（方位从正北起，顺时针）
const horizontal = (ra: number, decl: number, jd: number, place: Place) => {
  const ha = wrap(sidereal(jd) + place.lon - ra);
  const alt =
    Math.asin(
      sin(place.lat) * sin(decl) + cos(place.lat) * cos(decl) * cos(ha),
    ) / RAD;
  const az = wrap(
    Math.atan2(
      -sin(ha) * cos(decl),
      cos(place.lat) * sin(decl) - sin(place.lat) * cos(decl) * cos(ha),
    ) / RAD,
  );
  return { alt, az };
};

// 某地当地时间的格林尼治恒星时（度），算星星转到哪里用
export const gmst = (date: string, minutes: number, utcOffset: number) =>
  sidereal(julian(date, minutes, utcOffset));

export const sunAt = (date: string, minutes: number, place: Place) => {
  const jd = julian(date, minutes, place.utcOffset);
  const s = solar(jd);
  return horizontal(s.ra, s.decl, jd, place);
};

// 日出日落（当地时间，午夜起的分钟数）；极昼极夜时返回 null
export const sunTimes = (date: string, place: Place) => {
  const s = solar(julian(date, 720, place.utcOffset));
  const x =
    cos(90.833) / (cos(place.lat) * cos(s.decl)) -
    Math.tan(place.lat * RAD) * Math.tan(s.decl * RAD);
  const noon = 720 - 4 * place.lon - s.eot + 60 * place.utcOffset;
  if (x < -1 || x > 1) return { noon, rise: null, set: null };
  const ha = Math.acos(x) / RAD;
  return { noon, rise: noon - 4 * ha, set: noon + 4 * ha };
};

// 月亮的位置和月相（Meeus 第 47、48 章，只取主要的几项）
const lunar = (jd: number) => {
  const t = (jd - 2451545) / 36525;
  const lp = wrap(218.3164477 + 481267.88123421 * t);
  const d = wrap(297.8501921 + 445267.1114034 * t);
  const m = wrap(357.5291092 + 35999.0502909 * t);
  const mp = wrap(134.9633964 + 477198.8675055 * t);
  const f = wrap(93.272095 + 483202.0175233 * t);
  const longitude =
    lp +
    6.288774 * sin(mp) +
    1.274027 * sin(2 * d - mp) +
    0.658314 * sin(2 * d) +
    0.213618 * sin(2 * mp) -
    0.185116 * sin(m) -
    0.114332 * sin(2 * f) +
    0.058793 * sin(2 * d - 2 * mp) +
    0.057066 * sin(2 * d - m - mp) +
    0.053322 * sin(2 * d + mp) +
    0.045758 * sin(2 * d - m);
  const latitude =
    5.128122 * sin(f) +
    0.280602 * sin(mp + f) +
    0.277693 * sin(mp - f) +
    0.173237 * sin(2 * d - f);
  // 相位角：0 是满月，180 是新月
  const phase =
    180 -
    d -
    6.289 * sin(mp) +
    2.1 * sin(m) -
    1.274 * sin(2 * d - mp) -
    0.658 * sin(2 * d) -
    0.214 * sin(2 * mp) -
    0.11 * sin(d);
  return {
    longitude: wrap(longitude),
    latitude,
    illuminated: (1 + cos(phase)) / 2,
    waxing: d < 180,
    elongation: d,
  };
};

export const moonAt = (date: string, minutes: number, place: Place) => {
  const jd = julian(date, minutes, place.utcOffset);
  const moon = lunar(jd);
  const { eps } = solar(jd);
  const ra = wrap(
    Math.atan2(
      sin(moon.longitude) * cos(eps) - Math.tan(moon.latitude * RAD) * sin(eps),
      cos(moon.longitude),
    ) / RAD,
  );
  const decl =
    Math.asin(
      sin(moon.latitude) * cos(eps) +
        cos(moon.latitude) * sin(eps) * sin(moon.longitude),
    ) / RAD;
  // 月亮离得近，视差约一度，不改的话月出会差几分钟，这里只粗略地压低一点
  const { alt, az } = horizontal(ra, decl, jd, place);
  return {
    alt: alt - 0.95 * cos(alt),
    az,
    illuminated: moon.illuminated,
    waxing: moon.waxing,
    elongation: moon.elongation,
  };
};

// 月相的名字
export const phaseName = (illuminated: number, waxing: boolean) => {
  if (illuminated < 0.03) return "新月";
  if (illuminated > 0.97) return "满月";
  if (Math.abs(illuminated - 0.5) < 0.06) return waxing ? "上弦月" : "下弦月";
  if (illuminated < 0.5) return waxing ? "蛾眉月" : "残月";
  return waxing ? "盈凸月" : "亏凸月";
};

// 地球在公转轨道上：日心黄经（度）和离太阳多远（天文单位）
export const earthAt = (date: string, minutes: number, utcOffset: number) => {
  const s = solar(julian(date, minutes, utcOffset));
  return { longitude: wrap(s.longitude + 180), distance: s.distance };
};

export const AU_KM = 149597870.7;

// 一年里每一天的昼长（分钟），极夜记 0、极昼记 1440
export const dayLengths = (year: number, place: Place) => {
  const out: number[] = [];
  for (
    let ms = Date.UTC(year, 0, 1);
    ms < Date.UTC(year + 1, 0, 1);
    ms += 86400000
  ) {
    const date = new Date(ms).toISOString().slice(0, 10);
    const { rise, set, noon } = sunTimes(date, place);
    if (rise === null || set === null) {
      out.push(sunAt(date, noon, place).alt > 0 ? 1440 : 0);
    } else {
      out.push(set - rise);
    }
  }
  return out;
};

export const dayOfYear = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000);
};

export const weekday = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return "日一二三四五六"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

export const clock = (minutes: number) => {
  const m = Math.round(minutes);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
