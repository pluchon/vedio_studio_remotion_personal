// 《光到不了的地方》成片：片名之后，一个镜头从麦田一直退到可观测宇宙之外，到站慢、赶路快；
// 然后镜头停住、时间快进，天空黑下来；最后回到此刻，留一个问号
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { loadLocalFont } from "../../shared/fonts";
import { Grain } from "../../shared/Grain";
import { useTextures } from "../looking-up/three/useTextures";
import { Coda } from "./Coda";
import { Line, Readout, Sentence, Title, during } from "./Overlay";
import { EVENT_HORIZON, E_FOLD_YEARS, HUBBLE_RADIUS, PARTICLE_HORIZON, lookbackYears } from "./cosmology";
import { Backdrop, Glare, Globe, Moon, Patch, Rig, Shell } from "./three/Bodies";
import { Cloud, useBinary } from "./three/Cloud";
import { VoyagerPass, flybyPosition, flybyProgress } from "./three/Flyby";
import { Mark, Marks, Ring } from "./three/Guides";
import { Island } from "./three/Island";
import { Post } from "./three/Post";
import { SkyGlow } from "./three/Sky";
import { Stars, useStars } from "./three/Stars";
import {
  AU,
  CLIP_END_FRAME,
  CLIP_FRAMES,
  CLIP_START,
  COLORS,
  DIR_NGP,
  EARTH_CENTER,
  ECLIPTIC_NORMAL,
  FONT,
  FPS,
  GLY,
  GALACTIC_CENTER,
  GALAXY_CENTER_POS,
  GAL_Y,
  HEIGHT,
  LIGHT_YEAR,
  M31_POS,
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
  lookbackFigure,
  rightFor,
  shotAt,
  speedFigure,
} from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 地球的日面、云和字体先借用上一期的
const TEXTURES = {
  day: "looking-up/textures/earth_day.jpg",
  night: asset("textures/earth_night_8k.jpg"),
  clouds: "looking-up/textures/earth_clouds.jpg",
  moon: asset("textures/moon.jpg"),
  field: asset("textures/field_last.jpg"),
  cmb: asset("textures/cmb.jpg"),
};
loadLocalFont(FONT, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));

// 月球轨道面：贴着黄道，过月球此刻的位置
const MOON_ARM = MOON_POS.clone().sub(EARTH_CENTER);
const MOON_AXIS = MOON_ARM.clone().normalize();
const MOON_PLANE = ECLIPTIC_NORMAL.clone().addScaledVector(MOON_AXIS, -MOON_AXIS.dot(ECLIPTIC_NORMAL)).normalize();
// 行星轨道半径，天文单位
const ORBITS = [0.387, 0.723, 1, 1.524, 5.203, 9.537, 19.19, 30.07];
const star = (ra: number, dec: number, pc: number) => equatorial(ra, dec).multiplyScalar(pc * PARSEC);
// 1920 年有了第一家广播电台，它的信号此刻走出一百多光年。名字标在这层球壳的右沿（按镜头经过时的朝向）
const RADIO = 106 * LIGHT_YEAR;
const RADIO_EDGE = SUN_POS.clone().addScaledVector(rightFor(directionAt(T.bubble * FPS)), RADIO);
const ORIGIN = new THREE.Vector3();
// 室女座星系团：离我们最近的大星系团
const VIRGO = star(187.7, 12.4, 16.5e6);
// 斯隆长城的中段
const GREAT_WALL = star(197, 4, 330e6);

// 按镜头的远近出现的标注
const MARKS: Mark[] = [
  { name: "地球", at: EARTH_CENTER, from: 9.5, to: 10.9, dot: true },
  { name: "太阳", note: "8.3 光分", at: SUN_POS, from: 10.9, to: 12.6 },
  { name: "太阳", at: SUN_POS, from: 14.4, to: 17.6 },
  { name: "比邻星", note: "4.2 光年", at: star(217.4, -62.7, 1.302), from: 15.9, to: 17.3 },
  { name: "天狼星", note: "8.6 光年", at: star(101.3, -16.7, 2.637), from: 16.4, to: 17.6 },
  { name: "人类最早的广播，此刻才传到这里", note: "约 100 光年", at: RADIO_EDGE, from: 18.2, to: 18.75 },
];

