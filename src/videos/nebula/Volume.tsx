// 体积渲染：一块全屏的着色器，沿每条视线一步步走过一团密度场，累加发光、吸收和散射
// 同一个函数先后画「地球的云」和「宇宙的云」，用 mix 在两者之间过渡
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import * as THREE from "three";
import { HEIGHT, RENDER_SCALE, WIDTH } from "./theme";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uMix;        // 0 = 地球的云，1 = 星云
  uniform vec3 uCam;
  uniform vec3 uLook;
  uniform vec3 uCam2;
  uniform vec3 uLook2;
  uniform float uFov;
  uniform float uSun;        // 云的光：0 午后，1 落日
  uniform float uNight;      // 0 白天傍晚，1 夜
  uniform float uDark;       // 乌云
  uniform float uAurora;
  uniform float uExposure;
  uniform float uBlue;       // 星云里蓝色（反射）和红色（发光）的比例
  uniform vec3 uSeed;        // 星云噪声的偏移：换一个种子就是另一团星云
  uniform float uMono;       // 0 彩色，1 黑白（老式望远镜）
  uniform float uKind;       // 0 一团一团的云，1 行星状星云的壳
  uniform float uShell;      // 壳的半径
  uniform float uStarK;      // 热星的亮度，越大照亮的范围越大
  uniform float uIonK;       // 电离区随距离收小的快慢
  uniform float uFade;
  uniform float uStarsOn;    // 背景星星的多少
  uniform float uCloud;      // 云的多少

  float hash(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * noise(p);
      p = p * 2.03 + vec3(11.7, 3.1, 7.9);
      a *= 0.5;
    }
    return s;
  }

  // 背景的星：把视线方向切成小格，每格最多一颗
  vec3 stars(vec3 dir) {
    vec3 col = vec3(0.0);
    for (int k = 0; k < 2; k++) {
      float scale = k == 0 ? 90.0 : 170.0;
      vec3 p = dir * scale;
      vec3 id = floor(p);
      vec3 f = fract(p) - 0.5;
      float h = hash(id + float(k) * 13.0);
      if (h > 0.965) {
        float d = length(f);
        float b = (h - 0.965) / 0.035;
        float tw = 0.85 + 0.15 * sin(uTime * (0.6 + 2.0 * h) + h * 40.0);
        vec3 tint = mix(vec3(1.0, 0.82, 0.62), vec3(0.7, 0.82, 1.0), hash(id.zxy));
        col += tint * exp(-d * d * (k == 0 ? 90.0 : 160.0)) * b * b * tw * (k == 0 ? 1.4 : 0.8);
      }
    }
    return col;
  }

  // ---------- 极光 ----------
  vec3 aurora(vec3 d) {
    if (uAurora < 0.001 || d.y < 0.03) return vec3(0.0);
    float az = atan(d.x, -d.z);
    float v = d.y;
    float base = 0.2 + 0.1 * sin(az * 2.3 + uTime * 0.15) + 0.14 * (fbm(vec3(az * 1.2, uTime * 0.04, 3.0)) - 0.35);
    float above = v - base;
    float e = above > 0.0 ? exp(-above * 3.4) : exp(above * 26.0);
    float rays = 0.3 + 0.9 * noise(vec3(az * 24.0, v * 1.4, uTime * 0.35));
    float cover = smoothstep(1.9, 0.5, abs(az - 0.3));
    vec3 col = mix(vec3(0.15, 1.0, 0.55), vec3(0.6, 0.25, 0.95), smoothstep(0.0, 0.55, above));
    return col * e * rays * cover * uAurora * 0.7;
  }

  // ---------- 地球的云 ----------
  float cloudDensity(vec3 p) {
    float h = clamp((p.y - 1.0) / 3.2, 0.0, 1.0);
    vec3 q = p * vec3(0.3, 0.42, 0.3) + vec3(uTime * 0.03, 0.0, uTime * 0.012);
    float n = fbm(q + 1.6 * (vec3(noise(q * 0.5), noise(q * 0.5 + 9.0), 0.0) - 0.5));
    float cov = n * 1.1 - 0.42 * h - 0.1 * uDark;
    return smoothstep(0.43 + (1.0 - uCloud) * 0.25, 0.6 + (1.0 - uCloud) * 0.25, cov) * smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.85, 1.0, h));
  }

  vec3 earthSky(vec3 dir, vec3 sunDir) {
    float up = clamp(dir.y, 0.0, 1.0);
    vec3 horizon = mix(vec3(1.0, 0.72, 0.5), vec3(1.0, 0.36, 0.22), uSun);
    vec3 zenith = mix(vec3(0.26, 0.42, 0.78), vec3(0.06, 0.09, 0.26), uSun);
    vec3 sky = mix(horizon, zenith, pow(up, 0.45));
    float sd = max(dot(dir, sunDir), 0.0);
    sky += mix(vec3(1.0, 0.8, 0.55), vec3(1.0, 0.45, 0.2), uSun) * (pow(sd, 6.0) * 0.5 + pow(sd, 220.0) * 2.0);
    vec3 night = mix(vec3(0.03, 0.045, 0.1), vec3(0.004, 0.007, 0.024), pow(up, 0.5));
    sky *= 1.0 - 0.55 * uDark;
    sky = mix(sky, night, uNight);
    // 夜里地平线以下是黑的地面
    sky = mix(sky, vec3(0.004, 0.006, 0.012), uNight * smoothstep(0.0, -0.06, dir.y));
    if (uNight > 0.01 && dir.y > 0.0) sky += stars(dir) * uNight * smoothstep(0.0, 0.25, dir.y) * uStarsOn;
    sky += aurora(dir);
    return sky;
  }

  vec3 earthClouds(vec3 ro, vec3 rd) {
    vec3 sunDir = normalize(vec3(-0.55, mix(0.32, 0.06, uSun), -0.78));
    vec3 sky = earthSky(rd, sunDir);
    if (rd.y < 0.01) return sky;
    float t0 = (1.0 - ro.y) / rd.y;
    float t1 = (4.2 - ro.y) / rd.y;
    t1 = min(t1, t0 + 36.0);
    float steps = 40.0;
    float dt = (t1 - t0) / steps;
    float T = 1.0;
    vec3 col = vec3(0.0);
    float jitter = hash(vec3(gl_FragCoord.xy, uTime));
    vec3 lightCol = mix(vec3(1.0, 0.93, 0.82), vec3(1.0, 0.5, 0.26), uSun) * 1.9;
    vec3 shadowCol = mix(vec3(0.5, 0.6, 0.84), vec3(0.5, 0.4, 0.62), uSun);
    lightCol = mix(lightCol, vec3(0.26, 0.3, 0.5), uNight);
    shadowCol = mix(shadowCol, vec3(0.05, 0.07, 0.15), uNight);
    lightCol *= 1.0 - 0.8 * uDark;
    shadowCol *= 1.0 - 0.7 * uDark;
    for (int i = 0; i < 40; i++) {
      float t = t0 + (float(i) + jitter) * dt;
      vec3 p = ro + rd * t;
      float d = cloudDensity(p);
      if (d > 0.003) {
        float od = 0.0;
        for (int j = 1; j <= 3; j++) od += cloudDensity(p + sunDir * float(j) * 0.6);
        float lit = exp(-od * 0.9);
        vec3 c = shadowCol * 0.8 + lightCol * lit;
        float a = 1.0 - exp(-d * dt * 3.2);
        col += T * a * c;
        T *= 1.0 - a;
        if (T < 0.02) break;
      }
    }
    float fade = smoothstep(0.01, 0.12, rd.y);
    vec3 seen = sky * T + col;
    seen = mix(seen, earthSky(vec3(rd.x, 0.0, rd.z), sunDir), 1.0 - exp(-t0 * 0.02));
    return mix(sky, seen, fade);
  }

  // ---------- 宇宙的云 ----------
  vec3 S0 = vec3(0.9, 0.55, 0.2);
  vec3 S1 = vec3(-1.1, 0.1, -0.6);
  vec3 S2 = vec3(0.1, -0.7, 0.5);

  float nebulaShape(vec3 p, out vec3 q) {
    vec3 ps = p + uSeed;
    vec3 w = vec3(fbm(ps * 0.7 + vec3(0, 0, uTime * 0.01)), fbm(ps * 0.7 + 17.3), fbm(ps * 0.7 + 41.7)) - 0.5;
    q = ps + w * 2.2;
    float env = exp(-dot(p * vec3(0.5, 0.85, 0.6), p * vec3(0.5, 0.85, 0.6)) * 0.42);
    float n = fbm(q * 1.25);
    float ridge = 1.0 - abs(2.0 * noise(q * 3.3 + 4.0) - 1.0);
    n += 0.2 * ridge * ridge * (n - 0.3);
    float blob = max(0.0, n * 1.3 - 0.6 - 0.55 * (1.0 - env));
    if (uKind < 0.001) return blob;
    // 行星状星云：一层被抛出去的气体壳，略扁，壳上有疙瘩
    vec3 q2 = p + w * 0.4;
    float r = length(q2 * vec3(1.0, 1.0, 1.9));
    float width = 0.15 + 0.05 * uShell;
    float sh = exp(-pow((r - uShell) / width, 2.0));
    float nn = fbm(q2 * 2.4 + uSeed + 5.0);
    float shell = sh * max(0.0, nn * 1.7 - 0.42) * 0.85;
    return mix(blob, shell, uKind);
  }

  vec3 nebula(vec3 ro, vec3 rd) {
    // 背景：很深的靛蓝，往一边略亮，像银河的边
    float band = exp(-pow(dot(rd, normalize(vec3(0.3, 0.9, -0.2))) * 3.0, 2.0));
    vec3 bg = mix(vec3(0.006, 0.01, 0.028), vec3(0.03, 0.04, 0.09), band * (0.4 + 0.6 * fbm(rd * 3.0)));
    bg *= 1.0 - 0.9 * uMono;
    vec3 starLight = stars(rd) * uStarsOn;

    S0 = mix(S0, vec3(0.0), uKind);
    float others = 1.0 - uKind;

    // 与半径 3.6 的球相交，只在球内走
    float b = dot(ro, rd);
    float c = dot(ro, ro) - 3.6 * 3.6;
    float disc = b * b - c;
    if (disc < 0.0) return bg + starLight;
    float sq = sqrt(disc);
    float t0 = max(-b - sq, 0.0);
    float t1 = -b + sq;
    float steps = 56.0;
    float dt = (t1 - t0) / steps;
    float jitter = hash(vec3(gl_FragCoord.xy, uTime + 3.0));

    float T = 1.0;
    vec3 col = vec3(0.0);
    vec3 redGas = vec3(0.78, 0.07, 0.17);
    vec3 pinkGas = vec3(0.95, 0.38, 0.5);
    vec3 tealGas = vec3(0.1, 0.72, 0.78);
    vec3 blueDust = vec3(0.3, 0.52, 1.0);
    float k0 = uIonK / (uStarK * uStarK);
    for (int i = 0; i < 56; i++) {
      float t = t0 + (float(i) + jitter) * dt;
      vec3 p = ro + rd * t;
      vec3 q;
      float d = nebulaShape(p, q);
      if (d > 0.002) {
        // 离炽热恒星近的地方被电离，发出更亮更偏青的光；远处是暗红
        float near0 = 1.0 / (1.0 + k0 * dot(p - S0, p - S0));
        float near1 = others / (1.0 + k0 * 1.12 * dot(p - S1, p - S1));
        float near2 = others / (1.0 + k0 * 1.25 * dot(p - S2, p - S2));
        float ion = clamp((near0 + near1 * 0.8 + near2 * 0.6) * uStarK, 0.0, 1.5);
        float dust = fbm(q * 2.4 + 5.0);
        vec3 emit = mix(redGas, pinkGas, smoothstep(0.1, 0.7, ion));
        emit = mix(emit, tealGas, smoothstep(0.55, 1.2, ion) * 0.85);
        emit = mix(emit, blueDust, uBlue * (0.85 + 0.15 * smoothstep(0.2, 0.9, ion)));
        emit *= (0.14 + 1.1 * ion) * (0.35 + 1.0 * dust);
        float a = 1.0 - exp(-d * dt * 5.5);
        col += T * a * emit * 1.9;
        // 暗尘遮光：密的地方更挡
        T *= 1.0 - a * mix(0.7, 0.98, smoothstep(0.3, 0.7, dust)) * (1.0 - 0.55 * uKind);
        if (T < 0.015) break;
      }
    }

    // 嵌在里面的几颗热星：柔和的光晕，没有衍射十字
    vec3 hot = vec3(0.0);
    vec3 pts[3];
    pts[0] = S0;
    pts[1] = S1;
    pts[2] = S2;
    for (int k = 0; k < 3; k++) {
      vec3 v = pts[k] - ro;
      float tt = dot(v, rd);
      float d2 = length(v - rd * tt);
      float g = exp(-d2 * d2 * 90.0 / uStarK) * 0.9 + exp(-d2 * 14.0 / uStarK) * 0.12;
      float wk = k == 0 ? 1.0 : others;
      hot += vec3(0.8, 0.9, 1.0) * g * wk * uStarK;
    }
    return bg * T + starLight * T + col + hot * (0.35 + 0.65 * T);
  }

  vec3 rayDir(vec3 cam, vec3 look, vec2 uv) {
    vec3 f = normalize(look - cam);
    vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
    vec3 u = cross(r, f);
    return normalize(f + (uv.x * r + uv.y * u) * 2.0 * tan(uFov * 0.5));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    vec3 rd = rayDir(uCam, uLook, uv);
    vec3 rd2 = rayDir(uCam2, uLook2, uv);

    vec3 col;
    if (uMix < 0.001) col = earthClouds(uCam, rd);
    else if (uMix > 0.999) col = nebula(uCam2, rd2);
    else {
      // 变形：低频噪声做成一块块的遮罩，让云一团一团地换成星云
      float m = smoothstep(0.0, 1.0, clamp((uMix * 1.5 - 0.25) + (fbm(vec3(uv * 1.6, 1.7)) - 0.5) * 0.7, 0.0, 1.0));
      col = mix(earthClouds(uCam, rd), nebula(uCam2, rd2), m);
    }

    col *= uExposure;
    col = 1.0 - exp(-col * 1.05);
    float vig = smoothstep(1.25, 0.35, length(uv * vec2(0.8, 1.0)));
    col *= mix(0.55, 1.0, vig);
    col = mix(col, vec3(dot(col, vec3(0.3, 0.55, 0.15))) * vec3(0.95, 1.0, 1.05), uMono);
    col *= uFade;
    col += (hash(vec3(gl_FragCoord.xy, uTime * 60.0)) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export type V3 = [number, number, number];

export type VolumeProps = {
  mix?: number;
  time: number;
  cam: V3;
  look: V3;
  cam2?: V3;
  look2?: V3;
  fov?: number;
  sun?: number;
  night?: number;
  dark?: number;
  aurora?: number;
  exposure?: number;
  blue?: number;
  seed?: V3;
  mono?: number;
  kind?: number;
  shell?: number;
  starK?: number;
  ionK?: number;
  fade?: number;
  stars?: number;
  cloud?: number;
};

// 只有那块全屏的网格，可以和别的东西放进同一个画布
export const VolumeMesh: React.FC<VolumeProps> = ({
  mix = 0,
  time,
  cam,
  look,
  cam2,
  look2,
  fov = 56,
  sun = 0,
  night = 0,
  dark = 0,
  aurora = 0,
  exposure = 1,
  blue = 0,
  seed = [0, 0, 0],
  mono = 0,
  kind = 0,
  shell = 1.5,
  starK = 1,
  ionK = 4,
  fade = 1,
  stars = 1,
  cloud = 1,
}) => {
  // 每帧给一份新的：画布会把 uniforms 复制进材质，事后改原对象里的数字它看不到
  const uniforms = {
    uRes: { value: new THREE.Vector2(WIDTH, HEIGHT) },
    uTime: { value: time },
    uMix: { value: mix },
    uCam: { value: new THREE.Vector3(...cam) },
    uLook: { value: new THREE.Vector3(...look) },
    uCam2: { value: new THREE.Vector3(...(cam2 ?? cam)) },
    uLook2: { value: new THREE.Vector3(...(look2 ?? look)) },
    uFov: { value: (fov * Math.PI) / 180 },
    uSun: { value: sun },
    uNight: { value: night },
    uDark: { value: dark },
    uAurora: { value: aurora },
    uExposure: { value: exposure },
    uBlue: { value: blue },
    uSeed: { value: new THREE.Vector3(...seed) },
    uMono: { value: mono },
    uKind: { value: kind },
    uShell: { value: shell },
    uStarK: { value: starK },
    uIonK: { value: ionK },
    uFade: { value: fade },
    uStarsOn: { value: stars },
    uCloud: { value: cloud },
  };
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} depthTest={false} depthWrite={false} />
    </mesh>
  );
};

// 半分辨率的画布，再用 CSS 放大到整屏
export const Canvas: React.FC<{ children: React.ReactNode; scale?: number }> = ({ children, scale = RENDER_SCALE }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH * scale, height: HEIGHT * scale, transform: `scale(${1 / scale})`, transformOrigin: "0 0" }}>
    <ThreeCanvas width={WIDTH * scale} height={HEIGHT * scale}>
      {children}
    </ThreeCanvas>
  </div>
);

export const Volume: React.FC<VolumeProps> = (props) => (
  <Canvas>
    <VolumeMesh {...props} />
  </Canvas>
);
