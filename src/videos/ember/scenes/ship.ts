// 一艘飞船：长长的船身、一圈居住环（带辐条）、前面的天线碟、两翼的板、尾部的推进器；
// 远处恒星的冷光勾出边，环上的窗口透出一点暖光；四周是空的
export const SHIP = /* glsl */ `
uniform vec3 uShipPos;
uniform float uShipRot;   // 环的转角
uniform vec3 uKey;        // 主光方向
uniform float uExpo;
uniform float uStarsAmt;
uniform float uEngine;

float sdCap(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdTorusX(vec3 p, float R, float r) {
  vec2 q = vec2(length(p.yz) - R, p.x);
  return length(q) - r;
}

// 返回距离，id：0 船身 1 环 2 碟 3 板 4 推进器
float ship(vec3 p, out float id) {
  p -= uShipPos;
  id = 0.0;
  if (length(p) > 14.0) return length(p) - 13.0;
  float d = sdCap(p, vec3(-8.0, 0.0, 0.0), vec3(8.0, 0.0, 0.0), 0.8);
  // 船身上一节节的舱
  vec3 q = p;
  q.x = mod(q.x + 1.0, 2.0) - 1.0;
  d = min(d, max(sdCap(q, vec3(-0.25, 0.0, 0.0), vec3(0.25, 0.0, 0.0), 0.98), abs(p.x) - 7.5));
  // 居住环 + 辐条（绕 x 轴转）
  vec3 r = p - vec3(2.0, 0.0, 0.0);
  r.yz *= rot(uShipRot);
  float ring = sdTorusX(r, 4.2, 0.42);
  float sp = 1e9;
  for (int i = 0; i < 4; i++) {
    float a = float(i) * PI * 0.5;
    sp = min(sp, sdCap(r, vec3(0.0), vec3(0.0, cos(a), sin(a)) * 4.1, 0.12));
  }
  ring = min(ring, sp);
  if (ring < d) { d = ring; id = 1.0; }
  // 前面的天线碟：一段球壳，朝前
  vec3 c = p - vec3(9.6, 0.0, 0.0);
  float shell = abs(length(c - vec3(-3.2, 0.0, 0.0)) - 3.2) - 0.05;
  shell = max(shell, -c.x - 1.3);
  shell = min(shell, sdCap(c, vec3(-1.4, 0.0, 0.0), vec3(0.6, 0.0, 0.0), 0.05));
  if (shell < d) { d = shell; id = 2.0; }
  // 两翼的板
  vec3 w = p - vec3(-4.5, 0.0, 0.0);
  w.z = abs(w.z);
  float panel = sdBox(w - vec3(0.0, 0.0, 4.2), vec3(1.6, 0.03, 2.9));
  panel = min(panel, sdCap(w, vec3(0.0), vec3(0.0, 0.0, 7.0), 0.06));
  if (panel < d) { d = panel; id = 3.0; }
  // 推进器
  vec3 e = p - vec3(-8.6, 0.0, 0.0);
  float noz = max(abs(length(e.yz) - (0.5 + (-e.x) * 0.45)) - 0.06, abs(e.x + 0.6) - 0.6);
  if (noz < d) { d = noz; id = 4.0; }
  return d;
}

vec3 shipN(vec3 p) {
  float id;
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(ship(p + e.xyy, id) - ship(p - e.xyy, id), ship(p + e.yxy, id) - ship(p - e.yxy, id), ship(p + e.yyx, id) - ship(p - e.yyx, id)));
}

float shadowT(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.05;
  for (int i = 0; i < 32; i++) {
    float id;
    float h = ship(ro + rd * t, id);
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.05, 1.0);
    if (res < 0.002 || t > 30.0) break;
  }
  return sat(res);
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  vec3 col = stars(rd, px, uStarsAmt);
  float t = 0.0;
  float id = 0.0;
  bool hit = false;
  for (int i = 0; i < 140; i++) {
    float d = ship(ro + rd * t, id);
    if (d < 0.0005 * t) { hit = true; break; }
    t += d;
    if (t > 400.0) break;
  }
  vec3 L = normalize(uKey);
  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = shipN(p);
    float sh = shadowT(p + n * 0.01, L);
    float ndl = sat(dot(n, L));
    vec3 lp = p - uShipPos;
    // 金属的颜色：一块块面板，深浅不一
    vec3 alb = vec3(0.5, 0.52, 0.55) * (0.7 + 0.3 * h31(floor(lp * vec3(1.5, 2.0, 2.0))));
    if (id == 3.0) alb = vec3(0.05, 0.06, 0.09) + vec3(0.1) * step(0.92, fract(lp.x * 2.0)) + vec3(0.1) * step(0.94, fract(lp.z * 2.5));
    if (id == 2.0) alb = vec3(0.75);
    vec3 h = normalize(L - rd);
    float spec = pow(sat(dot(n, h)), id == 3.0 ? 120.0 : 40.0) * (id == 3.0 ? 1.5 : 0.4);
    float rim = pow(1.0 - sat(dot(n, -rd)), 4.0) * sat(dot(n, L) + 0.3);
    col = (alb * ndl + spec) * sh * vec3(0.9, 0.95, 1.0) * 2.2 + alb * vec3(0.004, 0.005, 0.008) + rim * vec3(0.6, 0.7, 0.9) * 0.3 * sh;
    // 环上的窗：一格一格的暖光
    if (id == 1.0) {
      vec3 r = lp - vec3(2.0, 0.0, 0.0);
      r.yz *= rot(uShipRot);
      float ang = atan(r.z, r.y);
      float cell = floor(ang / TAU * 90.0);
      float win = step(0.45, h11(cell)) * smoothstep(0.35, 0.2, abs(fract(ang / TAU * 90.0) - 0.5)) * smoothstep(0.2, 0.05, abs(r.x));
      col += vec3(1.0, 0.62, 0.3) * win * 1.6;
    }
  }
  // 推进器的光
  vec3 ep = uShipPos + vec3(-9.4, 0.0, 0.0);
  vec3 w = ep - ro;
  float a = length(cross(normalize(w), rd));
  if (!hit || dot(w, rd) < t) col += vec3(0.55, 0.7, 1.0) * uEngine * (exp(-a * a / (2.0 * px * px * 6.0)) * 3.0 + exp(-a / 0.01) * 0.15);
  o = vec4(col * uExpo, 1.0);
}
`;
