// 《星云》的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { Style } from "./Style";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";

export const NebulaCompositions: React.FC = () => {
  return (
    <Folder name="Nebula">
      <Composition id="Nebula" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="Nebula-Style" component={Style} durationInFrames={4} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  );
};
