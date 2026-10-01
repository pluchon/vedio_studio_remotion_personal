// 近处的几样实体，坐标都以取景地为原点、以米为单位，外面套一层按镜头距离缩放的 group：
// 夜面朝上的地球、月球、太阳的眩光、贴在地面上的那一帧田野，以及按帧摆放的镜头
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import type { PerspectiveCamera } from "three";
import { EARTH_CENTER, EARTH_SPIN, FOV, PATCH_HEIGHT, R_EARTH, R_MOON, R_SUN, SCREEN_RIGHT, SCREEN_UP, SITE, SUN_DIR, Shot, ZENITH } from "../theme";

export const FAR = 1e6;

// 镜头始终在离取景地一个单位处回望；整个世界按距离缩放，镜头只换方向
export const Rig: React.FC<{ shot: Shot }> = ({ shot }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { dir, up, target, near } = shot;
  useLayoutEffect(() => {
    camera.position.copy(dir);
    camera.up.copy(up);
    camera.lookAt(target);
    camera.fov = FOV;
    camera.near = near;
    camera.far = FAR;
    camera.updateProjectionMatrix();
  }, [camera, dir, up, target, near]);
  return null;
};

const GLOBE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vUnit;
  void main() {
    vUv = uv;
    vUnit = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GLOBE_FRAGMENT = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D cloudMap;
  uniform vec3 sunDir;
  uniform vec3 site;
  uniform vec3 east;
  uniform vec3 north;
  uniform float lights;
  uniform float moon;
  uniform float veil;
  uniform float soften;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vUnit;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  // 灯光贴图放大以后是一个个方块：在周围取九个点平均，方块就成了一团团光
  vec3 cityLights(vec2 uv, float spread) {
    vec2 texel = spread / vec2(8192.0, 4096.0);
    vec3 sum = texture2D(nightMap, uv).rgb * 0.25;
    for (int i = 0; i < 4; i++) {
      float a = 1.5708 * float(i);
      vec2 o = vec2(cos(a), sin(a));
      sum += texture2D(nightMap, uv + o * texel).rgb * 0.125;
      sum += texture2D(nightMap, uv + vec2(o.x - o.y, o.x + o.y) * texel).rgb * 0.0625;
    }
    return sum;
  }
  // 一层碎云：从几公里到上百公里的起伏叠在一起
  float deck(vec2 q) {
    float sum = 0.0;
    float amp = 0.5;
    vec2 p = q / 45.0;
    for (int i = 0; i < 6; i++) {
      sum += amp * noise(p);
      p = p * 2.07 + 13.7;
      amp *= 0.5;
    }
    return smoothstep(0.42, 0.72, sum);
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float d = dot(n, sunDir);
    float lit = smoothstep(-0.1, 0.25, d);
    float cloud = texture2D(cloudMap, vUv).r;
    vec3 base = texture2D(dayMap, vUv).rgb;

    // 白天一侧给到高动态范围，月牙形的亮边会溢出辉光
    vec3 day = mix(base, vec3(0.95), cloud * 0.85) * max(d, 0.0) * 2.6;
    // 夜面：城市灯火，加一层很淡的月光把陆地和云的轮廓托出来
    vec2 q = vec2(dot(vUnit - site, east), dot(vUnit - site, north)) * 6371.0;
    vec3 moonlit = (base * 0.022 + vec3(cloud) * 0.02) * vec3(0.6, 0.75, 1.0) * moon;
    vec3 night = cityLights(vUv, soften) * lights * (1.0 - cloud * 0.7) + moonlit;
    // 离地几公里穿过一层被月光照亮的碎云，贴图够不着的这段高度由它接上
    float wisps = deck(q) * veil;
    night = mix(night, vec3(0.045, 0.055, 0.075) * (0.55 + 0.45 * noise(q / 6.0)), wisps * 0.9);
    vec3 col = mix(night, day, lit);

    // 大气：边缘一圈蓝；逆着太阳看过去的那一段，阳光穿过大气，烧成一道金红的亮边
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    col += vec3(0.32, 0.56, 1.0) * rim * (0.05 + 1.6 * smoothstep(-0.25, 0.6, d));
    float toward = pow(max(dot(-v, sunDir), 0.0), 24.0);
    col += vec3(1.0, 0.62, 0.34) * pow(rim, 0.7) * toward * smoothstep(-0.32, 0.02, d) * 7.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// 取景地在未转动的地球上的位置，以及当地的正东、正北（和贴图的等距圆柱投影对齐）
const SITE_LOCAL = (() => {
  const a = (SITE.lat * Math.PI) / 180;
  const b = (SITE.lon * Math.PI) / 180;
  return {
    site: new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b)),
    east: new THREE.Vector3(-Math.sin(b), 0, -Math.cos(b)),
    north: new THREE.Vector3(-Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)),
  };
})();

