// 管理端各功能场景（坐标均为截图 CSS 像素，截图视口 1600×900）
import React from "react";
import { GlowRing, InkCircle, Shot } from "../../../shared/Plate";
import { FeatureScene } from "../components/FeatureScene";
import { asset } from "../theme";

const CHAPTER = { numeral: "IV", chapter: "管理端" };

export const DashboardScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 10 · 数据概览"
    title="数据概览"
    desc={"提交趋势、活跃用户、\n最近竞赛与难题榜，\n一页看全。"}
    camera={[
      { f: 30, x: 800, y: 450, s: 1 },
      { f: 90, x: 900, y: 380, s: 1.35 },
      { f: 160, x: 1220, y: 720, s: 1.5 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/b_overview.png")} />
        <InkCircle cx={1464} cy={626} rx={62} ry={22} at={166} />
      </>
    }
  />
);

export const HardAnalysisScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 11 · 难题分析"
    title="难题分析"
    desc={"数字由 SQL 统计，\n结论由 AI 归纳：\n出题质量提醒、薄弱标签、\n错误类型分布。"}
    chips={["SQL 统计", "AI 归纳"]}
    camera={[
      { f: 10, x: 800, y: 450, s: 1.1 },
      { f: 80, x: 800, y: 450, s: 1.25 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/b_hard_loading.png")} />
        <GlowRing x={460} y={257} w={680} h={386} from={10} to={98} radius={6} />
        <Shot src={asset("shots/b_hard.png")} inAt={88} />
        <InkCircle cx={1075} cy={222} rx={64} ry={19} at={112} hideAt={160} />
        <Shot src={asset("shots/b_hard_bottom.png")} inAt={165} />
        <InkCircle cx={686} cy={474} rx={74} ry={20} at={190} />
      </>
    }
  />
);

export const AiQuestionScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 12 · AI 出题"
    title="AI 出题"
    desc={"一句话描述，\n生成题面、标签与模板；\n用例输出由标程\n在沙箱实跑得到。"}
    chips={["AI 出题", "AI 生成用例"]}
    camera={[
      { f: 10, x: 800, y: 450, s: 1.45 },
      { f: 115, x: 800, y: 450, s: 1.45 },
      { f: 160, x: 1190, y: 420, s: 1.3 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/b_ai_question_typed.png")} />
        <Shot src={asset("shots/b_ai_question_loading.png")} inAt={45} fade={8} />
        <GlowRing x={520} y={308} w={560} h={283} from={48} to={128} radius={6} />
        <Shot src={asset("shots/b_ai_question.png")} inAt={120} />
      </>
    }
  />
);

export const AppealJudgeScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 13 · 申诉裁定"
    title="申诉裁定"
    desc={"对照逐用例的输入、\n预期与实际输出，\n参考 AI 初审意见裁定。"}
    chips={["改判通过", "站内通知"]}
    camera={[
      { f: 20, x: 800, y: 450, s: 1 },
      { f: 60, x: 800, y: 300, s: 1.5 },
      { f: 120, x: 800, y: 480, s: 1.4 },
      { f: 175, x: 1000, y: 720, s: 1.5 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/b_appeal_detail.png")} />
        <InkCircle cx={673} cy={304} rx={292} ry={22} at={62} hideAt={112} />
        <InkCircle cx={564} cy={388} rx={22} ry={20} at={122} />
      </>
    }
  />
);
