// 河网：每一小段画成一条贴着地面的带子，宽度按真实流量给；带子本身几乎看不见，只在迎着太阳的角度亮成一条金线。
// 亚马逊水系另有一层「勾出来的线」：离海比水头更远的河段都点亮，于是每条支流从各自的源头长出来，和干流同时到达汇合处
import React, { useMemo } from "react";
import * as THREE from "three";
import { FOV, HEIGHT } from "../theme";
import { AIR, GEO } from "./glsl";

const FOCAL = HEIGHT / 2 / Math.tan((FOV * Math.PI) / 360);

const VERTEX = /* glsl */ `
  ${GEO}
  attribute vec4 ends;   // 两端的经纬度
  attribute vec4 info;   // 流量、两端离海的距离、身份（2 主河道，1 亚马逊水系，0 别的水系）
  uniform sampler2D dem;
  uniform float relief;
  uniform float widen;
  varying float vAcross;
  varying float vFade;
  varying float vDown;
  varying float vMain;
  varying float vFlow;
  varying vec3 vPos;
  varying vec3 vUp;

  vec3 ground(vec2 lonLat) {
    float h = max(texture2D(dem, uvOf(lonLat)).r, 0.0) * 0.001 * relief;
    return upAt(lonLat) * (EARTH + h);
  }

  void main() {
    vec3 a = ground(ends.xy);
    vec3 b = ground(ends.zw);
    float end = position.x;
    vec3 here = mix(a, b, end);
    vec3 up = normalize(here);
    vec3 along = normalize(b - a + up * 1e-6);
    vec3 side = normalize(cross(along, up));

    float dist = length(here - cameraPosition);
    // 真实的河宽大致和流量的平方根成正比；太细的补到一个像素左右，同时按比例调暗
    float real = 0.008 * sqrt(info.x) * widen;
    // 勾出来的线要看得清：干流粗一些，支流按流量从细到粗
    float pen = info.w > 1.5 ? 3.8 : info.w > 0.5 ? mix(1.3, 3.2, smoothstep(1.5, 4.2, log(info.x) / 2.3026)) : 1.15;
    float least = pen * dist / ${FOCAL.toFixed(1)};
    float width = max(real, least);
    vFade = clamp(real / least, 0.0, 1.0);

    // 两头各伸出半个宽度，接缝处不留缺口
    here += along * (end - 0.5) * width;
    here += side * position.y * width * 0.5;
    // 稍微抬离地面，离得越远抬得越多，免得和地面打架
    here += up * (0.25 + dist * 0.0012);

    vAcross = position.y;
    vDown = mix(info.y, info.z, end);
    vMain = info.w;
    vFlow = info.x;
    vPos = here;
    vUp = up;
    gl_Position = projectionMatrix * viewMatrix * vec4(here, 1.0);
    // 主河道那道光是给人指路的，深谷里也不该被两边的山挡住：比较深度时当它离镜头近三成
    gl_Position.z -= min(info.w, 1.0) * 0.3 * (10.0 / dist) * gl_Position.w;
  }
`;

const FRAGMENT = /* glsl */ `
  ${AIR}
  uniform float gain;
  uniform float time;
  uniform float head;
  varying float vAcross;
  varying float vFade;
  varying float vDown;
  varying float vMain;
  varying float vFlow;
  varying vec3 vPos;
  varying vec3 vUp;
  void main() {
    vec3 view = normalize(cameraPosition - vPos);
    float mirror = max(dot(reflect(-sunDir, vUp), view), 0.0);
    // 一圈窄而亮的反光，外面一圈宽而暗的
    float core = pow(mirror, 140.0);
    float wide = pow(mirror, 14.0);
    vec3 gold = vec3(1.0, 0.66, 0.34);
    vec3 white = vec3(1.0, 0.95, 0.86);
    vec3 color = mix(gold, white, core) * (core * 0.9 + wide * 0.26);
    // 没有反光的地方只映着一点天色
    color += vec3(0.25, 0.36, 0.5) * 0.03;
    // 大河在底图上认得出水面，由地面自己反光，这里让开
    color *= 1.0 - smoothstep(4000.0, 15000.0, vFlow);
    color *= vFade;
    // 勾出来的线：离海比水头更远的河段都亮着，水头那一小截最亮
    float behind = vDown - head;
    float drawn = step(0.0, behind) * step(0.5, vMain);
    float trunk = step(1.5, vMain);
    float weight = mix(0.16 + 0.42 * smoothstep(1.2, 4.3, log(vFlow) / 2.3026), 0.85, trunk);
    float tip = exp(-max(behind, 0.0) / mix(22.0, 55.0, trunk)) * mix(0.7, 1.5, trunk);
    // 河宽到卫星图上自己看得见以后，改由地面上真实的河面去亮（见 Land），这里的线让开
    float slim = 1.0 - smoothstep(9000.0, 32000.0, vFlow);
    // 拉远以后真实的河面只剩一两个像素，线再接回来
    slim = mix(slim, 1.0, smoothstep(1000.0, 2300.0, length(vPos - cameraPosition)));
    color += vec3(0.8, 0.92, 1.0) * drawn * (weight + tip) * slim;

    float soft = smoothstep(1.0, 0.45, abs(vAcross));
    float haze = exp(-length(vPos - cameraPosition) / hazeRange);
    gl_FragColor = vec4(color * soft * gain * haze, 1.0);
    #include <colorspace_fragment>
  }
`;

export const Rivers: React.FC<{
  data: Float32Array;
  dem: THREE.Texture;
  sun: THREE.Vector3;
  relief: number;
  time: number;
  hazeRange: number;
  gain?: number;
  widen?: number;
  // 水现在流到了离海多远的地方；不给就不画那道光
  head?: number;
}> = ({ data, dem, sun, relief, time, hazeRange, gain = 1, widen = 1, head = 1e9 }) => {
  const geometry = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 2, 1, 3]);
    const packed = new THREE.InstancedInterleavedBuffer(data, 8);
    g.setAttribute("ends", new THREE.InterleavedBufferAttribute(packed, 4, 0));
    g.setAttribute("info", new THREE.InterleavedBufferAttribute(packed, 4, 4));
    g.instanceCount = data.length / 8;
    return g;
  }, [data]);

  // 每帧给一份新的：画布会把 uniforms 复制进材质，事后改原对象里的数字它看不到
  const uniforms = {
    dem: { value: dem },
    sunDir: { value: sun },
    relief: { value: relief },
    time: { value: time },
    hazeRange: { value: hazeRange },
    gain: { value: gain },
    widen: { value: widen },
    head: { value: head },
  };

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
