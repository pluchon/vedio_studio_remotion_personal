// 《宇宙的尽头》的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";

export const EdgeCompositions: React.FC = () => {
  return (
    <Folder name="Edge">
      <Composition id="Edge" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  );
};
