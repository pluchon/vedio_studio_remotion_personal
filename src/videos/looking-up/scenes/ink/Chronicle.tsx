// 墨 · 公元前 613 年：史官立在台上仰头；北斗七星一颗颗亮起，一颗拖着长尾的彗星划进斗里；
// 旁边竹简上一字一字写下「秋七月有星孛入于北斗」。半句之后，一千多年后的敦煌星图压上来——记下的星，一代代传了下去
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Camera, InkImage, Mist } from "../../components/Ink";
import { starPath } from "../../components/InkStars";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { EASE_IN_OUT, EASE_OUT, FONTS, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.chronicle);

// 北斗七星：天枢、天璇、天玑、天权、玉衡、开阳、摇光
const DIPPER = [
  [0, 0],
  [4, 62],
  [86, 80],
  [102, 24],
  [168, 12],
  [234, 6],
  [306, 40],
].map(([x, y]) => ({ x: 1120 + x * 1.5, y: 120 + y * 1.5 }));
const BOWL = { x: (DIPPER[0].x + DIPPER[2].x) / 2, y: (DIPPER[0].y + DIPPER[2].y) / 2 + 6 };
const COMET_FROM = { x: 1840, y: 40 };

const TEXT = [..."秋七月有星孛入于北斗"];
const SLIPS = { right: 1800, top: 330, width: 50, gap: 8, count: 5, height: 520 };

const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  const c = interpolate(frame, [t(46.7), t(49.0)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const head = { x: COMET_FROM.x + (BOWL.x - COMET_FROM.x) * c, y: COMET_FROM.y + (BOWL.y - COMET_FROM.y) * c };
  const dir = Math.atan2(COMET_FROM.y - BOWL.y, COMET_FROM.x - BOWL.x);
  const tail = 260 * Math.min(1, c * 3);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {DIPPER.slice(0, -1).map((s, i) => {
        const e = DIPPER[i + 1];
        const p = interpolate(frame, [t(46.5) + i * 4, t(46.5) + i * 4 + 10], [0, 1], clamp);
        return <line key={i} x1={s.x} y1={s.y} x2={s.x + (e.x - s.x) * p} y2={s.y + (e.y - s.y) * p} stroke={PAPER.ink} strokeWidth={1.2} strokeDasharray="2 6" opacity={0.6} />;
      })}
      {/* 斗口合上 */}
      <line x1={DIPPER[3].x} y1={DIPPER[3].y} x2={DIPPER[0].x} y2={DIPPER[0].y} stroke={PAPER.ink} strokeWidth={1.2} strokeDasharray="2 6" opacity={interpolate(frame, [t(47.4), t(47.8)], [0, 0.6], clamp)} />
      {DIPPER.map((s, i) => {
        const p = interpolate(frame, [t(46.2) + i * 3, t(46.2) + i * 3 + 10], [0, 1], { ...clamp, easing: EASE_OUT });
        return <path key={i} d={starPath(11 * p)} transform={`translate(${s.x} ${s.y})`} fill={PAPER.ink} />;
      })}
      {c > 0 && (
        <g transform={`translate(${head.x} ${head.y}) rotate(${(dir * 180) / Math.PI})`}>
          {/* 彗尾：几道刻线往后散开 */}
          {[-10, -5, 0, 5, 10].map((a, k) => (
            <line key={k} x1={0} y1={0} x2={tail * (1 - Math.abs(a) / 30)} y2={a * tail * 0.012} stroke={PAPER.ink} strokeWidth={k === 2 ? 2 : 1} opacity={0.65 - Math.abs(a) * 0.03} />
          ))}
          <circle r={7} fill={PAPER.ink} />
          <circle r={16} fill="none" stroke={PAPER.ink} strokeWidth={0.8} opacity={0.5} />
        </g>
      )}
      <text x={BOWL.x - 20} y={BOWL.y + 120} fontFamily={FONTS.song} fontSize={26} letterSpacing="0.2em" fill={PAPER.cinnabar} style={inkIn(frame, t(48.4), 14)}>
        北斗
      </text>
    </svg>
  );
};

