// 意识之海：一片一直铺到地平线的液面。暗的时候像水银、带一层薄膜的虹彩，水滴落下一圈圈涟漪；
// 苏醒之后，液面底下长出流动的暖光脉络，浪尖发光，地平线一线暖光——和开头那片海是同一个样子，只是换成了光
export const SEA = /* glsl */ `
uniform float uAwake;     // 0 暗的液面 → 1 整片发光
uniform float uDrops;     // 涟漪
uniform float uFlow;      // 光脉流动的时间
uniform float uExpo;
uniform float uStarsAmt;
uniform float uHorizon;   // 地平线的暖光

float waves(vec2 q, float t) {
  float h = fbm(q * 0.35 + vec2(t * 0.08, t * 0.05), 5) * 1.0 + fbm(q * 1.4 - vec2(t * 0.15, 0.0), 4) * 0.35;
  return h;
}

// 光脉：被扭过的分形噪声的「脊」，一条条连起来像神经，也像河网
float veins(vec2 q, float t) {
  vec2 w = q * 0.5 + 0.8 * vec2(fbm(q * 0.25 + vec2(t * 0.05, 0.0), 4), fbm(q * 0.25 + vec2(3.0, t * 0.04), 4));
  float a = 1.0 - abs(2.0 * fbm(w, 5) - 1.0);
  float b = 1.0 - abs(2.0 * fbm(w * 2.3 + 7.0, 4) - 1.0);
  return pow(a, 9.0) + 0.5 * pow(b, 12.0);
}

// 涟漪：几个落点，一圈圈往外扩
float ripples(vec2 q) {
  float r = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = vec2(h11(fi * 3.1) * 16.0 - 8.0, -h11(fi * 7.7) * 14.0 - 3.0);
    float t0 = fi * 1.1;
    float age = uDrops - t0;
    if (age < 0.0) continue;
    float d = length(q - c);
    float ring = d - age * 2.2;
    r += sin(ring * 9.0) * exp(-ring * ring * 1.5) * exp(-age * 0.35) * step(-1.0, -ring + 0.0 + 6.0);
  }
  return r;
}

vec3 skyCol(vec3 d, float px) {
  float h = max(d.y, 0.0);
  vec3 c = mix(vec3(0.012, 0.01, 0.016), vec3(0.0006, 0.0009, 0.002), smoothstep(0.0, 0.35, h));
  // 前方天上一大片很淡的亮（让暗的液面有东西可反射）
  c += vec3(0.05, 0.05, 0.07) * exp(-pow(d.x / 0.5, 2.0)) * exp(-pow((h - 0.12) / 0.12, 2.0)) * (1.0 - uAwake * 0.7);
  c += vec3(1.0, 0.55, 0.22) * uHorizon * exp(-h * 22.0) * 0.18 * uAwake;
  c += stars(d, px, uStarsAmt) * smoothstep(0.0, 0.15, h);
  return c;
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  vec3 col;
  if (rd.y < -0.0005) {
    float t = -ro.y / rd.y;
    vec3 p = ro + rd * t;
    vec2 q = p.xz;
    float e = 0.04 + t * 0.002;
    float tt = uFlow;
    float amp = 0.5 / (1.0 + t * 0.02);
    float h0 = waves(q, tt) + ripples(q) * 0.08;
    float hx = waves(q + vec2(e, 0.0), tt) + ripples(q + vec2(e, 0.0)) * 0.08;
    float hz = waves(q + vec2(0.0, e), tt) + ripples(q + vec2(0.0, e)) * 0.08;
    vec3 n = normalize(vec3(-(hx - h0) / e * amp, 1.0, -(hz - h0) / e * amp));
    vec3 rf = reflect(rd, n);
    rf.y = abs(rf.y);
    float fr = 0.04 + 0.96 * pow(1.0 - sat(dot(n, -rd)), 5.0);
    // 薄膜虹彩：厚度跟着起伏和噪声变
    float thick = h0 * 2.0 + fbm(q * 0.8, 3) * 1.5;
    vec3 irid = 0.5 + 0.5 * cos(TAU * (thick + vec3(0.0, 0.33, 0.67)));
    vec3 refl = skyCol(rf, px * 1.5) + vec3(0.03, 0.035, 0.05) * pow(sat(rf.y), 0.4) * 0.3;
    col = refl * (fr * 0.85 + 0.15) * mix(vec3(1.0), irid * 1.8, 0.65 * (1.0 - uAwake * 0.6));
    // 液面底下的暖光：先是光脉，然后整片亮起来
    float v = veins(q, tt);
    float body = fbm(q * 0.2 + vec2(tt * 0.03, 0.0), 4);
    vec3 glow = vec3(1.0, 0.58, 0.24) * (v * 2.2 + body * 0.25 * uAwake) * smoothstep(0.0, 0.25, uAwake);
    glow += vec3(1.0, 0.75, 0.45) * pow(sat(h0 - 0.55), 2.0) * 3.0 * uAwake;
    col += glow * (1.0 - fr * 0.5) * sqrt(uAwake);
    // 远处融进地平线的暖雾
    col = mix(skyCol(normalize(vec3(rd.x, 0.002, rd.z)), px), col, exp(-t * 0.012));
  } else {
    col = skyCol(rd, px);
  }
  o = vec4(col * uExpo, 1.0);
}
`;
