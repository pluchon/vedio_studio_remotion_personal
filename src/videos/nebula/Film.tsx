// 《星云》整片：一个连续的夜空，用体积渲染把「云」一路画到「星云」；底下是画面，最上面是字幕和一点颗粒
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Grain } from "../../shared/Grain";
import { loadLocalFont } from "../../shared/fonts";
import { Subtitles } from "./Subtitles";
import { COLORS, FONT, FONT_LIGHT, FPS, LEAD, SCENES, asset } from "./theme";
import { Scene, TimeRoot, ramp, useT } from "./time";
import { Clouds, Cosmos } from "./scenes/Sky";
import { Gallery, Morph } from "./scenes/Gallery";
import { Catalog, Messier } from "./scenes/Messier";
import { Debate, Shell } from "./scenes/Debate";
import { Spectra } from "./scenes/Spectra";
import { Aurora, Classes, Hubble } from "./scenes/Light";
import { Flowers } from "./scenes/Flowers";

loadLocalFont(FONT, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));
loadLocalFont(FONT_LIGHT, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));

const VOICE = asset("audio/voice.wav");
const MUSIC = asset("audio/bgm.wav");

// 片名：开头两秒，压在第一幕的云上
const Title: React.FC = () => {
  const t = useT();
  const p = ramp(t, -1.7, -0.6) * (1 - ramp(t, 0.5, 1.9));
  if (p <= 0.003) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: p }}>
      <div style={{ fontFamily: FONT, fontSize: 150, letterSpacing: 60, paddingLeft: 60, color: "#3d3858", textShadow: "0 0 36px rgba(255,248,240,0.7)" }}>星云</div>
    </AbsoluteFill>
  );
};

// 结尾：画面慢慢黑下去，只剩一点光
const Ending: React.FC = () => {
  const t = useT();
  const total = SCENES.flowers[1];
  const p = ramp(t, total - 4.4, total - 0.6);
  return <AbsoluteFill style={{ background: COLORS.night, opacity: p }} />;
};

// 最后留下的一点光
const FinalStar: React.FC = () => {
  const t = useT();
  const total = SCENES.flowers[1];
  const p = ramp(t, total - 4.2, total - 2.6) * (1 - ramp(t, total - 0.9, total + 0.2));
  if (p <= 0.003) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: p }}>
      <div style={{ width: 360, height: 360, borderRadius: 180, background: "radial-gradient(circle, rgba(255,240,215,0.95) 0%, rgba(255,214,170,0.35) 8%, rgba(255,214,170,0) 60%)" }} />
    </AbsoluteFill>
  );
};

const Captions: React.FC = () => {
  const t = useT();
  return <Subtitles t={t} />;
};

export const Film: React.FC = () => (
  <TimeRoot>
    <AbsoluteFill style={{ background: COLORS.night }}>
      <Scene from={SCENES.clouds[0]} to={SCENES.clouds[1]} pad={2} fadeIn={false}>
        <Clouds />
      </Scene>
      <Scene from={SCENES.cosmos[0]} to={SCENES.cosmos[1]}>
        <Cosmos />
      </Scene>
      <Scene from={SCENES.morph[0]} to={SCENES.morph[1]}>
        <Morph />
      </Scene>
      <Scene from={SCENES.gallery[0]} to={SCENES.gallery[1]}>
        <Gallery />
      </Scene>
      <Scene from={SCENES.messier[0]} to={SCENES.messier[1]}>
        <Messier />
      </Scene>
      <Scene from={SCENES.catalog[0]} to={SCENES.catalog[1]}>
        <Catalog />
      </Scene>
      <Scene from={SCENES.debate[0]} to={SCENES.debate[1]}>
        <Debate />
      </Scene>
      <Scene from={SCENES.shell[0]} to={SCENES.shell[1]}>
        <Shell />
      </Scene>
      <Scene from={SCENES.spectra[0]} to={SCENES.spectra[1]}>
        <Spectra />
      </Scene>
      <Scene from={SCENES.hubble[0]} to={SCENES.hubble[1]}>
        <Hubble />
      </Scene>
      <Scene from={SCENES.classes[0]} to={SCENES.classes[1]}>
        <Classes />
      </Scene>
      <Scene from={SCENES.aurora[0]} to={SCENES.aurora[1]}>
        <Aurora />
      </Scene>
      <Scene from={SCENES.flowers[0]} to={SCENES.flowers[1]}>
        <Flowers />
      </Scene>
      <Title />
      <Ending />
      <FinalStar />
      <Grain opacity={0.05} vignette={0.3} />
      <Captions />
      <Sequence from={LEAD * FPS} layout="none">
        <Audio src={staticFile(VOICE)} volume={0.85} />
      </Sequence>
      <Audio src={staticFile(MUSIC)} volume={0.95} />
    </AbsoluteFill>
  </TimeRoot>
);
