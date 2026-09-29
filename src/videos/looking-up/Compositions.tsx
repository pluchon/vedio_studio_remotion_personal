// 《我们一直在仰望》：成片 LookingUp 按配乐的乐句一幕接一幕；下一幕压在上一幕上面，在乐句点上短暂叠化进来。
// 各幕另外单独注册，配乐从该幕在曲中的位置接入
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Composition, Folder, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { withMusic } from "../../shared/preview";
import { Bone } from "./scenes/ink/Bone";
import { Canoe } from "./scenes/ink/Canoe";
import { Primal } from "./scenes/ink/Primal";
import { Prologue } from "./scenes/ink/Prologue";
import { Stones } from "./scenes/ink/Stones";
import { pending } from "./scenes/Pending";
import { Galileo1610 } from "./styleframes/Galileo1610";
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
  {
    id: "LookingUp-Chronicle",
    name: "墨 · 公元前 613 年",
    segment: SEGMENTS.chronicle,
    Scene: pending("墨 · 公元前 613 年 · 鲁国", ["史官在竹简上写下「秋七月，有星孛入于北斗」", "天上一道彗星划进北斗；敦煌星图作档案插页"]),
    fade: 10,
  },
  { id: "LookingUp-Omens", name: "墨 · 美索不达米亚", segment: SEGMENTS.omens, Scene: pending("墨 · 约三千年前 · 美索不达米亚", ["塔顶的祭司读星象，星星连成神的轮廓"]), fade: 10 },
  { id: "LookingUp-Kepler", name: "墨 · 1576~1609", segment: SEGMENTS.kepler, Scene: pending("墨 · 1576 汶岛 → 1609 布拉格", ["第谷的观测点一夜夜积起来，开普勒的椭圆穿过所有点"]), fade: 10 },
  { id: "LookingUp-Newton", name: "墨 · 1687", segment: SEGMENTS.newton, Scene: pending("墨 · 1687 · 伦敦", ["苹果落下；抛出的石头越飞越远，绕成轨道，月亮就在这条线上"]), fade: 10 },
  { id: "LookingUp-Lens", name: "墨 · 1609", segment: SEGMENTS.lens, Scene: pending("墨 · 1609 · 帕多瓦", ["屏息：弗拉马利翁版画里的人探出天穹"]), fade: 10 },
  { id: "LookingUp-Galileo", name: "海报 · 1610", segment: SEGMENTS.galileo, Scene: Galileo1610, fade: 8 },
  {
    id: "LookingUp-Poster",
    name: "海报 · 1924~1977",
    segment: SEGMENTS.poster,
    Scene: pending("海报 · 1924 → 1980", ["1924 威尔逊山：银河之外的千亿星系", "宇宙日历：一百三十八亿年压成一年", "1957 屋顶上看卫星的人", "1969 土星五号升空 → 电视前的一家人", "1977 旅行者号与金唱片 → 1979 木星 → 1980 土星"]),
    fade: 10,
  },
  {
    id: "LookingUp-Deep",
    name: "深空 · 1990~2021",
    segment: SEGMENTS.deep,
    Scene: pending("深空 · 1990 → 此刻", ["1990 暗淡蓝点", "2012 日球层顶", "2021 韦布展开 → 2022 第一张深空场", "恒星锻造铁与钙 → 地球夜面"]),
    fade: 10,
  },
  { id: "LookingUp-Light", name: "光 · 1879~2026", segment: SEGMENTS.light, Scene: pending("光 · 1947 → 2026", ["屏息里擦亮一粒电火花", "沙 → 硅 → 回路", "定位标越翻越快，地球夜面被灯火织满", "光很亮，影子也很深"]), fade: 10 },
  { id: "LookingUp-Unknown", name: "未知", segment: SEGMENTS.unknown, Scene: pending("未知 · 2026 → ？", ["年份跳成「？」，星空里多出一点不是星星的光", "Opus 5.5 的三句"]), fade: 10 },
  { id: "LookingUp-Coda", name: "跋", segment: SEGMENTS.coda, Scene: pending("跋 · 今天", ["屋顶上仰望的人，星一颗颗点亮", "而我们依旧在仰望"]), fade: 10 },
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
