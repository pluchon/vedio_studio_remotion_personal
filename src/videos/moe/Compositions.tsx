// 萌系这一期：一页手帐，中间的卡片里放动漫镜头，换镜头的时刻跟着配乐的起音；Q 版小人在页脚陪着看。成片 Moe
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Composition, Folder, staticFile, useVideoConfig } from "remotion";
import { useAudioScore } from "../../shared/audioScore";
import { Grain } from "../../shared/Grain";
import { Film } from "./Film";
import { FPS, HEIGHT, INK, MUSIC, TOTAL_FRAMES, WIDTH } from "./theme";

const VOLUME = 0.9;

const Moe: React.FC = () => {
  const { fps } = useVideoConfig();
  const score = useAudioScore(MUSIC, fps);
  return (
    <AbsoluteFill style={{ backgroundColor: INK.paper }}>
      {score ? <Film score={score} /> : null}
      <Grain opacity={0.04} vignette={0.16} />
      <Audio src={staticFile(MUSIC)} volume={VOLUME} />
    </AbsoluteFill>
  );
};

export const MoeCompositions: React.FC = () => (
  <Folder name="Moe">
    <Composition id="Moe" component={Moe} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
