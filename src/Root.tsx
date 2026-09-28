import "./index.css";
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

// 各场景单独注册，便于在 Studio 里逐个预览
const SCENE_COMPOSITIONS: { id: string; component: React.FC; duration: number }[] = [
  { id: "Opening", component: OpeningScene, duration: DURATIONS.opening },
  { id: "Overview", component: OverviewScene, duration: DURATIONS.overview },
  { id: "Architecture", component: ArchitectureScene, duration: DURATIONS.architecture },
  { id: "QuestionBank", component: QuestionBankScene, duration: DURATIONS.questionBank },
  { id: "Workbench", component: WorkbenchScene, duration: DURATIONS.workbench },
  { id: "Tutor", component: TutorScene, duration: DURATIONS.tutor },
  { id: "Appeal", component: AppealScene, duration: DURATIONS.appeal },
  { id: "Contest", component: ContestScene, duration: DURATIONS.contest },
  { id: "Review", component: ReviewScene, duration: DURATIONS.review },
  { id: "Profile", component: ProfileScene, duration: DURATIONS.profile },
  { id: "Dashboard", component: DashboardScene, duration: DURATIONS.dashboard },
  { id: "HardAnalysis", component: HardAnalysisScene, duration: DURATIONS.hardAnalysis },
  { id: "AiQuestion", component: AiQuestionScene, duration: DURATIONS.aiQuestion },
  { id: "AppealJudge", component: AppealJudgeScene, duration: DURATIONS.appealJudge },
  { id: "Principles", component: PrinciplesScene, duration: DURATIONS.principles },
  { id: "Ending", component: EndingScene, duration: DURATIONS.ending },
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="MohengOJ" component={MohengVideo} durationInFrames={TOTAL_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Folder name="Scenes">
        {SCENE_COMPOSITIONS.map(({ id, component, duration }) => (
          <Composition key={id} id={id} component={component} durationInFrames={duration} fps={FPS} width={WIDTH} height={HEIGHT} />
        ))}
      </Folder>
    </>
  );
};