// 竹简：几根竹片用两道绳编在一起，第二根上一字一字写下去
const Slips: React.FC = () => {
  const frame = useCurrentFrame();
  const show = interpolate(frame, [t(46.4), t(46.9)], [0, 1], clamp);
  const x = (k: number) => SLIPS.right - (k + 1) * (SLIPS.width + SLIPS.gap);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: show }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: SLIPS.count }, (_, k) => (
          <rect key={k} x={x(k)} y={SLIPS.top} width={SLIPS.width} height={SLIPS.height} rx={4} fill={PAPER.deep} stroke={PAPER.ink} strokeWidth={1.2} />
        ))}
        {[0.2, 0.8].map((f) => (
          <line key={f} x1={x(SLIPS.count - 1) - 10} y1={SLIPS.top + SLIPS.height * f} x2={SLIPS.right + 6} y2={SLIPS.top + SLIPS.height * f} stroke={PAPER.ink} strokeWidth={2.4} opacity={0.7} />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: x(1) + SLIPS.width / 2,
          top: SLIPS.top + 22,
          transform: "translateX(-50%)",
          writingMode: "vertical-rl",
          fontFamily: FONTS.song,
          fontSize: 38,
          lineHeight: 1,
          letterSpacing: "0.06em",
          color: PAPER.ink,
        }}
      >
        {TEXT.map((ch, i) => (
          <span key={i} style={{ display: "inline-block", ...inkIn(frame, t(47.0) + i * 5, 12) }}>
            {ch}
          </span>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: x(SLIPS.count - 1) - 20,
          top: SLIPS.top + SLIPS.height + 24,
          fontFamily: FONTS.song,
          fontSize: 24,
          letterSpacing: "0.16em",
          color: PAPER.cinnabar,
          whiteSpace: "nowrap",
          ...inkIn(frame, t(49.2), 14),
        }}
      >
        ——《春秋 · 文公十四年》
      </div>
    </div>
  );
};

// 敦煌星图：像一张旧纸摊在画面上
const Atlas: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [t(50.65), t(51.4)], [0, 1], { ...clamp, easing: EASE_OUT });
  if (p <= 0) return null;
  const drift = interpolate(frame, [t(50.65), t(55.13)], [0, 1]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: PAPER.base, opacity: p * 0.72 }} />
      <div
        style={{
          position: "absolute",
          left: 960 - 390,
          top: 70,
          width: 780,
          height: 783,
          opacity: p,
          rotate: `${-1.5 + drift * 0.6}deg`,
          scale: `${0.96 + p * 0.04 + drift * 0.03}`,
          boxShadow: "0 18px 40px rgba(60, 40, 20, 0.35)",
        }}
      >
        <Img src={staticFile(asset("plates/dunhuang.jpg"))} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.15)" }} />
      </div>
    </AbsoluteFill>
  );
};

export const Chronicle: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, t(50.65)], [1.0, 1.05]);
  return (
    <AbsoluteFill>
      <Xuan />
      <Camera scale={push} origin="40% 60%">
        <InkImage src={asset("engravings/scribe.png")} focus="50% 100%" />
      </Camera>
      <Sky />
      <Slips />
      <Atlas />
      <Mist tone="ink" />
      <Locator year="公元前 613 年" place="鲁国" at={t(46.3)} out={t(50.4)} tone="ink" />
      <Locator year="约公元 700 年" place="敦煌 · 唐" at={t(50.9)} tone="ink" />
      <Subtitle
        zh={["两千六百多年前，有人把一颗彗星写进了史书，", "像是留给宇宙的一行回信。"]}
        en={["More than 2,600 years ago, someone wrote a comet into the annals,", "like a reply to the universe."]}
        at={t(46.9)}
        out={t(50.4)}
        tone="ink"
      />
      <Subtitle zh={["星辰给了我们时间，时间给了我们文明。"]} en={["The stars gave us time, and time gave us civilization."]} at={t(51.3)} out={t(54.9)} tone="ink" />
      <Grain opacity={0.05} vignette={0.2} />
    </AbsoluteFill>
  );
};
