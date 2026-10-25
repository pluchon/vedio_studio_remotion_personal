// 后期：全屏三角形、拷贝、泛光的缩小与放大、成片调色
export const VERT = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }
`;

export const BLIT_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uRes;
out vec4 o;
void main() { o = vec4(texture(uSrc, gl_FragCoord.xy / uRes).rgb, 1.0); }
`;

// 13 次采样的缩小（Jimenez 2014）；第一级先做软阈值，并压住特别亮的单个像素，免得闪
export const DOWN_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uTexel, uRes;
uniform float uFirst, uThreshold;
out vec4 o;
vec3 S(vec2 uv) { return texture(uSrc, uv).rgb; }
vec3 pre(vec3 c) {
  float l = max(c.r, max(c.g, c.b));
  float k = uThreshold * 0.5;
  float s = clamp(l - uThreshold + k, 0.0, 2.0 * k);
  s = s * s / (4.0 * k + 1e-5);
  float w = max(s, l - uThreshold) / max(l, 1e-5);
  return c * w / (1.0 + l * 0.08);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 d = uTexel;
  vec3 a = S(uv + d * vec2(-2, 2)), b = S(uv + d * vec2(0, 2)), c = S(uv + d * vec2(2, 2));
  vec3 e = S(uv + d * vec2(-2, 0)), f = S(uv), g = S(uv + d * vec2(2, 0));
  vec3 h = S(uv + d * vec2(-2, -2)), i = S(uv + d * vec2(0, -2)), j = S(uv + d * vec2(2, -2));
  vec3 k = S(uv + d * vec2(-1, 1)), l = S(uv + d * vec2(1, 1)), m = S(uv + d * vec2(-1, -1)), n = S(uv + d * vec2(1, -1));
  vec3 r = f * 0.125 + (a + c + h + j) * 0.03125 + (b + e + g + i) * 0.0625 + (k + l + m + n) * 0.125;
  if (uFirst > 0.5) r = pre(r);
  o = vec4(r, 1.0);
}
`;

export const UP_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uTexel, uRes;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 d = uTexel;
  vec3 r = texture(uSrc, uv).rgb * 4.0;
  r += (texture(uSrc, uv + vec2(d.x, 0)).rgb + texture(uSrc, uv - vec2(d.x, 0)).rgb + texture(uSrc, uv + vec2(0, d.y)).rgb + texture(uSrc, uv - vec2(0, d.y)).rgb) * 2.0;
  r += texture(uSrc, uv + d).rgb + texture(uSrc, uv - d).rgb + texture(uSrc, uv + vec2(d.x, -d.y)).rgb + texture(uSrc, uv + vec2(-d.x, d.y)).rgb;
  o = vec4(r / 16.0 * 0.82, 1.0);
}
`;

// 成片：色差、泛光、曝光、ACES、饱和度、暗角、颗粒、抖动
export const POST_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uHdr, uBloom;
uniform vec2 uRes, uOrigin;
uniform float uFrame, uExposure, uBloomAmt, uGrain, uVig, uSat, uLift, uCA, uFade, uRaw;
uniform vec3 uTint;
out vec4 o;
vec3 aces(vec3 v) {
  const mat3 i = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 m = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  v = i * v;
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return clamp(m * (a / b), 0.0, 1.0);
}
float hash(vec3 p) {
  uvec3 q = uvec3(ivec3(p)) * uvec3(1597334673u, 3812015801u, 2798796415u);
  uint n = (q.x ^ q.y ^ q.z) * 1597334673u;
  return float(n) * (1.0 / 4294967295.0);
}
void main() {
  vec2 px = gl_FragCoord.xy - uOrigin;
  vec2 uv = px / uRes;
  vec2 cc = uv - 0.5;
  float r2 = dot(cc * vec2(uRes.x / uRes.y, 1.0), cc * vec2(uRes.x / uRes.y, 1.0));
  vec2 off = cc * r2 * uCA * 0.004;
  vec3 c;
  c.r = texture(uHdr, uv - off).r;
  c.g = texture(uHdr, uv).g;
  c.b = texture(uHdr, uv + off).b;
  c += texture(uBloom, uv).rgb * uBloomAmt;
  c *= uExposure;
  c = mix(aces(c), clamp(c, 0.0, 1.0), uRaw);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSat) * uTint;
  c = pow(max(c, 0.0), vec3(1.0 / 2.2));
  c = c * (1.0 - uLift) + uLift * vec3(0.95, 0.97, 1.0) * 0.08;
  float v = 1.0 - uVig * smoothstep(0.25, 1.35, r2 * 1.2);
  c *= v;
  // 颗粒：亮度中间调最明显
  float g = hash(vec3(px, uFrame)) + hash(vec3(px + 17.0, uFrame + 3.0)) - 1.0;
  c += g * uGrain * (0.35 + 0.65 * (1.0 - abs(l * 2.0 - 1.0)));
  c *= uFade;
  c += (hash(vec3(px, uFrame + 9.0)) - 0.5) / 255.0;
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`;
