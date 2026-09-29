// 海报 · 宇宙日历：把宇宙一百三十八亿年的一生压成一年。一根红针从元旦走到除夕，路过太阳诞生、恐龙；
// 然后只看最后一天的最后几分钟——智人、农业、文字、望远镜，一行行跳出来，全挤在午夜前的几秒里
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Rows } from "../../components/Rows";
import { Subtitle } from "../../components/Subtitle";
import { EASE_IN_OUT, EASE_OUT, FONTS, RETRO, SEGMENTS, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.calendar);

const CARD = { left: 164, top: 250, w: 118, h: 320, gap: 16 };
const COLORS = [RETRO.tealLight, RETRO.salmon, RETRO.mustard, RETRO.sand];
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
// 一年里的第几天 → 横坐标
const dayX = (day: number) => {
  let d = day;
  for (let m = 0; m < 12; m++) {
    if (d <= DAYS[m]) return CARD.left + m * (CARD.w + CARD.gap) + (d / DAYS[m]) * CARD.w;
    d -= DAYS[m];
  }
  return CARD.left + 12 * (CARD.w + CARD.gap) - CARD.gap;
};

// 一天 ≈ 3780 万年：太阳 46 亿年前 → 9 月初；恐龙 2.3 亿年前 → 12 月 25 日
const EVENTS = [
  { day: 0.5, label: "大爆炸", at: 105.3 },
  { day: 244, label: "太阳诞生", at: 106.6 },
  { day: 359, label: "恐龙", at: 107.2 },
];

export const Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  const needle = interpolate(frame, [t(105.2), t(107.4)], [0, 365], { ...clamp, easing: EASE_IN_OUT });
  const yearOut = interpolate(frame, [t(107.7), t(108.2)], [1, 0], clamp);
  const bracket = interpolate(frame, [t(111.9), t(112.4)], [0, 1], { ...clamp, easing: EASE_OUT });

  return (
    <AbsoluteFill style={{ backgroundColor: RETRO.cream }}>
      {/* 背景几块色块 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={1780} cy={120} r={150} fill={RETRO.mustard} opacity={0.5} />
        <rect x={0} y={880} width={1920} height={200} fill={RETRO.sand} opacity={0.5} />
      </svg>
      {/* 一年十二张卡 */}
      <div style={{ position: "absolute", inset: 0, opacity: yearOut }}>
        {DAYS.map((_, m) => (
          <div
            key={m}
            style={{
              position: "absolute",
              left: CARD.left + m * (CARD.w + CARD.gap),
              top: CARD.top,
              width: CARD.w,
              height: CARD.h,
              backgroundColor: COLORS[m % 4],
              opacity: interpolate(frame, [m * 2, m * 2 + 10], [0, 0.9], clamp),
            }}
          >
            <div style={{ position: "absolute", left: 14, top: 12, fontFamily: FONTS.songBlack, fontSize: 30, color: RETRO.ink }}>{m + 1}月</div>
          </div>
        ))}
        {EVENTS.map((e) => (
          <div key={e.label} style={{ position: "absolute", left: dayX(e.day), top: CARD.top + CARD.h + 18, ...inkIn(frame, t(e.at), 10) }}>
            <div style={{ position: "absolute", left: -1, top: -CARD.h * 0.55, width: 2, height: CARD.h * 0.55, backgroundColor: RETRO.navy }} />
            <div style={{ position: "absolute", left: -7, top: -CARD.h * 0.55 - 7, width: 14, height: 14, borderRadius: 7, backgroundColor: RETRO.navy }} />
            <div style={{ transform: "translateX(-50%)", fontFamily: FONTS.song, fontSize: 26, letterSpacing: "0.1em", color: RETRO.navy, whiteSpace: "nowrap" }}>{e.label}</div>
          </div>
        ))}
        {/* 红针 */}
        <div style={{ position: "absolute", left: dayX(needle) - 1.5, top: CARD.top - 40, width: 3, height: CARD.h + 60, backgroundColor: RETRO.red }} />
        <div style={{ position: "absolute", left: dayX(needle) - 10, top: CARD.top - 58, width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: `16px solid ${RETRO.red}` }} />
      </div>
      {/* 最后一天的最后几分钟 */}
      <div style={{ position: "absolute", left: 520, top: 150, fontFamily: FONTS.songBlack, fontSize: 56, letterSpacing: "0.1em", color: RETRO.ink, ...inkIn(frame, t(108.2), 14) }}>
        12 月 31 日
      </div>
      <Rows
        rows={[
          { label: "智人出现", value: "23:48:34", at: t(108.7) },
          { label: "农业", value: "23:59:33", at: t(109.6), color: RETRO.teal },
          { label: "文字", value: "23:59:48", at: t(110.4), color: RETRO.coral },
          { label: "望远镜之后的一切", value: "23:59:59", at: t(111.2), color: RETRO.red },
        ]}
        left={520}
        top={270}
        labelWidth={410}
        step={84}
        size={52}
        color={RETRO.ink}
        soft={RETRO.inkSoft}
      />
      {/* 括号框住农业以后的三行：宽度为 0 时边框也会画出来，所以没开始就不画 */}
      {bracket > 0 && (
        <div style={{ position: "absolute", left: 1200, top: 270 + 84 - 14, width: 30 * bracket, height: 3 * 84 - 30, borderTop: `3px solid ${RETRO.red}`, borderRight: `3px solid ${RETRO.red}`, borderBottom: `3px solid ${RETRO.red}` }} />
      )}
      <div style={{ position: "absolute", left: 1262, top: 270 + 84 * 2 - 4, fontFamily: FONTS.songBlack, fontSize: 44, color: RETRO.red, whiteSpace: "nowrap", opacity: bracket, translate: `${(1 - bracket) * -20}px 0` }}>
        = 我们的整部文明
      </div>
      <Mist tone="retro" height={260} />
      <Locator year="138 亿年" place="宇宙日历 · 把宇宙的一生压成一年" at={t(105.1)} />
      <Subtitle
        zh={["宇宙已经一百三十八亿岁，", "我们的整部文明，不过是它最后一瞬的呼吸。"]}
        en={["The universe is 13.8 billion years old;", "the whole of our civilization is but its final breath."]}
        at={t(105.5)}
        out={t(113.7)}
        tone="retro"
      />
      <Grain opacity={0.08} vignette={0.16} />
    </AbsoluteFill>
  );
};
