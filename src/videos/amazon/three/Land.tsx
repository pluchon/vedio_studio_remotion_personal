// 地面：卫星底图铺在按真实高程起伏的球面上，山的明暗、海面的反光、云和云影都在着色器里算
import React, { useMemo } from "react";
import * as THREE from "three";
import { AIR, GEO, NOISE } from "./glsl";

const COLUMNS = 2160;
const ROWS = 1500;

const VERTEX = /* glsl */ `
  ${GEO}
  uniform sampler2D dem;
  uniform float relief;
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = position.xy;
    vec2 lonLat = lonLatOf(vUv);
    float h = max(texture2D(dem, vUv).r, 0.0) * 0.001 * relief;
    vPos = upAt(lonLat) * (EARTH + h);
    gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  ${GEO}
  ${NOISE}
  ${AIR}
  uniform sampler2D land;
  uniform sampler2D dem;
  uniform sampler2D nearRiver;
  uniform sampler2D reach;
  uniform float head;
  uniform float relief;
  uniform float clouds;
  uniform float mist;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vPos;

  float heightAt(vec2 uv) { return max(texture2D(dem, uv).r, 0.0); }

  // 一朵朵的积云：大尺度的噪声决定哪一片有云，小尺度的决定每一朵的形状。
  // 高山上没有，大河上空也没有（河面比雨林凉，云在河上生不起来）
  float cloudAt(vec2 lonLat) {
    vec2 uv = uvOf(lonLat);
    vec2 drift = vec2(-time * 0.012, time * 0.004);
    float region = fbm(lonLat * 0.5 + drift * 0.3 + 4.0);
    float puffs = fbm(lonLat * 7.0 + drift);
    float fine = fbm(lonLat * 26.0 + drift * 2.0);
    float density = puffs * 0.75 + fine * 0.25;
    float amount = smoothstep(0.38, 0.68, region) * clouds;
    amount *= 1.0 - smoothstep(900.0, 2600.0, heightAt(uv));
    amount *= 1.0 - texture2D(nearRiver, uv).r;
    float cut = mix(0.8, 0.5, amount);
    return smoothstep(cut, cut + 0.1, density) * step(0.001, amount);
  }

  // 晨雾：低地的雨林上一片片地浮着，山里则沉在比四周低的河谷里
  float mistAt(vec2 lonLat, vec2 uv, float h) {
    vec2 far = DEM_TEXEL * 14.0;
    float around = (heightAt(uv + vec2(far.x, 0.0)) + heightAt(uv - vec2(far.x, 0.0)) + heightAt(uv + vec2(0.0, far.y)) + heightAt(uv - vec2(0.0, far.y))) * 0.25;
    float valley = smoothstep(200.0, 900.0, around - h);
    float low = 1.0 - smoothstep(120.0, 700.0, h);
    vec2 drift = vec2(time * 0.004, -time * 0.002);
    float broad = fbm(lonLat * 1.7 + drift);
    float fine = fbm(lonLat * 9.0 - drift * 3.0);
    float patches = smoothstep(0.5, 0.8, broad * 0.68 + fine * 0.32);
    // 大河上空不起雾，河面才看得清
    low *= 1.0 - 0.9 * texture2D(nearRiver, uv).r;
    return max(low * patches * 0.75, valley * (0.45 + 0.55 * fine)) * mist;
  }

  void main() {
    vec2 lonLat = lonLatOf(vUv);
    vec3 up = upAt(lonLat);
    vec3 east = eastAt(lonLat);
    vec3 north = northAt(lonLat);

    // 坡度：左右、上下各隔一格取高差
    float dx = heightAt(vUv + vec2(DEM_TEXEL.x, 0.0)) - heightAt(vUv - vec2(DEM_TEXEL.x, 0.0));
    float dy = heightAt(vUv + vec2(0.0, DEM_TEXEL.y)) - heightAt(vUv - vec2(0.0, DEM_TEXEL.y));
    float scale = relief * 0.001 / (2.0 * DEM_CELL);
    vec3 normal = normalize(up - east * dx * scale + north * dy * scale);

    float raw = texture2D(dem, vUv).r;
    float sea = smoothstep(SEA * 0.2, SEA * 0.8, raw);
    vec3 albedo = texture2D(land, vUv).rgb;

    // 大河附近按底图的颜色认水面：浑水偏红褐，黑水几乎全黑，雨林是绿的
    float brown = smoothstep(0.0, 0.01, albedo.r - albedo.g);
    float black = 1.0 - smoothstep(0.004, 0.013, albedo.g);
    float river = max(brown, black) * texture2D(nearRiver, vUv).r * (1.0 - smoothstep(250.0, 500.0, raw));
    float water = max(sea, river);

    // 太阳低的时候平地也只有一点光，这里把平地补回正常亮度，只留下坡面的明暗差
    float height = max(dot(up, sunDir), 0.0);
    float lit = min(max(dot(normal, sunDir), 0.0) / max(height, 0.2), 2.4);
    vec3 sunColor = mix(vec3(1.0, 0.56, 0.3), vec3(1.0, 0.94, 0.86), smoothstep(0.05, 0.55, height));
    vec3 skyColor = vec3(0.3, 0.44, 0.78);

    // 云影：顺着阳光的方向往回找，看那里有没有云
    vec3 sunFlat = sunDir - up * dot(up, sunDir);
    vec2 toSun = vec2(dot(sunFlat, east), dot(sunFlat, north)) / max(height, 0.12);
    float cloud = cloudAt(lonLat);
    float shadow = cloudAt(lonLat + toSun * 0.02);

    // 底图偏灰，提一点饱和
    float grey = dot(albedo, vec3(0.3, 0.55, 0.15));
    albedo = max(mix(vec3(grey), albedo, 1.2), 0.0) * mix(1.0, 0.8, river);
    vec3 color = albedo * (skyColor * 0.3 + sunColor * lit * 1.1 * (1.0 - shadow * 0.75));

    // 水面：太阳的倒影。海上被波浪打散成一大片，河上是窄窄的一道
    vec3 view = normalize(cameraPosition - vPos);
    float mirror = max(dot(reflect(-sunDir, up), view), 0.0);
    float swell = 0.65 + 0.7 * fbm(lonLat * 5.0 + vec2(time * 0.01, 0.0));
    vec3 glint = mix(vec3(1.0, 0.66, 0.34), vec3(1.0, 0.93, 0.8), pow(mirror, 60.0)) * (pow(mirror, 160.0) * 0.9 + pow(mirror, 16.0) * 0.26);
    color += glint * water * mix(1.0, swell, sea) * (1.0 - cloud) * (1.0 - shadow * 0.6);
    // 勾出来的线：大河在卫星图上有自己的宽度，线画到的地方让真实的河面亮起来，水头那一截最亮
    float away = texture2D(reach, vUv).r;
    float behind = away - head;
    float drawn = step(0.0, away) * step(0.0, behind);
    color += vec3(0.62, 0.8, 1.0) * river * drawn * (0.15 + 0.5 * exp(-max(behind, 0.0) / 55.0));
    // 没有反光的水面映着天色
    color += skyColor * 0.035 * water * (1.0 - mirror);

    // 云：朝太阳的一侧亮，背着的一侧暗，看起来才有厚度
    float rim = clamp((cloud - cloudAt(lonLat + toSun * 0.012)) * 1.4, -1.0, 1.0);
    vec3 cloudColor = skyColor * 0.34 + sunColor * (0.42 + 0.3 * rim);
    color = mix(color, cloudColor, cloud * 0.9);

    float fog = mistAt(lonLat, vUv, max(raw, 0.0)) * (1.0 - sea);
    color = mix(color, skyColor * 0.34 + sunColor * 0.2, fog * 0.62);

    color = withHaze(color, vPos);

    // 数据范围的边上淡出，露出下面那颗低清的地球
    vec2 edge = smoothstep(vec2(0.0), vec2(0.02), vUv) * smoothstep(vec2(0.0), vec2(0.02), 1.0 - vUv);
    gl_FragColor = vec4(grade(color), edge.x * edge.y);
    #include <colorspace_fragment>
  }
`;

