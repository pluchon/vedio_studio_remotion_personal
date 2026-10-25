// 水下往上看：起伏的水面（斯涅尔窗里是折射进来的天空和太阳，窗外是全反射的幽暗）、一道道光柱、焦散、漂浮的微粒
import { SKY } from "./sky";

export const UNDER = SKY + /* glsl */ `
uniform float uWaveT;
uniform float uExpo;

const vec3 SIGT = vec3(0.32, 0.075, 0.055);   // 海水每米的衰减（红光最快）

vec3 refractSun() {
  vec3 s = uSunDir;
  float st = length(s.xz) / 1.33;
  float ct = sqrt(1.0 - st * st);
  return normalize(vec3(normalize(s.xz) * st, ct).xzy);
}

// 焦散：两层扭过的噪声的「脊」叠在一起，随时间流动
float caustic(vec2 q) {
  float c = 0.0;
  for (int i = 0; i < 2; i++) {
    float s = i == 0 ? 0.9 : 1.9;
    vec2 w = q * s + vec2(uWaveT * 0.25 * s, uWaveT * 0.17);
    w += 0.6 * vec2(fbm(w * 0.5 + 3.0, 3), fbm(w * 0.5 + 8.0, 3));
    float n = noise(w);
    c += pow(1.0 - abs(2.0 * n - 1.0), 7.0) * (i == 0 ? 1.0 : 0.6);
  }
  return c;
}

vec3 waveN(vec2 q) {
  float e = 0.05;
  float h0 = fbm(q * 0.6 + vec2(uWaveT * 0.4, uWaveT * 0.2), 5);
  float hx = fbm((q + vec2(e, 0.0)) * 0.6 + vec2(uWaveT * 0.4, uWaveT * 0.2), 5);
  float hz = fbm((q + vec2(0.0, e)) * 0.6 + vec2(uWaveT * 0.4, uWaveT * 0.2), 5);
  return normalize(vec3(-(hx - h0) / e * 0.45, 1.0, -(hz - h0) / e * 0.45));
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  vec3 ls = refractSun();
  vec3 sunIn = uSunI * 0.07 * skyTrans(uSunDir);
  // 到水面的距离
  float tS = rd.y > 0.0 ? -ro.y / rd.y : 1e9;
  float tEnd = min(tS, 60.0);
  // 光柱：沿视线采样，每点的光 = 水面焦散沿折射的阳光投下来，再被海水吃掉
  vec3 ins = vec3(0.0);
  const int N = 28;
  float j = h21(gl_FragCoord.xy);
  for (int i = 0; i < N; i++) {
    float t = tEnd * (float(i) + j) / float(N);
    vec3 p = ro + rd * t;
    float depth = -p.y;
    vec2 at = p.xz - ls.xz / ls.y * depth;
    float c = caustic(at * 0.35);
    vec3 att = exp(-SIGT * (depth / ls.y + t));
    float ph = 1.0 + 3.0 * pow(sat(dot(rd, ls)), 6.0);
    ins += sunIn * att * (0.04 + c * 0.6) * ph * (tEnd / float(N)) * 0.08;
  }
  vec3 col = ins;
  vec3 deepC = vec3(0.0, 0.01, 0.014) * exp(-SIGT * max(-ro.y, 0.0) * 0.5) * 0.3;
  if (tS < 1e8) {
    vec3 p = ro + rd * tS;
    vec3 n = waveN(p.xz);
    // 从水里往外：n 指向水里
    vec3 r = refract(rd, -n, 1.33);
    vec3 surf;
    if (dot(r, r) < 0.01) {
      surf = deepC * 2.0 + ins * 0.5;
    } else {
      float mu = dot(r, uSunDir);
      surf = skyScatter(r) * 0.08 + uSunI * skyTrans(uSunDir) * smoothstep(0.9993, 0.9999, mu) * 2.0 + uSunI * exp((mu - 1.0) * 400.0) * 0.12;
      float fr = 0.02 + 0.98 * pow(1.0 - sat(dot(-rd, -n)), 5.0);
      surf *= (1.0 - fr);
    }
    col += surf * exp(-SIGT * tS);
  } else {
    col += deepC;
  }
  // 往下看是深的
  col += deepC * smoothstep(0.1, -0.6, rd.y);
  // 漂浮的微粒：被光柱照到时亮
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 2.5 : 5.0;
    for (int i = 1; i < 14; i++) {
      float tt0 = float(i) / sc * 1.2;
      vec3 drift = vec3(uWaveT * 0.05, uWaveT * 0.08, 0.0);
      vec3 q = (ro + rd * tt0 + drift) * sc;
      vec3 c = floor(q);
      vec4 h = h34(c + float(k) * 17.0);
      if (h.w > 0.35) continue;
      vec3 pp = (c + 0.5 + 0.35 * (h.xyz - 0.5)) / sc - drift;
      vec3 w = pp - ro;
      float t = dot(w, rd);
      if (t < 0.1 || t > tEnd) continue;
      float d = length(w - rd * t);
      float coc = abs(t - 2.5) * 0.02 / t + px * 0.8;
      float lit = caustic((pp.xz - ls.xz / ls.y * (-pp.y)) * 0.35) * 0.5 + 0.1;
      col += sunIn * exp(-SIGT * (-pp.y + t)) * lit * smoothstep(coc, coc * 0.6, d) * (px * px) / (coc * coc) * 0.03;
    }
  }
  o = vec4(col * uExpo, 1.0);
}
`;
