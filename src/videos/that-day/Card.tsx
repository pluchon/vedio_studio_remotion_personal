// 结尾的卡片：名字（可以不写）和留言一行行浮出来，下面是日期和地点
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Card: React.FC<{
  name: string;
  message: string;
  dateLabel: string;
  city: string;
  accent: string;
}> = ({ name, message, dateLabel, city, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const lines = message.split("\n").filter((line) => line.trim());
  const fade = interpolate(
    frame,
    [0, 0.8 * fps, durationInFrames - 1.2 * fps, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const appear = (start: number) => ({
    opacity: interpolate(t, [start, start + 1], [0, 1], clamp),
    filter: `blur(${interpolate(t, [start, start + 1], [6, 0], clamp)}px)`,
  });
  const after = 0.8 + (name ? 1 : 0) + lines.length * 1.1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: COLORS.ink,
        opacity: fade,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        color: COLORS.cream,
      }}
    >
      {name ? (
        <div
          style={{
            fontSize: 44,
            letterSpacing: 10,
            marginBottom: 48,
            ...appear(0.6),
          }}
        >
          {name}
        </div>
      ) : null}
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontSize: 50,
            letterSpacing: 8,
            lineHeight: 1.9,
            ...appear(0.8 + (name ? 1 : 0) + i * 1.1),
          }}
        >
          {line}
        </div>
      ))}
      <div
        style={{
          marginTop: 70,
          width: 60,
          height: 2,
          background: accent,
          ...appear(after),
        }}
      />
      <div
        style={{
          marginTop: 26,
          fontSize: 26,
          letterSpacing: 8,
          color: COLORS.soft,
          ...appear(after + 0.3),
        }}
      >
        {dateLabel} · {city}
      </div>
    </div>
  );
};