export const Land: React.FC<{
  land: THREE.Texture;
  dem: THREE.Texture;
  nearRiver: THREE.Texture;
  reach: THREE.Texture;
  // 水现在流到了离海多远的地方
  head: number;
  sun: THREE.Vector3;
  relief: number;
  clouds: number;
  mist?: number;
  time: number;
  hazeRange: number;
}> = ({ land, dem, nearRiver, reach, head, sun, relief, clouds, mist = 0, time, hazeRange }) => {
  const geometry = useMemo(() => {
    const positions = new Float32Array((COLUMNS + 1) * (ROWS + 1) * 3);
    let p = 0;
    for (let y = 0; y <= ROWS; y++) {
      for (let x = 0; x <= COLUMNS; x++) {
        positions[p++] = x / COLUMNS;
        positions[p++] = y / ROWS;
        positions[p++] = 0;
      }
    }
    const index = new Uint32Array(COLUMNS * ROWS * 6);
    let i = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLUMNS; x++) {
        const a = y * (COLUMNS + 1) + x;
        const b = a + COLUMNS + 1;
        index[i++] = a;
        index[i++] = b;
        index[i++] = a + 1;
        index[i++] = a + 1;
        index[i++] = b;
        index[i++] = b + 1;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setIndex(new THREE.BufferAttribute(index, 1));
    return g;
  }, []);

  // 每帧给一份新的：画布会把 uniforms 复制进材质，事后改原对象里的数字它看不到
  const uniforms = {
    land: { value: land },
    dem: { value: dem },
    nearRiver: { value: nearRiver },
    reach: { value: reach },
    head: { value: head },
    sunDir: { value: sun },
    relief: { value: relief },
    clouds: { value: clouds },
    mist: { value: mist },
    time: { value: time },
    hazeRange: { value: hazeRange },
  };

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={1}>
      <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} transparent side={THREE.DoubleSide} />
    </mesh>
  );
};
