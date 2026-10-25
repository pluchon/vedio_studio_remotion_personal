// 站在地面看的天：地球尺度的单次散射（日落、晨昏的颜色都是算出来的），夜里的银河（核心、尘埃暗带、密集的星）、气辉
// 给岸边、篝火、旷野这几个场景共用（拼在它们的着色器前面）
export const SKY = /* glsl */ `
uniform vec3 uSunDir;     // 太阳方向（可以在地平线下）
uniform float uSunI;      // 太阳强度
uniform vec3 uGalPole;    // 银河的极方向
uniform vec3 uGalCenter;  // 银心方向
uniform float uMilky;     // 银河的量
uniform float uNightStars;

const float ER = 6360.0, EA = 6420.0;
const vec3 EBR = vec3(5.8e-3, 13.5e-3, 33.1e-3);
const float EBM = 21e-3;

vec2 eDens(vec3 p) { float h = length(p) - ER; return exp(-max(h, 0.0) / vec2(8.0, 1.2)); }

float eRayEnd(vec3 ro, vec3 rd, float R) {
  float b = dot(ro, rd), c = dot(ro, ro) - R * R;
  float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b + sqrt(h);
}

vec3 skyScatter(vec3 rd) {
  vec3 ro = vec3(0.0, ER + 0.02, 0.0);
  rd.y = max(rd.y, 0.002);
  rd = normalize(rd);
  float L = eRayEnd(ro, rd, EA);
  const int N = 14;
  vec2 od = vec2(0.0);
  vec3 sr = vec3(0.0), sm = vec3(0.0);
  float prev = 0.0;
  for (int i = 0; i < N; i++) {
    // 越靠近地面采得越密
    float f = (float(i) + 0.5) / float(N);
    float t = L * f * f;
    float ds = L * (2.0 * f) / float(N);
    vec3 p = ro + rd * t;
    vec2 d = eDens(p) * ds;
    od += d;
    // 到太阳那边：被地球挡住就没有光
    float b = dot(p, uSunDir);
    float c = dot(p, p) - ER * ER;
    if (b < 0.0 && b * b - c > 0.0) continue;
    float Ls = eRayEnd(p, uSunDir, EA);
    vec2 ol = vec2(0.0);
    for (int k = 0; k < 4; k++) {
      float g = (float(k) + 0.5) / 4.0;
      ol += eDens(p + uSunDir * Ls * g * g) * Ls * 2.0 * g / 4.0;
    }
    vec3 T = exp(-(EBR * (od.x + ol.x) + EBM * 1.1 * (od.y + ol.y)));
    sr += d.x * T;
    sm += d.y * T;
  }
  float mu = dot(rd, uSunDir);
  float pr = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  float g = 0.76;
  float pm = 3.0 / (8.0 * PI) * ((1.0 - g * g) * (1.0 + mu * mu)) / ((2.0 + g * g) * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
  // 单次散射算不出暮色里那层蓝（多次散射），按太阳在地平线下的深度补一层
  float el = asin(clamp(uSunDir.y, -1.0, 1.0));
  float tw = smoothstep(-0.24, -0.03, el) * smoothstep(0.12, -0.02, el);
  vec3 fill = vec3(0.1, 0.17, 0.42) * tw * (0.35 + 0.65 * (1.0 - rd.y)) * 0.012;
  return uSunI * (sr * EBR * pr + sm * EBM * pm + fill);
}

// 视线方向上穿过大气的透射（看星星、看太阳时用）
vec3 skyTrans(vec3 rd) {
  vec3 ro = vec3(0.0, ER + 0.02, 0.0);
  rd.y = max(rd.y, 0.002);
  rd = normalize(rd);
  float L = eRayEnd(ro, rd, EA);
  vec2 od = vec2(0.0);
  for (int i = 0; i < 6; i++) {
    float f = (float(i) + 0.5) / 6.0;
    od += eDens(ro + rd * L * f * f) * L * 2.0 * f / 6.0;
  }
  return exp(-(EBR * od.x + EBM * 1.1 * od.y));
}

// 银河：银纬上的高斯带、银心的核球、云团、中间一条条尘埃暗带，再加一层按带密度分布的密星
vec3 milkyWay(vec3 d, float px) {
  vec3 gx = normalize(uGalCenter - uGalPole * dot(uGalCenter, uGalPole));
  vec3 gy = cross(uGalPole, gx);
  float b = asin(clamp(dot(d, uGalPole), -1.0, 1.0));
  float l = atan(dot(d, gy), dot(d, gx));
  float band = exp(-b * b / (2.0 * 0.13 * 0.13));
  float core = exp(-(l * l * 1.4 + b * b * 9.0) / 0.35);
  vec2 q = vec2(l * 3.0, b * 9.0);
  float clouds = fbm(q * 2.2 + 3.0, 6);
  float fine = fbm(q * vec2(7.0, 11.0) + 7.0, 5);
  float dens = band * (0.45 + 0.7 * clouds + 0.25 * fine) * (0.6 + 0.4 * cos(l * 0.5)) + core * 1.4;
  // 尘埃：沿着银道一条条细长的暗带（大裂缝），边缘是丝状的
  float off = 0.025 * sin(l * 2.3) + 0.03 * (fbm(vec2(l * 4.0, 1.0), 3) - 0.5);
  float rift = exp(-pow((b - off) / 0.04, 2.0));
  float fil = fbm(q * vec2(2.2, 6.0) + 11.0, 6);
  float lane = rift * smoothstep(0.38, 0.62, fil);
  float wisps = pow(1.0 - abs(2.0 * fbm(q * vec2(3.0, 6.0) + 21.0, 5) - 1.0), 4.0) * band * smoothstep(0.35, 0.6, fbm(q * 1.5 + 40.0, 3));
  float absorb = exp(-(lane * 1.5 + wisps * 0.7));
  vec3 c = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.84, 0.66), sat(core * 1.2));
  vec3 col = c * dens * absorb * 0.11;
  // 带里多出来的星
  col += (starLayer(d, 260.0, 0.85 * band, px, 77.0) * 0.25 + starLayer(d, 150.0, 0.6 * band, px, 91.0) * 0.4) * absorb;
  return col;
}

// 夜空：银河 + 星 + 一点气辉（地平线附近发绿）
vec3 nightSky(vec3 d, float px) {
  vec3 col = milkyWay(d, px) * uMilky + stars(d, px, uNightStars);
  float h = max(d.y, 0.0);
  col += vec3(0.012, 0.02, 0.012) * exp(-h * 9.0) * 0.08;
  return col * skyTrans(d);
}
`;
