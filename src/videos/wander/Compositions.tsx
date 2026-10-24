// 《宇宙漫游》的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";

export const WanderCompositions: React.FC = () => (
  <Folder name="Wander">
    <Composition id="Wander" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
