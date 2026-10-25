// 深海里的第一点暖光：一条会复制自己的分子（螺旋的骨架 + 一级级横档，副本的横档一格格扣上去），光线步进画出体积感；
// 也用来画「两点光合成一点」。周围是幽暗的海水、斜下来的光、漂浮的微粒（离焦的变成光斑）
export const CELLS = /* glsl */ `
uniform float uCopy;      // 副本长到哪里（沿 x，-1.3..1.3）
uniform float uFocus;     // 对焦距离
uniform float uAperture;  // 景深的模糊量
uniform float uGlow;      // 整体亮度
uniform float uMerge;     // 「合二为一」模式：0 不用；>0 时两团光按这个进度靠近融合
uniform vec3 uTintA;
uniform vec3 uTintB;

const float HR = 0.12;          // 螺旋半径
const float W = 6.98;           // 每单位长度转的弧度（0.9 一圈）
const float DX = 0.075;         // 横档间距
const float BOFF = 2.6;         // 两条骨架错开的角度（大沟小沟）

vec3 helix(float x, float off) { float a = x * W + off; return vec3(x, cos(a) * HR, sin(a) * HR); }

float smin(float a, float b, float k) { float h = sat(0.5 + 0.5 * (b - a) / k); return mix(b, a, h) - k * h * (1.0 - h); }
float capsule(vec3 p, vec3 a, vec3 b, float r, out vec3 cp) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  cp = a + ba * h;
  return length(p - cp) - r;
}

// 分子的距离场；kind：0 骨架 A，1 骨架 B，2 横档；fresh 是刚扣上的程度
float molecule(vec3 p, out float kind, out float fresh) {
  float d = 1e9;
  kind = 0.0;
  fresh = 0.0;
  vec3 cp;
  if (abs(p.x) > 1.45) return length(p) - 1.2;
  float j = floor(p.x / (DX * 0.5));
  float bbA = 1e9, bbB = 1e9;
  for (int k = -1; k <= 1; k++) {
    float x0 = (j + float(k)) * DX * 0.5;
    float x1 = x0 + DX * 0.5;
    // 相邻的几段骨架用平滑并集接起来，看不出接缝
    bbA = smin(bbA, capsule(p, helix(x0, 0.0), helix(x1, 0.0), 0.016, cp), 0.006);
    if (x0 < uCopy) {
      float grow = sat((uCopy - x0) / 0.12);
      bbB = smin(bbB, capsule(p, helix(x0, BOFF), helix(min(x1, uCopy), BOFF), 0.016 * grow, cp), 0.006);
    }
  }
  if (bbA < d) { d = bbA; kind = 0.0; }
  if (bbB < d) { d = bbB; kind = 1.0; fresh = sat(1.0 - (uCopy - p.x) / 0.35); }
  float i = floor(p.x / DX + 0.5);
  for (int k = -1; k <= 1; k++) {
    float x = (i + float(k)) * DX;
    if (abs(x) > 1.3) continue;
    vec3 a = helix(x, 0.0), b = helix(x, BOFF);
    vec3 m = mix(a, b, 0.5);
    // A 侧的半根总在；B 侧的半根要等副本长到这里
    float dr = capsule(p, a, mix(a, b, 0.47), 0.011, cp);
    if (dr < d) { d = dr; kind = 2.0; fresh = 0.0; }
    if (x < uCopy - 0.02) {
      float snap = sat((uCopy - x) / 0.1);
      float db = capsule(p, mix(m, b, 1.0 - snap) + (m - b) * 0.06, b, 0.011, cp);
      if (db < d) { d = db; kind = 2.0; fresh = sat(1.0 - (uCopy - x) / 0.3); }
    }
  }
  return d;
}

// 一颗光球：芯 + 晕；离焦的按景深变大变淡
vec3 orb(vec3 ro, vec3 rd, vec3 c, float r, vec3 tint, float px) {
  vec3 w = c - ro;
  float t = dot(w, rd);
  if (t < 0.05) return vec3(0.0);
  float d = length(w - rd * t);
  float coc = abs(t - uFocus) * uAperture / t + px * 1.2;
  float rr = max(r, coc);
  float core = smoothstep(rr, rr * 0.3, d) * (r * r) / (rr * rr);
  float halo = exp(-d / (r * 1.5 + coc)) * 0.25 + exp(-d / (r * 6.0)) * 0.04;
  return tint * (core * 1.6 + halo);
}

vec3 water(vec3 rd) {
  float up = rd.y * 0.5 + 0.5;
  vec3 col = mix(vec3(0.0004, 0.0016, 0.0022), vec3(0.004, 0.016, 0.022), smoothstep(0.35, 1.0, up));
  vec2 sp = rd.xz / max(rd.y + 1.2, 0.2);
  float rays = fbm(vec2(sp.x * 3.0 + uTime * 0.03, uTime * 0.02), 4);
  col += vec3(0.006, 0.024, 0.03) * pow(rays, 3.0) * smoothstep(0.3, 0.95, up) * 2.0;
  return col;
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  vec3 col = water(rd);
  vec3 sum = vec3(0.0);
  if (uMerge <= 0.0) {
    // 包围圆柱：只在分子附近步进
    float t = 0.0;
    vec3 glow = vec3(0.0);
    bool hit = false;
    float kind = 0.0, fresh = 0.0;
    vec3 p;
    for (int i = 0; i < 110; i++) {
      p = ro + rd * t;
      float d = molecule(p, kind, fresh);
      vec3 tint = kind == 1.0 ? uTintB : uTintA;
      glow += tint * exp(-max(d, 0.0) * 55.0) * 0.012 * (1.0 + fresh * 6.0) * min(d + 0.01, 0.04) * 30.0;
      if (d < 0.0006 * t) { hit = true; break; }
      t += d * 0.85;
      if (t > 6.0) break;
    }
    if (hit) {
      float e = 0.0008;
      float k2, f2;
      vec3 n = normalize(vec3(
        molecule(p + vec3(e, 0, 0), k2, f2) - molecule(p - vec3(e, 0, 0), k2, f2),
        molecule(p + vec3(0, e, 0), k2, f2) - molecule(p - vec3(0, e, 0), k2, f2),
        molecule(p + vec3(0, 0, e), k2, f2) - molecule(p - vec3(0, 0, e), k2, f2)));
      vec3 tint = kind == 1.0 ? uTintB : uTintA;
      float facing = sat(dot(n, -rd));
      float rim = pow(1.0 - facing, 3.0);
      float top = sat(dot(n, normalize(vec3(0.3, 1.0, 0.4))));
      // 半透明的发光体：中间透出暖光，边缘亮，顶上有一点冷的水光
      // 像凝胶：正面透出一点暖光，越往边越亮
      vec3 c = tint * (0.18 + 0.35 * facing * facing) * (kind == 2.0 ? 0.8 : 1.0);
      c += tint * (rim * 2.4 + pow(1.0 - facing, 1.5) * 0.5) + vec3(0.25, 0.5, 0.6) * pow(top, 10.0) * 0.5;
      // 内部的细纹，像里面有东西在流
      c *= 0.75 + 0.5 * noise(p * 60.0 + vec3(uTime * 0.3, 0.0, 0.0));
      c *= 1.0 + fresh * 4.0;
      // 离焦：离对焦距离越远越淡（真正的模糊交给泛光）
      float coc = abs(t - uFocus) * uAperture / t;
      sum += c * mix(1.0, 0.35, sat(coc / 0.02));
    }
    sum += glow;
  } else {
    float m = uMerge;
    vec3 c1 = vec3(-0.7 * (1.0 - m), 0.04 * sin(m * 6.0), 0.0);
    vec3 c2 = vec3(0.7 * (1.0 - m), -0.04 * sin(m * 6.0), 0.1 * (1.0 - m));
    float r = 0.1 + 0.04 * smoothstep(0.8, 1.0, m);
    sum += orb(ro, rd, c1, r, uTintA, px);
    sum += orb(ro, rd, c2, r, uTintB, px);
    vec3 w = (c1 + c2) * 0.5 - ro;
    float t = dot(w, rd);
    vec3 q = ro + rd * t - (c1 + c2) * 0.5;
    float bridge = exp(-abs(q.y) / 0.02) * exp(-abs(q.x) / max(length(c1 - c2) * 0.5, 0.01)) * smoothstep(0.3, 0.8, m);
    sum += mix(uTintA, uTintB, 0.5) * bridge * 0.5;
  }
  // 漂浮的微粒：离对焦面远的变成光斑；被暖光照到的会亮
  for (int k = 0; k < 3; k++) {
    float sc = k == 0 ? 6.0 : (k == 1 ? 11.0 : 19.0);
    for (int j = 1; j < 12; j++) {
      float tt0 = float(j) / sc * 1.9;
      vec3 drift = vec3(uTime * 0.01, uTime * 0.025, 0.0);
      vec3 q = (ro + rd * tt0 + drift) * sc;
      vec3 c = floor(q);
      vec4 h = h34(c + float(k) * 31.0);
      if (h.w > 0.4) continue;
      vec3 ppos = (c + 0.5 + 0.35 * (h.xyz - 0.5)) / sc - drift;
      vec3 w = ppos - ro;
      float tt = dot(w, rd);
      if (tt < 0.05) continue;
      float d = length(w - rd * tt);
      float coc = abs(tt - uFocus) * uAperture / tt + px * 0.8;
      float lit = 0.012 + 0.08 / (1.0 + dot(ppos.yz, ppos.yz) * 30.0) * smoothstep(1.6, 1.0, abs(ppos.x));
      vec3 pc = mix(vec3(0.25, 0.55, 0.65), uTintA, sat(lit * 20.0));
      sum += pc * lit * smoothstep(coc, coc * 0.7, d) * (px * px) / (coc * coc) * 2.5;
    }
  }
  col += sum * uGlow;
  o = vec4(col, 1.0);
}
`;
