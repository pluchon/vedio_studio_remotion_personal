// 《一场雨》：一个镜头跟着一滴雨，从窗玻璃滑到窗台，落过屋檐，掉进水洼；雨点和涟漪跟着钢琴曲《溯》的每个音。最后一帧接回第一帧，可以循环播放
import React, { useMemo } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Composition, Folder, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain } from "../../shared/Grain";
import { RainDefs } from "./parts/Bead";
import { cameraAt, makePlan } from "./plan";
import { Glass } from "./scenes/Glass";
import { Yard } from "./scenes/Yard";
import { useScore } from "./score";
import { DUSK, FPS, HEIGHT, LIP_Y, MUSIC, TOTAL_FRAMES, WIDTH } from "./theme";

const VOLUME = 0.9;

const Rain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const score = useScore(MUSIC, fps);
  const plan = useMemo(() => (score ? makePlan(score, fps) : null), [score, fps]);
  return (
    <AbsoluteFill style={{ backgroundColor: DUSK.top }}>
      <RainDefs />
      {score && plan ? (
        <>
          <Yard score={score} plan={plan} />
          {cameraAt(plan, frame / fps) < LIP_Y + 80 ? <Glass score={score} plan={plan} /> : null}
        </>
      ) : null}
      <Grain opacity={0.06} vignette={0.5} />
      <Audio src={staticFile(MUSIC)} volume={VOLUME} />
    </AbsoluteFill>
  );
};

export const RainCompositions: React.FC = () => (
  <Folder name="Rain">
    <Composition id="Rain" component={Rain} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
