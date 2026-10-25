// 旋涡星系：体积渲染（发光的恒星盘、旋臂、尘埃带、核球、电离氢区），盘面上的恒星按远近分级闪烁；
// 背景是远处的小星系；可选第二个星系（只算盘面）、一个在星系之间走的光子、一层 Canvas 叠加（文明的灯火）
export const GALAXY = /* glsl */ `
uniform float uSpin;      // 旋臂转角
uniform float uExpo;      // 星系亮度
uniform float uDive;      // 冲进星系时近处恒星流过的量
uniform vec4 uG2;         // 第二个星系：位置 xyz、半径 w（0 表示没有）
uniform vec3 uG2n;        // 第二个星系的盘面法线
uniform vec4 uPh;         // 光子：位置 xyz、亮度 w
uniform vec3 uPhDir;
uniform float uBg;        // 背景星系与星的量
uniform float uWarm;      // 盘面上某处的暖光（文明）：0 没有
uniform vec3 uWarmAt;
uniform vec4 uStar;       // 冲刺终点那颗恒星：位置 xyz、亮度 w

float armPhase(vec2 q) {
  float r = length(q);
  return atan(q.y, q.x) - log(max(r, 1e-3)) * 2.4 + uSpin;
}

// 盘面二维结构：返回 x = 年轻恒星（旋臂），y = 老恒星，z = 尘埃，w = 电离氢区
// 噪声在「解开旋臂」的坐标里采样（cos/sin 解卷角 + 半径），纹理顺着旋臂拉长，像被较差自转剪切过
float gOct = 5.0; // 按像素在盘面上的尺度定噪声的层数
vec4 disk2(vec2 q) {
  float r = length(q);
  float tw = atan(q.y, q.x) - log(max(r, 0.08)) * 2.3 + uSpin;
  vec2 cs = vec2(cos(tw), sin(tw));
  float warp = fbm(vec3(cs * 1.8, r * 2.2) + 3.0, 3) - 0.5;
  float ph = tw + warp * 1.0;
  vec2 cp = vec2(cos(ph), sin(ph));
  float c2 = cos(2.0 * ph);
  float arm = pow(0.5 + 0.5 * c2, 4.0);
  float broad = pow(0.5 + 0.5 * c2, 1.4);
  // 顺着旋臂的条纹（解卷角变化快、半径变化慢）和一团团的星云
  int no = int(gOct);
  // 核附近解卷角变化太快，条纹会变成一圈圈笔刷，换成各向同性的噪声
  float iso = smoothstep(0.42, 0.18, r);
  float streak = mix(fbm(vec3(cp * 9.0, r * 5.0), no), fbm(vec3(q * 14.0, 4.0), no), iso);
  float clump = fbm(vec3(q * 18.0, 2.0), no);
  float win = smoothstep(0.1, 0.28, r) * smoothstep(1.12, 0.72, r);
  // 主旋臂之外还有一组细碎的三重分支（絮状）
  float floc = pow(0.5 + 0.5 * cos(3.0 * ph + 1.7 + 3.0 * warp), 6.0) * 0.45;
  float young = (arm + floc) * (0.35 + 1.8 * smoothstep(0.35, 0.8, streak * 0.6 + clump * 0.55)) * exp(-r / 0.55) * win;
  young += broad * 0.1 * clump * exp(-r / 0.5) * win;
  float old = exp(-r / 0.22) * (0.75 + 0.35 * broad) * smoothstep(1.25, 0.45, r) + exp(-r / 0.6) * 0.1 * smoothstep(1.2, 0.8, r);
  float lane = pow(0.5 + 0.5 * cos(2.0 * (ph + 0.36)), 6.0);
  float fil = fbm(vec3(cp * 14.0, r * 9.0) + 7.0, no);
  float ridge = pow(1.0 - abs(2.0 * fil - 1.0), 3.0);
  float dust = lane * (0.25 + 1.7 * ridge) * smoothstep(0.14, 0.32, r) * exp(-r / 0.6) * smoothstep(1.08, 0.75, r);
  dust += pow(sat(fbm(vec3(q * 12.0, 9.0), no) * 1.5 - 0.5), 2.0) * 0.25 * broad * win;
  float hii = (arm + floc) * pow(sat(fbm(vec3(q * 48.0, 8.0), 3) * 2.4 - 1.3), 1.5) * 10.0 * smoothstep(0.15, 0.35, r) * smoothstep(0.95, 0.5, r);
  return vec4(young, old, dust, hii);
}

const vec3 C_YOUNG = vec3(0.42, 0.62, 1.0);
const vec3 C_OLD = vec3(1.0, 0.8, 0.58);
const vec3 C_BULGE = vec3(1.0, 0.72, 0.45);
const vec3 C_HII = vec3(1.0, 0.32, 0.45);

// 体积：沿视线积分发光与吸收
vec3 galaxyVolume(vec3 ro, vec3 rd, out vec3 trans) {
  trans = vec3(1.0);
  vec3 col = vec3(0.0);
  // 和厚度 0.3、半径 1.25 的圆柱求交
  float H = 0.3;
  float t0 = 0.0, t1 = 1e9;
  if (abs(rd.y) > 1e-5) {
    float a = (-H - ro.y) / rd.y, b = (H - ro.y) / rd.y;
    t0 = max(t0, min(a, b));
    t1 = min(t1, max(a, b));
  } else if (abs(ro.y) > H) return col;
  vec2 oc = ro.xz, dc = rd.xz;
  float A = dot(dc, dc), B = dot(oc, dc), C = dot(oc, oc) - 1.25 * 1.25;
  float disc = B * B - A * C;
  if (disc < 0.0) return col;
  disc = sqrt(disc);
  t0 = max(t0, (-B - disc) / A);
  t1 = min(t1, (-B + disc) / A);
  if (t1 <= t0) return col;
  // 步长：离盘面越近越小（结构都很薄），远处的样本少算几层噪声
  float j = h21(gl_FragCoord.xy + 0.5);
  float t = t0;
  float px = pixAngle();
  for (int i = 0; i < 180; i++) {
    if (t >= t1) break;
    vec3 p0 = ro + rd * t;
    float dt = clamp(max(abs(p0.y), 0.006) * 0.4 / max(abs(rd.y), 0.03), 0.002, 0.035);
    dt = min(dt, t1 - t);
    vec3 p = ro + rd * (t + dt * j);
    float z = abs(p.y);
    gOct = clamp(log2(0.02 / max((t + 0.02) * px, 1e-5)), 2.0, 7.0);
    vec4 d = disk2(p.xz);
    float bulge = exp(-pow(length(p * vec3(1.0, 1.6, 1.0)) / 0.1, 1.1)) * 6.0 + exp(-length(p * vec3(1.0, 1.4, 1.0)) / 0.22) * 0.7;
    vec3 e = C_YOUNG * d.x * exp(-z / 0.014) * 8.0
           + C_OLD * d.y * exp(-z / 0.04) * 3.0
           + C_HII * d.w * exp(-z / 0.005) * 14.0
           + C_BULGE * bulge;
    float sig = d.z * exp(-z / 0.007) * 160.0;
    vec3 absorb = exp(-sig * dt * vec3(1.0, 1.25, 1.6));
    col += e * dt * trans;
    trans *= absorb;
    if (trans.g < 0.01) break;
    t += dt;
  }
  return col;
}

// 盘面上能分辨出来的星：按像素在盘面上的尺度分两级，像贴图的 mipmap 一样混合，缩放时不会跳
vec3 diskStars(vec3 ro, vec3 rd, float px) {
  if (abs(rd.y) < 1e-4) return vec3(0.0);
  float t = -ro.y / rd.y;
  if (t <= 0.0) return vec3(0.0);
  vec3 p = ro + rd * t;
  float r = length(p.xz);
  if (r > 1.2) return vec3(0.0);
  vec4 d = disk2(p.xz);
  float dens = d.x * 3.0 + d.y * 0.5 + d.w;
  float foot = t * px / max(abs(rd.y), 0.05);
  float L = log2(foot * 9.0);
  float l0 = floor(L);
  vec3 sum = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float g = exp2(l0 + float(k));
    vec2 q = p.xz / g;
    vec2 c = floor(q);
    vec4 h = vec4(h22(c + 17.0), h22(c + 91.0));
    vec2 sp = (c + 0.3 + 0.4 * h.xy) * g;
    vec3 sw = vec3(sp.x, 0.0, sp.y);
    vec3 sd = normalize(sw - ro);
    float a = length(cross(sd, rd));
    float sig = px * 0.8;
    float b = pow(h.z, 6.0) * dens * g * g / (foot * foot) * 0.03;
    vec3 c3 = mix(C_YOUNG * 1.2, C_OLD, step(d.x * 2.0, d.y * 0.6 + h.w * 0.5));
    float wk = k == 0 ? 1.0 - fract(L) : fract(L);
    sum += c3 * b * exp(-a * a / (2.0 * sig * sig)) * wk;
  }
  return sum;
}

// 远处的小星系：方向上的格子，每格一个椭圆的光斑
vec3 bgGalaxies(vec3 d, float px) {
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 26.0 : 60.0;
    vec3 p = d * sc + float(k) * 13.7;
    vec3 c = floor(p);
    vec4 h = h34(c + 5.0);
    if (h.w > 0.07) continue;
    vec3 gp = normalize(c + 0.3 + 0.4 * h.xyz - float(k) * 13.7);
    vec3 ax = normalize(cross(gp, normalize(h33(c + 3.0) - 0.5)));
    vec3 ay = cross(gp, ax);
    vec3 dd = d - gp * dot(d, gp);
    vec2 q = vec2(dot(dd, ax), dot(dd, ay));
    float size = px * mix(1.0, 4.5, pow(h.x, 4.0)) * (k == 0 ? 1.4 : 0.9);
    float flat_ = mix(1.0, 4.0, h.y);
    q.y *= flat_;
    float rr = length(q) / size;
    float core = exp(-rr * rr * 2.5);
    float halo = exp(-rr * 1.6) * 0.35;
    vec3 tint = mix(vec3(1.0, 0.62, 0.38), vec3(0.75, 0.85, 1.0), pow(h.z, 2.0));
    col += tint * (core + halo) * mix(0.25, 1.6, pow(fract(h.w * 37.0), 2.0)) * (k == 0 ? 1.0 : 0.55);
  }
  return col;
}

// 冲进盘里时近处的恒星：沿视线穿过一格格的小立方体，每格一颗星，按距离算亮度
vec3 starStream(vec3 ro, vec3 rd, float px) {
  const float G = 0.006;
  vec3 col = vec3(0.0);
  vec3 p = ro / G;
  vec3 cell = floor(p);
  vec3 stepv = sign(rd);
  vec3 tMax = (cell + max(stepv, 0.0) - p) / rd;
  vec3 tDelta = abs(1.0 / rd);
  for (int i = 0; i < 48; i++) {
    vec4 h = h34(cell + 101.0);
    vec3 sp = (cell + 0.2 + 0.6 * h.xyz) * G;
    float inDisk = exp(-abs(sp.y) / 0.02);
    if (h.w < 0.55 * inDisk) {
      vec3 w = sp - ro;
      float d = length(w);
      float a = length(cross(w / d, rd));
      float sig = px * 0.9;
      float b = 0.0000025 / (d * d) * pow(fract(h.w * 53.1), 3.0);
      vec3 c = blackbody(mix(3000.0, 12000.0, fract(h.x * 17.3)));
      col += c * b * exp(-a * a / (2.0 * sig * sig)) / (sig * sig) * 1e-6;
    }
    if (tMax.x < tMax.y && tMax.x < tMax.z) { cell.x += stepv.x; tMax.x += tDelta.x; }
    else if (tMax.y < tMax.z) { cell.y += stepv.y; tMax.y += tDelta.y; }
    else { cell.z += stepv.z; tMax.z += tDelta.z; }
  }
  return col;
}

// 第二个星系：只在盘面上算一次
vec3 galaxy2(vec3 ro, vec3 rd) {
  if (uG2.w <= 0.0) return vec3(0.0);
  float dn = dot(rd, uG2n);
  if (abs(dn) < 1e-4) return vec3(0.0);
  float t = dot(uG2.xyz - ro, uG2n) / dn;
  if (t <= 0.0) return vec3(0.0);
  vec3 p = (ro + rd * t - uG2.xyz) / uG2.w;
  vec3 ax = normalize(cross(uG2n, vec3(0.0, 0.0, 1.0)));
  vec3 ay = cross(uG2n, ax);
  vec2 q = vec2(dot(p, ax), dot(p, ay));
  if (length(q) > 1.3) return vec3(0.0);
  vec4 d = disk2(q * rot(1.3) + 0.37);
  float r = length(q);
  float bulge = exp(-pow(r / 0.07, 1.1)) * 2.4 + exp(-r / 0.18) * 0.25;
  vec3 e = C_YOUNG * d.x * 0.09 + C_OLD * d.y * 0.07 + C_HII * d.w * 0.2 + C_BULGE * bulge * 0.12;
  e *= exp(-d.z * 1.3);
  return e / max(abs(dn), 0.25) * 2.0;
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  vec3 col = vec3(0.0);
  col += (stars(rd, px, 0.05) + bgGalaxies(rd, px) * 0.5) * uBg;
  col += galaxy2(ro, rd);
  vec3 trans;
  vec3 g = galaxyVolume(ro, rd, trans);
  col = col * trans + g * uExpo;
  col += diskStars(ro, rd, px) * uExpo * trans;
  // 光子：一个亮点拖着一道细光
  if (uPh.w > 0.0) {
    vec3 w = uPh.xyz - ro;
    float a = length(cross(normalize(w), rd));
    col += vec3(1.0, 0.95, 0.85) * uPh.w * exp(-a * a / (2.0 * px * px * 1.2));
    // 尾巴：到一条线段的角距离
    vec3 tail = uPh.xyz - uPhDir * 0.6;
    vec3 ab = tail - uPh.xyz;
    float best = 1e9;
    float along = 0.0;
    for (int i = 0; i < 24; i++) {
      float s = float(i) / 23.0;
      vec3 q = uPh.xyz + ab * s;
      float aa = length(cross(normalize(q - ro), rd));
      if (aa < best) { best = aa; along = s; }
    }
    col += vec3(0.8, 0.88, 1.0) * uPh.w * 0.12 * (1.0 - along) * exp(-best * best / (2.0 * px * px * 0.8));
  }
  if (uDive > 0.0) col += starStream(ro, rd, px) * uDive;
  if (uStar.w > 0.0) {
    vec3 w = uStar.xyz - ro;
    float a = length(cross(normalize(w), rd));
    col += vec3(1.0, 0.93, 0.82) * uStar.w * (exp(-a * a / (2.0 * px * px * 2.0)) * 40.0 + exp(-a / 0.01) * 2.0 + exp(-a / 0.08) * 0.25);
  }
  if (uWarm > 0.0) {
    vec3 w = uWarmAt - ro;
    float a = length(cross(normalize(w), rd));
    col += vec3(1.0, 0.55, 0.2) * uWarm * (exp(-a * a / (2.0 * px * px * 1.4)) + 0.08 * exp(-a / (px * 6.0)));
  }
  if (uCanvasGain > 0.0) col += texture(uCanvas, gl_FragCoord.xy / uRes).rgb * uCanvasGain;
  o = vec4(col, 1.0);
}
`;
