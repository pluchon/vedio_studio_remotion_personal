// 地面上的场景：海岸的岩石、左边的岬角、海面（波浪的法线、菲涅尔反射天空、岸边的白沫）、算出来的天空和银河；
// 可选：一堆篝火（照亮地面、火焰、火星）、围坐的几个身影、远处岬角下亮起来的聚落灯火、一排射电望远镜
import { SKY } from "./sky";

export const LAND = SKY + /* glsl */ `
uniform vec4 uFire;        // 篝火：位置 xyz、强度 w
uniform float uFigures;    // 围坐的身影（0 没有）
uniform float uTown;       // 远处的聚落灯火 0..1
uniform float uDishes;     // 射电望远镜（0 没有）
uniform float uWaveT;      // 浪的时间
uniform float uSeaAmt;     // 1 有海；0 没有（内陆的旷野）
uniform float uExpo;
uniform vec4 uMoon;        // 月光：方向 xyz、强度 w

float rocksH(vec2 p) {
  float near = smoothstep(-24.0, -14.0, p.y) * smoothstep(-2.0, -8.0, p.y) * smoothstep(34.0, 10.0, abs(p.x - 2.0));
  return ((fbm(p * 0.2 + 3.0, 6) - 0.42) * 3.6 + 0.9) * near;
}
float headH(vec2 p) {
  float m = smoothstep(-40.0, -220.0, p.x - p.y * 0.25);
  return (fbm(p * 0.006 + 1.0, 5) * 1.3 - 0.25) * 110.0 * m;
}
float islandH(vec2 p) {
  vec2 q = p - vec2(900.0, -2600.0);
  return (60.0 - length(q * vec2(1.0, 2.2)) * 0.12) + fbm(p * 0.02, 4) * 10.0;
}
float terrain(vec2 p) {
  float h;
  if (uSeaAmt > 0.5) {
    h = max(max(rocksH(p), headH(p)), islandH(p));
  } else {
    // 内陆：火堆周围是平缓的草原，远处才是山
    float far = smoothstep(120.0, 420.0, length(p - uFire.xz));
    h = 0.35 * fbm(p * 0.25, 4) + 2.0 * fbm(p * 0.02, 3) + (fbm(p * 0.004 + 5.0, 6) * 1.4 - 0.35) * 160.0 * far;
  }
  return h;
}

// 围坐的身影：一个个柔和的胶囊身子 + 头，朝着火
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float smin(float a, float b, float k) { float h = sat(0.5 + 0.5 * (b - a) / k); return mix(b, a, h) - k * h * (1.0 - h); }
// 圆锥台（iq 的 round cone）：底下宽、上面窄，像裹着衣服坐着
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 ba = b - a;
  float l2 = dot(ba, ba);
  float rr = r1 - r2;
  float a2 = l2 - rr * rr;
  float il2 = 1.0 / l2;
  vec3 pa = p - a;
  float y = dot(pa, ba);
  float z = y - l2;
  vec3 xv = pa * l2 - ba * y;
  float x2 = dot(xv, xv);
  float y2 = y * y * l2;
  float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
float figures(vec3 p) {
  if (uFigures <= 0.0) return 1e9;
  vec3 f = uFire.xyz;
  float bound = max(length(p.xz - f.xz) - 2.4, p.y - f.y - 1.6);
  if (bound > 0.3) return bound;
  float d = 1e9;
  for (int i = 0; i < 5; i++) {
    float a = float(i) * 1.25 + 0.4 + 0.2 * sin(float(i) * 3.7);
    float r = 1.3 + 0.12 * sin(float(i) * 2.1);
    vec3 base = f + vec3(cos(a) * r, 0.0, sin(a) * r);
    base.y = terrain(base.xz);
    vec3 toF = normalize(vec3(f.x - base.x, 0.0, f.z - base.z));
    float s = 0.85 + 0.2 * h11(float(i) + 0.5);
    // 裹着的身子微微前倾，头小一点
    vec3 top = base + vec3(0.0, 0.66 * s, 0.0) + toF * 0.1 * s;
    float body = sdRoundCone(p, base + vec3(0.0, 0.12, 0.0), top, 0.26 * s, 0.11 * s);
    float head = length(p - (top + vec3(0.0, 0.15 * s, 0.0) + toF * 0.04)) - 0.095 * s;
    d = min(d, smin(body, head, 0.05));
  }
  return d;
}

// 射电望远镜：碟子（一段球壳）+ 支架，碟面朝天
float dishes(vec3 p) {
  if (uDishes <= 0.0) return 1e9;
  float d = 1e9;
  for (int i = 0; i < 3; i++) {
    vec2 cxz = vec2(-0.566, -0.824) * (22.0 + 18.0 * float(i)) + vec2(0.824, -0.566) * (float(i) - 1.0) * 15.0;
    vec3 c = vec3(cxz.x, 0.0, cxz.y);
    c.y = terrain(c.xz);
    vec3 q = p - c;
    float mast = sdCapsule(q, vec3(0.0), vec3(0.0, 5.5, 0.0), 0.35);
    vec3 dq = q - vec3(0.0, 6.0, 0.0);
    // 碟面斜朝天（朝画面右上），从侧面看得出碟子的弧
    vec3 A = normalize(vec3(0.47, 0.8, -0.36));
    vec3 Bv = normalize(cross(A, vec3(0.0, 0.0, 1.0)));
    vec3 Cv = cross(Bv, A);
    dq = vec3(dot(dq, Bv), dot(dq, A), dot(dq, Cv));
    float shell = abs(length(dq - vec3(0.0, 7.0, 0.0)) - 7.0) - 0.08;
    shell = max(shell, dq.y - 1.6);
    float feed = sdCapsule(dq, vec3(0.0, 0.0, 0.0), vec3(0.0, 3.4, 0.0), 0.06);
    d = min(d, min(mast, min(shell, feed)));
  }
  return d;
}

float sceneD(vec3 p) {
  float d = (p.y - terrain(p.xz)) * 0.45;
  d = min(d, figures(p));
  d = min(d, dishes(p));
  return d;
}

vec3 sceneN(vec3 p, float t) {
  float e = max(0.002, t * 0.0015);
  return normalize(vec3(
    sceneD(p + vec3(e, 0, 0)) - sceneD(p - vec3(e, 0, 0)),
    sceneD(p + vec3(0, e, 0)) - sceneD(p - vec3(0, e, 0)),
    sceneD(p + vec3(0, 0, e)) - sceneD(p - vec3(0, 0, e))));
}

// 火光的闪烁
float flicker() {
  return 0.75 + 0.15 * sin(uTime * 13.0) * sin(uTime * 7.3 + 1.0) + 0.1 * noise(vec2(uTime * 9.0, 0.0));
}

vec3 fireLight(vec3 p, vec3 n) {
  if (uFire.w <= 0.0) return vec3(0.0);
  vec3 l = uFire.xyz + vec3(0.0, 0.35, 0.0) - p;
  float d2 = dot(l, l);
  float ndl = sat(dot(n, l / sqrt(d2)) * 0.8 + 0.2);
  return vec3(1.0, 0.45, 0.13) * uFire.w * flicker() * ndl / (d2 + 0.3) * 6.0;
}

vec3 skyAll(vec3 d, float px) {
  vec3 c = skyScatter(d);
  c += nightSky(d, px);
  // 太阳本身
  float mu = dot(d, uSunDir);
  c += uSunI * skyTrans(d) * smoothstep(0.99996, 0.99999, mu) * 40.0;
  return c;
}

// 篝火的火焰：火堆上方一小块体积，往上流的噪声，黑体颜色
vec3 flame(vec3 ro, vec3 rd, float tmax) {
  if (uFire.w <= 0.0) return vec3(0.0);
  vec3 c = uFire.xyz;
  vec3 col = vec3(0.0);
  // 和火焰所在的竖直圆柱求一个大概的范围
  vec3 oc = ro - c;
  float b = dot(oc.xz, rd.xz), a = dot(rd.xz, rd.xz), cc = dot(oc.xz, oc.xz) - 0.36;
  float h = b * b - a * cc;
  if (h < 0.0) return col;
  h = sqrt(h);
  float t0 = max((-b - h) / a, 0.0), t1 = min((-b + h) / a, tmax);
  if (t1 <= t0) return col;
  float dt = (t1 - t0) / 20.0;
  for (int i = 0; i < 20; i++) {
    vec3 p = ro + rd * (t0 + dt * (float(i) + 0.5)) - c;
    float y = p.y;
    if (y < -0.05 || y > 1.4) continue;
    float r = length(p.xz);
    float w = 0.33 * (1.0 - y / 1.4) * (0.7 + 0.3 * sin(y * 6.0 - uTime * 9.0));
    vec3 q = p * vec3(3.0, 2.0, 3.0) - vec3(0.0, uTime * 2.6, 0.0);
    float n = fbm(q, 4);
    float dens = smoothstep(w, w * 0.2, r + (n - 0.5) * 0.25) * smoothstep(1.4, 0.2, y + (n - 0.5) * 0.5);
    float temp = 900.0 + 2300.0 * dens * (1.0 - y * 0.5);
    col += blackbody(temp) * dens * dens * dt * 22.0 * uFire.w * flicker();
  }
  return col;
}

// 火星：一颗颗往上飘、慢慢熄灭的小亮点
vec3 embers(vec3 ro, vec3 rd, float px, float tmax) {
  if (uFire.w <= 0.0) return vec3(0.0);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 28; i++) {
    float fi = float(i);
    float life = 3.5 + 2.0 * h11(fi * 1.3);
    float age = mod(uTime + h11(fi) * life, life);
    float k = floor((uTime + h11(fi) * life) / life);
    vec3 dir = normalize(vec3(h11(fi + k * 7.0) - 0.5, 0.0, h11(fi + k * 3.0) - 0.5));
    vec3 p = uFire.xyz + vec3(0.0, 0.3 + age * 0.9, 0.0) + dir * age * 0.25
           + vec3(sin(age * 2.0 + fi), 0.0, cos(age * 1.7 + fi)) * 0.15 * age;
    vec3 w = p - ro;
    float t = dot(w, rd);
    if (t < 0.1 || t > tmax) continue;
    float a = length(cross(normalize(w), rd));
    float glow = exp(-a * a / (2.0 * px * px * 1.3)) * (1.0 - age / life) * 3.0;
    col += vec3(1.0, 0.5, 0.15) * glow * uFire.w;
  }
  return col;
}

// 远处岬角下的灯火：一颗颗按顺序亮起来
vec3 town(vec3 ro, vec3 rd, float px, float tEnd) {
  if (uTown <= 0.0) return vec3(0.0);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 70; i++) {
    float fi = float(i);
    vec2 q = vec2(-260.0 - h11(fi) * 380.0, -700.0 - h11(fi + 9.0) * 900.0);
    float hh = terrain(q);
    if (hh < 0.5) continue;
    vec3 p = vec3(q.x, hh + 1.5, q.y);
    float on = smoothstep(fi / 70.0, fi / 70.0 + 0.05, uTown);
    vec3 w = p - ro;
    if (length(w) > tEnd + 30.0) continue;
    float a = length(cross(normalize(w), rd));
    col += vec3(1.0, 0.6, 0.25) * on * exp(-a * a / (2.0 * px * px)) * 2.5;
  }
  // 灯火照亮的那片低空
  vec3 dir = normalize(vec3(-450.0, 30.0, -1150.0) - ro);
  float m = dot(rd, dir);
  col += vec3(1.0, 0.5, 0.2) * uTown * exp(-(1.0 - m) * 60.0) * smoothstep(-0.02, 0.08, rd.y) * 0.04;
  return col;
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  // 地形和物体：步进
  float t = 0.05;
  bool hit = false;
  float tPrev = t;
  for (int i = 0; i < 260; i++) {
    vec3 p = ro + rd * t;
    float d = sceneD(p);
    if (d < 0.0006 * t) { hit = true; break; }
    tPrev = t;
    // 远处的山坡陡，步子要小一点，不然会跨过山脚、只剩山头飘在天上
    t += max(d * (t > 200.0 ? 0.55 : 0.75), 0.0012 * t);
    if (t > 6000.0 || p.y > 300.0 && rd.y > 0.0) break;
  }
  // 命中后在上一步和这一步之间二分，去掉台阶状的条纹
  if (hit) {
    float a = tPrev, b = t;
    for (int k = 0; k < 6; k++) {
      float m = 0.5 * (a + b);
      if (sceneD(ro + rd * m) < 0.0006 * m) b = m; else a = m;
    }
    t = b;
  }
  // 海面
  float tSea = (uSeaAmt > 0.5 && rd.y < 0.0) ? -ro.y / rd.y : 1e9;
  vec3 col;
  float tEnd = 1e9;
  vec3 ambient = skyScatter(vec3(0.0, 1.0, 0.0)) * 0.6 + vec3(0.0008, 0.001, 0.0016);
  if (hit && t < tSea) {
    vec3 p = ro + rd * t;
    vec3 n = sceneN(p, t);
    float wet = smoothstep(0.6, 0.0, p.y);
    vec3 alb = mix(vec3(0.07, 0.06, 0.05), vec3(0.03, 0.03, 0.028), wet);
    alb *= 0.7 + 0.6 * noise(p * 3.0);
    float isFig = step(figures(p), 0.01) + step(dishes(p), 0.01);
    alb = mix(alb, vec3(0.04, 0.035, 0.03), isFig);
    if (dishes(p) < 0.01) alb = vec3(0.35, 0.36, 0.38);
    vec3 sunT = skyTrans(uSunDir) * step(0.0, uSunDir.y + 0.01);
    float ndl = sat(dot(n, uSunDir));
    col = alb * (uSunI * sunT * ndl * 0.06 + ambient * (0.5 + 0.5 * n.y));
    col += alb * fireLight(p, n) * 2.5;
    if (uMoon.w > 0.0) col += alb * vec3(0.55, 0.62, 0.8) * uMoon.w * sat(dot(n, normalize(uMoon.xyz)));
    // 湿的岩石有一点天光的反射
    vec3 rf = reflect(rd, n);
    col += skyScatter(rf) * wet * 0.04 * pow(1.0 - sat(dot(n, -rd)), 3.0);
    // 远处罩一层大气
    vec3 haze = skyScatter(normalize(vec3(rd.x, 0.02, rd.z)));
    col = mix(haze, col, exp(-t * 0.00035));
    tEnd = t;
  } else if (tSea < 1e8) {
    vec3 p = ro + rd * tSea;
    float dist = tSea;
    // 浪：两层噪声的梯度做法线，远处变平
    vec2 q = p.xz;
    float amp = 0.12 / (1.0 + dist * 0.004);
    float e = 0.05 + dist * 0.002;
    float h0 = fbm(q * 0.35 + vec2(uWaveT * 0.3, uWaveT * 0.12), 5) + 0.5 * fbm(q * 1.3 - vec2(uWaveT * 0.5, 0.0), 4);
    float hx = fbm((q + vec2(e, 0.0)) * 0.35 + vec2(uWaveT * 0.3, uWaveT * 0.12), 5) + 0.5 * fbm((q + vec2(e, 0.0)) * 1.3 - vec2(uWaveT * 0.5, 0.0), 4);
    float hz = fbm((q + vec2(0.0, e)) * 0.35 + vec2(uWaveT * 0.3, uWaveT * 0.12), 5) + 0.5 * fbm((q + vec2(0.0, e)) * 1.3 - vec2(uWaveT * 0.5, 0.0), 4);
    vec3 n = normalize(vec3(-(hx - h0) / e * amp * 8.0, 1.0, -(hz - h0) / e * amp * 8.0));
    vec3 rf = reflect(rd, n);
    rf.y = abs(rf.y);
    float fr = 0.02 + 0.98 * pow(1.0 - sat(dot(n, -rd)), 5.0);
    vec3 refl = skyAll(rf, px * 1.5);
    vec3 deep = vec3(0.002, 0.008, 0.01) * (skyScatter(vec3(0.0, 1.0, 0.0)) * 0.3 + 0.002);
    col = mix(deep, refl, fr);
    col += fireLight(p, n) * 0.08;
    // 岸边的白沫：地形刚好没过水面的地方
    float under = terrain(q);
    float foam = smoothstep(-0.5, 0.0, under) * smoothstep(0.4, 0.8, fbm(q * 2.0 + vec2(uWaveT * 0.6, 0.0), 4) + 0.3 * sin(uWaveT * 1.3 + q.y * 0.4));
    col = mix(col, ambient * 0.9 + skyScatter(normalize(vec3(rd.x, 0.1, rd.z))) * 0.1 + fireLight(p, vec3(0, 1, 0)) * 0.3, foam * 0.7);
    vec3 haze = skyScatter(normalize(vec3(rd.x, 0.02, rd.z)));
    col = mix(haze, col, exp(-dist * 0.00025));
    tEnd = tSea;
  } else {
    col = skyAll(rd, px);
  }
  col += flame(ro, rd, tEnd);
  col += embers(ro, rd, px, tEnd);
  col += town(ro, rd, px, tEnd);
  o = vec4(col * uExpo, 1.0);
}
`;
