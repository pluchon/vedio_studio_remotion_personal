// 《光到不了的地方》：光速、宇宙膨胀与事件视界。全片一个镜头，配乐不裁剪，结尾多留几秒无声
import React from "react";
import { Audio } from "@remotion/media";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH, assetUrl } from "./theme";

const FilmWithMusic: React.FC = () => (
  <>
    <Film />
    <Audio src={assetUrl("audio/cornfield-chase.mp3")} volume={0.9} />
  </>
);

export const HorizonCompositions: React.FC = () => (
  <Folder name="Horizon">
    <Composition id="Horizon" component={FilmWithMusic} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
