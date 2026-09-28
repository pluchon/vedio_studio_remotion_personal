// 成片：各场景按顺序以淡入淡出衔接，配乐贯穿全片
import React from "react";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { DURATIONS, TRANSITION } from "./theme";
import { OpeningScene } from "./scenes/Opening";
import { OverviewScene } from "./scenes/Overview";
import { ArchitectureScene } from "./scenes/Architecture";
import {
  AppealScene,
  ContestScene,
  ProfileScene,
  QuestionBankScene,
  ReviewScene,
  TutorScene,
  WorkbenchScene,
} from "./scenes/StudentScenes";
import { AiQuestionScene, AppealJudgeScene, DashboardScene, HardAnalysisScene } from "./scenes/AdminScenes";
import { PrinciplesScene } from "./scenes/Principles";
import { EndingScene } from "./scenes/Ending";

// 场景顺序（名称用于 Studio 时间线）
const SCENES: { name: string; duration: number; Component: React.FC }[] = [
  { name: "片头", duration: DURATIONS.opening, Component: OpeningScene },
  { name: "概览", duration: DURATIONS.overview, Component: OverviewScene },
  { name: "架构", duration: DURATIONS.architecture, Component: ArchitectureScene },
  { name: "题库", duration: DURATIONS.questionBank, Component: QuestionBankScene },
  { name: "做题工作台", duration: DURATIONS.workbench, Component: WorkbenchScene },
  { name: "AI 辅导", duration: DURATIONS.tutor, Component: TutorScene },
  { name: "判题申诉", duration: DURATIONS.appeal, Component: AppealScene },
  { name: "竞赛与排名", duration: DURATIONS.contest, Component: ContestScene },
  { name: "赛后复盘", duration: DURATIONS.review, Component: ReviewScene },
  { name: "个人中心", duration: DURATIONS.profile, Component: ProfileScene },
  { name: "数据概览", duration: DURATIONS.dashboard, Component: DashboardScene },
  { name: "难题分析", duration: DURATIONS.hardAnalysis, Component: HardAnalysisScene },
  { name: "AI 出题", duration: DURATIONS.aiQuestion, Component: AiQuestionScene },
  { name: "申诉裁定", duration: DURATIONS.appealJudge, Component: AppealJudgeScene },
  { name: "取向", duration: DURATIONS.principles, Component: PrinciplesScene },
  { name: "片尾", duration: DURATIONS.ending, Component: EndingScene },
];

export const MohengVideo: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();

  return (
    <>
      <TransitionSeries>
        {SCENES.flatMap(({ name, duration, Component }, i) => [
          ...(i > 0
            ? [<TransitionSeries.Transition key={`t-${name}`} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />]
            : []),
          <TransitionSeries.Sequence key={name} name={name} durationInFrames={duration}>
            <Component />
          </TransitionSeries.Sequence>,
        ])}
      </TransitionSeries>
      <Audio
        src={staticFile("audio/bgm.wav")}
        volume={(f) =>
          interpolate(f, [0, 2 * fps, durationInFrames - 4 * fps, durationInFrames], [0, 0.9, 0.9, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </>
  );
};
