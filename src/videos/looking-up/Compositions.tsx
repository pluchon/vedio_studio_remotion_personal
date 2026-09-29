// 《我们一直在仰望》：成片 LookingUp 按配乐的乐句一幕接一幕；下一幕压在上一幕上面，在乐句点上短暂叠化进来。
// 各幕另外单独注册，配乐从该幕在曲中的位置接入
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Composition, Folder, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { withMusic } from "../../shared/preview";
import { Bone } from "./scenes/ink/Bone";
import { Canoe } from "./scenes/ink/Canoe";
import { Chronicle } from "./scenes/ink/Chronicle";
import { Kepler } from "./scenes/ink/Kepler";
import { Lens } from "./scenes/ink/Lens";
import { Newton } from "./scenes/ink/Newton";
import { Omens } from "./scenes/ink/Omens";
import { Primal } from "./scenes/ink/Primal";
import { Prologue } from "./scenes/ink/Prologue";
import { Stones } from "./scenes/ink/Stones";
import { Coda } from "./scenes/ink/Coda";
import { Network } from "./scenes/light/Network";
import { Silicon } from "./scenes/light/Silicon";
import { Unknown } from "./scenes/Unknown";
import { Calendar } from "./scenes/poster/Calendar";
import { Jupiter, Recede, Saturn } from "./scenes/poster/Flyby";
import { Galaxies } from "./scenes/poster/Galaxies";
import { Galileo } from "./scenes/poster/Galileo";
import { Landing } from "./scenes/poster/Landing";
import { Launch } from "./scenes/poster/Launch";
import { Record } from "./scenes/poster/Record";
import { Sputnik } from "./scenes/poster/Sputnik";
import { Deepfield } from "./scenes/deep/Deepfield";
import { Dot } from "./scenes/deep/Dot";
import { Forge } from "./scenes/deep/Forge";
import { Helio } from "./scenes/deep/Helio";
import { Home } from "./scenes/deep/Home";
import { Turn } from "./scenes/deep/Turn";
import { WebbScene } from "./scenes/deep/WebbScene";
import { FPS, HEIGHT, MUSIC, SEGMENTS, Segment, TOTAL_FRAMES, WIDTH, segDuration, segFrom } from "./theme";

const VOLUME = 0.85;

