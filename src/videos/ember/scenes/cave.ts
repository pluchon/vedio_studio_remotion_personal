// 洞壁：凹凸的岩石（法线贴图），被下面的火光照着、一闪一闪；两个生灵的影子投在墙上，一来一回地「说话」，
// 暖色的光点从一个影子的头传到另一个；赭石色的符号一个个画上去；也有「时间的尘埃」版：冷的一束光斜进来，尘埃在里面飘，符号褪了色
export const CAVE = /* glsl */ `
uniform float uFireAmt;    // 火光
uniform float uShadows;    // 影子
uniform float uTalk;       // 光点传递的进度（秒）
uniform float uMarks;      // 符号画到第几个（0..1）
uniform float uFaded;      // 褪色程度（时间的尘埃）
uniform float uBeam;       // 冷光束
uniform vec2 uBeamAt;      // 光束穿过墙上的哪一点
uniform float uExpo;

float flick() {
  return 0.78 + 0.14 * sin(uTime * 12.0) * sin(uTime * 5.3 + 1.0) + 0.08 * noise(vec2(uTime * 9.0, 4.0));
}

float wallH(vec2 p) {
  return fbm(p * 1.3, 6) * 0.35 + fbm(p * 7.0 + 3.0, 4) * 0.05;
}

// 影子：两个生灵在离墙 1.2 的平面上（2D 剪影：身子、头、会动的手）
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float smin2(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float ell(vec2 p, vec2 c, vec2 r, float ang) { p -= c; p = rot(ang) * p; return (length(p / r) - 1.0) * min(r.x, r.y); }
// 侧影：前倾的身子、脖子、往前探的头、会比划的手臂，全用平滑并集连起来
float being(vec2 p, vec2 base, float dir, float phase) {
  float talk = sin(uTime * 3.1 + phase) * 0.5 + 0.5;
  vec2 q = p - base;
  q.x *= dir;
  float torso = ell(q, vec2(0.0, 0.62), vec2(0.21, 0.5), -0.18);
  float neck = sdSeg(q, vec2(0.06, 0.98), vec2(0.15, 1.13)) - 0.06;
  vec2 hc = vec2(0.2 + 0.02 * talk, 1.2 + 0.02 * sin(uTime * 2.0 + phase));
  float head = ell(q, hc, vec2(0.15, 0.115), -0.25 + 0.12 * talk);
  vec2 sh = vec2(0.1, 0.9);
  vec2 elbow = sh + vec2(0.2, -0.16 + 0.06 * sin(uTime * 2.3 + phase));
  vec2 hand = elbow + vec2(0.17, 0.1 + 0.14 * sin(uTime * 2.9 + phase * 1.7));
  float arm = min(sdSeg(q, sh, elbow) - 0.045, sdSeg(q, elbow, hand) - 0.035);
  float d = smin2(torso, neck, 0.06);
  d = smin2(d, head, 0.05);
  d = smin2(d, arm, 0.04);
  return d;
}

// 赭石符号：点、线、螺旋、同心圆、折线、分叉
float glyph(vec2 p, float k) {
  float d = 1e9;
  int t = int(mod(k, 6.0));
  if (t == 0) {
    for (int i = 0; i < 5; i++) d = min(d, length(p - vec2(float(i) * 0.09 - 0.18, 0.04 * sin(float(i) * 2.0))) - 0.028);
  } else if (t == 1) {
    for (int i = 0; i < 3; i++) d = min(d, sdSeg(p, vec2(-0.16 + float(i) * 0.12, -0.15), vec2(-0.12 + float(i) * 0.12, 0.15)) - 0.018);
  } else if (t == 2) {
    float r = length(p);
    float a = atan(p.y, p.x);
    d = abs(fract((r * 22.0 - a / TAU) ) - 0.5) / 22.0 * 2.0 - 0.012;
    d = max(d, r - 0.17);
  } else if (t == 3) {
    float r = length(p);
    d = min(abs(r - 0.15), abs(r - 0.08)) - 0.016;
    d = min(d, r - 0.025);
  } else if (t == 4) {
    vec2 a = vec2(-0.2, -0.05);
    for (int i = 0; i < 4; i++) {
      vec2 b = a + vec2(0.1, (i % 2 == 0) ? 0.14 : -0.14);
      d = min(d, sdSeg(p, a, b) - 0.017);
      a = b;
    }
  } else {
    d = sdSeg(p, vec2(0.0, -0.18), vec2(0.0, 0.18)) - 0.018;
    d = min(d, sdSeg(p, vec2(0.0, 0.0), vec2(0.12, 0.13)) - 0.016);
    d = min(d, sdSeg(p, vec2(0.0, -0.07), vec2(-0.12, 0.06)) - 0.016);
  }
  return d;
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  vec3 col = vec3(0.0);
  // 墙是 z=0 的平面，起伏只用在法线上
  float t = -ro.z / rd.z;
  if (t > 0.0) {
    vec3 p = ro + rd * t;
    vec2 w = p.xy;
    float e = 0.004;
    float h0 = wallH(w);
    vec3 n = normalize(vec3(-(wallH(w + vec2(e, 0.0)) - h0) / e, -(wallH(w + vec2(0.0, e)) - h0) / e, 1.0));
    vec3 alb = vec3(0.32, 0.25, 0.19) * (0.65 + 0.6 * fbm(w * 3.0 + 9.0, 4));
    alb = mix(alb, vec3(0.22, 0.2, 0.18), smoothstep(0.4, 0.7, fbm(w * 0.8, 3)));
    // 符号：一格一格，每格一个，按顺序画上去
    vec2 g = w * vec2(1.6, 1.8);
    vec2 gc = floor(g);
    vec2 gf = fract(g) - 0.5;
    vec2 jit = (h22(gc + 3.0) - 0.5) * 0.3;
    float k = floor(h21(gc + 9.0) * 6.0);
    // 从镜头先看到的地方开始画，慢慢往外
    vec2 cw = (gc + 0.5) / vec2(1.6, 1.8);
    float order = h21(gc + 21.0) * 0.25 + sat(length(cw - vec2(-0.7, 0.8)) / 4.0) * 0.75;
    float shown = smoothstep(order, order + 0.05, uMarks) * step(h21(gc + 33.0), 0.75);
    float gd = glyph((gf - jit) / 0.95, k + h21(gc) * 6.0);
    float paint = smoothstep(0.012, -0.004, gd + (noise(w * 60.0) - 0.5) * 0.012) * shown;
    paint *= 0.75 + 0.25 * noise(w * 25.0);
    vec3 ochre = mix(vec3(0.42, 0.09, 0.04), vec3(0.18, 0.05, 0.03), noise(w * 9.0));
    alb = mix(alb, mix(ochre, alb * 0.85, uFaded * 0.7), paint);
    // 火光：在下面偏左，一闪一闪
    vec3 lp = vec3(-0.3, -1.4, 1.8);
    vec3 L = lp - p;
    float dl = length(L);
    float ndl = sat(dot(n, L / dl));
    float fire = uFireAmt * flick() * 7.0 / (dl * dl);
    // 影子：从墙上这点朝火看过去，在生灵所在的平面上落在哪里
    float sh = 1.0;
    if (uShadows > 0.0) {
      float zb = 0.55;
      vec3 q = p + L * (zb / L.z);
      float d1 = being(q.xy, vec2(-0.6, -1.3), 1.0, 0.0);
      float d2 = being(q.xy, vec2(0.32, -1.3), -1.0, 1.9);
      float pen = 0.008 + 0.03 * (zb / L.z);
      sh = mix(1.0, smoothstep(-pen, pen, min(d1, d2)), uShadows);
    }
    col = alb * vec3(1.0, 0.45, 0.14) * fire * ndl * sh;
    col += alb * vec3(0.01, 0.012, 0.016) * (0.5 + 0.5 * n.y);
    // 冷光束照到的墙
    if (uBeam > 0.0) {
      float bc = 0.6 * (w.x - uBeamAt.x) - (w.y - uBeamAt.y);
      float onWall = exp(-pow(bc / 0.4, 2.0));
      col += alb * vec3(0.55, 0.65, 0.8) * onWall * uBeam * 1.2 * sat(dot(n, normalize(vec3(-0.4, 0.6, 0.7))) * 1.3);
    }
  }
  // 光点：从一个影子的头传到另一个（在墙前一点点）
  if (uTalk > 0.0 && uShadows > 0.0) {
    for (int i = 0; i < 6; i++) {
      float s = fract(uTalk * 0.35 + float(i) / 6.0);
      float dir = mod(float(i), 2.0) < 1.0 ? 1.0 : -1.0;
      float x = mix(-0.22, 0.05, dir > 0.0 ? s : 1.0 - s);
      vec3 mp = vec3(x * 2.4 - 0.1, 0.32 + sin(s * PI) * 0.3, 0.12);
      vec3 wv = mp - ro;
      float a = length(cross(normalize(wv), rd));
      float fade = sin(s * PI);
      col += vec3(1.0, 0.6, 0.25) * fade * (exp(-a * a / (2.0 * px * px * 3.0)) * 4.0 + exp(-a / (px * 10.0)) * 0.25);
    }
  }
  // 光束里的尘埃
  if (uBeam > 0.0) {
    for (int i = 0; i < 24; i++) {
      float tt = 0.4 + float(i) * 0.12;
      vec3 p = ro + rd * tt;
      float inB = exp(-pow((0.6 * (p.x - uBeamAt.x) - (p.y - uBeamAt.y) + p.z * 0.35) / 0.4, 2.0));
      col += vec3(0.5, 0.6, 0.75) * inB * 0.016 * uBeam * (0.4 + noise(p * 4.0 + vec3(0.0, uTime * 0.1, 0.0)));
    }
    for (int k = 0; k < 2; k++) {
      float sc = k == 0 ? 9.0 : 16.0;
      for (int i = 1; i < 12; i++) {
        float tt = float(i) / sc * 3.0;
        vec3 drift = vec3(uTime * 0.02, -uTime * 0.012, uTime * 0.01);
        vec3 q = (ro + rd * tt + drift) * sc;
        vec3 c = floor(q);
        vec4 hh = h34(c + float(k) * 7.0);
        if (hh.w > 0.45) continue;
        vec3 pp = (c + 0.5 + 0.35 * (hh.xyz - 0.5)) / sc - drift;
        float inB = exp(-pow((0.6 * (pp.x - uBeamAt.x) - (pp.y - uBeamAt.y) + pp.z * 0.35) / 0.4, 2.0));
        vec3 wv = pp - ro;
        float ta = dot(wv, rd);
        if (ta < 0.05) continue;
        float d = length(wv - rd * ta);
        float coc = abs(ta - 1.6) * 0.012 / ta + px * 0.7;
        col += vec3(0.75, 0.82, 0.95) * (inB + 0.04) * uBeam * smoothstep(coc, coc * 0.6, d) * (px * px) / (coc * coc) * 1.6;
      }
    }
  }
  o = vec4(col * uExpo, 1.0);
}
`;
