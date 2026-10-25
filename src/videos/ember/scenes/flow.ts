// 光的丝：一束束流动的细丝（被噪声扭过的等值线）。四种摆法：
// 0 两个相隔很远的世界被一束丝连起来；1 两束丝缠在一起、颜色变成一样；2 万花筒一样的光之曼陀罗；3 一条伸向远方的光路，前面慢慢没了
export const FLOW = /* glsl */ `
uniform float uMode;
uniform float uGrow;      // 丝长出来的程度
uniform float uSync;      // 同步：0 各闪各的，1 一起闪
uniform float uMerge;     // 两种颜色合成一种
uniform float uFade;      // 光路：前面消失到哪里
uniform float uExpo;
uniform float uStarsAmt;

const vec3 WARM_A = vec3(1.0, 0.6, 0.26);
const vec3 WARM_B = vec3(1.0, 0.45, 0.42);

// 一束丝：v 是横穿丝束的坐标（-1..1），u 是沿着丝束的坐标
float threads(float u, float v, float t, float n, float seed) {
  float g = v * 0.5 + 0.32 * fbm(vec2(u * 5.0 - t * 0.6, v * 1.6 + seed), 4);
  float f = abs(2.0 * fract(g * n) - 1.0);
  float line = pow(1.0 - f, 22.0) + 0.25 * pow(1.0 - f, 5.0);
  return line * smoothstep(1.0, 0.5, abs(v));
}

float orb(vec2 p, vec2 c, float r) {
  float d = length(p - c);
  return exp(-d * d / (r * r)) * 2.0 + exp(-d / (r * 4.0)) * 0.25;
}

void main() {
  vec2 p = screen(gl_FragCoord.xy);
  vec3 rd = camRay(gl_FragCoord.xy);
  float px = pixAngle();
  float t = uTime;
  vec3 col = stars(rd, px, uStarsAmt);
  int mode = int(uMode + 0.5);
  if (mode == 0) {
    vec2 A = vec2(-1.55, 0.12), B = vec2(1.55, -0.06);
    vec2 ab = B - A;
    float u = dot(p - A, ab) / dot(ab, ab);
    vec2 nrm = normalize(vec2(-ab.y, ab.x));
    float bend = 0.18 * sin(u * PI);
    float vv = dot(p - A, nrm) - bend;
    float w = 0.02 + 0.13 * pow(sin(sat(u) * PI), 0.6);
    float v = vv / w;
    // 从两头往中间长
    // 从两头往中间长，长到的尽头柔和地淡掉，尖上有一点亮
    float g1 = smoothstep(uGrow * 0.5, uGrow * 0.5 - 0.06, u);
    float g2 = smoothstep(1.0 - uGrow * 0.5, 1.0 - uGrow * 0.5 + 0.06, u);
    float grown = sat(g1 + g2) * step(0.0, u) * step(u, 1.0);
    float tip = (exp(-pow((u - uGrow * 0.5) / 0.02, 2.0)) + exp(-pow((u - 1.0 + uGrow * 0.5) / 0.02, 2.0))) * step(uGrow, 0.99);
    float line = threads(u, v, t, 6.0, 0.0) * (grown + tip * 2.0);
    float pulse = 1.0 + 2.5 * exp(-pow((fract(u - t * 0.3) - 0.5) * 9.0, 2.0)) * uSync;
    vec3 c = mix(WARM_A, WARM_B, mix(u, 0.5, uMerge));
    col += c * line * pulse * 0.9;
    float blinkA = mix(0.7 + 0.3 * sin(t * 3.1), 0.7 + 0.3 * sin(t * 2.0), uSync);
    float blinkB = mix(0.7 + 0.3 * sin(t * 4.3 + 1.0), 0.7 + 0.3 * sin(t * 2.0), uSync);
    col += WARM_A * orb(p, A, 0.06) * blinkA + mix(WARM_B, WARM_A, uMerge) * orb(p, B, 0.06) * blinkB;
  } else if (mode == 1) {
    // 两束从左右两边来，缠在一起
    float x = p.x;
    float ph = x * 1.6 - t * 0.5;
    float y1 = 0.28 * sin(ph) * (1.0 - uMerge * 0.7);
    float y2 = -0.28 * sin(ph) * (1.0 - uMerge * 0.7);
    float w = 0.14;
    float l1 = threads(x * 0.4, (p.y - y1) / w, t, 5.0, 0.0);
    float l2 = threads(x * 0.4 + 3.0, (p.y - y2) / w, t, 5.0, 4.0);
    float front = smoothstep(-0.2, 0.2, uGrow * 6.0 - 3.0 - x) * smoothstep(-0.2, 0.2, uGrow * 6.0 - 3.0 + x);
    vec3 c1 = mix(WARM_A, mix(WARM_A, WARM_B, 0.5), uMerge);
    vec3 c2 = mix(WARM_B, mix(WARM_A, WARM_B, 0.5), uMerge);
    col += (c1 * l1 + c2 * l2) * (0.9 + 0.6 * uMerge) * mix(1.0, front, 1.0 - uMerge);
  } else if (mode == 2) {
    // 光之曼陀罗：两层不同折数的对称（12 和 7）叠在一起，丝沿着花瓣走，一圈圈同步的脉动往外推
    float r = length(p);
    float env = smoothstep(1.35, 0.15, r) * uGrow;
    for (int L = 0; L < 2; L++) {
      float N = L == 0 ? 12.0 : 7.0;
      float a = atan(p.y, p.x) + t * (L == 0 ? 0.03 : -0.05);
      float seg = TAU / N;
      float af = abs(mod(a, seg) - seg * 0.5);
      // 花瓣形的等值线：半径和角度一起
      float g = r * 3.0 - 0.9 * cos(af * N) * r + 0.25 * fbm(vec2(af * 6.0, r * 3.0 - t * 0.3), 4);
      float f = abs(2.0 * fract(g * (L == 0 ? 3.5 : 2.5)) - 1.0);
      float line = pow(1.0 - f, 24.0) + 0.15 * pow(1.0 - f, 4.0);
      // 放射的细丝
      float spoke = pow(1.0 - abs(2.0 * fract(af / seg * 3.0 + r * 0.6) - 1.0), 30.0) * smoothstep(0.1, 0.5, r);
      vec3 c = L == 0 ? WARM_A : mix(WARM_A, vec3(1.0, 0.85, 0.65), 0.6);
      col += c * (line + spoke * 0.5) * env * (L == 0 ? 0.8 : 0.55);
    }
    float pulse = 0.5 + 0.5 * sin(r * 10.0 - t * 2.6);
    col *= 0.7 + 0.6 * pulse;
    col += vec3(1.0, 0.8, 0.55) * (exp(-r * r / 0.008) * 1.6 + exp(-r / 0.25) * 0.08) * uGrow;
  } else {
    // 光路：地面上一条伸向远方的丝束，前面一段段消失
    vec3 ro = uCam;
    if (rd.y < -0.001) {
      float tt = -(ro.y + 1.0) / rd.y;
      vec3 q = ro + rd * tt;
      float w = 0.8;
      float v = q.x / w;
      float z = -q.z;
      float line = threads(z * 0.05, v, t, 5.0, 0.0);
      float ahead = smoothstep(uFade + 6.0, uFade - 6.0, z);
      float fog = exp(-tt * 0.012);
      col += WARM_A * line * ahead * fog * 1.2;
      col += WARM_A * exp(-v * v * 0.5) * 0.03 * ahead * fog;
    }
    col += vec3(1.0, 0.55, 0.25) * exp(-abs(rd.y) * 40.0) * 0.02;
  }
  o = vec4(col * uExpo, 1.0);
}
`;
