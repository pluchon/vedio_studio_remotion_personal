// 《风经过的地方》：先做第一则 · 猫当样片，配乐从本章在曲中的位置接入
import React from "react";
import { Audio } from "@remotion/media";
import { Composition, Folder, interpolate, staticFile } from "remotion";
import { CatChapter } from "./scenes/CatChapter";
import { CHAPTERS, FPS, HEIGHT, MUSIC, WIDTH, chapterDuration, chapterFrom } from "./theme";

// 单独预览某一章：配乐从该章起点截取，头尾各做短淡入淡出
const withMusic = (Scene: React.FC, from: number, duration: number): React.FC => {
  const ChapterWithMusic: React.FC = () => (
    <>
      <Scene />
      <Audio
        src={staticFile(MUSIC)}
        trimBefore={from}
        volume={(f) =>
          interpolate(f, [0, 12, duration - 20, duration], [0, 0.85, 0.85, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </>
  );
  return ChapterWithMusic;
};

const CatSample = withMusic(CatChapter, chapterFrom(CHAPTERS.cat), chapterDuration(CHAPTERS.cat));

export const WindDiaryCompositions: React.FC = () => (
  <Folder name="WindDiary">
    <Composition
      id="WindDiary-Cat"
      component={CatSample}
      durationInFrames={chapterDuration(CHAPTERS.cat)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </Folder>
);
