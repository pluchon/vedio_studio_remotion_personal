// 结尾：一家人出来挥手，气球升起来，烟花和彩纸屑；字幕条变回对话框，等着下一个问题
import { Lottie } from "@remotion/lottie";
import React from "react";
import { Sequence } from "remotion";
import { BuddyG, headTop, Kind, Pose, REST } from "../Buddy";
import { CONFETTI, CONFETTI_FRAMES } from "../confetti";
import { Burst, Kao, Twinkles } from "../emotes";
import {
  Cam,
  during,
  EASE,
  hop,
  jelly,
  mix,
  ramp,
  track,
  jolt,
} from "../motion";
import { Paper } from "../Paper";
import {
  At,
  Balloon,
  Bunting,
  Bush,
  Cloud,
  Flower,
  Sun,
  Tree,
  Beams,
  Foliage,
} from "../scenery";
import { Pop } from "../stickers";
import { C, floorY, FPS, HEIGHT, TEXT, WIDTH } from "../theme";

const T = { family: 2.2, confetti: 2.5, box: 5.3, credit: 6.5 };
const FAMILY: { kind: Kind; x: number; size: number }[] = [
  { kind: "haiku", x: 200, size: 84 },
  { kind: "sonnet", x: 520, size: 116 },
  { kind: "fable", x: 1500, size: 182 },
];
const BALLOONS = [
  { x: 110, y: 430, fill: C.coral },
  { x: 330, y: 410, fill: C.lemon },
  { x: 1560, y: 450, fill: C.mint },
  { x: 1890, y: 340, fill: C.lilac },
  { x: 1840, y: 570, fill: C.pink },
];
const FIREWORKS = [
  { at: 2.6, x: 420, y: 320 },
  { at: 3.0, x: 1480, y: 280 },
  { at: 3.45, x: 960, y: 200 },
  { at: 8.2, x: 300, y: 420 },
  { at: 8.5, x: 1620, y: 400 },
];

export const pose = (t: number): Pose => {
  const jump = hop(t, T.confetti, 0.42, 120);
  const again = hop(t, T.credit + 1.6, 0.36, 80);
  const down = during(t, T.box, T.credit + 0.4, 0.3);
  return {
    ...REST,
    lift: jump.lift + again.lift,
    squash: jump.squash + again.squash,
    lookY: 0.7 * down,
    wave: during(t, 0.5, T.confetti - 0.1, 0.25),
    cheer:
      during(t, T.confetti, T.box - 0.2, 0.25) +
      ramp(t, T.credit + 1.6, T.credit + 1.85),
    mood:
      t > T.credit + 1.6
        ? "star"
        : t > T.confetti && t < T.box - 0.3
          ? "happy"
          : t > T.credit + 0.5
            ? "wink"
            : "smile",
  };
};

// 镜头：一家人出来时推近一点，落款出来以后慢慢拉成全景
export const camera = (t: number): Cam => ({
  z: track(t, [
    [0.2, 1.05],
    [T.confetti + 0.3, 1.09],
    [T.box, 1.04],
    [T.credit + 1, 1],
  ]),
  fx: 960,
  fy: 620,
  sy:
    jolt(t, T.confetti + 0.42, 0.7) +
    jolt(t, 2.6, 0.3) +
    jolt(t, 3.0, 0.3) +
    jolt(t, 3.45, 0.3),
});

