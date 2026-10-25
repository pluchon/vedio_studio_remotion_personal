// 恒星特写和它外面的戴森云：表面的米粒组织、临边昏暗、黑子、日冕的流线；
// 外面三层慢慢转的球壳上，一块块收集光的板（挡在恒星前面是黑的剪影，侧面反光，背面透出暖红的余热）
export const STAR = /* glsl */ `
uniform float uSwarm;     // 板的覆盖程度 0..1
uniform float uStarI;     // 恒星亮度
uniform float uExpo;
uniform float uStarsAmt;
uniform float uRotT;

vec2 sphHit(vec3 ro, vec3 rd, float R) {
  float b = dot(ro, rd), c = dot(ro, ro) - R * R;
  float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

vec3 starSurface(vec3 n, float mu) {
  // 米粒组织：两层流动的胞状噪声
  vec3 q = n * 26.0 + vec3(0.0, uRotT * 0.4, 0.0);
  float g = 1.0 - abs(2.0 * fbm(q, 4) - 1.0);
  float g2 = fbm(n * 70.0 + uRotT * 0.2, 3);
  float spots = smoothstep(0.72, 0.8, fbm(n * 5.0 + 3.0, 4));
  float limb = pow(mu, 0.55);
  vec3 c = blackbody(5600.0 + 600.0 * g) * (0.75 + 0.35 * g + 0.15 * g2);
  c *= 1.0 - spots * 0.8;
  return c * limb;
}

// 一条轨道带上的板：半径 R 的球面上、绕着倾斜的轴、纬度很窄的一圈；带里一格一格的小板
vec4 band(vec3 ro, vec3 rd, float R, vec3 axis, float spin, float width, float seed, float tmax, out float tHit) {
  tHit = 1e9;
  vec2 h = sphHit(ro, rd, R);
  vec3 ax = normalize(axis);
  vec3 bx = normalize(cross(ax, vec3(0.3, 0.1, 1.0)));
  vec3 by = cross(ax, bx);
  for (int k = 0; k < 2; k++) {
    float t = k == 0 ? h.x : h.y;
    if (t <= 0.0 || t > tmax) continue;
    vec3 p = ro + rd * t;
    vec3 q = p / R;
    float lat = asin(clamp(dot(q, ax), -1.0, 1.0));
    if (abs(lat) > width) continue;
    float lon = atan(dot(q, by), dot(q, bx)) + spin;
    float n = 420.0;
    float cl = floor(lon / TAU * n);
    float rows = max(1.0, floor(width * 2.0 * n / TAU));
    float cr = floor((lat + width) / (2.0 * width) * rows);
    vec2 f = vec2(fract(lon / TAU * n), fract((lat + width) / (2.0 * width) * rows));
    float on = step(h21(vec2(cl, cr) + seed * 13.0), 0.86);
    float inside = step(abs(f.x - 0.5), 0.4) * step(abs(f.y - 0.5), 0.4);
    if (on * inside > 0.5) {
      tHit = t;
      vec3 nrm = normalize(p);
      float facing = dot(nrm, -rd);
      // 背着恒星的一面是黑的，透一点余热；朝着恒星的一面（从外面看见内侧）反光
      vec3 c = vec3(0.006, 0.002, 0.001) + vec3(1.0, 0.22, 0.05) * 0.05 * (0.6 + 0.4 * h21(vec2(cl, cr)));
      if (facing < 0.0) c = blackbody(5600.0) * uStarI * 0.06;
      c += vec3(1.0, 0.85, 0.6) * pow(1.0 - abs(facing), 10.0) * 0.5;
      return vec4(c, 1.0);
    }
  }
  return vec4(0.0);
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  vec3 col = stars(rd, px, uStarsAmt);
  vec2 hs = sphHit(ro, rd, 1.0);
  float tStar = hs.x > 0.0 ? hs.x : 1e9;
  // 日冕：离表面越远越淡，有一条条往外的流线
  float b = dot(ro, rd);
  vec3 cp = ro - rd * b;
  float dc = length(cp);
  if (tStar > 1e8) {
    float ang = atan(cp.y, cp.x);
    float str = 0.6 + 0.4 * fbm(vec2(ang * 6.0, dc * 2.0 - uRotT * 0.1), 4);
    col += blackbody(6200.0) * uStarI * (exp(-(dc - 1.0) * 9.0) * 0.6 * str + exp(-(dc - 1.0) * 2.0) * 0.06);
  } else {
    vec3 n = normalize(ro + rd * tStar);
    col = starSurface(n, sat(dot(n, -rd))) * uStarI;
  }
  // 一条条轨道带：覆盖程度越高，带越多、越宽
  if (uSwarm > 0.0) {
    float tm = tStar;
    for (int i = 0; i < 9; i++) {
      float fi = float(i);
      float grow = sat(uSwarm * 9.0 - fi);
      if (grow <= 0.0) break;
      vec3 axis = vec3(sin(fi * 2.4) * 0.8, 1.0, cos(fi * 1.7) * 0.8);
      float R = 1.6 + fi * 0.09;
      float th;
      vec4 pc = band(ro, rd, R, axis, uRotT * (0.06 - fi * 0.005) + fi, 0.05 + 0.1 * grow, fi, tm, th);
      if (pc.a > 0.0 && th < tm) {
        col = pc.rgb;
        tm = th;
      }
    }
  }
  o = vec4(col * uExpo, 1.0);
}
`;
