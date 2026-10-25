// 画板：深色的底（可以有星、有旧纸一样的斑驳），上面叠镜头自己用 Canvas 画的发光线条和点（乘上增益当作发光，泛光会把它晕开）
export const BOARD = /* glsl */ `
uniform float uStarsAmt;
uniform float uPaper;     // 旧星图的底：暖色的斑驳和划痕
uniform float uDust;      // 落灰
uniform vec3 uBgTint;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 rd = camRay(gl_FragCoord.xy);
  float px = pixAngle();
  vec3 col = uBgTint * (0.6 + 0.4 * (1.0 - length(uv - 0.5)));
  col += stars(rd, px, uStarsAmt);
  if (uPaper > 0.0) {
    vec2 q = gl_FragCoord.xy / uRes.y;
    float m = fbm(q * 3.0, 5) * 0.6 + fbm(q * 18.0, 3) * 0.4;
    float scratch = pow(1.0 - abs(2.0 * noise(vec2(q.x * 2.0 + q.y * 9.0, q.y * 0.5) * 6.0) - 1.0), 40.0);
    col += vec3(0.05, 0.035, 0.02) * (0.4 + m) * uPaper + vec3(0.04, 0.03, 0.02) * scratch * uPaper * 0.5;
  }
  vec4 cv = texture(uCanvas, uv);
  col = col * (1.0 - cv.a * 0.3) + cv.rgb * uCanvasGain;
  if (uDust > 0.0) {
    vec2 q = gl_FragCoord.xy;
    float d = pow(h21(floor(q / 2.0) + floor(uTime * 0.0)), 60.0);
    col += vec3(0.5, 0.48, 0.45) * d * uDust * 0.3;
    col *= 1.0 - uDust * 0.25 * fbm(gl_FragCoord.xy / uRes.y * 4.0, 4);
  }
  o = vec4(col, 1.0);
}
`;
