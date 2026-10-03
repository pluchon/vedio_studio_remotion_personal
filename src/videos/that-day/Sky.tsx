// 那一天的天空：面朝南（南半球面朝北）看一整天，天色、太阳、星星、月亮都按那天那地真实的位置走；时间快进，日出日落前后放慢
import React, { useEffect, useMemo, useState } from "react";
import { SkiaCanvas } from "@remotion/skia";
import {
  BlurMask,
  Circle,
  DashPathEffect,
  Fill,
  Group,
  Path,
  Points,
  Shader,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import {
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
} from "remotion";
import { moonAt, sunAt } from "./astro";
import type { Day } from "./day";
import { effect, litShape } from "./skia";
import { COLORS, FONT, HEIGHT, WIDTH } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const RAD = Math.PI / 180;

export const HORIZON = 800;

const SKY = effect(`
uniform float2 size;
uniform float2 sun;
uniform float alt;
uniform float horizon;

half4 main(float2 p) {
  float h = clamp((horizon - p.y) / horizon, 0.0, 1.0);
  float day = smoothstep(-4.0, 10.0, alt);
  float night = 1.0 - smoothstep(-18.0, -6.0, alt);
  float dusk = clamp(1.0 - day - night, 0.0, 1.0);
  // 黄昏时只有太阳那一侧的地平线是暖的
  float side = exp(-abs(p.x - sun.x) / (size.x * 0.33));
  float3 warm = mix(float3(0.30, 0.30, 0.46), float3(0.98, 0.56, 0.32), side);
  float3 zen = day * float3(0.15, 0.34, 0.68) + dusk * float3(0.10, 0.13, 0.30) + night * float3(0.010, 0.014, 0.036);
  float3 hor = day * float3(0.64, 0.78, 0.90) + dusk * warm + night * float3(0.035, 0.045, 0.09);
  float3 c = mix(hor, zen, pow(h, 0.5));
  float d = distance(p, sun) / size.y;
  float low = 1.0 - smoothstep(0.0, 22.0, abs(alt));
  c += float3(1.0, 0.6, 0.3) * exp(-d * 5.0) * (0.18 + 0.55 * low) * smoothstep(-14.0, -1.0, alt);
  c += float3(1.0, 0.95, 0.84) * exp(-d * 24.0) * 0.45 * smoothstep(-1.0, 5.0, alt);
  float n = fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) / 160.0;
  return half4(half3(c), 1.0);
}
`);

type Star = { ra: number; dec: number; mag: number };

let starCache: Promise<Star[]> | null = null;

// 第四期的 HYG 星表：存的是 three.js 的坐标（x、北极、-y），换回赤经赤纬，只留肉眼看得见的
const loadStars = () => {
  starCache ??= fetch(staticFile("horizon/data/stars.bin"))
    .then((res) => res.arrayBuffer())
    .then((buffer) => {
      const v = new Float32Array(buffer);
      const out: Star[] = [];
      for (let i = 0; i < v.length; i += 7) {
        const x = v[i];
        const y = -v[i + 2];
        const z = v[i + 1];
        const d = Math.hypot(x, y, z);
        if (d < 1e-6) continue;
        const mag = v[i + 3] + 5 * Math.log10(d / 10);
        if (mag > 5.2) continue;
        out.push({
          ra: (Math.atan2(y, x) / RAD + 360) % 360,
          dec: Math.asin(z / d) / RAD,
          mag,
        });
      }
      return out;
    });
  return starCache;
};

const useStars = () => {
  const [stars, setStars] = useState<Star[] | null>(null);
  const [handle] = useState(() => delayRender("载入星表"));
  useEffect(() => {
    loadStars()
      .then((loaded) => {
        setStars(loaded);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return stars;
};

// 全景的投影：方位按比例横着铺开，高度竖着铺，横竖同一个比例
export const panorama = (day: Day) => {
  const north = day.place.lat >= 0;
  const centre = north ? 180 : 0;
  const rel = (az: number) => ((((az - centre + 180) % 360) + 360) % 360) - 180;
  // 左右对称地铺开，日出、日落和月出的方位都要在画面里
  const edges = [day.rise, day.set].map((m) =>
    Math.abs(rel(sunAt(day.date, m, day.place).az)),
  );
  if (day.moonrise !== null) {
    edges.push(Math.abs(rel(moonAt(day.date, day.moonrise, day.place).az)));
  }
  const span = Math.max(150, 2 * Math.max(...edges) + 30);
  const scale = WIDTH / span;
  return {
    scale,
    visible: (az: number) => Math.abs(rel(az)) < span / 2 - 2,
    x: (az: number) => WIDTH / 2 + (north ? rel(az) : -rel(az)) * scale,
    y: (alt: number) => HORIZON - alt * scale,
  };
};

// 远山和近处的山脊：几层正弦叠出来的轮廓
const ridge = (base: number, amp: number, seed: number) => {
  let d = `M 0 ${HEIGHT} L 0 ${base}`;
  for (let x = 0; x <= WIDTH; x += 12) {
    const t = x / WIDTH;
    const y =
      base -
      amp *
        (0.5 * Math.sin(t * 7.1 + seed) +
          0.3 * Math.sin(t * 17.3 + seed * 2.1) +
          0.2 * Math.sin(t * 41.7 + seed * 3.7));
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return Skia.Path.MakeFromSVGString(`${d} L ${WIDTH} ${HEIGHT} Z`)!;
};

const FAR = ridge(HORIZON - 10, 22, 1.3);
const NEAR = ridge(HORIZON + 40, 34, 4.2);

const COMPASS: [number, string][] = [
  [0, "北"],
  [45, "东北"],
  [90, "东"],
  [135, "东南"],
  [180, "南"],
  [225, "西南"],
  [270, "西"],
  [315, "西北"],
];

const mixColor = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

export const Sky: React.FC<{ day: Day; minutes: number; zoom?: number }> = ({
  day,
  minutes,
  zoom = 1,
}) => {
  const stars = useStars();
  const view = useMemo(() => panorama(day), [day]);
  if (!stars) return null;

  const sun = sunAt(day.date, minutes, day.place);
  const moon = moonAt(day.date, minutes, day.place);
  const sx = view.x(sun.az);
  const sy = view.y(sun.alt);
  const daylight = interpolate(sun.alt, [-8, 8], [0, 1], clamp);
  const dark = interpolate(sun.alt, [-16, -5], [1, 0], clamp);

  // 星星按亮度分四档，每档一组点
  const lst = (day.siderealAt(minutes) + day.place.lon) % 360;
  const bins: { x: number; y: number }[][] = [[], [], [], []];
  if (dark > 0) {
    for (const star of stars) {
      const ha = (lst - star.ra) * RAD;
      const dec = star.dec * RAD;
      const lat = day.place.lat * RAD;
      const alt =
        Math.asin(
          Math.sin(lat) * Math.sin(dec) +
            Math.cos(lat) * Math.cos(dec) * Math.cos(ha),
        ) / RAD;
      if (alt < 0.5) continue;
      const az =
        (Math.atan2(
          -Math.sin(ha) * Math.cos(dec),
          Math.cos(lat) * Math.sin(dec) -
            Math.sin(lat) * Math.cos(dec) * Math.cos(ha),
        ) /
          RAD +
          360) %
        360;
      const bin =
        star.mag < 1 ? 0 : star.mag < 2.3 ? 1 : star.mag < 3.6 ? 2 : 3;
      bins[bin].push({ x: view.x(az), y: view.y(alt) });
    }
  }

  const mx = view.x(moon.az);
  const my = view.y(moon.alt);
  const moonR = 15;
  // 亮的一侧朝着太阳（太阳在地平线下也一样）
  const toward = Math.atan2(sy - my, sx - mx) / RAD;
  const lit = Skia.Path.MakeFromSVGString(
    litShape(mx, my, moonR, moon.illuminated),
  )!;

  // 太阳一整天的轨迹：走过的部分画成虚线，整点处点一个小点
  const passed = day.path.filter((point) => point.minutes <= minutes);
  const trail = Skia.Path.Make();
  passed.forEach((point, i) => {
    const x = view.x(point.az);
    const y = view.y(point.alt);
    if (i === 0) trail.moveTo(x, y);
    else trail.lineTo(x, y);
  });
  const hours = passed.filter(
    (point) => point.minutes % 60 === 0 && point.alt > 0,
  );
  // 推近月亮时轨迹和刻度先退掉，免得被放得很大
  const keep = interpolate(zoom, [1, 1.3], [1, 0], clamp);
  const lineColor = `rgba(255, 240, 214, ${(0.22 + 0.25 * (1 - daylight)) * keep})`;

  const hillFar = mixColor([14, 18, 30], [88, 104, 122], daylight);
  const hillNear = mixColor([6, 8, 14], [40, 48, 56], daylight);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `scale(${zoom})`,
        transformOrigin: `${mx}px ${my}px`,
      }}
    >
      <SkiaCanvas width={WIDTH} height={HEIGHT}>
        <Fill>
          <Shader
            source={SKY}
            uniforms={{
              size: [WIDTH, HEIGHT],
              sun: [sx, sy],
              alt: sun.alt,
              horizon: HORIZON,
            }}
          />
        </Fill>
        {bins.map((points, i) => (
          <Points
            key={i}
            points={points.map((p) => vec(p.x, p.y))}
            mode="points"
            color={COLORS.cream}
            strokeWidth={[5.5, 3.8, 2.6, 1.7][i]}
            strokeCap="round"
            opacity={dark * [1, 0.9, 0.7, 0.45][i]}
          />
        ))}
        {moon.alt > -2 ? (
          <Group>
            <Circle
              cx={mx}
              cy={my}
              r={moonR * 3.2}
              color={`rgba(230, 228, 214, ${0.12 * moon.illuminated})`}
            >
              <BlurMask blur={26} style="normal" />
            </Circle>
            <Circle
              cx={mx}
              cy={my}
              r={moonR}
              color={`rgba(40, 46, 62, ${0.5 + 0.3 * dark})`}
            />
            <Group transform={[{ rotate: toward * RAD }]} origin={vec(mx, my)}>
              <Path path={lit} color={COLORS.moon} />
            </Group>
          </Group>
        ) : null}
        {sun.alt > -3 ? (
          <Group>
            <Circle
              cx={sx}
              cy={sy}
              r={70}
              color={`rgba(255, 214, 160, ${0.35 * daylight + 0.2})`}
            >
              <BlurMask blur={40} style="normal" />
            </Circle>
            <Circle
              cx={sx}
              cy={sy}
              r={22}
              color={sun.alt < 6 ? "#ffd29a" : COLORS.sun}
            />
          </Group>
        ) : null}
        <Path path={trail} style="stroke" strokeWidth={1.6} color={lineColor}>
          <DashPathEffect intervals={[3, 9]} />
        </Path>
        {hours.map((point) => (
          <Circle
            key={point.minutes}
            cx={view.x(point.az)}
            cy={view.y(point.alt)}
            r={3.2}
            color={lineColor}
          />
        ))}
        <Path path={FAR} color={hillFar} />
        <Path path={NEAR} color={hillNear} />
      </SkiaCanvas>
      {hours.map((point) => (
        <div
          key={point.minutes}
          style={{
            position: "absolute",
            left: view.x(point.az) - 30,
            top: view.y(point.alt) + 14,
            width: 60,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 20,
            color: lineColor,
          }}
        >
          {point.minutes / 60}
        </div>
      ))}
      {COMPASS.filter(([az]) => view.visible(az)).map(([az, name]) => (
        <div
          key={name}
          style={{
            position: "absolute",
            left: view.x(az) - 60,
            top: HORIZON + 96,
            width: 120,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 24,
            letterSpacing: 4,
            color: COLORS.faint,
          }}
        >
          {name}
        </div>
      ))}
    </div>
  );
};
