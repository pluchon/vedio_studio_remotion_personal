// 概览：一句话说清是什么，两端登录页并排出现
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ChapterMark } from "../components/ChapterMark";
import { enter } from "../components/motion";
import { Paper } from "../components/Paper";
import { COLORS, EASE_OUT, FONTS } from "../theme";

const LoginCard: React.FC<{ src: string; left: number; start: number; tilt: number; name: string; role: string }> = ({
  src,
  left,
  start,
  tilt,
  name,
  role,
}) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: "absolute", left, top: 400, ...enter(frame, start, 30, 50) }}>
      <div
        style={{
          padding: 12,
          backgroundColor: COLORS.plate,
          border: "1px solid rgba(120, 100, 80, 0.22)",
          boxShadow: "0 30px 60px -30px rgba(60, 45, 30, 0.55)",
          rotate: `${interpolate(frame, [start, start + 40], [tilt * 2, tilt], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          })}deg`,
        }}
      >
        <Img src={staticFile(src)} style={{ display: "block", width: 760, height: 427.5 }} />
      </div>
      <div style={{ marginTop: 34, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 18 }}>
        <span style={{ fontFamily: FONTS.serif, fontSize: 44, fontWeight: 600, color: COLORS.ink, letterSpacing: "0.12em" }}>
          {name}
        </span>
        <span style={{ fontFamily: FONTS.serif, fontSize: 32, color: COLORS.text, letterSpacing: "0.1em" }}>{role}</span>
      </div>
    </div>
  );
};

export const OverviewScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Paper>
      <ChapterMark numeral="I" label="概览" />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 150,
          textAlign: "center",
          fontFamily: FONTS.serif,
          fontSize: 84,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: "0.12em",
          ...enter(frame, 10),
        }}
      >
        一个微服务在线判题平台
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 278,
          textAlign: "center",
          fontFamily: FONTS.serif,
          fontSize: 40,
          color: COLORS.text,
          letterSpacing: "0.12em",
          ...enter(frame, 24),
        }}
      >
        学员刷题、竞赛、复盘；管理员出题、组赛、裁定申诉
      </div>
      <LoginCard src="shots/c_login.png" left={160} start={46} tilt={-1.2} name="学员端" role="刷题与竞赛" />
      <LoginCard src="shots/b_login.png" left={1000} start={66} tilt={1.2} name="管理端" role="出题与管理" />
    </Paper>
  );
};
