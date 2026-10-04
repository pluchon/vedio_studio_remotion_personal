// 《巨引源》的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";

export const AttractorCompositions: React.FC = () => {
  return (
    <Folder name="Attractor">
      <Composition id="Attractor" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  );
};