const LINES: Sentence[] = [
  { zh: ["抬头看见的每一点光，都是过去。"], en: "Every light you see is the past.", at: T.earth, out: 16.2 },
  { zh: ["光走一天的路，它飞了四十九年。"], en: "What light crosses in a day took it forty-nine years.", at: 26.9, out: 30.6 },
  { zh: ["看得越远，看到的越早。"], en: "The farther you look, the earlier you see.", at: T.stars, out: 37.6 },
  { zh: ["空间自己在变大。越远的地方，离开得越快。"], en: "Space itself is growing. The farther away, the faster it recedes.", note: "v = H₀ · d", at: 60.0, out: 65.2 },
  { zh: ["光走了多久，和它如今有多远，不再是同一个数。"], en: "How long the light has travelled, and how far away its source is now, are no longer the same number.", at: 68.4, out: 73.6 },
  { zh: ["这束光出发的时候，还没有地球。"], en: "When this light set out, there was no Earth.", at: T.earthBorn, out: 80.6 },
  {
    zh: ["这条线以外，星系退行得比光还快。", "我们仍然看得见它们：那是很久以前出发的光。"],
    en: "Beyond this line, galaxies recede faster than light. We still see them, by light that left long ago.",
    at: 85.2,
    out: 95.6,
  },
  { zh: ["此刻从这条线外面出发的光，永远到不了。"], en: "Light that leaves from beyond this line now will never arrive.", at: 98.4, out: 108.4 },
  { zh: ["一千亿年后，望远镜里不会再有别的星系。"], en: "A hundred billion years from now, no telescope will find another galaxy.", at: 115.6, out: 119.9 },
  { zh: ["我们恰好活在还看得见的时候。"], en: "We happen to live while it can still be seen.", at: 120.6, out: 123.4 },
  { zh: ["这么远的路，等得起的，也许不是我们。"], en: "On a road this long, the ones who can afford to wait may not be us.", at: 124.6, out: 128.0 },
];

// cosmos.bin 里星系的个数（tools/horizon/build_data.py 的输出）
const SDSS_GALAXIES = 373145;

