// 《那一天》整片：日期 → 那天的天空 → 那晚的月亮 → 一年里的这一天 → 地球在轨道上 → 留言
import React, { useMemo } from "react";
import { Audio } from "@remotion/media";
import { Lottie } from "@remotion/lottie";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clock } from "./astro";
import { BIRDS } from "./birds";
import { Card } from "./Card";
import { readDay } from "./day";
import type { Day } from "./day";
import { useFont } from "./font";
import { Moon } from "./Moon";
import { Orbit } from "./Orbit";
import { Sky } from "./Sky";
import { Title } from "./Title";
import { Year } from "./Year";
import { COLORS, FONT, FPS, MUSIC, PARTS, totalSeconds } from "./theme";
import type { Props } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const at = (seconds: number) => Math.round(seconds * FPS);

// 天空这一段：时钟、日出日落等事件、早上飞过的一群鸟；最后推近到月亮上
const SkyPart: React.FC<{ day: Day }> = ({ day }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const minutes = day.clockAt[Math.min(day.clockAt.length - 1, frame)];
  const events = [
    { at: day.rise, text: "日出" },
    { at: day.noon, text: "正午" },
    { at: day.set, text: "日落" },
    ...(day.moonrise ? [{ at: day.moonrise, text: "月出" }] : []),
  ];
  const fadeIn = interpolate(frame, [0, 20], [0, 1], clamp);
  const push = interpolate(
    frame,
    [durationInFrames - 1.6 * fps, durationInFrames],
    [1, 5],
    {
      ...clamp,
      easing: Easing.in(Easing.cubic),
    },
  );
  const leave = interpolate(
    frame,
    [durationInFrames - 0.5 * fps, durationInFrames],
    [1, 0],
    clamp,
  );
  // 鸟在日出后半小时到两个半小时之间横穿天空
  const flight = interpolate(
    minutes,
    [day.rise + 30, day.rise + 150],
    [0, 1],
    clamp,
  );
  const birds = flight > 0 && flight < 1;

  return (
    <AbsoluteFill style={{ opacity: fadeIn * leave }}>
      <Sky day={day} minutes={minutes} zoom={push} />
      {birds ? (
        <div
          style={{
            position: "absolute",
            left: interpolate(flight, [0, 1], [-420, 1920]),
            top: interpolate(flight, [0, 1], [430, 300]),
            width: 420,
            height: 240,
            opacity: interpolate(flight, [0, 0.08, 0.92, 1], [0, 1, 1, 0]),
          }}
        >
          <Lottie animationData={BIRDS} loop playbackRate={1.2} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 84,
          fontFamily: FONT,
          color: COLORS.cream,
          opacity: interpolate(push, [1, 1.3], [1, 0], clamp),
        }}
      >
        <div
          style={{
            fontSize: 64,
            letterSpacing: 4,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock(minutes)}
        </div>
        <div
          style={{
            marginTop: 10,
            height: 40,
            fontSize: 26,
            letterSpacing: 6,
            color: COLORS.soft,
          }}
        >
          {events.map((event) => {
            const near = interpolate(
              Math.abs(minutes - event.at),
              [8, 30],
              [1, 0],
              clamp,
            );
            return near > 0 ? (
              <span
                key={event.text}
                style={{ position: "absolute", opacity: near }}
              >
                {event.text} {clock(event.at)}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Film: React.FC<Props> = (props) => {
  const day = useMemo(() => readDay(props), [props]);
  const ready = useFont();
  const total = at(totalSeconds(props.message));
  if (!ready) return null;

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Audio
        src={staticFile(MUSIC)}
        volume={(f) =>
          interpolate(f, [0, 20, total - 60, total], [0, 1, 1, 0], clamp)
        }
      />
      <Sequence
        from={at(PARTS.title)}
        durationInFrames={at(PARTS.sky - PARTS.title)}
      >
        <Title date={props.date} weekday={day.weekday} city={props.city} />
      </Sequence>
      <Sequence
        from={at(PARTS.sky)}
        durationInFrames={at(PARTS.moon - PARTS.sky)}
      >
        <SkyPart day={day} />
      </Sequence>
      <Sequence
        from={at(PARTS.moon)}
        durationInFrames={at(PARTS.year - PARTS.moon)}
      >
        <Moon day={day} />
      </Sequence>
      <Sequence
        from={at(PARTS.year)}
        durationInFrames={at(PARTS.orbit - PARTS.year)}
      >
        <Year day={day} accent={props.accent} />
      </Sequence>
      <Sequence
        from={at(PARTS.orbit)}
        durationInFrames={at(PARTS.card - PARTS.orbit)}
      >
        <Orbit day={day} accent={props.accent} asOf={props.asOf} />
      </Sequence>
      <Sequence from={at(PARTS.card)} durationInFrames={total - at(PARTS.card)}>
        <Card
          name={props.name}
          message={props.message}
          dateLabel={`${day.year} 年 ${day.dateLabel}`}
          city={props.city}
          accent={props.accent}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
