// 深空：哈勃超深场的原图（首尾那一帧），和一片三维的程序星系场——镜头在里面穿行，近的星系有旋臂，远的只是一个个小光斑
export const DEEP = /* glsl */ `
uniform float uPhoto;     // 原图的量
uniform float uZoom;      // 原图放大
uniform vec2 uPan;        // 原图平移（图的 uv）
uniform float uField;     // 程序星系场的量
uniform float uFieldExpo;

vec3 photo(vec2 fc) {
  vec2 f = fc / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 uv = vec2(0.5 + (f.x - 0.5) / uZoom, 0.5 + (f.y - 0.5) / aspect / uZoom) + uPan;
  vec3 c = texture(uImage, uv).rgb;
  return pow(c, vec3(2.2));
}

// 一个星系的样子：在它自己的盘面坐标 q（以半径为 1）里
vec3 galaxyShape(vec2 q, vec4 h, float blur) {
  float r = length(q);
  float spiral = step(0.45, h.x);
  float th = atan(q.y, q.x);
  float arms = pow(0.5 + 0.5 * cos(2.0 * th - log(max(r, 0.05)) * 3.0 + h.y * 6.28), 2.0);
  float disk = exp(-r / 0.28) * mix(1.0, 0.35 + 1.3 * arms, spiral * (1.0 - blur));
  float bulge = exp(-r * r / 0.012) * 2.5;
  vec3 young = vec3(0.5, 0.65, 1.0);
  vec3 old = vec3(1.0, 0.72, 0.45);
  // 越远的越红（宇宙学红移的意思）
  vec3 far = vec3(1.0, 0.45, 0.25);
  vec3 dc = mix(old, young, spiral * smoothstep(0.1, 0.5, r));
  dc = mix(dc, far, h.z * h.z * 0.8);
  return (dc * disk + old * bulge) * smoothstep(1.0, 0.6, r);
}

vec3 field(vec3 ro, vec3 rd, float px) {
  vec3 col = vec3(0.0);
  vec3 p = ro;
  vec3 cell = floor(p);
  vec3 stepv = sign(rd);
  vec3 tMax = (cell + max(stepv, 0.0) - p) / rd;
  vec3 tDelta = abs(1.0 / rd);
  for (int i = 0; i < 64; i++) {
    vec4 h = h34(cell);
    if (h.w < 0.3) {
      vec3 c = cell + 0.2 + 0.6 * h33(cell + 7.0);
      vec3 w = c - ro;
      float tc = dot(w, rd);
      if (tc > 0.02) {
        float size = mix(0.04, 0.16, pow(h.y, 3.0));
        vec3 nrm = normalize(h33(cell + 3.0) - 0.5);
        float dn = dot(rd, nrm);
        float tt = dot(w, nrm) / (abs(dn) > 1e-3 ? dn : 1e-3);
        vec3 hp = ro + rd * tt - c;
        vec3 ax = normalize(cross(nrm, vec3(0.3, 1.0, 0.2)));
        vec3 ay = cross(nrm, ax);
        vec2 q = vec2(dot(hp, ax), dot(hp, ay)) / size;
        float foot = tc * px / size;
        float blur = sat(foot * 6.0);
        // 太远太小时退化成按像素算的光斑，免得闪
        float a = length(cross(normalize(w), rd));
        float sig = max(px * 0.9, size * 0.3 / tc);
        vec3 tiny = mix(vec3(1.0, 0.6, 0.35), vec3(0.8, 0.85, 1.0), h.x) * exp(-a * a / (2.0 * sig * sig)) * (size * size) / (tc * tc * sig * sig) * 0.06;
        vec3 big = abs(tt - tc) < 2.0 ? galaxyShape(q, h, blur) * 0.6 : vec3(0.0);
        // 离镜头太近的会糊成一大团，淡掉
        col += mix(big, tiny, smoothstep(0.08, 0.5, foot)) * mix(0.5, 1.4, h.z) / (1.0 + tc * 0.06) * smoothstep(0.8, 2.5, tc);
      }
    }
    if (tMax.x < tMax.y && tMax.x < tMax.z) { cell.x += stepv.x; tMax.x += tDelta.x; }
    else if (tMax.y < tMax.z) { cell.y += stepv.y; tMax.y += tDelta.y; }
    else { cell.z += stepv.z; tMax.z += tDelta.z; }
  }
  return col;
}

void main() {
  vec3 col = vec3(0.0);
  if (uPhoto > 0.0) col += photo(gl_FragCoord.xy) * uPhoto;
  if (uField > 0.0) {
    vec3 rd = camRay(gl_FragCoord.xy);
    float px = pixAngle();
    col += (field(uCam, rd, px) * uFieldExpo + stars(rd, px, 0.04)) * uField;
  }
  o = vec4(col, 1.0);
}
`;
