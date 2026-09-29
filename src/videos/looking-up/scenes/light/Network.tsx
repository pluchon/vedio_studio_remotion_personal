// 光 · 编年：地球的夜面，城市的灯越来越亮，城市之间一条条光缆弧线越连越密；左上角的编年越翻越快，
// 一直翻到二〇二六年那三件标红的事。然后最亮的那一点从地平线上升起来，另一边的影子也跟着沉下去
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Subtitle } from "../../components/Subtitle";
import { Ticker, TickerEntry } from "../../components/Ticker";
import { CameraRig } from "../../three/CameraRig";
import { DeepSky } from "../../three/DeepSky";
import { Earth, latLon } from "../../three/Earth";
import { Glow } from "../../three/Points";
import { useTextures } from "../../three/useTextures";
import { EASE_IN_OUT, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.network);
const TEXTURES = {
  sky: asset("textures/milky_way.jpg"),
  day: asset("textures/earth_day.jpg"),
  night: asset("textures/earth_night.jpg"),
  clouds: asset("textures/earth_clouds.jpg"),
};
const R = 10;

// 编年：前面隔得远，越往后越密；二〇二六年三条标红
const ENTRIES: TickerEntry[] = [
  { year: "1969", place: "洛杉矶", event: "阿帕网第一次连通", at: t(245.6) },
  { year: "1971", place: "硅谷", event: "微处理器", at: t(247.7) },
  { year: "1989", place: "日内瓦", event: "万维网的提案", at: t(249.5) },
  { year: "2012", place: "多伦多", event: "深度学习认出了图像", at: t(251.0) },
  { year: "2016", place: "首尔", event: "AlphaGo", at: t(252.3) },
  { year: "2017", place: "长滩", event: "一篇论文写下「注意力」", at: t(253.4) },
  { year: "2022", place: "旧金山", event: "机器开始与所有人交谈", at: t(254.4) },
  { year: "2024", place: "斯德哥尔摩", event: "诺贝尔化学奖颁给蛋白质的预测与设计", at: t(255.6) },
  { year: "2026", place: "帕洛阿尔托", event: "AI 设计出全新的噬菌体", at: t(257.3), hot: true },
  { year: "2026", place: "华盛顿", event: "最前沿的模型一度被出口管制", at: t(259.1), hot: true },
  { year: "2026", place: "测试沙箱之外", event: "智能体自主攻入另一家机构", at: t(260.9), hot: true },
];

// 城市（纬度, 经度）
const CITIES: [number, number][] = [
  [40.7, -74], [37.8, -122.4], [34, -118.2], [41.9, -87.6], [43.7, -79.4], [19.4, -99.1], [-23.5, -46.6], [-34.6, -58.4],
  [51.5, -0.1], [48.9, 2.4], [52.5, 13.4], [46.2, 6.1], [55.8, 37.6], [59.3, 18.1], [41, 29], [30, 31.2],
  [25.2, 55.3], [19.1, 72.9], [28.6, 77.2], [13, 77.6], [1.35, 103.8], [22.3, 114.2], [31.2, 121.5], [39.9, 116.4],
  [37.6, 127], [35.7, 139.7], [-33.9, 151.2], [-26.2, 28], [6.5, 3.4], [-1.3, 36.8],
];

// 两座城市之间拱起的一道弧
const arcPoints = (a: [number, number], b: [number, number]) => {
  const va = new THREE.Vector3(...latLon(a[0], a[1], 1));
  const vb = new THREE.Vector3(...latLon(b[0], b[1], 1));
  const angle = va.angleTo(vb);
  return Array.from({ length: 48 }, (_, i) => {
    const s = i / 47;
    const v = va
      .clone()
      .multiplyScalar(Math.sin((1 - s) * angle) / Math.sin(angle))
      .add(vb.clone().multiplyScalar(Math.sin(s * angle) / Math.sin(angle)));
    return v.normalize().multiplyScalar(R * (1.005 + 0.12 * Math.sin(Math.PI * s) * (angle / Math.PI)));
  });
};

const ARCS = Array.from({ length: 80 }, (_, i) => {
  const r = (k: string) => random(`arc-${i}-${k}`);
  const a = CITIES[Math.floor(r("a") * CITIES.length)];
  let b = CITIES[Math.floor(r("b") * CITIES.length)];
  if (a === b) b = CITIES[(CITIES.indexOf(a) + 7) % CITIES.length];
  // 越往后出现得越密
  return { points: arcPoints(a, b), at: t(245.6) + Math.pow(i / 80, 0.6) * (t(262) - t(245.6)), warm: r("w") < 0.6 };
});

const Arcs: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = useMemo(
    () =>
      ARCS.map((a) => {
        const g = new THREE.BufferGeometry().setFromPoints(a.points);
        const m = new THREE.LineBasicMaterial({ color: a.warm ? "#ffc873" : "#8fd3ff", transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
        return new THREE.Line(g, m);
      }),
    [],
  );
  lines.forEach((l, i) => {
    const p = interpolate(frame, [ARCS[i].at, ARCS[i].at + 24], [0, 1], clamp);
    l.geometry.setDrawRange(0, Math.floor(p * 48));
    l.visible = p > 0;
  });
  return (
    <>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </>
  );
};

export const Network: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  const p = interpolate(frame, [0, t(272.6)], [0, 1], { easing: EASE_IN_OUT });
  const glow = interpolate(frame, [t(245.6), t(262)], [1.3, 3.4], clamp);
  // 光很亮，影子也很深：最亮的一点升起，城市的灯反而暗下去一些，画面另一边沉进阴影
  const rise = interpolate(frame, [t(262.4), t(265)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const nightGain = glow - rise * 1.4;

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      {tex && (
        <ThreeCanvas width={1920} height={1080}>
          <CameraRig position={[2 - p * 4, 4, 36 - p * 8]} target={[0, 0, 0]} fov={40} />
          <DeepSky sky={tex.sky} brightness={0.35} />
          <Earth day={tex.day} night={tex.night} clouds={tex.clouds} radius={R} spin={2.7 + frame * 0.0015} sunDir={[1, 0.2, -0.7]} nightGain={nightGain}>
            <Arcs />
          </Earth>
          {rise > 0 && <Glow color="#fff3dc" size={6 + rise * 30} intensity={0.4 + rise * 1.2} position={[7.2, 8.6 + rise * 2, 2]} />}
        </ThreeCanvas>
      )}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 70% 60% at 12% 95%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 70%)", opacity: rise }}
      />
      <Ticker entries={ENTRIES} out={t(262.2)} />
      <Mist tone="space" strength={0.5} height={260} />
      <Subtitle zh={["它的光很亮，投下的影子也很深。"]} en={["Its light is bright, and the shadow it casts is deep."]} at={t(263.8)} out={t(267.2)} tone="space" stagger={3} />
      <Subtitle
        zh={["这或许就是我们的宿命：抬头，追问，", "然后造出会回答的东西。"]}
        en={["Perhaps this is our fate: to look up, to ask,", "and then to make something that answers."]}
        at={t(267.5)}
        out={t(272.4)}
        tone="space"
      />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
