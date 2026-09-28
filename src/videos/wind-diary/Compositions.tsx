// 《风经过的地方》：成片 WindDiary 按配乐的段落依次接上片头、三则与尾声；各章另外单独注册，配乐从该章在曲中的位置接入
import React from "react";
import { Audio } from "@remotion/media";
import { Composition, Folder, Sequence, interpolate, staticFile } from "remotion";
import { CatChapter } from "./scenes/CatChapter";
import { DuskChapter } from "./scenes/DuskChapter";
import { Ending } from "./scenes/Ending";
import { Opening } from "./scenes/Opening";
import { SeaChapter } from "./scenes/SeaChapter";
import { CHAPTERS, Chapter, FPS, HEIGHT, MUSIC, MUSIC_FRAMES, WIDTH, chapterDuration, chapterFrom } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const VOLUME = 0.9;

const PARTS: { id: string; name: string; chapter: Chapter; Scene: React.FC }[] = [
  { id: "WindDiary-Opening", name: "片头", chapter: CHAPTERS.opening, Scene: Opening },
  { id: "WindDiary-Cat", name: "第一则 · 猫", chapter: CHAPTERS.cat, Scene: CatChapter },
  { id: "WindDiary-Sea", name: "第二则 · 海", chapter: CHAPTERS.sea, Scene: SeaChapter },
  { id: "WindDiary-Dusk", name: "第三则 · 暮色", chapter: CHAPTERS.dusk, Scene: DuskChapter },
  { id: "WindDiary-Ending", name: "尾声", chapter: CHAPTERS.ending, Scene: Ending },
];

// 成片：配乐贯穿全片（曲子末尾已自带淡出）
const WindDiary: React.FC = () => (
  <>
    {PARTS.map(({ name, chapter, Scene }) => (
      <Sequence key={name} name={name} from={chapterFrom(chapter)} durationInFrames={chapterDuration(chapter)}>
        <Scene />
      </Sequence>
    ))}
    <Audio src={staticFile(MUSIC)} volume={VOLUME} />
  </>
);

// 单独预览某一章：配乐从该章起点截取，头尾各做短淡入淡出
const withMusic = (Scene: React.FC, chapter: Chapter): React.FC => {
  const from = chapterFrom(chapter);
  const duration = chapterDuration(chapter);
  const ChapterWithMusic: React.FC = () => (
    <>
      <Scene />
      <Audio
        src={staticFile(MUSIC)}
        trimBefore={from}
        volume={(f) => interpolate(f, [0, 12, duration - 20, duration], [0, VOLUME, VOLUME, 0], clamp)}
      />
    </>
  );
  return ChapterWithMusic;
};

// 在模块里一次建好，避免每次渲染都生成新组件导致重新挂载
const PREVIEWS = PARTS.map((part) => ({ ...part, Preview: withMusic(part.Scene, part.chapter) }));

export const WindDiaryCompositions: React.FC = () => (
  <Folder name="WindDiary">
    <Composition id="WindDiary" component={WindDiary} durationInFrames={MUSIC_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="WindDiary-Chapters">
      {PREVIEWS.map(({ id, chapter, Preview }) => (
        <Composition
          key={id}
          id={id}
          component={Preview}
          durationInFrames={chapterDuration(chapter)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      ))}
    </Folder>
  </Folder>
);
