// 《云走过的地方，天空都记得》：成片 CloudSky 按配乐的乐句接上窗边、云的旅程、天空、黄昏与后来；各段另外单独注册，配乐从该段在曲中的位置接入
import React from "react";
import { Audio } from "@remotion/media";
import { Composition, Folder, Sequence, staticFile } from "remotion";
import { withMusic } from "../../shared/preview";
import { Dusk } from "./scenes/Dusk";
import { Journey } from "./scenes/Journey";
import { Later } from "./scenes/Later";
import { Opening } from "./scenes/Opening";
import { Sky } from "./scenes/Sky";
import { FPS, HEIGHT, MUSIC, SEGMENTS, Segment, TOTAL_FRAMES, WIDTH, segDuration, segFrom } from "./theme";

const VOLUME = 0.9;

const PARTS: { id: string; name: string; segment: Segment; Scene: React.FC }[] = [
  { id: "CloudSky-Opening", name: "窗边", segment: SEGMENTS.opening, Scene: Opening },
  { id: "CloudSky-Journey", name: "云的旅程", segment: SEGMENTS.journey, Scene: Journey },
  { id: "CloudSky-Sky", name: "天空", segment: SEGMENTS.sky, Scene: Sky },
  { id: "CloudSky-Dusk", name: "黄昏", segment: SEGMENTS.dusk, Scene: Dusk },
  { id: "CloudSky-Later", name: "后来", segment: SEGMENTS.later, Scene: Later },
];

// 成片：配乐只到 74.3 秒，之后画面静静停一会儿
const CloudSky: React.FC = () => (
  <>
    {PARTS.map(({ name, segment, Scene }) => (
      <Sequence key={name} name={name} from={segFrom(segment)} durationInFrames={segDuration(segment)}>
        <Scene />
      </Sequence>
    ))}
    <Audio src={staticFile(MUSIC)} volume={VOLUME} />
  </>
);

const PREVIEWS = PARTS.map((part) => ({
  ...part,
  Preview: withMusic(part.Scene, MUSIC, segFrom(part.segment), segDuration(part.segment), VOLUME),
}));

export const CloudSkyCompositions: React.FC = () => (
  <Folder name="CloudSky">
    <Composition id="CloudSky" component={CloudSky} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="CloudSky-Parts">
      {PREVIEWS.map(({ id, segment, Preview }) => (
        <Composition key={id} id={id} component={Preview} durationInFrames={segDuration(segment)} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
  </Folder>
);
