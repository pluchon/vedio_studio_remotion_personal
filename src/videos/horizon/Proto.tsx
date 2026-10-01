// 第一幕样片（0–42.5 秒）：开头的生成片段接上 3D，一个镜头从麦田退到几千光年外。
// 到站慢、赶路快：绕到地球背后看太阳从边缘露出来，掠过月球，看行星轨道展开，掠过旅行者 1 号，最后太阳变成一颗普通的星
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadLocalFont } from "../../shared/fonts";
import { Grain } from "../../shared/Grain";
import { useTextures } from "../looking-up/three/useTextures";
import { Glare, Globe, Moon, Patch, Rig, Shell } from "./three/Bodies";
import { VoyagerPass, flybyPosition, flybyProgress } from "./three/Flyby";
import { Mark, Marks, Ring } from "./three/Guides";
import { Post } from "./three/Post";
import { SkyGlow } from "./three/Sky";
import { Stars, useStars } from "./three/Stars";
import {
  AU,
  CLIP_FRAMES,
  COLORS,
  EARTH_CENTER,
  ECLIPTIC_NORMAL,
  FPS,
  HEIGHT,
  LIGHT_YEAR,
  MOON_POS,
  PARSEC,
  START_HEIGHT,
  SUN_POS,
  T,
  WIDTH,
  asset,
  assetUrl,
  directionAt,
  equatorial,
  lightDistance,
  lookback,
  rightFor,
  shotAt,
} from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 样片阶段先借用上一期的贴图和字体，正式做时再整理
const TEXTURES = {
  day: "looking-up/textures/earth_day.jpg",
  night: asset("textures/earth_night_8k.jpg"),
  clouds: "looking-up/textures/earth_clouds.jpg",
  moon: asset("textures/moon.jpg"),
  field: asset("textures/field_last.jpg"),
};
const SONG = "Horizon Song";
loadLocalFont(SONG, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));

// 月球轨道面：贴着黄道，过月球此刻的位置
const MOON_ARM = MOON_POS.clone().sub(EARTH_CENTER);
const MOON_AXIS = MOON_ARM.clone().normalize();
const MOON_PLANE = ECLIPTIC_NORMAL.clone().addScaledVector(MOON_AXIS, -MOON_AXIS.dot(ECLIPTIC_NORMAL)).normalize();
// 行星轨道半径，天文单位
const ORBITS = [0.387, 0.723, 1, 1.524, 5.203, 9.537, 19.19, 30.07];
const star = (ra: number, dec: number, pc: number) => equatorial(ra, dec).multiplyScalar(pc * PARSEC);
// 1920 年有了第一家广播电台，它的信号此刻走出一百多光年
const RADIO = 106 * LIGHT_YEAR;
// 名字标在这层球壳的右沿（按镜头经过时的朝向）
const RADIO_EDGE = SUN_POS.clone().addScaledVector(rightFor(directionAt(T.bubble * FPS)), RADIO);

const MARKS: Mark[] = [
  { name: "地球", at: EARTH_CENTER, from: 9.5, to: 10.9, dot: true },
  { name: "太阳", note: "8.3 光分", at: SUN_POS, from: 10.9, to: 12.6 },
  { name: "太阳", at: SUN_POS, from: 14.4, to: 17.6 },
  { name: "比邻星", note: "4.2 光年", at: star(217.4, -62.7, 1.302), from: 15.9, to: 17.3 },
  { name: "天狼星", note: "8.6 光年", at: star(101.3, -16.7, 2.637), from: 16.4, to: 17.6 },
  { name: "人类最早的广播，此刻才传到这里", note: "约 100 光年", at: RADIO_EDGE, from: 18.2, to: 18.75 },
];

type Sentence = { zh: string; en: string; at: number; out: number };
const LINES: Sentence[] = [
  { zh: "抬头看见的每一点光，都是过去。", en: "Every light you see is the past.", at: T.earth, out: 14.6 },
  { zh: "光走一天的路，它飞了四十九年。", en: "What light crosses in a day took it forty-nine years.", at: 26.9, out: 30.6 },
  { zh: "看得越远，看到的越早。", en: "The farther you look, the earlier you see.", at: T.stars, out: 37.6 },
];

// 一句话：字一个个从模糊里显出来，说完整句淡掉
const Line: React.FC<{ line: Sentence }> = ({ line }) => {
  const t = useCurrentFrame() / FPS;
  if (t < line.at || t > line.out + 0.8) return null;
  const chars = [...line.zh];
  const out = interpolate(t, [line.out, line.out + 0.8], [1, 0], clamp);
  const written = line.at + chars.length * 0.07;
  const en = interpolate(t, [written + 0.2, written + 1.1], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 752, textAlign: "center", opacity: out, color: COLORS.cream }}>
      <div style={{ fontFamily: SONG, fontSize: 46, letterSpacing: "0.22em", whiteSpace: "pre" }}>
        {chars.map((c, i) => {
          const p = interpolate(t, [line.at + i * 0.07, line.at + i * 0.07 + 0.55], [0, 1], clamp);
          return (
            <span key={i} style={{ opacity: p, filter: `blur(${(1 - p) * 8}px)` }}>
              {c}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 18, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 23, letterSpacing: "0.04em", color: COLORS.soft, opacity: en }}>{line.en}</div>
    </div>
  );
};

