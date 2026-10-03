// 成片：底下是各段的画面（段与段之间用转场接起来），中间是贯穿全片的小家伙，最上面是字幕条
// 画面整个装在一个「镜头」里：各段给出自己想要的推近和落点，这里统一推拉，再加一点很轻的晃动
import { Audio } from "@remotion/media";
import { noise2D } from "@remotion/noise";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { iris } from "@remotion/transitions/iris";
import { slide } from "@remotion/transitions/slide";
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { blend, BuddyG } from "./Buddy";
import type { Pose } from "./Buddy";
import { SpeechBar } from "./Captions";
import * as Ending from "./chapters/Ending";
import * as Family from "./chapters/Family";
import * as GrowUp from "./chapters/GrowUp";
import * as Honest from "./chapters/Honest";
import * as Making from "./chapters/Making";
import * as Me from "./chapters/Me";
import * as Opening from "./chapters/Opening";
import * as What from "./chapters/What";
import { useFonts } from "./font";
import { camMix, EASE, ramp, WIDE } from "./motion";
import type { Cam } from "./motion";
import { Options } from "./options";
import type { Props } from "./options";
import { scallop } from "./scallop";
import { asset, C, FPS, HEIGHT, WIDTH } from "./theme";
import { OVERLAP, SECONDS, STARTS, talkAt } from "./timeline";

type Chapter = {
  Back: React.FC<{ t: number }>;
  Front?: React.FC<{ t: number }>;
  pose: (t: number) => Pose;
  camera?: (t: number) => Cam;
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
  loose(scallop({ direction: "from-left" })),
  loose(clockWipe({ width: WIDTH, height: HEIGHT })),
  loose(fade()),
  loose(slide({ direction: "from-bottom" })),
  loose(scallop({ direction: "from-bottom" })),
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

// 每一段盖在小家伙前面的那一层：这一段的转场一开始就淡出，不拖进下一段
const FrontLayer: React.FC<{
  View: React.FC<{ t: number }>;
  seconds: number;
  last: boolean;
}> = ({ View, seconds, last }) => {
  const t = useCurrentFrame() / FPS;
  const fade = last
    ? 1
    : 1 - ramp(t, seconds - OVERLAP - 0.1, seconds - OVERLAP + 0.2);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <View t={t} />
    </AbsoluteFill>
  );
};

// 现在演到第几段，以及正在两段交接的话，交接到了哪一步
const where = (t: number) => {
  let index = 0;
  while (index + 1 < COUNT && t >= STARTS[index + 1]) index++;
  const local = t - STARTS[index];
  const p = index === 0 || local >= OVERLAP ? 1 : EASE.inOut(local / OVERLAP);
  return { index, local, p };
};

// 小家伙此刻的姿势：两段交接时，从上一段的姿势走到下一段的姿势
const poseAt = (t: number): Pose => {
  const { index, local, p } = where(t);
  const now = CHAPTERS[index].pose(local);
  if (p >= 1) return now;
  const before = CHAPTERS[index - 1].pose(t - STARTS[index - 1]);
  const mixed = blend(before, now, p);
  // 换位置的时候迈着步子过去
  const walked = (Math.abs(now.x - before.x) / 240) * p;
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

// 镜头此刻的位置：同样在两段之间过渡
const cameraAt = (t: number): Cam => {
  const { index, local, p } = where(t);
  const now = CHAPTERS[index].camera?.(local) ?? WIDE;
  if (p >= 1) return now;
  const before = CHAPTERS[index - 1].camera?.(t - STARTS[index - 1]) ?? WIDE;
  return camMix(before, now, p);
};

// 整个画面先放大一点点，留出晃动的余地
const BASE = 1.02;

export const Film: React.FC<Props> = (props) => {
  const ready = useFonts();
  const t = useCurrentFrame() / FPS;
  if (!ready) return null;
  const pose = { ...poseAt(t), talk: talkAt(t) };
  const cam = cameraAt(t);
  const driftX = noise2D("cam-x", t * 0.16, 0) * 5 + (cam.sx ?? 0);
  const driftY = noise2D("cam-y", 0, t * 0.16) * 3 + (cam.sy ?? 0);
  return (
    <Options.Provider value={props}>
      <AbsoluteFill style={{ background: C.paper }}>
        <AbsoluteFill
          style={{
            transformOrigin: "0 0",
            transform: `translate(${driftX + cam.fx * (1 - cam.z)}px, ${
              driftY + cam.fy * (1 - cam.z)
            }px) scale(${cam.z}) translate(${(WIDTH / 2) * (1 - BASE)}px, ${
              (HEIGHT / 2) * (1 - BASE)
            }px) scale(${BASE})`,
          }}
        >
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
                <FrontLayer
                  View={chapter.Front}
                  seconds={SECONDS[i]}
                  last={i === COUNT - 1}
                />
              </Sequence>
            ) : null,
          )}
        </AbsoluteFill>
        {/* 四角压暗一点点，让中间更亮 */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 46%, rgba(58,42,38,0) 58%, rgba(58,42,38,0.13) 100%)",
          }}
        />
        <SpeechBar t={t} />
        {/* 配乐和说话声是两条音轨，各调各的音量 */}
        <Audio src={asset("audio/bgm.wav")} volume={0.85} />
        <Audio src={asset("audio/voice.wav")} volume={0.5} />
      </AbsoluteFill>
    </Options.Provider>
  );
};
