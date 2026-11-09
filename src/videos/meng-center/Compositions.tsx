// 《萌部落》演示片的组合登记
import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { Journal } from "./journal/Journal";
import { DURATION as JOURNAL_DURATION } from "./journal/timeline";
import { DEMO, NaitangDemo } from "./NaitangDemo";
import { DURATION, FPS, HEIGHT, WIDTH } from "./theme";

export const MengCenterCompositions: React.FC = () => {
  return (
    <Folder name="MengCenter">
      <Composition id="MengCenter" component={Film} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="MengCenter-Journal" component={Journal} durationInFrames={JOURNAL_DURATION} fps={40} width={1920} height={1080} />
      <Composition id="MengCenter-NaitangDemo" component={NaitangDemo} durationInFrames={DEMO.duration} fps={DEMO.fps} width={DEMO.width} height={DEMO.height} />
    </Folder>
  );
};
