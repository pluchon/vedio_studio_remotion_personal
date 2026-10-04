// 第二幕「光里的线索」：宇宙微波背景的全天图；再加上我们运动造成的偶极——前方偏暖，后方偏凉。
// 前半从球里面看（环顾），后半摊成一张椭圆的全天图（Mollweide 投影），这样暖的一头和凉的一头能同时看到
import React from "react";
import * as THREE from "three";
import { useTextures } from "../../looking-up/three/useTextures";
import { Tag } from "../labels";
import { Canvas, Rig, dir } from "../space";
import { asset } from "../theme";
import { ease, ramp, track, useT } from "../time";
import type { V3 } from "../time";

const INSIDE_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position.z = gl_Position.w;
  }
`;
const INSIDE_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  varying vec3 vDir;
  const float PI = 3.14159265;
  void main() {
    vec3 d = normalize(vDir);
    float l = atan(-d.z, d.x);
    float b = asin(clamp(d.y, -1.0, 1.0));
    gl_FragColor = vec4(texture2D(map, vec2(0.5 - l / (2.0 * PI), 0.5 + b / PI)).rgb * 0.92, 1.0);
    #include <colorspace_fragment>
  }
`;

// 椭圆全天图：半宽 780 px、半高 390 px，中心在画面中央
const MOLL_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
const MOLL_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 motion;
  uniform float dip;
  varying vec2 vUv;
  const float PI = 3.14159265;
  void main() {
    float nx = (vUv.x - 0.5) / (780.0 / 1920.0);
    float ny = (vUv.y - 0.5) / (390.0 / 1080.0);
    float r2 = nx * nx + ny * ny;
    if (r2 > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    float th = asin(ny);
    float lat = asin(clamp((2.0 * th + sin(2.0 * th)) / PI, -1.0, 1.0));
    float lon = PI * nx / max(cos(th), 1e-4);
    float l = -lon;
    vec3 d = vec3(cos(lat) * cos(l), sin(lat), -cos(lat) * sin(l));
    vec3 cmb = texture2D(map, vec2(0.5 - l / (2.0 * PI), 0.5 + lat / PI)).rgb;
    float c = dot(d, normalize(motion));
    vec3 mid = vec3(0.04, 0.04, 0.06);
    vec3 warm = vec3(0.95, 0.42, 0.12);
    vec3 cold = vec3(0.1, 0.3, 0.85);
    float k = pow(abs(c), 0.8);
    vec3 dc = c > 0.0 ? mix(mid, warm, k) : mix(mid, cold, k);
    // 偶极盖上去以后，原来的起伏只剩一点点纹理
    vec3 col = mix(cmb, dc * (0.9 + 0.5 * (cmb - 0.5)), dip);
    float edge = smoothstep(1.0, 0.985, sqrt(r2));
    gl_FragColor = vec4(col * edge, 1.0);
    #include <colorspace_fragment>
  }
`;

const MOTION = dir(271.9, 29.6);

// 银道坐标 → 椭圆全天图上的屏幕位置
const moll = (l: number, b: number): [number, number] => {
  let lon = -l;
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  const phi = (b * Math.PI) / 180;
  let th = phi;
  for (let i = 0; i < 20; i++) th -= (2 * th + Math.sin(2 * th) - Math.PI * Math.sin(phi)) / (2 + 2 * Math.cos(2 * th) || 1e-6);
  return [960 + ((lon / 180) * Math.cos(th)) * 780, 540 - Math.sin(th) * 390];
};

export const Cmb: React.FC = () => {
  const t = useT();
  const tex = useTextures({ cmb: asset("img/cmb.jpg") });
  const lon = track(t, [[48, 70], [62, 150], [70, 190]]);
  const lat = track(t, [[48, 8], [62, 12], [70, 14]]);
  const fov = track(t, [[48, 92], [70, 82]]);
  const look = dir(lon, lat).map((v) => v * 10) as V3;
  const inside = 1 - ramp(t, 63, 68);
  const flat = ramp(t, 63, 68);
  const dip = ease(t, 72, 82);
  const [hx, hy] = moll(271.9, 29.6);
  const [cx, cy] = moll(91.9, -29.6);
  const hold = ramp(t, 82, 85.5) * (1 - ramp(t, 95, 98));
  return (
    <>
      {tex ? (
        <>
          {inside > 0.003 ? (
            <div style={{ position: "absolute", inset: 0, opacity: inside }}>
              <Canvas>
                <Rig pos={[0, 0, 0]} look={look} fov={fov} far={100} />
                <mesh frustumCulled={false}>
                  <sphereGeometry args={[20, 64, 32]} />
                  <shaderMaterial vertexShader={INSIDE_VERTEX} fragmentShader={INSIDE_FRAGMENT} uniforms={{ map: { value: tex.cmb } }} side={THREE.BackSide} depthTest={false} depthWrite={false} />
                </mesh>
              </Canvas>
            </div>
          ) : null}
          {flat > 0.003 ? (
            <div style={{ position: "absolute", inset: 0, opacity: flat }}>
              <Canvas>
                <mesh frustumCulled={false}>
                  <planeGeometry args={[2, 2]} />
                  <shaderMaterial
                    vertexShader={MOLL_VERTEX}
                    fragmentShader={MOLL_FRAGMENT}
                    uniforms={{ map: { value: tex.cmb }, motion: { value: new THREE.Vector3(...MOTION) }, dip: { value: dip } }}
                    depthTest={false}
                    depthWrite={false}
                  />
                </mesh>
              </Canvas>
            </div>
          ) : null}
        </>
      ) : null}
      <Tag x={960} y={120} p={ramp(t, 50, 52.5) * (1 - ramp(t, 62, 64))} size={36} sub="2.725 K · 普朗克卫星 2018 · 图上的起伏只有十万分之几，已放大显示">
        宇宙微波背景
      </Tag>
      <Tag x={960} y={96} p={ramp(t, 72, 75) * (1 - ramp(t, 98, 100))} size={34} sub="示意：偶极比图上的起伏大三十倍左右，这里用颜色表示方向">
        再加上我们自己的运动
      </Tag>
      <Tag x={hx} y={hy + 50} p={hold} size={30} color="#fff3e2" sub="前进方向 (l, b) ≈ (272°, +30°)">
        偏暖 +3.36 mK
      </Tag>
      <Tag x={cx} y={cy + 50} p={hold} size={30} color="#e6f0ff" sub="身后">
        偏凉 −3.36 mK
      </Tag>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: hold }}>
        <circle cx={hx} cy={hy} r={14} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.6} />
        <circle cx={cx} cy={cy} r={14} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.6} />
      </svg>
    </>
  );
};
