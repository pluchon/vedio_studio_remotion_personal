// 成片：底下是各段的画面（段与段之间用转场接起来），中间是贯穿全片的小家伙，最上面是字幕
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { iris } from "@remotion/transitions/iris";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { blend, BuddyG } from "./Buddy";
import type { Pose } from "./Buddy";
import { Captions } from "./Captions";
import * as Ending from "./chapters/Ending";
import * as Family from "./chapters/Family";
import * as GrowUp from "./chapters/GrowUp";
import * as Honest from "./chapters/Honest";
import * as Making from "./chapters/Making";
import * as Me from "./chapters/Me";
import * as Opening from "./chapters/Opening";
import * as What from "./chapters/What";
import { useFonts } from "./font";
import { EASE } from "./motion";
import { Options } from "./options";
import type { Props } from "./options";
import { asset, C, FPS, HEIGHT, WIDTH } from "./theme";
import { LINES, OVERLAP, SECONDS, STARTS, talkAt } from "./timeline";

type Chapter = {
  Back: React.FC<{ t: number }>;
  Front?: React.FC<{ t: number }>;
  pose: (t: number) => Pose;
};

// 顺序和 script.json 里的一致
const CHAPTERS: Chapter[] = [
  Opening,
  What,
  GrowUp,
  Family,
  Me,
  Honest,
  Making,
  Ending,
];
const COUNT = CHAPTERS.length;
export const FILM_SECONDS = STARTS[COUNT - 1] + SECONDS[COUNT - 1];

type AnyPresentation = TransitionPresentation<Record<string, unknown>>;
const loose = <T extends Record<string, unknown>>(
  presentation: TransitionPresentation<T>,
) => presentation as unknown as AnyPresentation;

// 每两段之间换一种转场；小家伙不在转场里，它一直站在最前面
const BRIDGES: AnyPresentation[] = [
  loose(iris({ width: WIDTH, height: HEIGHT })),
  loose(slide({ direction: "from-right" })),
  loose(wipe({ direction: "from-left" })),
  loose(clockWipe({ width: WIDTH, height: HEIGHT })),
  loose(fade()),
  loose(slide({ direction: "from-bottom" })),
  loose(iris({ width: WIDTH, height: HEIGHT })),
];

const frames = (seconds: number) => Math.round(seconds * FPS);

// 把「这一段自己的秒数」交给这一段的画面
const Layer: React.FC<{ View: React.FC<{ t: number }> }> = ({ View }) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <View t={t} />
    </AbsoluteFill>
  );
};

// 小家伙此刻的姿势：两段交接时，从上一段的姿势走到下一段的姿势
const poseAt = (t: number): Pose => {
  let index = 0;
  while (index + 1 < COUNT && t >= STARTS[index + 1]) index++;
  const local = t - STARTS[index];
  const now = CHAPTERS[index].pose(local);
  if (index === 0 || local >= OVERLAP) return now;
  const before = CHAPTERS[index - 1].pose(t - STARTS[index - 1]);
  const p = EASE.inOut(local / OVERLAP);
  const mixed = blend(before, now, p);
  // 换位置的时候迈着步子过去
  const walked = (Math.abs(now.x - before.x) / 150) * p;
  const hurry = Math.sin(p * Math.PI);
  return {
    ...mixed,
    step: mixed.step + walked,
    lift:
      mixed.lift +
      (Math.abs(now.x - before.x) > 30
        ? hurry * Math.abs(Math.sin(walked * Math.PI * 2)) * 9
        : 0),
  };
};

export const Film: React.FC<Props> = (props) => {
  const ready = useFonts();
  const t = useCurrentFrame() / FPS;
  if (!ready) return null;
  const pose = { ...poseAt(t), talk: talkAt(LINES, t) };
  return (
    <Options.Provider value={props}>
      <AbsoluteFill style={{ background: C.paper }}>
        <TransitionSeries>
          {CHAPTERS.flatMap((chapter, i) => {
            const scene = (
              <TransitionSeries.Sequence
                key={`scene-${i}`}
                durationInFrames={frames(SECONDS[i])}
              >
                <Layer View={chapter.Back} />
              </TransitionSeries.Sequence>
            );
            if (i === COUNT - 1) return [scene];
            return [
              scene,
              <TransitionSeries.Transition
                key={`bridge-${i}`}
                presentation={BRIDGES[i]}
                timing={linearTiming({
                  durationInFrames: frames(OVERLAP),
                  easing: EASE.inOut,
                })}
              />,
            ];
          })}
        </TransitionSeries>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <BuddyG pose={pose} t={t} />
        </svg>
        {CHAPTERS.map((chapter, i) =>
          chapter.Front ? (
            <Sequence
              key={i}
              from={frames(STARTS[i])}
              durationInFrames={frames(SECONDS[i])}
            >
              <Layer View={chapter.Front} />
            </Sequence>
          ) : null,
        )}
        <Captions t={t} />
        {/* 配乐和说话声是两条音轨，各调各的音量 */}
        <Audio src={asset("audio/bgm.wav")} volume={0.85} />
        <Audio src={asset("audio/voice.wav")} volume={0.42} />
      </AbsoluteFill>
    </Options.Provider>
  );
};
