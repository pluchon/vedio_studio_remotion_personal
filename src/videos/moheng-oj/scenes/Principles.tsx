// 设计取向：以引文的形式写下三条贯穿全项目的做法
import React from "react";
import { useCurrentFrame } from "remotion";
import { enter } from "../../../shared/motion";
import { ChapterMark } from "../components/ChapterMark";
import { Paper } from "../components/Paper";
import { COLORS, FONTS } from "../theme";

const LINES = [
  "数字交给 SQL，结论交给 AI。",
  "用例输出由标程在沙箱实跑，不靠模型猜。",
  "AI 只做计算，写库与裁定留给业务服务。",
];

export const PrinciplesScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Paper>
      <ChapterMark numeral="V" label="取向" />
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 170,
          fontFamily: FONTS.latin,
          fontSize: 220,
          lineHeight: 1,
          color: "rgba(139, 53, 42, 0.75)",
          ...enter(frame, 6, 30, 20),
        }}
      >
        “
      </div>
      <div style={{ position: "absolute", left: 420, top: 330, display: "flex", flexDirection: "column", gap: 44 }}>
        {LINES.map((line, i) => (
          <div key={line} style={{ display: "flex", alignItems: "baseline", gap: 30, ...enter(frame, 30 + i * 46, 30, 20) }}>
            <span style={{ fontFamily: FONTS.latin, fontStyle: "italic", fontSize: 40, color: COLORS.muted, width: 56 }}>
              {["i.", "ii.", "iii."][i]}
            </span>
            <span style={{ fontFamily: FONTS.serif, fontSize: 60, color: COLORS.ink, letterSpacing: "0.06em" }}>{line}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 506,
          top: 760,
          display: "flex",
          alignItems: "center",
          gap: 24,
          ...enter(frame, 180, 30, 12),
        }}
      >
        <span style={{ width: 90, height: 2, backgroundColor: COLORS.cinnabar }} />
        <span style={{ fontFamily: FONTS.serif, fontSize: 36, color: COLORS.text, letterSpacing: "0.2em" }}>墨衡的三条取向</span>
      </div>
    </Paper>
  );
};
