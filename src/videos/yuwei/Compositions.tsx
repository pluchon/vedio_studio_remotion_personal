// 《雨未愁眠》的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";

export const YuweiCompositions: React.FC = () => (
  <Folder name="Yuwei">
    <Composition id="Yuwei" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
