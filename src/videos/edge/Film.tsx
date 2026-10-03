// 《宇宙的尽头》整片：一张老地图不断被重画，从海边画到宇宙的边缘；底下是纸，中间是各幕，最上面是字幕
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Grain } from "../../shared/Grain";
import { loadLocalFont } from "../../shared/fonts";
import { RoughDefs } from "./ink";
import { Margin, Neatline, Paper } from "./Paper";
import { Subtitles } from "./Subtitles";
import { Bang } from "./scenes/Bang";
import { Coda } from "./scenes/Coda";
import { Edge } from "./scenes/Edge";
import { Fossil } from "./scenes/Fossil";
import { Fur } from "./scenes/Fur";
import { Globe } from "./scenes/Globe";
import { Hubble } from "./scenes/Hubble";
import { Rings } from "./scenes/Rings";
import { Sea } from "./scenes/Sea";
import { COLORS, FONT, FONT_BLACK, FPS, LEAD, MUSIC, SCENES, TAIL, VOICE, VOICE_SECONDS } from "./theme";
import type { SceneId } from "./theme";
import { Scene, TimeRoot, ramp, useT } from "./time";

loadLocalFont(FONT, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));
loadLocalFont(FONT_BLACK, staticFile("looking-up/fonts/NotoSerifSC-Black.otf"));

const BODY: Partial<Record<SceneId, React.FC>> = {
  sea: Sea,
  globe: Globe,
  rings: Rings,
  fur: Fur,
  hubble: Hubble,
  fossil: Fossil,
  edge: Edge,
  bang: Bang,
  coda: Coda,
};

// 片名：念白开始前的两秒
const Title: React.FC = () => {
  const t = useT();
  const inn = ramp(t, -LEAD + 0.2, -LEAD + 1.2);
  const out = 1 - ramp(t, -0.5, 0.6);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: inn * out }}>
      <div style={{ fontFamily: FONT_BLACK, fontSize: 132, letterSpacing: 36, paddingLeft: 36, color: COLORS.ink }}>宇宙的尽头</div>
      <div style={{ marginTop: 28, fontFamily: FONT, fontSize: 30, letterSpacing: 14, paddingLeft: 14, color: COLORS.inkSoft }}>
        TERMINVS · VNIVERSI
      </div>
    </AbsoluteFill>
  );
};

// 片尾：念白结束以后，船走远了，留下片名
const EndTitle: React.FC = () => {
  const t = useT();
  const inn = ramp(t, VOICE_SECONDS + 0.6, VOICE_SECONDS + 2.0);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: inn }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10, 14, 28, 0.55)" }} />
      <div style={{ position: "relative", fontFamily: FONT_BLACK, fontSize: 132, letterSpacing: 36, paddingLeft: 36, color: COLORS.star }}>宇宙的尽头</div>
      <div style={{ position: "relative", marginTop: 28, fontFamily: FONT, fontSize: 30, letterSpacing: 14, paddingLeft: 14, color: "rgba(243, 233, 201, 0.7)" }}>
        TERMINVS · VNIVERSI
      </div>
    </AbsoluteFill>
  );
};

const Pictures: React.FC = () => {
  const t = useT();
  // 走远以后，图框也淡去
  const frameFade = 1 - ramp(t, 196.6, 199.0);
  return (
    <AbsoluteFill>
      <Paper />
      <RoughDefs />
      {SCENES.map(({ id, from, to }, i) => {
        const Body = BODY[id];
        if (!Body) return null;
        return (
          <Scene key={id} from={from} to={i === SCENES.length - 1 ? VOICE_SECONDS + TAIL - 0.9 : to} fadeIn={i > 0} fadeOut={i < SCENES.length - 1}>
            <Body />
          </Scene>
        );
      })}
      <Margin opacity={frameFade} />
      <Neatline from={-0.4} opacity={frameFade} />
      <Title />
      <EndTitle />
      <Subtitles ms={t * 1000} />
      <Grain opacity={0.07} vignette={0.22} />
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => (
  <AbsoluteFill>
    <TimeRoot>
      <Pictures />
    </TimeRoot>
    <Sequence from={LEAD * FPS} layout="none">
      <Audio src={staticFile(VOICE)} volume={0.93} />
    </Sequence>
    <Audio src={staticFile(MUSIC)} volume={0.85} />
  </AbsoluteFill>
);
