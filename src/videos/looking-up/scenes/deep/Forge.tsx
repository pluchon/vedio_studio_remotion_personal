// 深空 · 约五十亿年前：一颗大质量恒星，心脏里一层层锻出更重的元素，最里面是铁；它炸开，尘埃被抛进太空，
// 又慢慢旋成一个盘，在盘里聚出了地球——我们身体里的铁和钙，就是从那里来的
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { CameraRig } from "../../three/CameraRig";
import { DeepSky } from "../../three/DeepSky";
import { Earth } from "../../three/Earth";
import { Glow, PointCloud, makeCloud } from "../../three/Points";
import { useTextures } from "../../three/useTextures";
import { EASE_IN_OUT, EASE_OUT, FONTS, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.forge);
const TEXTURES = {
  sky: asset("textures/milky_way.jpg"),
  day: asset("textures/earth_day.jpg"),
  night: asset("textures/earth_night.jpg"),
  clouds: asset("textures/earth_clouds.jpg"),
};

// 恒星表面：中心白热、边缘橙红，米粒组织按帧慢慢翻涌
const STAR_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vPos;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const STAR_FRAGMENT = /* glsl */ `
  uniform float time;
  varying vec3 vNormalV;
  varying vec3 vPos;
  void main() {
    float mu = max(dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0);
    // 表面只随时间轻轻起伏一点亮度，不画纹理（纹理一放大就成了格子）
    float g = sin(time + vPos.y * 3.0) * 0.02;
    vec3 core = vec3(1.0, 0.95, 0.82);
    vec3 limb = vec3(1.0, 0.45, 0.16);
    vec3 col = mix(limb, core, pow(mu, 0.6)) * (0.98 + g);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const Star: React.FC<{ time: number; scale: number }> = ({ time, scale }) => {
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  uniforms.time.value = time;
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 96, 64]} />
      <shaderMaterial vertexShader={STAR_VERTEX} fragmentShader={STAR_FRAGMENT} uniforms={uniforms} />
    </mesh>
  );
};

// 洋葱一样的分层：由外到内
const SHELLS = [
  { name: "氢", color: "#f7d9a8" },
  { name: "氦", color: "#f3bb7d" },
  { name: "碳", color: "#e9955a" },
  { name: "氧", color: "#d9713f" },
  { name: "硅", color: "#b8522e" },
  { name: "铁", color: "#7a3622" },
];
const ONION = { x: 1470, y: 420, r: 190 };

const Onion: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [t(217.6), t(217.9)], [1, 0], clamp);
  if (out <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {SHELLS.map((s, i) => {
          const p = interpolate(frame, [t(214.3) + i * 8, t(214.3) + i * 8 + 12], [0, 1], { ...clamp, easing: EASE_OUT });
          return <circle key={s.name} cx={ONION.x} cy={ONION.y} r={ONION.r * (1 - i / SHELLS.length) * p} fill={s.color} stroke="#2a1408" strokeWidth={1} opacity={0.95} />;
        })}
      </svg>
      {SHELLS.map((s, i) => (
        <div
          key={s.name}
          style={{
            position: "absolute",
            left: ONION.x + ONION.r + 30,
            top: ONION.y - ONION.r + i * 62,
            fontFamily: i === SHELLS.length - 1 ? FONTS.songBlack : FONTS.song,
            fontSize: i === SHELLS.length - 1 ? 40 : 30,
            color: i === SHELLS.length - 1 ? SPACE.cinnabar : SPACE.cream,
            whiteSpace: "nowrap",
            ...inkIn(frame, t(214.5) + i * 8, 10),
          }}
        >
          {s.name}
        </div>
      ))}
    </div>
  );
};

// 爆开的尘埃：先沿径向飞出去，再被拉成一个转动的盘
const DUST = 5000;
const DUST_DIRS = Array.from({ length: DUST }, (_, i) => {
  const r = (k: string) => random(`dust-${i}-${k}`);
  const v = new THREE.Vector3(r("x") - 0.5, r("y") - 0.5, r("z") - 0.5).normalize();
  return { v, speed: 0.6 + r("s") * 0.8, orbit: 3 + Math.pow(r("o"), 0.6) * 22, phase: r("p") * Math.PI * 2, lift: (r("l") - 0.5) * 1.2 };
});

export const Forge: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  const boom = t(217.8);
  const after = Math.max(0, frame - boom);
  const swirl = interpolate(frame, [t(219.6), t(221.2)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const flash = interpolate(frame, [boom - 2, boom, boom + 18], [0, 1, 0], clamp);
  const earth = interpolate(frame, [t(220.6), t(221.8)], [0, 1], { ...clamp, easing: EASE_OUT });
  const push = interpolate(frame, [0, boom], [60, 40], { easing: EASE_IN_OUT });
  const cam = frame < boom ? push : interpolate(after, [0, 60, 150], [40, 70, 46], clamp);

  const dust = useMemo(
    () =>
      makeCloud(DUST, (i) => ({ p: [0, 0, 0], s: 1 + (i % 5) * 0.5, c: new THREE.Color(i % 7 === 0 ? "#9fc4ff" : i % 3 === 0 ? "#ffd9a0" : "#ff9a5c") })),
    [],
  );
  // 每帧改写尘埃的位置
  if (after > 0) {
    for (let i = 0; i < DUST; i++) {
      const d = DUST_DIRS[i];
      const burst = d.v.clone().multiplyScalar(Math.min(after, 70) * d.speed * 0.5);
      const a = d.phase + frame * 0.02 * (8 / d.orbit);
      const disk = new THREE.Vector3(Math.cos(a) * d.orbit, d.lift, Math.sin(a) * d.orbit);
      const p = burst.lerp(disk, swirl);
      dust.positions.set([p.x, p.y, p.z], i * 3);
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      {tex && (
        <ThreeCanvas width={1920} height={1080}>
          {/* 看向恒星右边一点，恒星落在画面左侧，给右边的分层图留位置 */}
          <CameraRig position={[0, cam * 0.35, cam]} target={[frame < boom ? 12 : 0, 0, 0]} fov={42} />
          <DeepSky sky={tex.sky} brightness={0.4} />
          {frame < boom && (
            <>
              <Star time={frame * 0.05} scale={10} />
              <Glow color="#ffb870" size={70} intensity={1.1} />
            </>
          )}
          {after > 0 && <PointCloud key={after} cloud={dust} scale={1100} minSize={1.6} maxSize={7} opacity={interpolate(after, [0, 10], [0, 1.6], clamp)} />}
          {earth > 0 && (
            <group scale={earth}>
              <Earth day={tex.day} night={tex.night} clouds={tex.clouds} radius={2.2} spin={frame * 0.01} sunDir={[1, 0.3, 0.6]} />
            </group>
          )}
        </ThreeCanvas>
      )}
      <Onion />
      <AbsoluteFill style={{ backgroundColor: "#fff6e8", opacity: flash }} />
      <div style={{ position: "absolute", left: 1180, top: 300, opacity: interpolate(frame, [t(220.2), t(220.6)], [1, 0], clamp) }}>
        <div style={{ fontFamily: FONTS.song, fontSize: 32, letterSpacing: "0.12em", color: SPACE.cream, whiteSpace: "nowrap", ...inkIn(frame, t(218.3), 14) }}>铁、钙……被抛向宇宙</div>
      </div>
      <div style={{ position: "absolute", left: 1180, top: 300, fontFamily: FONTS.song, fontSize: 32, letterSpacing: "0.12em", color: SPACE.cream, whiteSpace: "nowrap", ...inkIn(frame, t(220.7), 14) }}>
        四十六亿年前，它们聚成了地球
      </div>
      <Mist tone="space" strength={0.55} height={280} />
      <Locator year="约五十亿年前" place="一颗早已死去的恒星" at={t(213.9)} tone="space" />
      <Subtitle
        zh={["构成身体的铁与钙，都曾在恒星的心脏里锻造。", "我们仰望的远方，其实是很久以前的家。"]}
        en={["The iron and calcium in our bodies were forged in the hearts of stars.", "The distance we look up to was, long ago, our home."]}
        at={t(214.0)}
        out={t(222.5)}
        tone="space"
      />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
