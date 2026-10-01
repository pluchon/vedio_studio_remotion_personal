// 第四期（光速与事件视界）：目前只有样片
import React from "react";
import { Audio } from "@remotion/media";
import { Composition, Folder } from "remotion";
import { Proto } from "./Proto";
import { FPS, HEIGHT, T, WIDTH, assetUrl } from "./theme";

const PROTO_FRAMES = Math.round(T.end * FPS);

const ProtoWithMusic: React.FC = () => (
  <>
    <Proto />
    <Audio src={assetUrl("audio/cornfield-chase.mp3")} volume={0.85} />
  </>
);

export const HorizonCompositions: React.FC = () => (
  <Folder name="Horizon">
    <Composition id="Horizon-Proto" component={ProtoWithMusic} durationInFrames={PROTO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
