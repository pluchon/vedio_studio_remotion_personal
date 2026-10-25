// 《宇宙漫游》重制版的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";

export const EmberCompositions: React.FC = () => (
  <Folder name="Ember">
    <Composition id="Ember" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
