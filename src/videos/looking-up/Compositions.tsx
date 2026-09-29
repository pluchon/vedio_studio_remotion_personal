// 《我们一直在仰望》：目前只有 3D 打样
import React from "react";
import { Composition, Folder } from "remotion";
import { Spike3D } from "./scenes/Spike3D";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const LookingUpCompositions: React.FC = () => (
  <Folder name="LookingUp">
    <Composition id="LookingUp-Spike3D" component={Spike3D} durationInFrames={150} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
