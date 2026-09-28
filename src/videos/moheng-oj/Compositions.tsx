// 墨衡 OJ 介绍视频：成片 MohengOJ，另把各场景单独注册，便于在 Studio 里逐个预览
import React from "react";
import { Composition, Folder } from "remotion";
import { DURATIONS, FPS, HEIGHT, TOTAL_DURATION, WIDTH } from "./theme";
import { MohengVideo } from "./MohengVideo";
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

// 场景 ID 统一带 MohengOJ- 前缀，避免与其他视频重名
const SCENE_COMPOSITIONS: { id: string; component: React.FC; duration: number }[] = [
  { id: "MohengOJ-Opening", component: OpeningScene, duration: DURATIONS.opening },
  { id: "MohengOJ-Overview", component: OverviewScene, duration: DURATIONS.overview },
  { id: "MohengOJ-Architecture", component: ArchitectureScene, duration: DURATIONS.architecture },
  { id: "MohengOJ-QuestionBank", component: QuestionBankScene, duration: DURATIONS.questionBank },
  { id: "MohengOJ-Workbench", component: WorkbenchScene, duration: DURATIONS.workbench },
  { id: "MohengOJ-Tutor", component: TutorScene, duration: DURATIONS.tutor },
  { id: "MohengOJ-Appeal", component: AppealScene, duration: DURATIONS.appeal },
  { id: "MohengOJ-Contest", component: ContestScene, duration: DURATIONS.contest },
  { id: "MohengOJ-Review", component: ReviewScene, duration: DURATIONS.review },
  { id: "MohengOJ-Profile", component: ProfileScene, duration: DURATIONS.profile },
  { id: "MohengOJ-Dashboard", component: DashboardScene, duration: DURATIONS.dashboard },
  { id: "MohengOJ-HardAnalysis", component: HardAnalysisScene, duration: DURATIONS.hardAnalysis },
  { id: "MohengOJ-AiQuestion", component: AiQuestionScene, duration: DURATIONS.aiQuestion },
  { id: "MohengOJ-AppealJudge", component: AppealJudgeScene, duration: DURATIONS.appealJudge },
  { id: "MohengOJ-Principles", component: PrinciplesScene, duration: DURATIONS.principles },
  { id: "MohengOJ-Ending", component: EndingScene, duration: DURATIONS.ending },
];

export const MohengOJCompositions: React.FC = () => (
  <Folder name="MohengOJ">
    <Composition id="MohengOJ" component={MohengVideo} durationInFrames={TOTAL_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="Scenes">
      {SCENE_COMPOSITIONS.map(({ id, component, duration }) => (
        <Composition key={id} id={id} component={component} durationInFrames={duration} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
  </Folder>
);