export const Back: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Paper t={t} backColor="#FDEBD0" />
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <At x={1740} y={190}>
        <Beams t={t} />
        <Sun t={t} />
      </At>
      <At x={1560} y={120} s={0.6}>
        <Cloud t={t} seed={2} />
      </At>
      <Bunting
        t={t}
        x1={-20}
        y1={30}
        x2={1940}
        y2={30}
        sag={46}
        count={18}
        k={ramp(t, 1.9, 3.0, EASE.out)}
      />
      <At x={90} y={floorY(90) + 14} s={0.9}>
        <Tree t={t} />
      </At>
      <At x={1850} y={floorY(1850) + 14} s={0.8}>
        <Tree t={t} seed={3} fill="#A6DB8E" />
      </At>
      <At x={1280} y={floorY(1280) + 30} s={0.8}>
        <Bush fill={C.leafDeep} />
      </At>
      <At x={760} y={floorY(760) + 40}>
        <Flower t={t} />
      </At>
      <At x={1190} y={floorY(1190) + 60} s={0.9}>
        <Flower t={t} seed={2} fill={C.lemon} />
      </At>
      {/* 气球一只一只升起来 */}
      {BALLOONS.map((balloon, i) => {
        const up = ramp(t, 2.3 + i * 0.18, 4.4 + i * 0.18, EASE.out);
        return (
          <At
            key={balloon.x}
            x={balloon.x}
            y={mix(HEIGHT + 260, balloon.y, up)}
            s={0.9}
          >
            <Balloon t={t} fill={balloon.fill} seed={i} />
          </At>
        );
      })}
      {FIREWORKS.map((fire, i) => (
        <Burst
          key={i}
          t={t}
          at={fire.at}
          x={fire.x}
          y={fire.y}
          reach={300}
          count={16}
          seconds={1}
          ring={[C.lemon, C.pink, C.mint][i % 3]}
          seed={`fire-${i}`}
        />
      ))}
      {FAMILY.map((member, i) => {
        const at = T.family + i * 0.14;
        if (t < at) return null;
        const born = jelly(t, at);
        const cheer = hop(t, T.credit + 1.7 + i * 0.08, 0.34, 56);
        return (
          <BuddyG
            key={member.kind}
            t={t}
            kind={member.kind}
            seed={i + 1}
            pose={{
              ...REST,
              x: member.x,
              size: member.size,
              scale: born.scale,
              squash: born.squash + cheer.squash,
              lift: cheer.lift,
              lookX: member.x < 960 ? 0.4 : -0.4,
              wave: during(t, at + 0.3, T.credit + 1.6, 0.25),
              cheer: ramp(t, T.credit + 1.7, T.credit + 1.95),
              mood: "happy",
            }}
          />
        );
      })}
      <At x={0} y={0} s={1.5}>
        <Foliage t={t} seed={2} />
      </At>
      <Twinkles
        t={t}
        at={T.credit + 0.6}
        out={99}
        x={WIDTH / 2}
        y={230}
        spread={560}
        count={8}
        seed="credit"
      />
    </svg>
    {/* 落款 */}
    <Pop t={t} at={T.credit} x={WIDTH / 2} y={230} from={[0, -260]} float={5}>
      <div
        style={{ textAlign: "center", whiteSpace: "nowrap", fontFamily: TEXT }}
      >
        <div style={{ fontSize: 100, fontWeight: 700 }}>
          你好，我是 <span style={{ color: C.coral }}>Claude</span>
        </div>
        <div style={{ fontSize: 42, opacity: 0.66, marginTop: 6 }}>
          画面、配乐、文案：Claude Opus 5.5 · 用 Remotion 一行一行写成
        </div>
      </div>
    </Pop>
  </>
);

export const Front: React.FC<{ t: number }> = ({ t }) => {
  const me = pose(t);
  return (
    <>
      {/* 彩纸屑盖在所有人前面 */}
      <Sequence
        from={Math.round(T.confetti * FPS)}
        durationInFrames={CONFETTI_FRAMES}
      >
        <Lottie
          animationData={CONFETTI}
          style={{
            position: "absolute",
            inset: 0,
            width: WIDTH,
            height: HEIGHT,
          }}
        />
      </Sequence>
      <Kao
        t={t}
        at={T.family + 0.8}
        out={T.box - 0.3}
        x={200 + 150}
        y={600}
        text="(≧▽≦)"
        size={36}
        turn={8}
      />
      <Kao
        t={t}
        at={T.family + 1.0}
        out={T.box - 0.3}
        x={1500 + 150}
        y={430}
        text="(*´▽｀*)"
        size={36}
        turn={8}
      />
      <Kao
        t={t}
        at={T.confetti + 0.6}
        out={T.box - 0.2}
        x={me.x + 20}
        y={headTop(me) - 70}
        text="ヽ(・∀・)ノ"
      />
      <Kao
        t={t}
        at={T.credit + 1.9}
        out={99}
        x={me.x + 20}
        y={headTop(me) - 80}
        text="(✧∀✧)"
        fill={C.lemon}
        size={50}
      />
    </>
  );
};
