// 《宇宙漫游》重制版整片：一张 WebGL 画布画全部画面，上面叠文字，底下是配乐和音效
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { loadLocalFont } from "../../shared/fonts";
import { Screen } from "./Screen";
import { SHOTS } from "./shots/index";
import { Credits, Labels, Lines, Notes, Title } from "./Text";
import { FONT, asset } from "./theme";

loadLocalFont(FONT, staticFile(asset("fonts/NotoSerifSC-Light.otf")));

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Screen shots={SHOTS} />
    <Title />
    <Lines />
    <Notes />
    <Labels />
    <Credits />
    <Audio src={staticFile(asset("audio/bgm.wav"))} />
    <Audio src={staticFile(asset("audio/sfx.wav"))} />
  </AbsoluteFill>
);
