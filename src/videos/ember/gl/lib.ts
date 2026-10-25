// 各场景着色器共用的 GLSL：哈希、值噪声（贴图版，快）、分形噪声、相机、星空、黑体颜色
export const LIB = /* glsl */ `
#define PI 3.14159265359
#define TAU 6.28318530718
uniform vec2 uRes;
uniform float uTime, uFrame;
uniform float uLocal, uProg; // 镜头内的秒数、镜头进度 0..1
uniform sampler2D uNoise, uCanvas, uImage;
uniform vec3 uCam, uTgt;
uniform float uFoc, uRoll;
uniform vec3 uUp; // 相机的上方（默认世界的 y）
uniform float uCanvasGain; // 镜头自己画的 Canvas 叠加的量
out vec4 o;

uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
float h11(float p) { return float(pcg(floatBitsToUint(p))) / 4294967295.0; }
float h21(vec2 p) { uvec2 q = uvec2(ivec2(floor(p)) + 32768); return float(pcg(q.x + pcg(q.y))) / 4294967295.0; }
vec2 h22(vec2 p) { uvec2 q = uvec2(ivec2(floor(p)) + 32768); uint a = pcg(q.x + pcg(q.y)); uint b = pcg(a); return vec2(a, b) / 4294967295.0; }
float h31(vec3 p) { uvec3 q = uvec3(ivec3(floor(p)) + 32768); return float(pcg(q.x + pcg(q.y + pcg(q.z)))) / 4294967295.0; }
vec3 h33(vec3 p) { uvec3 q = uvec3(ivec3(floor(p)) + 32768); uint a = pcg(q.x + pcg(q.y + pcg(q.z))); uint b = pcg(a); uint c = pcg(b); return vec3(a, b, c) / 4294967295.0; }
vec4 h34(vec3 p) { uvec3 q = uvec3(ivec3(floor(p)) + 32768); uint a = pcg(q.x + pcg(q.y + pcg(q.z))); uint b = pcg(a); uint c = pcg(b); uint d = pcg(c); return vec4(a, b, c, d) / 4294967295.0; }

// 三维值噪声：一次贴图采样（R 和错开 (37,17) 的 G）
float noise(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
  vec2 rg = textureLod(uNoise, (uv + 0.5) / 256.0, 0.0).yx;
  return mix(rg.x, rg.y, f.z);
}
float noise(vec2 x) {
  vec2 p = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return textureLod(uNoise, (p + f + 0.5) / 256.0, 0.0).x;
}
float fbm(vec3 p, int n) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= n) break;
    s += a * noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 4.1);
    a *= 0.5;
  }
  return s;
}
float fbm(vec2 p, int n) {
  float a = 0.5, s = 0.0;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 8; i++) {
    if (i >= n) break;
    s += a * noise(p);
    p = m * p + vec2(3.1, 1.7);
    a *= 0.5;
  }
  return s;
}
// 有符号的版本，均值 0
float snoise(vec3 p) { return noise(p) * 2.0 - 1.0; }

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float sat(float x) { return clamp(x, 0.0, 1.0); }
float lin(float x, float a, float b) { return clamp((x - a) / (b - a), 0.0, 1.0); }
float smooth01(float x) { x = sat(x); return x * x * (3.0 - 2.0 * x); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// 相机：uCam 看向 uTgt，uFoc 是焦距（1/tan(半视角)），uRoll 绕视线转
mat3 camBasis() {
  vec3 f = normalize(uTgt - uCam);
  vec3 up = dot(uUp, uUp) > 0.0 ? uUp : vec3(0.0, 1.0, 0.0);
  vec3 r = normalize(cross(f, up));
  vec3 u = cross(r, f);
  float c = cos(uRoll), s = sin(uRoll);
  return mat3(r * c + u * s, u * c - r * s, f);
}
vec2 screen(vec2 fc) { return (2.0 * fc - uRes) / uRes.y; }
vec3 camRay(vec2 fc) { return normalize(camBasis() * vec3(screen(fc), uFoc)); }
// 一个像素对应的弧度
float pixAngle() { return 2.0 / (uRes.y * uFoc); }

// 近似黑体颜色（线性），t 是开尔文
vec3 blackbody(float t) {
  t = clamp(t, 1000.0, 40000.0) / 100.0;
  vec3 c;
  c.r = t <= 66.0 ? 1.0 : clamp(1.292936 * pow(t - 60.0, -0.1332047), 0.0, 1.0);
  c.g = t <= 66.0 ? clamp(0.3900816 * log(t) - 0.6318414, 0.0, 1.0) : clamp(1.1298909 * pow(t - 60.0, -0.0755148), 0.0, 1.0);
  c.b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : clamp(0.5432068 * log(t - 10.0) - 1.1962541, 0.0, 1.0));
  return pow(c, vec3(2.2));
}

// 星空：方向 d 上的恒星。scale 越大星越密越暗；px 是一个像素的弧度
vec3 starLayer(vec3 d, float scale, float density, float px, float seed) {
  vec3 p = d * scale + seed;
  vec3 c = floor(p);
  vec4 h = h34(c + seed * 7.0);
  if (h.w > density) return vec3(0.0);
  vec3 sp = c + 0.3 + 0.4 * h.xyz;
  vec3 sd = normalize(sp - seed);
  float a = length(cross(sd, d));
  float sig = px * 0.85;
  // 亮度大致按幂律：大多数很暗，偶尔一颗很亮
  float u = fract(h.w * 97.13 + h.x * 13.1);
  float b = 0.0005 * exp(u * u * 8.5);
  float temp = mix(3200.0, 11000.0, pow(fract(h.z * 53.7), 1.6));
  return blackbody(temp) * b * exp(-a * a / (2.0 * sig * sig));
}
vec3 stars(vec3 d, float px, float amount) {
  vec3 c = vec3(0.0);
  c += starLayer(d, 55.0, 0.35, px, 0.0) * 2.2;
  c += starLayer(d, 110.0, 0.5, px, 11.3);
  c += starLayer(d, 200.0, 0.7, px, 23.9) * 0.6;
  return c * amount;
}
`;