// lights 城市灯火的亮度，moon 月光下地面的亮度，veil 碎云的浓度，soften 灯光贴图往外抹开几个像素
export const Globe: React.FC<{
  day: THREE.Texture;
  night: THREE.Texture;
  clouds: THREE.Texture;
  lights?: number;
  moon?: number;
  veil?: number;
  soften?: number;
}> = ({ day, night, clouds, lights = 1.5, moon = 1, veil = 0, soften = 0 }) => {
  // 每帧给一份新的：画布会把 uniforms 复制进材质，事后改原对象里的数字它看不到
  const uniforms = {
    dayMap: { value: day },
    nightMap: { value: night },
    cloudMap: { value: clouds },
    sunDir: { value: SUN_DIR },
    site: { value: SITE_LOCAL.site },
    east: { value: SITE_LOCAL.east },
    north: { value: SITE_LOCAL.north },
    lights: { value: lights },
    moon: { value: moon },
    veil: { value: veil },
    soften: { value: soften },
  };
  // 取景地是原点，地心在它正下方一个地球半径处
  return (
    <mesh position={EARTH_CENTER} rotation={[0, EARTH_SPIN, 0]} scale={R_EARTH}>
      <sphereGeometry args={[1, 256, 192]} />
      <shaderMaterial vertexShader={GLOBE_VERTEX} fragmentShader={GLOBE_FRAGMENT} uniforms={uniforms} />
    </mesh>
  );
};

const MOON_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 sunDir;
  uniform vec3 earthDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 rock = texture2D(map, vUv).rgb;
    // 朝太阳的一面是亮的；朝地球的一面有地球反过来的一点蓝光；其余留一点底，背面的环形山才看得出来
    float sun = max(dot(n, sunDir), 0.0);
    float earth = max(dot(n, earthDir), 0.0);
    gl_FragColor = vec4(rock * (sun * 2.6 + vec3(0.35, 0.5, 0.8) * 0.03 * earth + vec3(0.02, 0.022, 0.026)), 1.0);
  }
`;

export const Moon: React.FC<{ map: THREE.Texture; position: THREE.Vector3 }> = ({ map, position }) => {
  const uniforms = useMemo(
    () => ({ map: { value: map }, sunDir: { value: SUN_DIR }, earthDir: { value: EARTH_CENTER.clone().sub(position).normalize() } }),
    [map, position],
  );
  return (
    <mesh position={position} scale={R_MOON}>
      <sphereGeometry args={[1, 128, 96]} />
      <shaderMaterial vertexShader={GLOBE_VERTEX} fragmentShader={MOON_FRAGMENT} uniforms={uniforms} />
    </mesh>
  );
};

const PATCH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PATCH_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float edge;
  varying vec2 vUv;
  void main() {
    // 镜头升高以后，田野从四周往中间化进地面，矩形的边不会露出来
    vec2 p = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
    float mask = 1.0 - smoothstep(edge * 0.35, edge, length(p));
    gl_FragColor = vec4(texture2D(map, vUv).rgb, mask);
  }
`;

const PATCH_QUATERNION = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(SCREEN_RIGHT, SCREEN_UP, ZENITH));

// 开头片段的最后一帧，平铺在取景地的地面上；edge 是还亮着的半径（以画面高度为 1）
export const Patch: React.FC<{ map: THREE.Texture; edge: number }> = ({ map, edge }) => (
  <mesh quaternion={PATCH_QUATERNION} scale={[(PATCH_HEIGHT * 16) / 9, PATCH_HEIGHT, 1]} renderOrder={2}>
    <planeGeometry args={[1, 1]} />
    <shaderMaterial
      vertexShader={PATCH_VERTEX}
      fragmentShader={PATCH_FRAGMENT}
      uniforms={{ map: { value: map }, edge: { value: edge } }}
      transparent
      depthTest={false}
      depthWrite={false}
    />
  </mesh>
);

const GLARE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // 广告牌：只取物体中心的位置，面片在视空间里展开
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
    gl_Position = projectionMatrix * mv;
  }
