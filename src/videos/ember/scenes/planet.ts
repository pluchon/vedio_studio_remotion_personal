// 行星：海、陆地（扭曲的分形噪声）、云、海面的太阳高光、夜面的城市灯火（按「到达时间」铺开、按「熄灭顺序」暗下去）、
// 单次散射的大气（瑞利 + 米氏），远处的恒星和它的光晕；可选发射的光迹、轨道上的光环
export const PLANET = /* glsl */ `
uniform vec3 uSun;        // 指向恒星的方向
uniform vec3 uSunCol;     // 恒星光的强度和颜色
uniform float uSunSize;   // 恒星的视半径（弧度）
uniform float uSeed;
uniform float uSea;       // 海平面（噪声值）
uniform float uSpinA;     // 自转角
uniform float uCloud;     // 云量 0..1
uniform float uCloudT;    // 云的流动
uniform float uCity;      // 灯火铺开的进度 0..1
uniform float uOff;       // 灯火熄灭的进度 0..1
uniform vec3 uLastCity;   // 最后熄灭的地方（行星本地坐标的方向）
uniform vec3 uOcean, uLandA, uLandB, uIceC;
uniform float uIce;       // 冰盖范围
uniform vec3 uBetaR;      // 瑞利散射系数（每单位半径）
uniform float uBetaM;
uniform float uAtm;       // 大气整体量
uniform vec3 uLightCol;
uniform float uLightAmt;
uniform vec4 uLaunch;     // 发射点方向 xyz（本地），进度 w
uniform float uHalo;      // 轨道光环
uniform float uStarsAmt;
uniform float uFlare;
uniform float uDesert;    // 陆地的干旱程度
uniform float uLava;      // 夜面的熔岩/年轻行星的暗红

const float RP = 1.0;
const float RA = 1.04;
const float HR = 0.0075;
const float HM = 0.0018;

vec2 sph(vec3 ro, vec3 rd, float R) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - R * R;
  float h = b * b - c;
  if (h < 0.0) return vec2(1e9, -1e9);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}
vec2 dens(vec3 p) {
  float h = max(length(p) - RP, 0.0);
  return exp(-h / vec2(HR, HM));
}
vec3 extinction(vec2 od) { return exp(-(uBetaR * od.x + uBetaM * 1.1 * od.y) * uAtm); }

// 从 p 沿 dir 到大气顶的透射
vec3 sunTrans(vec3 p, vec3 dir) {
  vec2 tp = sph(p, dir, RP * 0.998);
  if (tp.x > 0.0) return vec3(0.0);
  float L = sph(p, dir, RA).y;
  float ds = L / 6.0;
  vec2 od = vec2(0.0);
  for (int i = 0; i < 6; i++) od += dens(p + dir * (float(i) + 0.5) * ds) * ds;
  return extinction(od);
}

// 沿视线的散射：返回进来的光，透射写进 trans
vec3 atmosphere(vec3 ro, vec3 rd, float tmax, out vec3 trans) {
  trans = vec3(1.0);
  vec2 ta = sph(ro, rd, RA);
  if (ta.y < 0.0 || ta.x > 1e8) return vec3(0.0);
  float t0 = max(ta.x, 0.0);
  float t1 = min(ta.y, tmax);
  if (t1 <= t0) return vec3(0.0);
  const int N = 14;
  float ds = (t1 - t0) / float(N);
  vec2 od = vec2(0.0);
  vec3 sr = vec3(0.0), sm = vec3(0.0);
  for (int i = 0; i < N; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + 0.5) * ds);
    vec2 d = dens(p) * ds;
    od += d;
    vec3 T = extinction(od) * sunTrans(p, uSun);
    sr += d.x * T;
    sm += d.y * T;
  }
  trans = extinction(od);
  // 夜里的气辉：大气里很薄的一层自己在发光，从边缘看是一道细细的绿蓝色
  float airglow = 0.0;
  for (int i = 0; i < N; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + 0.5) * ds);
    float h = length(p) - RP;
    airglow += exp(-abs(h - 0.012) / 0.0025) * ds;
  }
  float mu = dot(rd, uSun);
  float pr = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  float g = 0.76;
  float pm = 3.0 / (8.0 * PI) * ((1.0 - g * g) * (1.0 + mu * mu)) / ((2.0 + g * g) * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
  return uSunCol * (sr * uBetaR * pr + sm * uBetaM * pm) * uAtm + vec3(0.12, 0.35, 0.3) * airglow * uAtm * 0.8;
}

mat3 spinM() {
  float c = cos(uSpinA), s = sin(uSpinA);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

float terrain(vec3 n, int oct) {
  vec3 q = n * 1.6 + uSeed;
  vec3 w = vec3(fbm(q * 1.2, 4), fbm(q * 1.2 + 5.2, 4), fbm(q * 1.2 + 9.1, 4)) - 0.5;
  return fbm(q + w * 1.4, oct);
}

float clouds(vec3 n) {
  vec3 q = n * 2.2 + vec3(uCloudT, 0.0, uCloudT * 0.3);
  vec3 w = vec3(fbm(q * 0.8 + 1.0, 3), fbm(q * 0.8 + 6.0, 3), 0.0) - 0.5;
  float lat = n.y;
  // 纬度带让云有点「气旋」的走向
  q.xz *= rot(lat * 0.8);
  float c = fbm(q * 2.1 + w * 1.5, 7);
  return smoothstep(0.62 - uCloud * 0.32, 0.86 - uCloud * 0.3, c);
}

// 灯火的密度：靠海岸、在陆地上、按到达时间亮起来、按熄灭顺序暗下去
float cityDensity(vec3 n, float h) {
  float coast = h - uSea;
  if (coast < 0.0) return 0.0;
  float near = exp(-coast * 16.0);
  float region = smoothstep(0.4, 0.62, fbm(n * 4.0 + uSeed * 3.0, 5));
  float arrive = 0.55 * fbm(n * 2.2 + uSeed * 1.7, 3) + 0.45 * (1.0 - near) + 0.15 * (1.0 - region);
  float grown = sat((uCity * 1.25 - arrive) / 0.06);
  float order = fbm(n * 3.0 + 40.0 + uSeed, 3) * 0.8 + 0.2 * noise(n * 30.0);
  order = mix(order, 1.4, smoothstep(0.35, 0.05, length(n - uLastCity)));
  float alive = sat((order - uOff * 1.45) / 0.04);
  float cluster = pow(sat(fbm(n * 30.0, 4) * 1.9 - 0.7), 1.3) + 0.15 * pow(sat(fbm(n * 90.0, 3) * 1.6 - 0.5), 2.0);
  return (0.12 + 0.88 * near) * (0.15 + region) * cluster * grown * alive * smoothstep(0.0, 0.002, coast);
}

// 灯火：三层——很淡的底光、一座座城市（亮的芯 + 橙色的晕）、散在各处的小镇（按像素尺度分级的点，缩放不跳）
vec3 cityLights(vec3 n, float h, float foot) {
  float D = cityDensity(n, h);
  if (D <= 0.0) return vec3(0.0);
  vec3 tint = mix(uLightCol, vec3(1.0, 0.8, 0.55), noise(n * 33.0) * 0.6);
  vec3 sum = tint * D * 0.06;
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 18.0 : 41.0;
    vec3 c = floor(n * sc);
    vec4 hh = h34(c + 5.0 + float(k) * 19.0);
    vec3 cp = normalize((c + 0.38 + 0.24 * hh.xyz) / sc);
    float Dc = cityDensity(cp, terrain(cp, 5));
    if (hh.w < Dc * (k == 0 ? 1.1 : 1.5)) {
      float r = (k == 0 ? 0.002 + 0.0045 * hh.x * hh.x : 0.0012 + 0.002 * hh.x);
      r = max(r, foot * 0.8);
      float d = length(n - cp);
      // 离格子边越近越淡，免得晕被格子切成方块
      vec3 fr = fract(n * sc);
      float edge = smoothstep(0.0, 0.12, min(min(min(fr.x, 1.0 - fr.x), min(fr.y, 1.0 - fr.y)), min(fr.z, 1.0 - fr.z)));
      float core = exp(-d * d / (2.0 * r * r));
      float b = (k == 0 ? 3.0 : 1.4) * (0.5 + hh.y);
      sum += (mix(tint, vec3(1.0, 0.92, 0.8), core * 0.7) * core * b + tint * exp(-d / (r * 1.8)) * 0.15 * b) * edge;
    }
  }
  float L = log2(foot * 5.0);
  float l0 = floor(L);
  for (int k = 0; k < 2; k++) {
    float g = exp2(l0 + float(k));
    vec3 q = n / g;
    vec3 c = floor(q);
    vec4 hh = h34(c + 11.0);
    vec3 sp = (c + 0.3 + 0.4 * hh.xyz) * g;
    float dd = length(n - sp);
    float rad = max(foot * 0.7, g * 0.06);
    float on = step(hh.w, D * 2.2);
    float b = on * (g * g) / (rad * rad) * 0.06 * (0.3 + 1.2 * fract(hh.w * 91.0));
    float wk = k == 0 ? 1.0 - fract(L) : fract(L);
    sum += tint * b * exp(-dd * dd / (2.0 * rad * rad)) * wk;
  }
  return sum;
}

vec3 sky(vec3 rd, float px) {
  vec3 c = stars(rd, px, uStarsAmt);
  // 恒星：盘面 + 光晕 + 横向的镜头拉丝
  float mu = dot(rd, uSun);
  float a = acos(clamp(mu, -1.0, 1.0));
  c += uSunCol * smoothstep(uSunSize, uSunSize * 0.7, a) * 30.0;
  c += uSunCol * (exp(-a / (uSunSize * 2.5)) * 0.8 + exp(-a / 0.05) * 0.06 + exp(-a / 0.35) * 0.008) * uFlare;
  return c;
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  vec2 tp = sph(ro, rd, RP);
  bool hit = tp.x > 0.0 && tp.x < 1e8;
  vec3 col;
  if (hit) {
    vec3 p = ro + rd * tp.x;
    vec3 N = normalize(p);
    vec3 n = spinM() * N;
    float foot = tp.x * px;
    int oct = int(clamp(log2(0.5 / foot), 4.0, 10.0));
    float h = terrain(n, oct);
    float land = smoothstep(uSea, uSea + 0.006, h);
    // 地形的法线：沿两个切向差分
    vec3 t1 = normalize(cross(n, vec3(0.0, 1.0, 0.0) + 1e-4));
    vec3 t2 = cross(n, t1);
    float e = 0.0025;
    float hx = terrain(normalize(n + t1 * e), oct) - h;
    float hy = terrain(normalize(n + t2 * e), oct) - h;
    vec3 bn = normalize(n - (t1 * hx + t2 * hy) * 2.2 * land);
    vec3 nW = transpose(spinM()) * bn;
    float lat = abs(n.y);
    float ice = smoothstep(uIce, uIce + 0.06, lat + (h - uSea) * 0.6 + 0.05 * noise(n * 20.0));
    float dry = smoothstep(0.3, 0.7, fbm(n * 3.0 + 7.0, 4)) * uDesert + smoothstep(0.35, 0.2, lat) * 0.3 * uDesert;
    vec3 landC = mix(uLandA, uLandB, sat(dry + (h - uSea) * 4.0));
    landC *= 0.75 + 0.5 * noise(n * 60.0);
    float shallow = smoothstep(uSea - 0.05, uSea, h);
    vec3 seaC = mix(uOcean, uOcean * 2.4 + vec3(0.0, 0.01, 0.012), shallow);
    vec3 alb = mix(seaC, landC, land);
    alb = mix(alb, uIceC, ice);
    // 云和云影
    float cl = uCloud > 0.0 ? clouds(n) : 0.0;
    vec3 sunL = spinM() * uSun;
    float shadow = uCloud > 0.0 ? clouds(normalize(n + sunL * 0.012)) : 0.0;
    vec3 Tsun = sunTrans(p * 1.0005, uSun);
    // 稍微包一点：晨昏线软一些
    float ndl = pow(sat((dot(nW, uSun) + 0.06) / 1.06), 1.25);
    vec3 lit = alb * ndl * Tsun * uSunCol * (1.0 - shadow * 0.6) / PI;
    // 海面：太阳的高光和天光
    if (land < 0.5 && ice < 0.5) {
      vec3 hv = normalize(uSun - rd);
      float spec = pow(max(dot(N, hv), 0.0), 380.0) * 60.0 + pow(max(dot(N, hv), 0.0), 40.0) * 0.6;
      float fr = 0.02 + 0.98 * pow(1.0 - max(dot(N, -rd), 0.0), 5.0);
      lit += Tsun * uSunCol * spec * fr * (1.0 - cl) * (1.0 - shadow * 0.8) * 0.02;
      lit += vec3(0.02, 0.05, 0.1) * fr * sat(dot(N, uSun)) * 0.2;
    }
    // 夜面的灯
    float night = smoothstep(0.08, -0.18, dot(N, uSun));
    vec3 city = uLightAmt > 0.0 ? cityLights(n, h, foot) * uLightAmt : vec3(0.0);
    vec3 em = city * night * (1.0 - cl * 0.75);
    // 熔岩或年轻行星的暗红
    em += vec3(1.0, 0.25, 0.05) * uLava * pow(sat(1.0 - abs(h - uSea) * 9.0), 6.0) * night * 0.5;
    // 云：亮面、晨昏线附近的透光、被下面的城市照亮
    float cdl = dot(N, uSun);
    vec3 cloudC = vec3(1.0) * pow(smoothstep(-0.02, 0.7, cdl), 1.3) * sunTrans(p * 1.004, uSun) * uSunCol / PI * 1.1;
    cloudC += city * 0.25 * night;
    col = mix(lit, cloudC, cl * 0.92) + em;
    // 发射点附近的地面被照亮
    if (uLaunch.w > 0.0) {
      float dl = length(n - normalize(uLaunch.xyz));
      col += vec3(1.0, 0.75, 0.45) * exp(-dl * 400.0) * 3.0 * smoothstep(0.0, 0.03, uLaunch.w) * smoothstep(0.35, 0.1, uLaunch.w);
    }
    vec3 tr;
    vec3 ins = atmosphere(ro, rd, tp.x, tr);
    col = col * tr + ins;
  } else {
    vec3 tr;
    vec3 ins = atmosphere(ro, rd, 1e9, tr);
    col = sky(rd, px) * tr + ins;
  }
  // 发射的光迹：从地面升起、弯向东边，拖一道慢慢变淡的尾巴（按线段算离视线的最近距离，连续不断）
  if (uLaunch.w > 0.0) {
    vec3 base = transpose(spinM()) * normalize(uLaunch.xyz);
    vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), base));
    float prog = uLaunch.w;
    float glow = 0.0;
    vec3 prev = base * 1.002;
    for (int i = 1; i < 48; i++) {
      float s = float(i) / 47.0 * prog;
      vec3 q = base * (1.002 + s * s * 0.5 + s * 0.06) + east * s * s * 0.55;
      // 线段 prev→q 和视线的最近点
      vec3 u = q - prev;
      vec3 w0 = ro - prev;
      float a = dot(rd, rd), b = dot(rd, u), c = dot(u, u), d = dot(rd, w0), e = dot(u, w0);
      float den = a * c - b * b;
      float sc = clamp((b * e - c * d) / max(den, 1e-9), 0.0, 1e9);
      float tc = clamp((a * e - b * d) / max(den, 1e-9), 0.0, 1.0);
      vec3 pr = ro + rd * sc;
      vec3 pq = prev + u * tc;
      float dist = length(pr - pq) / max(sc, 1e-4);
      vec2 occ = sph(ro, normalize(pq - ro), RP);
      bool hidden = occ.x > 0.0 && occ.x < length(pq - ro) - 0.003;
      float head = exp(-(prog - s) * 10.0);
      float w = px * (0.9 + head * 1.5);
      if (!hidden) glow += exp(-dist * dist / (2.0 * w * w)) * (0.12 + head * 2.5) * (0.4 + 0.6 * float(i) / 47.0);
      prev = q;
    }
    col += vec3(1.0, 0.78, 0.5) * glow * 1.6 * smoothstep(1.0, 0.85, prog);
    // 头上一团圆的亮光
    vec3 headP = base * (1.002 + prog * prog * 0.5 + prog * 0.06) + east * prog * prog * 0.55;
    float ah = length(cross(normalize(headP - ro), rd));
    vec2 occH = sph(ro, normalize(headP - ro), RP);
    if (!(occH.x > 0.0 && occH.x < length(headP - ro) - 0.003)) col += vec3(1.0, 0.85, 0.65) * (exp(-ah * ah / (2.0 * px * px * 4.0)) * 4.0 + exp(-ah / (px * 12.0)) * 0.3) * smoothstep(1.0, 0.85, prog);
  }
  // 轨道上的光环：赤道面上一圈细碎的光点
  if (uHalo > 0.0 && abs(rd.y) > 1e-4) {
    float t = -ro.y / rd.y;
    if (t > 0.0 && (!hit || t < tp.x)) {
      vec3 q = ro + rd * t;
      float r = length(q.xz);
      float band = smoothstep(1.16, 1.18, r) * smoothstep(1.26, 1.2, r);
      float ang = atan(q.z, q.x) + uSpinA * 0.6;
      float cells = ang * 2400.0 / TAU;
      float h = h11(floor(cells) + floor(r * 60.0) * 0.37);
      float dot_ = exp(-pow((fract(cells) - 0.5) * 4.0, 2.0)) * step(0.9, h) * exp(-pow((fract(r * 60.0) - 0.5) * 4.0, 2.0));
      bool shad = sph(q, uSun, RP).x > 0.0;
      vec3 lc = mix(vec3(1.0, 0.7, 0.4), vec3(0.9, 0.95, 1.0), h);
      col += lc * band * (dot_ * 5.0 + 0.012) * uHalo * (shad ? 1.0 : 0.6);
    }
  }
  if (uCanvasGain > 0.0) col += texture(uCanvas, gl_FragCoord.xy / uRes).rgb * uCanvasGain;
  o = vec4(col, 1.0);
}
`;