// 这一幕开头用多少帧叠化进来，同时上一幕多留这么久垫在底下
const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const o = frames === 0 ? 1 : interpolate(frame, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

type Part = { id: string; name: string; segment: Segment; Scene: React.FC; fade: number };

const PARTS: Part[] = [
  { id: "LookingUp-Prologue", name: "序", segment: SEGMENTS.prologue, Scene: Prologue, fade: 0 },
  // 书页从黑里亮起来，慢一点
  { id: "LookingUp-Primal", name: "墨 · 约三十万年前", segment: SEGMENTS.primal, Scene: Primal, fade: 40 },
  { id: "LookingUp-Bone", name: "墨 · 约四万年前", segment: SEGMENTS.bone, Scene: Bone, fade: 12 },
  { id: "LookingUp-Stones", name: "墨 · 约五千年前", segment: SEGMENTS.stones, Scene: Stones, fade: 10 },
  { id: "LookingUp-Canoe", name: "墨 · 约三千年前", segment: SEGMENTS.canoe, Scene: Canoe, fade: 10 },
  { id: "LookingUp-Chronicle", name: "墨 · 公元前 613 年", segment: SEGMENTS.chronicle, Scene: Chronicle, fade: 10 },
  { id: "LookingUp-Omens", name: "墨 · 美索不达米亚", segment: SEGMENTS.omens, Scene: Omens, fade: 10 },
  { id: "LookingUp-Kepler", name: "墨 · 1576~1609", segment: SEGMENTS.kepler, Scene: Kepler, fade: 10 },
  { id: "LookingUp-Newton", name: "墨 · 1687", segment: SEGMENTS.newton, Scene: Newton, fade: 10 },
  { id: "LookingUp-Lens", name: "墨 · 1609", segment: SEGMENTS.lens, Scene: Lens, fade: 10 },
  // 从白光里显出颜色
  { id: "LookingUp-Galileo", name: "海报 · 1610", segment: SEGMENTS.galileo, Scene: Galileo, fade: 12 },
  { id: "LookingUp-Galaxies", name: "海报 · 1924", segment: SEGMENTS.galaxies, Scene: Galaxies, fade: 10 },
  { id: "LookingUp-Calendar", name: "海报 · 宇宙日历", segment: SEGMENTS.calendar, Scene: Calendar, fade: 10 },
  { id: "LookingUp-Sputnik", name: "海报 · 1957", segment: SEGMENTS.sputnik, Scene: Sputnik, fade: 8 },
  { id: "LookingUp-Launch", name: "海报 · 1969 升空", segment: SEGMENTS.launch, Scene: Launch, fade: 8 },
  { id: "LookingUp-Landing", name: "海报 · 1969 登月", segment: SEGMENTS.landing, Scene: Landing, fade: 8 },
  { id: "LookingUp-Record", name: "海报 · 1977", segment: SEGMENTS.record, Scene: Record, fade: 8 },
  { id: "LookingUp-Jupiter", name: "海报 · 1979", segment: SEGMENTS.jupiter, Scene: Jupiter, fade: 10 },
  { id: "LookingUp-Saturn", name: "海报 · 1980", segment: SEGMENTS.saturn, Scene: Saturn, fade: 12 },
  { id: "LookingUp-Recede", name: "海报褪色", segment: SEGMENTS.recede, Scene: Recede, fade: 12 },
  { id: "LookingUp-Turn", name: "深空 · 1990 转身", segment: SEGMENTS.turn, Scene: Turn, fade: 10 },
  { id: "LookingUp-Dot", name: "深空 · 暗淡蓝点", segment: SEGMENTS.dot, Scene: Dot, fade: 10 },
  { id: "LookingUp-Helio", name: "深空 · 2012", segment: SEGMENTS.helio, Scene: Helio, fade: 10 },
  { id: "LookingUp-Webb", name: "深空 · 2021", segment: SEGMENTS.webb, Scene: WebbScene, fade: 10 },
  { id: "LookingUp-Deepfield", name: "深空 · 2022", segment: SEGMENTS.deepfield, Scene: Deepfield, fade: 10 },
  { id: "LookingUp-Forge", name: "深空 · 恒星", segment: SEGMENTS.forge, Scene: Forge, fade: 10 },
  { id: "LookingUp-Home", name: "深空 · 地球", segment: SEGMENTS.home, Scene: Home, fade: 10 },
  { id: "LookingUp-Silicon", name: "光 · 火花与硅", segment: SEGMENTS.silicon, Scene: Silicon, fade: 0 },
  { id: "LookingUp-Network", name: "光 · 编年", segment: SEGMENTS.network, Scene: Network, fade: 10 },
  { id: "LookingUp-Unknown", name: "未知", segment: SEGMENTS.unknown, Scene: Unknown, fade: 12 },
  { id: "LookingUp-Coda", name: "跋", segment: SEGMENTS.coda, Scene: Coda, fade: 20 },
];

// 成片：每一幕从它的起点开始，并多留下一幕叠化所需的帧数垫在底下
const LookingUp: React.FC = () => (
  <>
    {PARTS.map(({ name, segment, Scene, fade }, i) => {
      const next = PARTS[i + 1];
      return (
        <Sequence key={name} name={name} from={segFrom(segment)} durationInFrames={segDuration(segment) + (next ? next.fade : 0)}>
          <FadeIn frames={fade}>
            <Scene />
          </FadeIn>
        </Sequence>
      );
    })}
    <Audio src={staticFile(MUSIC)} volume={VOLUME} />
  </>
);

const PREVIEWS = PARTS.map((part) => ({
  ...part,
  Preview: withMusic(part.Scene, MUSIC, segFrom(part.segment), segDuration(part.segment), VOLUME),
}));

export const LookingUpCompositions: React.FC = () => (
  <Folder name="LookingUp">
    <Composition id="LookingUp" component={LookingUp} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="LookingUp-Parts">
      {PREVIEWS.map(({ id, segment, Preview }) => (
        <Composition key={id} id={id} component={Preview} durationInFrames={segDuration(segment)} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
  </Folder>
);