const Figure: React.FC<{ label: string; value: string; unit: string }> = ({ label, value, unit }) => (
  <div style={{ width: 420, textAlign: "center" }}>
    <div style={{ fontFamily: SONG, fontSize: 19, letterSpacing: "0.5em", color: COLORS.soft }}>{label}</div>
    <div style={{ marginTop: 10, fontFamily: "Georgia, serif", fontSize: 52, fontVariantNumeric: "tabular-nums" }}>
      {value}
      <span style={{ fontFamily: SONG, fontSize: 26, marginLeft: 14, letterSpacing: "0.2em" }}>{unit}</span>
    </div>
  </div>
);

// 两个并排的读数：现在有多远，这束光走了多久
const Readout: React.FC<{ meters: number }> = ({ meters }) => {
  const back = lookback(meters);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", color: COLORS.cream }}>
      <Figure label="距离" {...lightDistance(meters)} />
      {back && <Figure label="你看到的是" {...back} />}
    </div>
  );
};

export const Proto: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  const stars = useStars();
  const shot = shotAt(frame);
  const { meters, level } = shot;
  const eye = shot.dir.clone().multiplyScalar(meters);
  const edge = interpolate(Math.log10(meters / START_HEIGHT), [0, 0.3], [3.2, 0.48], clamp);
  // 太阳的眩光只在太阳系里有；再远它就是星表里的一颗星
  const sunGlow = interpolate(level, [12.4, 13.3], [1, 0], clamp);
  // 离开太阳系以后慢慢加大曝光，像相机在暗处把光圈开大
  const exposure = interpolate(level, [14.5, 18.5], [1, 4], clamp);
  // 一帧之内画面缩了多少（快门开半帧）
  const zoomBlur = 10 ** (Math.abs(shot.speed) / FPS / 2) - 1;

  const fly = flybyProgress(frame);
  const marks: Mark[] = [
    ...MARKS,
    {
      name: "旅行者 1 号",
      note: "1977 年出发",
      at: flybyPosition(frame, shot).multiplyScalar(meters),
      show: interpolate(fly, [0.2, 0.3, 0.52, 0.62], [0, 1, 1, 0], clamp),
    },
    { name: "月球", note: "1.3 光秒", at: MOON_POS, show: interpolate(frame / FPS, [18.8, 19.3, 20.6, 21.3], [0, 1, 1, 0], clamp), dot: frame / FPS > 19.6 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {tex && stars && (
        <ThreeCanvas width={WIDTH} height={HEIGHT}>
          <Rig shot={shot} />
          <SkyGlow strength={0.08 * interpolate(level, [5, 7], [0, 1], clamp) * interpolate(level, [17.6, 19.2], [1, 0], clamp)} />
          <Stars data={stars} eye={eye} metersPerUnit={meters} gain={exposure} />
          <group scale={1 / meters}>
            <Ring center={EARTH_CENTER} radius={MOON_ARM.length()} normal={MOON_PLANE} meters={meters} />
            {ORBITS.map((au) => (
              <Ring key={au} center={SUN_POS} radius={au * AU} normal={ECLIPTIC_NORMAL} meters={meters} strength={au === 1 ? 0.7 : 0.4} />
            ))}
            <Globe
              day={tex.day}
              night={tex.night}
              clouds={tex.clouds}
              lights={interpolate(level, [2.2, 4, 6, 7.2], [0, 0.5, 0.5, 1.5], clamp)}
              moon={interpolate(level, [2.2, 3.6, 6.5], [0, 0.3, 1], clamp)}
              veil={interpolate(level, [3.0, 3.6, 5.6, 6.4], [0, 1, 1, 0], clamp)}
              soften={interpolate(level, [5.8, 7], [1, 0], clamp)}
            />
            <Patch map={tex.field} edge={edge} />
            <Moon map={tex.moon} position={MOON_POS} />
            {sunGlow > 0 && <Glare position={SUN_POS} size={4e10} intensity={sunGlow} />}
            <Shell center={SUN_POS} radius={RADIO} strength={0.32 * interpolate(level, [18.1, 18.3, 18.7, 19.0], [0, 1, 1, 0], clamp)} />
          </group>
          <VoyagerPass frame={frame} shot={shot} />
          <Post zoomBlur={zoomBlur} />
        </ThreeCanvas>
      )}
      {frame < CLIP_FRAMES && <OffthreadVideo src={assetUrl("video/field.mp4")} playbackRate={1.25} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />}
      {frame >= CLIP_FRAMES && (
        <AbsoluteFill style={{ opacity: interpolate(frame, [CLIP_FRAMES, CLIP_FRAMES + 24], [0, 1], clamp) }}>
          <Marks marks={marks} shot={shot} font={SONG} />
          <Readout meters={meters} />
        </AbsoluteFill>
      )}
      {LINES.map((line) => (
        <Line key={line.at} line={line} />
      ))}
      <Grain opacity={0.05} vignette={0.35} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: interpolate(frame / FPS, [T.end - 1.2, T.end], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