// 空间膨胀的示意：到站的时候所有星系按同一个比例缓缓往外漂，赶路时悄悄收回来
const FLOW: [number[], number[]] = [
  [T.web, T.webOut, T.deep, T.deepOut, T.far, T.edge - 0.1],
  [1, 1.085, 1, 1.06, 1.14, 1],
];

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const tex = useTextures(TEXTURES);
  const stars = useStars();
  const local = useBinary("data/local.bin");
  const cosmos = useBinary("data/cosmos.bin");
  // 文件里前一段是星系，后一段是类星体
  const [galaxies, quasars] = useMemo(() => (cosmos ? [cosmos.subarray(0, SDSS_GALAXIES * 4), cosmos.subarray(SDSS_GALAXIES * 4)] : [null, null]), [cosmos]);
  // 微波背景按方向取样，经度在球的背面有一道接缝：不用多级贴图，接缝才不会显出来
  useMemo(() => {
    if (!tex) return;
    tex.cmb.generateMipmaps = false;
    tex.cmb.minFilter = THREE.LinearFilter;
    tex.cmb.needsUpdate = true;
  }, [tex]);

  const shot = shotAt(frame);
  const { meters, level } = shot;
  const eye = shot.dir.clone().multiplyScalar(meters);
  const edge = interpolate(Math.log10(meters / START_HEIGHT), [0, 0.3], [3.2, 0.48], clamp);
  // 太阳的眩光只在太阳系里有；再远它就是星表里的一颗星
  const sunGlow = interpolate(level, [12.4, 13.3], [1, 0], clamp);
  // 离开太阳系以后慢慢加大曝光，像相机在暗处把光圈开大；出了银河系，这十万颗星缩成一个点
  const starGain = interpolate(level, [14.5, 18.5], [1, 4], clamp) * interpolate(level, [20.0, 20.9], [1, 0], clamp);
  // 一帧之内画面缩了多少（快门开半帧）
  const zoomBlur = 10 ** (Math.abs(shot.speed) / FPS / 2) - 1;

  // 时间快进：红移被放大的倍数，对应过了多少年
  const forward = interpolate(t, [T.forward, T.dark], [0, 1], clamp);
  const shift = Math.exp(8.8 * forward ** 2);
  const elapsed = E_FOLD_YEARS * Math.log(shift);
  const flow = interpolate(t, FLOW[0], FLOW[1], clamp);

  const islandGain = 0.02 * interpolate(level, [19.0, 19.9], [0, 1], clamp) * interpolate(level, [21.2, 22.6], [1, 2.6], clamp) * interpolate(level, [23.3, 24.2], [1, 0], clamp);
  // 退得越远，同一块画面里挤进来的星系越多，每个点就要相应调暗，否则中间糊成一团白
  const crowd = (limit: number, power: number) => Math.min(1, (limit / meters) ** power);
  const localGain = 0.6 * interpolate(level, [22.3, 23.3], [0, 1], clamp) * crowd(1.6 * GLY, 1.6);
  const galaxyGain = 0.34 * interpolate(level, [25.05, 25.4], [0, 1], clamp) * crowd(6 * GLY, 1.5);
  const quasarGain = 0.5 * interpolate(level, [25.3, 25.9], [0, 1], clamp) * crowd(60 * GLY, 1);
  const cmb = 0.13 * interpolate(level, [25.9, 26.6], [0, 1], clamp);
  const lit = t < T.dark + 1.2;

  const fly = flybyProgress(frame);
  const right = shot.right;
  const marks: Mark[] = [
    ...MARKS,
    { name: "旅行者 1 号", note: "1977 年出发", at: flybyPosition(frame, shot).multiplyScalar(meters), show: interpolate(fly, [0.2, 0.3, 0.52, 0.62], [0, 1, 1, 0], clamp) },
    { name: "月球", note: "1.3 光秒", at: MOON_POS, show: during(t, 18.8, 21.3, 0.6), dot: t > 19.6 },
    { name: "太阳", note: "我们在这里", at: ORIGIN, show: during(t, 45.4, T.galaxyOut + 0.3), dot: true },
    { name: "银河系中心", note: "2.6 万光年 · 那时人类还在岩壁上画画", at: GALAXY_CENTER_POS, show: during(t, 46.4, T.galaxyOut + 0.3) },
    { name: "银河系", at: ORIGIN, show: during(t, T.group + 0.4, T.groupOut - 0.2), dot: true },
    { name: "仙女座星系", note: "250 万光年 · 这束光出发时，人属刚学会打制石器", at: M31_POS, show: during(t, 52.25, T.groupOut - 0.2) },
    { name: "银河系", at: ORIGIN, show: during(t, T.web + 0.3, T.webOut), dot: true },
    { name: "室女座星系团", note: "5400 万光年 · 这束光出发时，恐龙刚消失不久", at: VIRGO, show: during(t, T.web + 0.8, T.webOut), dot: true },
    { name: "斯隆长城", note: "约 10 亿光年", at: GREAT_WALL, show: during(t, T.deep + 0.3, T.deepOut), dot: true },
    { name: "哈勃球", note: "145 亿光年", at: right.clone().multiplyScalar(HUBBLE_RADIUS * 0.72).addScaledVector(shot.up, HUBBLE_RADIUS * 0.69), show: during(t, T.edge + 0.6, T.forward - 0.4) },
    { name: "事件视界", note: "167 亿光年", at: right.clone().multiplyScalar(EVENT_HORIZON * 0.72).addScaledVector(shot.up, -EVENT_HORIZON * 0.69), show: during(t, T.horizon + 0.6, T.forward + 1.5) },
    { name: "最早的光", note: "138 亿年前 · 如今在 461 亿光年外", at: shot.up.clone().multiplyScalar(PARTICLE_HORIZON * 0.9).addScaledVector(right, PARTICLE_HORIZON * 0.44), show: during(t, T.whole, T.forward) },
  ];

  // 底部的读数
  const back = lookbackFigure(meters, lookbackYears(meters));
  const speed = speedFigure(shot.velocity);
  const figures =
    t < T.forward
      ? [
          { label: level > 24.4 ? "如今的距离" : "距离", figure: lightDistance(meters) },
          ...(back ? [{ label: "你看到的是", figure: back }] : []),
          { label: "镜头的速度", figure: speed, hot: speed.faster },
        ]
      : [{ label: "时间", figure: { value: `+ ${(elapsed / 1e8).toFixed(0)}`, unit: "亿年" } }];
  const readout = interpolate(frame, [CLIP_END_FRAME, CLIP_END_FRAME + 24], [0, 1], clamp) * interpolate(t, [T.dark - 0.4, T.dark + 0.8], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {tex && stars && local && galaxies && quasars && lit && (
        <ThreeCanvas width={WIDTH} height={HEIGHT}>
          <Rig shot={shot} />
          <Backdrop map={tex.cmb} radius={PARTICLE_HORIZON / meters} strength={cmb} shift={shift} pole={DIR_NGP} center={GALACTIC_CENTER} side={GAL_Y} />
          <SkyGlow strength={0.08 * interpolate(level, [5, 7], [0, 1], clamp) * interpolate(level, [17.6, 19.2], [1, 0], clamp)} />
          {starGain > 0 && <Stars data={stars} eye={eye} metersPerUnit={meters} gain={starGain} />}
          <Island eye={eye} metersPerUnit={meters} gain={islandGain} />
          <Cloud data={local} eye={eye} metersPerUnit={meters} gain={localGain} flow={flow} shift={shift} minSize={1.9} />
          <Cloud data={galaxies} eye={eye} metersPerUnit={meters} gain={galaxyGain} flow={flow} shift={shift} minSize={1.4} />
          <Cloud data={quasars} eye={eye} metersPerUnit={meters} gain={quasarGain} flow={flow} shift={shift} minSize={1.5} />
          <group scale={1 / meters}>
            {level < 15 && (
              <>
                <Ring center={EARTH_CENTER} radius={MOON_ARM.length()} normal={MOON_PLANE} meters={meters} />
                {ORBITS.map((au) => (
                  <Ring key={au} center={SUN_POS} radius={au * AU} normal={ECLIPTIC_NORMAL} meters={meters} strength={au === 1 ? 0.7 : 0.4} />
                ))}
              </>
            )}
            {level < 11.5 && (
              <>
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
              </>
            )}
            {sunGlow > 0 && <Glare position={SUN_POS} size={4e10} intensity={sunGlow} />}
            <Shell center={SUN_POS} radius={RADIO} strength={0.32 * interpolate(level, [18.1, 18.3, 18.7, 19.0], [0, 1, 1, 0], clamp)} />
            <Shell center={ORIGIN} radius={HUBBLE_RADIUS} strength={0.55 * during(t, T.edge, T.forward + 0.8, 1.2)} color="#b9cdfa" />
            <Shell center={ORIGIN} radius={EVENT_HORIZON / shift} strength={0.75 * interpolate(t, [T.horizon, T.horizon + 1.2], [0, 1], clamp) * interpolate(forward, [0.55, 0.8], [1, 0], clamp)} color="#ff6a45" />
          </group>
          <VoyagerPass frame={frame} shot={shot} />
          <Post zoomBlur={zoomBlur} />
        </ThreeCanvas>
      )}
      {/* 所有的光都灭了以后，画面正中还剩一个点：我们自己这个星系群 */}
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 2,
          top: HEIGHT / 2 - 2,
          width: 4,
          height: 4,
          borderRadius: 2,
          background: "#ffe9c8",
          boxShadow: "0 0 14px 4px rgba(255, 225, 180, 0.55)",
          opacity: during(t, T.dark - 4, T.now + 0.2, 2.2),
        }}
      />
      {t > T.now - 1.6 && <Coda />}
      <Sequence from={CLIP_START} durationInFrames={CLIP_FRAMES} layout="none">
        <OffthreadVideo src={assetUrl("video/field_cut.mp4")} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: interpolate(frame, [CLIP_START, CLIP_START + 30], [0, 1], clamp) }} />
      </Sequence>
      {frame >= CLIP_END_FRAME && t < T.dark + 1 && (
        <AbsoluteFill style={{ opacity: readout }}>
          <Marks marks={marks} shot={shot} font={FONT} />
          <Readout figures={figures} />
        </AbsoluteFill>
      )}
      {LINES.map((line) => (
        <Line key={line.at} line={line} />
      ))}
      {/* 最后一个画面：一个问号 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 190,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 96,
          color: COLORS.rule,
          opacity: during(t, T.question, T.end - 0.3, 0.9),
        }}
      >
        ？
      </div>
      <Grain opacity={0.05} vignette={0.35} />
      <Title />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: interpolate(t, [T.end - 0.8, T.end - 0.1], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
