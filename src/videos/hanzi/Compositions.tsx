// 《汉字的演变》的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";

export const HanziCompositions: React.FC = () => {
  return (
    <Folder name="Hanzi">
      <Composition id="Hanzi" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  );
};