`;

const GLARE_FRAGMENT = /* glsl */ `
  uniform float disc;
  uniform float intensity;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p);
    // 日面本身、一圈很快衰减的光晕、一道横向拉开的镜头光条
    float core = smoothstep(disc, disc * 0.7, d) * 40.0;
    float halo = disc * disc / (d * d + disc * disc) * 2.2;
    float streak = exp(-abs(p.y) / (disc * 0.55)) * exp(-abs(p.x) * 3.2) * 1.6;
    float fade = smoothstep(1.0, 0.55, d);
    gl_FragColor = vec4(vec3(1.0, 0.93, 0.82) * (core + (halo + streak) * fade) * intensity, 1.0);
  }
`;

// 太阳：一张始终朝向镜头的发光面片，size 是面片的边长（米），日面按真实大小画在正中
export const Glare: React.FC<{ position: THREE.Vector3; size: number; intensity: number }> = ({ position, size, intensity }) => (
  <mesh position={position} scale={size}>
    <planeGeometry args={[1, 1]} />
    <shaderMaterial
      vertexShader={GLARE_VERTEX}
      fragmentShader={GLARE_FRAGMENT}
      uniforms={{ disc: { value: R_SUN / (size / 2) }, intensity: { value: intensity } }}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  </mesh>
);

const SHELL_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vPosV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPosV = mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  uniform vec3 color;
  uniform float strength;
  varying vec3 vNormalV;
  varying vec3 vPosV;
  void main() {
    // 只在掠射的边缘发光，看上去是一个很薄的泡
    float f = 1.0 - abs(dot(normalize(vNormalV), normalize(-vPosV)));
    gl_FragColor = vec4(color * pow(f, 9.0) * strength, 1.0);
  }
`;

// 一层薄薄的球壳（人类的无线电传到的范围）
export const Shell: React.FC<{ center: THREE.Vector3; radius: number; strength: number; color?: string }> = ({ center, radius, strength, color = "#7fa8ff" }) => {
  const tint = useMemo(() => new THREE.Color(color), [color]);
  if (strength <= 0) return null;
  return (
    <mesh position={center} scale={radius}>
      <sphereGeometry args={[1, 128, 96]} />
      <shaderMaterial
        vertexShader={SHELL_VERTEX}
        fragmentShader={SHELL_FRAGMENT}
        uniforms={{ color: { value: tint }, strength: { value: strength } }}
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

const BACKDROP_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BACKDROP_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 pole;
  uniform vec3 center;
  uniform vec3 side;
  uniform float strength;
  uniform float shift;
  varying vec3 vDir;
  void main() {
    // 普朗克的全天图是银道坐标的等距圆柱投影：银心在正中，银经往左增大
    vec3 d = normalize(vDir);
    float b = asin(clamp(dot(d, pole), -1.0, 1.0));
    float l = atan(dot(d, side), dot(d, center));
    vec3 tex = texture2D(map, vec2(0.5 - l / 6.2831853, 0.5 + b / 3.1415927)).rgb;
    // 原图是伪彩色，压一压饱和度，只留下那层斑驳
    float lum = dot(tex, vec3(0.3, 0.5, 0.2));
    vec3 col = mix(vec3(lum), tex, 0.38) * vec3(1.0, 0.84, 0.7) * (0.35 + 0.65 * lum);
    // 时间快进：这层光也被越拉越红、越来越暗
    col = mix(col, vec3(lum) * vec3(0.9, 0.2, 0.1), smoothstep(1.0, 6.0, shift)) / pow(shift, 0.9);
    gl_FragColor = vec4(col * strength, 1.0);
  }
`;

// 最早的光：一层包在最外面的球壳，贴的是普朗克卫星测到的微波背景。只画内壁，从外面看过去是一颗球
export const Backdrop: React.FC<{ map: THREE.Texture; radius: number; strength: number; shift?: number; pole: THREE.Vector3; center: THREE.Vector3; side: THREE.Vector3 }> = ({
  map,
  radius,
  strength,
  shift = 1,
  pole,
  center,
  side,
}) => {
  if (strength <= 0) return null;
  return (
    <mesh scale={radius} renderOrder={-8}>
      <sphereGeometry args={[1, 96, 64]} />
      <shaderMaterial
        vertexShader={BACKDROP_VERTEX}
        fragmentShader={BACKDROP_FRAGMENT}
        uniforms={{ map: { value: map }, pole: { value: pole }, center: { value: center }, side: { value: side }, strength: { value: strength }, shift: { value: shift } }}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};
