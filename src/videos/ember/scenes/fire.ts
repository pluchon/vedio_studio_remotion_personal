// 火的特写：黑暗里先迸出几颗火星，然后火苗窜起来（往上流的分形噪声，黑体颜色），木柴被映亮，火星往上飘；
// 也用来画「最后一盏灯」：火苗缩成一颗余烬，熄灭，留下一缕烟
export const FIRE = /* glsl */ `
uniform float uIgnite;    // 0..1 火从无到旺
uniform float uDie;       // 0..1 从旺到灭（最后一盏灯）
uniform float uSmoke;     // 灭了之后的烟
uniform float uExpo;
uniform float uLogs;      // 木柴的量（最后一盏灯不要木柴）

float flick() {
  return 0.8 + 0.12 * sin(uTime * 11.0) * sin(uTime * 6.1 + 1.0) + 0.08 * noise(vec2(uTime * 8.0, 2.0));
}

// 火焰的密度：p 在火的本地坐标里（火底在原点，往上是 y）。几条火舌：角度方向上的噪声决定哪里窜得高
float flameD(vec3 p, float size) {
  vec3 q0 = p / size;
  float y = q0.y;
  if (y < -0.05 || y > 2.0) return 0.0;
  float ang = atan(q0.z, q0.x);
  float tongues = 0.55 + 0.6 * noise(vec2(ang * 1.6 + 3.0, uTime * 1.3)) + 0.3 * noise(vec2(ang * 3.7, uTime * 2.1 + 5.0));
  vec3 q = q0 * vec3(2.6, 1.0, 2.6) - vec3(0.0, uTime * 2.6, 0.0);
  float n = fbm(q * 1.4, 5);
  float n2 = fbm(q * 2.8 + 7.0, 4);
  // 越往上越被扰动、越细
  vec2 sway = (vec2(n, n2) - 0.5) * (0.25 + 0.7 * y);
  float r = length(q0.xz + sway);
  float top = 1.25 * tongues;
  float w = 0.45 * pow(sat(1.0 - y / top), 0.65);
  float body = smoothstep(w, w * 0.15, r);
  float cut = smoothstep(top, top * 0.35, y + (n - 0.5) * 0.9);
  return body * cut * smoothstep(-0.05, 0.06, y);
}

// 光线和胶囊体求交（iq）
float capHit(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float ra) {
  vec3 ba = pb - pa, oa = ro - pa;
  float baba = dot(ba, ba), bard = dot(ba, rd), baoa = dot(ba, oa), rdoa = dot(rd, oa), oaoa = dot(oa, oa);
  float a = baba - bard * bard;
  float b = baba * rdoa - baoa * bard;
  float c = baba * oaoa - baoa * baoa - ra * ra * baba;
  float h = b * b - a * c;
  if (h >= 0.0) {
    float t = (-b - sqrt(h)) / a;
    float y = baoa + t * bard;
    if (y > 0.0 && y < baba) return t;
    vec3 oc = (y <= 0.0) ? oa : ro - pb;
    b = dot(rd, oc);
    c = dot(oc, oc) - ra * ra;
    h = b * b - c;
    if (h > 0.0) return -b - sqrt(h);
  }
  return -1.0;
}

void main() {
  vec3 rd = camRay(gl_FragCoord.xy);
  vec3 ro = uCam;
  float px = pixAngle();
  float alive = uIgnite * (1.0 - uDie);
  float size = mix(0.12, 0.55, smoothstep(0.0, 0.6, uIgnite)) * mix(1.0, 0.08, smoothstep(0.0, 0.9, uDie));
  vec3 col = vec3(0.0);
  // 地面：被火照亮的一圈
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  float light = alive * flick() * size * 4.0 + (1.0 - smoothstep(0.85, 1.0, uDie)) * uDie * 0.15;
  if (tg < 1e8) {
    vec3 p = ro + rd * tg;
    float d2 = dot(p.xz, p.xz);
    vec3 g = vec3(0.05, 0.04, 0.03) * (0.6 + 0.8 * fbm(p.xz * 4.0, 4));
    // 小石子
    float peb = pow(noise(p.xz * 18.0), 6.0);
    g += vec3(0.08) * peb;
    col = g * vec3(1.0, 0.45, 0.15) * light / (d2 * 6.0 + 0.4);
    // 一圈压着的石头（篝火边）：一块块的，朝火的一面亮
    float ang = atan(p.z, p.x);
    float cell = floor(ang / TAU * 11.0);
    float rr = 0.78 + 0.05 * h11(cell);
    float stone = smoothstep(0.1, 0.0, abs(sqrt(d2) - rr) - 0.04) * smoothstep(0.02, 0.12, abs(fract(ang / TAU * 11.0) - 0.5)) * uLogs;
    col = mix(col, vec3(0.05, 0.045, 0.04) * light / (d2 * 4.0 + 0.4) * (0.6 + 0.6 * noise(p.xz * 20.0)), stone);
  }
  // 木柴：几根交叉的圆柱（光线和胶囊体的解析求交），朝火的一面亮、背面黑，烧着的地方有发红的裂纹
  if (uLogs > 0.0) {
    for (int i = 0; i < 4; i++) {
      float a = float(i) * 1.6 + 0.3;
      vec3 pa = vec3(cos(a) * 0.62, 0.07, sin(a) * 0.62);
      vec3 pb = vec3(-cos(a) * 0.04, 0.2, -sin(a) * 0.04);
      float r = 0.065 - 0.008 * float(i % 2);
      float t = capHit(ro, rd, pa, pb, r);
      if (t > 0.0 && t < tg) {
        vec3 p = ro + rd * t;
        vec3 ba = pb - pa;
        float u = clamp(dot(p - pa, ba) / dot(ba, ba), 0.0, 1.0);
        vec3 n = normalize(p - (pa + ba * u));
        vec3 L = vec3(0.0, 0.45, 0.0) - p;
        float dl = length(L);
        float ndl = sat(dot(n, L / dl));
        float bark = 0.55 + 0.45 * noise(vec2(u * 38.0, atan(n.z, n.x) * 3.0 + float(i) * 5.0));
        float char_ = smoothstep(0.35, 0.8, u);
        vec3 woodC = mix(vec3(0.06, 0.038, 0.022), vec3(0.012, 0.01, 0.009), char_);
        vec3 lit = woodC * bark * (ndl * 1.2 + 0.08) * vec3(1.0, 0.5, 0.2) * light * 2.2 / (dl * dl * 3.0 + 0.3);
        float crack = pow(1.0 - abs(2.0 * noise(p * 55.0) - 1.0), 12.0);
        vec3 ember = vec3(1.0, 0.24, 0.03) * smoothstep(0.5, 0.85, u) * smoothstep(1.0, 0.9, u) * crack * (0.6 + 0.4 * noise(p * 20.0 + uTime * 0.5)) * alive * 2.2;
        col = lit + ember;
        tg = t;
      }
    }
  }
  // 火焰：沿视线穿过火焰所在的那块体积
  vec3 c = vec3(0.0, 0.05, 0.0);
  vec3 oc = ro - c;
  float b = dot(oc.xz, rd.xz), A = dot(rd.xz, rd.xz), C = dot(oc.xz, oc.xz) - pow(size * 0.9, 2.0);
  float h = b * b - A * C;
  if (h > 0.0 && alive > 0.0) {
    h = sqrt(h);
    float t0 = max((-b - h) / A, 0.0), t1 = min((-b + h) / A, tg);
    float dt = (t1 - t0) / 32.0;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 32; i++) {
      vec3 p = ro + rd * (t0 + dt * (float(i) + 0.5)) - c;
      float d = flameD(p, size);
      float temp = 1100.0 + 2300.0 * pow(d, 1.5) * (1.0 - 0.35 * p.y / size);
      acc += blackbody(temp) * d * d * dt / size * 14.0;
    }
    col += acc * alive * flick();
  }
  // 最后的余烬：一颗小红点，慢慢暗下去
  if (uDie > 0.0) {
    vec3 w = vec3(0.0, 0.04, 0.0) - ro;
    float a = length(cross(normalize(w), rd));
    float e = smoothstep(1.0, 0.75, uDie) * (0.6 + 0.4 * flick());
    col += vec3(1.0, 0.32, 0.06) * e * (exp(-a * a / (2.0 * px * px * 2.0)) * 3.0 + exp(-a / (px * 10.0)) * 0.15);
  }
  // 火星
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float life = 2.5 + 2.0 * h11(fi * 1.3);
    float tt = uTime + h11(fi) * life;
    float age = mod(tt, life);
    float k = floor(tt / life);
    vec3 dir = normalize(vec3(h11(fi + k * 7.0) - 0.5, 0.0, h11(fi + k * 3.0) - 0.5));
    vec3 p = vec3(0.0, 0.2 * size / 0.55 + age * 0.55, 0.0) + dir * age * 0.12
           + vec3(sin(age * 3.0 + fi), 0.0, cos(age * 2.3 + fi)) * 0.07 * age;
    vec3 w = p - ro;
    float t = dot(w, rd);
    if (t < 0.05) continue;
    float a = length(cross(normalize(w), rd));
    float g = exp(-a * a / (2.0 * px * px * 1.4)) * (1.0 - age / life);
    col += vec3(1.0, 0.45, 0.12) * g * 2.5 * alive * step(h11(fi + k), 0.2 + 0.8 * uIgnite);
  }
  // 灭了之后的一缕烟：被很弱的光照着
  if (uSmoke > 0.0) {
    for (int i = 0; i < 16; i++) {
      float y = float(i) * 0.06;
      vec3 p = vec3(0.04 * sin(y * 6.0 + uTime * 0.8) * y * 3.0, y, 0.0);
      vec3 w = p - ro;
      float a = length(cross(normalize(w), rd));
      float wdt = 0.004 + y * 0.03;
      float t = dot(w, rd);
      col += vec3(0.5, 0.52, 0.56) * exp(-a * a * t * t / (2.0 * wdt * wdt)) * 0.006 * uSmoke * (1.0 - y / 1.0) * (0.6 + 0.4 * noise(vec2(y * 10.0 - uTime, 1.0)));
    }
  }
  o = vec4(col * uExpo, 1.0);
}
`;
