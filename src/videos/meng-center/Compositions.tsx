// 《萌部落》演示片的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { DURATION, FPS, HEIGHT, WIDTH } from "./theme";

export const MengCenterCompositions: React.FC = () => {
  return (
    <Folder name="MengCenter">
      <Composition id="MengCenter" component={Film} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  );
};
