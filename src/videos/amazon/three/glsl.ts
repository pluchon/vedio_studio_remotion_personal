// 各个着色器共用的片段：经纬度与球面的换算、噪声、大气的颜色
import { BOX, DEM_CELL, DEM_SIZE, EARTH, SEA } from "../theme";

const f = (v: number) => v.toFixed(4);

export const GEO = /* glsl */ `
  const float EARTH = ${f(EARTH)};
  const vec2 BOX_ORIGIN = vec2(${f(BOX.west)}, ${f(BOX.north)});
  const vec2 BOX_SPAN = vec2(${f(BOX.east - BOX.west)}, ${f(BOX.south - BOX.north)});
  const vec2 DEM_TEXEL = vec2(${(1 / DEM_SIZE.width).toFixed(8)}, ${(1 / DEM_SIZE.height).toFixed(8)});
  const float DEM_CELL = ${f(DEM_CELL)};
  const float SEA = ${f(SEA)};

  vec2 lonLatOf(vec2 uv) { return BOX_ORIGIN + uv * BOX_SPAN; }
  vec2 uvOf(vec2 lonLat) { return (lonLat - BOX_ORIGIN) / BOX_SPAN; }

  vec3 upAt(vec2 lonLat) {
    float a = radians(lonLat.y);
    float b = radians(lonLat.x);
    return vec3(cos(a) * cos(b), sin(a), -cos(a) * sin(b));
  }
  vec3 eastAt(vec2 lonLat) {
    float b = radians(lonLat.x);
    return vec3(-sin(b), 0.0, -cos(b));
  }
  vec3 northAt(vec2 lonLat) {
    float a = radians(lonLat.y);
    float b = radians(lonLat.x);
    return vec3(-sin(a) * cos(b), cos(a), sin(a) * sin(b));
  }
`;

export const NOISE = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      sum += amp * noise(p);
      p = p * 2.03 + vec2(17.1, 9.3);
      amp *= 0.5;
    }
    return sum;
  }
`;

// 空气：离得越远越蒙上一层天色，朝太阳的方向偏暖；最后压一下高光再输出
export const AIR = /* glsl */ `
  uniform vec3 sunDir;
  uniform float hazeRange;

  vec3 hazeColor(vec3 viewDir) {
    float toSun = max(dot(viewDir, sunDir), 0.0);
    vec3 cool = vec3(0.10, 0.20, 0.42);
    vec3 warm = vec3(0.90, 0.50, 0.26);
    return mix(cool, warm, pow(toSun, 8.0) * 0.8);
  }
  vec3 withHaze(vec3 color, vec3 worldPos) {
    vec3 ray = worldPos - cameraPosition;
    float dist = length(ray);
    float amount = 1.0 - exp(-dist / hazeRange);
    return mix(color, hazeColor(ray / dist), amount);
  }
  // 电影常用的那条压高光的曲线（ACES 的近似）
  vec3 grade(vec3 color) {
    vec3 x = max(color * 1.3, 0.0);
    vec3 mapped = clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    // 褪一点颜色，暗部偏冷
    float grey = dot(mapped, vec3(0.3, 0.55, 0.15));
    mapped = mix(vec3(grey), mapped, 0.86);
    return mapped + (1.0 - grey) * vec3(-0.006, 0.0, 0.02);
  }
`;
