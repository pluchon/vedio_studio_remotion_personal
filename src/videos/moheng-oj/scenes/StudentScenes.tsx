// 学员端各功能场景（坐标均为截图 CSS 像素，截图视口 1600×900）
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { enter } from "../../../shared/motion";
import { GlowRing, InkCircle, Shot, StreamReveal } from "../../../shared/Plate";
import { FeatureScene } from "../components/FeatureScene";
import { asset } from "../theme";

const CHAPTER = { numeral: "III", chapter: "学员端" };

export const QuestionBankScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 03 · 题库"
    title="题库"
    desc={"按难度、标签、关键词筛题；\n搜不到时，给出语义推荐。"}
    chips={["语义检索", "做题统计"]}
    camera={[
      { f: 30, x: 800, y: 450, s: 1 },
      { f: 110, x: 700, y: 330, s: 1.45 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/c_question.png")} />
        <InkCircle cx={1140} cy={200} rx={48} ry={20} at={112} />
      </>
    }
  />
);

export const WorkbenchScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 04 · 做题工作台"
    title="做题工作台"
    desc={"Monaco 编辑器写代码，\n运行示例、提交判题，\n逐个用例看结果。"}
    chips={["Docker 沙箱", "RabbitMQ 异步判题"]}
    camera={[
      { f: 30, x: 800, y: 450, s: 1 },
      { f: 90, x: 1120, y: 250, s: 1.6 },
      { f: 150, x: 900, y: 700, s: 1.5 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/c_work_run.png")} />
        <InkCircle cx={792} cy={667} rx={72} ry={24} at={160} />
      </>
    }
  />
);

// 小墨：AI 辅导的形象，出现在旁注下方
const Xiaomo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Img
      src={staticFile(asset("art/xiaomo.png"))}
      style={{ marginTop: 26, width: 150, height: 150, ...enter(frame, 40) }}
    />
  );
};

// 辅导面板内容区（截图坐标）与面板底色
const TUTOR_CONTENT = { x: 1222, y: 118, w: 356, h: 682 };

const TutorBlank: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        left: TUTOR_CONTENT.x,
        top: TUTOR_CONTENT.y,
        width: TUTOR_CONTENT.w,
        height: TUTOR_CONTENT.h,
        backgroundColor: "#fdfbf7",
        opacity: interpolate(frame, [at, at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}
    />
  );
};

export const TutorScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 05 · AI 辅导"
    title="AI 辅导"
    desc={"指点思路、分析提交、\n解释编译错误；流式输出，\n只给思路，不给完整代码。"}
    camera={[
      { f: 30, x: 800, y: 450, s: 1 },
      { f: 80, x: 1130, y: 400, s: 1.4 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/c_tutor_open.png")} />
        <TutorBlank at={78} />
        <StreamReveal src={asset("shots/c_tutor.png")} {...TUTOR_CONTENT} from={84} to={220} lines={26} />
      </>
    }
    note={<Xiaomo />}
  />
);

export const AppealScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 06 · 判题申诉"
    title="判题申诉"
    desc={"觉得被判错，先由 AI 初审；\nAI 认为可能有误，\n才交给管理员裁定。"}
    chips={["AI 初审", "逐用例核对"]}
    camera={[
      { f: 50, x: 1150, y: 700, s: 1.5 },
      { f: 105, x: 800, y: 450, s: 1.55 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/c_appeal.png")} />
        <InkCircle cx={1530} cy={774} rx={32} ry={18} at={20} hideAt={92} />
        <InkCircle cx={934} cy={540} rx={140} ry={28} at={125} />
      </>
    }
  />
);

export const ContestScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 07 · 竞赛"
    title="竞赛与排名"
    desc={"报名、限时答题、计入排名；\n比赛结束后，\n还能继续赛后练习。"}
    chips={["倒计时", "排名榜"]}
    camera={[
      { f: 60, x: 800, y: 450, s: 1 },
      { f: 120, x: 800, y: 430, s: 1.45 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/c_exam.png")} />
        <Shot src={asset("shots/c_rank.png")} inAt={55} />
      </>
    }
  />
);

export const ReviewScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 08 · 赛后复盘"
    title="赛后复盘"
    desc={"成绩、排名与 AI 总结，\n逐题点评；\n每场可重新生成三次。"}
    chips={["AI 总结", "逐题点评"]}
    camera={[
      { f: 20, x: 800, y: 450, s: 1 },
      { f: 80, x: 800, y: 450, s: 1.3 },
      { f: 200, x: 800, y: 460, s: 1.4 },
    ]}
    plate={
      <>
        <Shot src={asset("shots/c_review_loading.png")} />
        <GlowRing x={420} y={285} w={760} h={330} from={20} to={118} radius={6} />
        <Shot src={asset("shots/c_review.png")} inAt={108} />
        <InkCircle cx={748} cy={364} rx={320} ry={30} at={165} />
      </>
    }
  />
);

export const ProfileScene: React.FC = () => (
  <FeatureScene
    {...CHAPTER}
    fig="Fig. 09 · 个人中心"
    title="个人中心"
    desc={"解题日历与能力雷达，\n记下每一次提交。"}
    camera={[
      { f: 20, x: 800, y: 450, s: 1 },
      { f: 60, x: 980, y: 250, s: 1.5 },
      { f: 140, x: 1030, y: 420, s: 1.5 },
    ]}
    plate={<Shot src={asset("shots/c_profile.png")} />}
  />
);
