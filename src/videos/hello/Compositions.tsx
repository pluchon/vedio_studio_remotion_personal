// 《你好，我是 Claude》的组合登记
import React from "react";
import { AbsoluteFill, Composition, Folder, useCurrentFrame } from "remotion";
import { BuddyG, REST } from "./Buddy";
import { Film, FILM_SECONDS } from "./Film";
import { DEFAULTS, schema } from "./options";
import { FPS, HEIGHT, WIDTH } from "./theme";

// 一张透明底的贴纸：小家伙挥手，两秒一个循环，可以导出成带透明通道的视频或动图
const Sticker: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 480 480" width={480} height={480}>
        <BuddyG
          t={t}
          pose={{
            ...REST,
            x: 220,
            y: 400,
            size: 120,
            wave: 1,
            mood: "happy",
            lift: Math.abs(Math.sin(t * Math.PI)) * 26,
          }}
        />
      </svg>
    </AbsoluteFill>
  );
};

export const HelloCompositions: React.FC = () => {
  return (
    <Folder name="Hello">
      <Composition
        id="Hello"
        component={Film}
        schema={schema}
        defaultProps={DEFAULTS}
        durationInFrames={Math.round(FILM_SECONDS * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Hello-Sticker"
        component={Sticker}
        durationInFrames={2 * FPS}
        fps={FPS}
        width={480}
        height={480}
      />
    </Folder>
  );
};
