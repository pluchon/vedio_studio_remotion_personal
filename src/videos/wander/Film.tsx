// 《宇宙漫游》整片：时间轴跟着配乐走，每 4–6 秒一个镜头；后一个镜头叠在前一个上淡入，前一个等它盖住再撤
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { loadLocalFont } from "../../shared/fonts";
import { Credits, Labels, Lines, Notes, Title } from "./Text";
import { COLORS, FONT, asset } from "./theme";
import { Scene } from "./time";
import { Crowd, Dive, Gather, Photo, Stillness, TitleShot, Vista, Voyage } from "./art/Prologue";
import { Heavens, Molecules, Nightfall, Shore, World } from "./art/Dawn";
import { Carve, Circle5, Generations, Remember, Spark, Talk } from "./art/Hearth";
import { Blueprint, Cities, Launch, NightSide, Observatory, Proud, Recede } from "./art/Rise";
import { Ark, Chart, Letter, Silence, Small, Statue } from "./art/Ages";
import { Count, DesertHome, Fleet, IceHome, LockedHome, OceanHome, Realm, Swarm, Veins } from "./art/Expanse";
import { Awaken, Braid, Ladder, LightSea, Mandala, Merge, OneThought, Path9, Unneeded } from "./art/Ascend";
import { Afar, Blink, LastLight, LightsOut, MapDark, PhotoEnd, Return, StillCity, StillTravelling } from "./art/Coda";

loadLocalFont(FONT, staticFile(asset("fonts/NotoSerifSC-Light.otf")));

// [组件, 开始, 结束, 淡入秒数, 淡出秒数（不写就是 0）]
type Cut = [React.FC, number, number, number, number?];
const CUTS: Cut[] = [
  // 序 · 星海
  [Photo, 0, 3.4, 1.2],
  [TitleShot, 2.2, 8.8, 1.0],
  [Vista, 8.4, 13.2, 0.4],
  [Gather, 12.8, 17.8, 0.4],
  [Crowd, 17.4, 22.4, 0.3],
  [Voyage, 22.0, 27.2, 0.4],
  [Stillness, 26.8, 31.2, 0.4],
  // 一 · 微光
  [Dive, 31.0, 36.6, 0.2],
  [World, 36.2, 41.8, 0.4],
  [Molecules, 41.6, 47.0, 0.25],
  [Shore, 46.6, 51.4, 0.4],
  [Nightfall, 51.0, 55.6, 0.4],
  [Heavens, 55.2, 61.4, 0.4],
  // 二 · 火
  [Spark, 60.4, 65.8, 1.0],
  [Circle5, 65.2, 70.8, 0.4],
  [Talk, 70.6, 75.2, 0.4],
  [Carve, 75.0, 79.8, 0.4],
  [Generations, 79.4, 84.6, 0.4],
  [Remember, 84.0, 91.2, 0.4],
  // 三 · 宏伟
  [Cities, 89.0, 95.8, 2.0],
  [NightSide, 95.4, 98.8, 0.4],
  [Blueprint, 98.4, 103.6, 0.4],
  [Launch, 103.2, 109.4, 0.4],
  [Proud, 109.0, 114.6, 0.4],
  [Observatory, 114.0, 120.6, 0.4],
  [Recede, 120.2, 126.4, 0.5],
  // 四 · 时间的尘埃
  [Silence, 125.0, 130.8, 0.8],
  [Ark, 130.4, 136.0, 0.4],
  [Letter, 135.6, 141.4, 0.4],
  [Statue, 141.0, 146.4, 0.4],
  [Chart, 145.8, 150.8, 0.4],
  [Small, 150.4, 155.6, 0.4],
  // 五 · 疆域：2:35 整个频段回来
  [Fleet, 154.6, 159.6, 0.45],
  [Count, 159.2, 163.8, 0.4],
  [DesertHome, 163.4, 165.0, 0.3],
  [IceHome, 164.8, 166.5, 0.3],
  [OceanHome, 166.3, 168.0, 0.3],
  [LockedHome, 167.8, 169.4, 0.3],
  [Swarm, 169.0, 175.4, 0.4],
  [Realm, 175.0, 181.6, 0.4],
  [Veins, 181.2, 186.6, 0.4],
  // 六 · 跃迁（以下是一种想象）
  [Awaken, 185.4, 192.8, 1.2],
  [LightSea, 192.4, 198.6, 0.5],
  [OneThought, 198.2, 203.6, 0.4],
  [Ladder, 203.2, 207.8, 0.4],
  [Braid, 207.4, 212.6, 0.4],
  [Merge, 212.2, 216.6, 0.4],
  [Unneeded, 216.0, 220.8, 0.4],
  [Mandala, 220.2, 226.0, 0.6],
  [Path9, 225.4, 232.6, 0.6],
  // 七 · 熄灭：4:07.6 配乐静下来时，最后一扇窗熄灭
  [StillCity, 232.0, 236.8, 0.8],
  [LightsOut, 236.4, 240.8, 0.4],
  [MapDark, 240.4, 245.2, 0.4],
  [LastLight, 244.8, 251.6, 0.5],
  // 尾 · 星海：4:11 引子重来
  [Return, 251.0, 257.2, 0.8],
  [StillTravelling, 256.8, 262.4, 0.5],
  [Blink, 262.0, 268.0, 0.5],
  [Afar, 267.6, 273.6, 0.6],
  [PhotoEnd, 272.8, 284.0, 1.4, 1.6],
];

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.night }}>
    {CUTS.map(([Shot, from, to, fadeIn, fadeOut = 0], i) => (
      <Scene key={i} from={from} to={to} fadeIn={fadeIn} fadeOut={fadeOut}>
        <Shot />
      </Scene>
    ))}
    <Title />
    <Lines />
    <Notes />
    <Labels />
    <Credits />
    <Audio src={staticFile(asset("audio/bgm.wav"))} />
  </AbsoluteFill>
);
