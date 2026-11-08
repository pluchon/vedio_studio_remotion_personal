// 《巨引源》整片：画面按设计时间写，经 time.tsx 逐句映射到念白；字幕逐句
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Grain } from "../../shared/Grain";
import { loadLocalFont } from "../../shared/fonts";
import { Subtitles } from "./Subtitles";
import { COLORS, FONT, FPS, LEAD, SCENES, VOICE_SECONDS, asset } from "./theme";
import { Scene, TimeRoot, ramp, useReal } from "./time";
import { Cmb } from "./scenes/Cmb";
import { Laniakea } from "./scenes/Laniakea";
import { Leaves } from "./scenes/Leaves";
import { Maybe } from "./scenes/Maybe";
import { Night } from "./scenes/Night";
import { Norma } from "./scenes/Norma";
import { Dressler, Lss, Montage, VelMap } from "./scenes/Paper";
import { PushPull } from "./scenes/PushPull";
import { Galaxy, Ground, Title } from "./scenes/Sky";
import { Inserts, SHOTS } from "./scenes/Inserts";
import { Dust, DustWide, Radio, SkyGap } from "./scenes/Zone";

loadLocalFont(FONT, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));

const MUSIC = asset("audio/bgm.wav");
const VOICE = asset("audio/voice.wav");

const Captions: React.FC = () => {
  const t = useReal();
  return <Subtitles t={t} />;
};

// 念白文件是 −20 LUFS 的单声道；Remotion 把它原样复制到左右两路，实际响度高 3 dB，乘 0.56 后约 −22 LUFS，助眠片不宜更响。
// 配乐原曲约 −19 LUFS：念白底下压到 0.17（约 −34 LUFS，比念白轻约 12 dB），片名和片尾没有念白时推到 0.34
const VOICE_VOLUME = 0.56;
const musicVolume = (frame: number) => {
  const t = frame / FPS;
  const talking = Math.min(ramp(t, LEAD - 1.5, LEAD + 0.5), 1 - ramp(t, LEAD + VOICE_SECONDS - 0.5, LEAD + VOICE_SECONDS + 3));
  return 0.34 - 0.17 * Math.max(0, talking);
};

export const Film: React.FC = () => (
  <TimeRoot>
    <AbsoluteFill style={{ background: COLORS.night }}>
      <Scene from={0} to={21} pad={2} fadeIn={false}>
        <Ground />
      </Scene>
      <Scene from={22.5} to={SCENES.sky[1]} pad={1.5}>
        <Galaxy />
      </Scene>
      <Scene from={SCENES.cmb[0]} to={SCENES.cmb[1]}>
        <Cmb />
      </Scene>
      <Scene from={SCENES.leaves[0]} to={SCENES.leaves[1]}>
        <Leaves />
      </Scene>
      <Scene from={SCENES.paper[0]} to={148} pad={0.5}>
        <Dressler />
      </Scene>
      <Scene from={148} to={155.5} pad={0.3}>
        <Montage />
      </Scene>
      <Scene from={155.5} to={170} pad={0.5}>
        <VelMap />
      </Scene>
      <Scene from={170} to={SCENES.paper[1]} pad={0.6}>
        <Lss />
      </Scene>
      <Scene from={SCENES.zone[0]} to={200} pad={1.2}>
        <DustWide />
      </Scene>
      <Scene from={200} to={215} pad={0.6}>
        <SkyGap />
      </Scene>
      <Scene from={215} to={224} pad={0.4}>
        <Dust />
      </Scene>
      <Scene from={224} to={SCENES.zone[1]} pad={0.5}>
        <Radio />
      </Scene>
      <Scene from={SCENES.norma[0]} to={SCENES.norma[1]} pad={1}>
        <Norma />
      </Scene>
      <Scene from={SCENES.laniakea[0]} to={SCENES.laniakea[1]}>
        <Laniakea />
      </Scene>
      <Scene from={SCENES.pushpull[0]} to={SCENES.pushpull[1]}>
        <PushPull />
      </Scene>
      <Scene from={SCENES.maybe[0]} to={SCENES.maybe[1]} pad={1}>
        <Maybe />
      </Scene>
      <Scene from={SCENES.night[0]} to={SCENES.night[1]} pad={1.5}>
        <Night />
      </Scene>
      <Inserts shots={SHOTS} />
      <Title />
      <Grain opacity={0.04} vignette={0.3} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 290, background: "linear-gradient(rgba(2,4,11,0), rgba(2,4,11,0.78))", pointerEvents: "none" }} />
      <Captions />
      <Sequence from={LEAD * FPS} layout="none">
        <Audio src={staticFile(VOICE)} volume={VOICE_VOLUME} />
      </Sequence>
      <Audio src={staticFile(MUSIC)} volume={musicVolume} />
    </AbsoluteFill>
  </TimeRoot>
);
