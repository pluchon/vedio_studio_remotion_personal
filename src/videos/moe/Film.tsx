// 整片的总装：手帐底图、卡片里的动漫镜头、盖在镜头上的胶带和夹子、左上角越贴越多的拍立得、飘落的花瓣、页脚的小人
import React, { useMemo } from "react";
import { OffthreadVideo } from "remotion";
import { AbsoluteFill, Freeze, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioScore } from "../../shared/audioScore";
import { Plan, Pose, boil, chibiAt, cutIndexAt, makePlan, reelFrameAt, stepped } from "./plan";
import { BLINK, CARD, GROUND, HEIGHT, INK, PARTS, PILES, REEL, WIDTH, asset } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 底图本身很亮，白发和纸几乎顶到纯白。压一点亮度、加一点对比和饱和，高光里才有层次
const TONE = "brightness(0.93) contrast(1.06) saturate(1.12)";

// 每个姿势画出来多高（像素）。坐着的几张原图画得偏大，这里缩回去
const POSE_HEIGHT: Record<Pose, number> = {
  walk1: 372,
  walk2: 372,
  jump1: 342,
  jump2: 394,
  sleepy1: 292,
  sleepy2: 284,
  watch1: 298,
  watch2: 292,
};
const POSES = Object.keys(POSE_HEIGHT) as Pose[];

// 卡片里的镜头：换上来的那一下整张卡片顿一下
const Reel: React.FC<{ plan: Plan; seconds: number }> = ({ plan, seconds }) => {
  const { fps } = useVideoConfig();
  const frame = Math.round(seconds * fps);
  const reelFrame = reelFrameAt(plan, seconds, fps);
  if (reelFrame === null) {
    return null;
  }
  const index = cutIndexAt(plan, seconds);
  const sinceCut = Math.round((seconds - plan.cuts[index].time) * fps);
  const pop = sinceCut < 2 ? 1.035 : sinceCut < 4 ? 0.992 : 1;
  // 尾声里镜头慢慢褪回空白的卡片，一格一格地淡
  const fade = interpolate(stepped(frame, 3) / fps, [PARTS.fade, PARTS.fade + 2.4], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x - CARD.w / 2,
        top: CARD.y - CARD.h / 2,
        width: CARD.w,
        height: CARD.h,
        transform: `rotate(${CARD.tilt}deg) scale(${pop})`,
        overflow: "hidden",
        borderRadius: 10,
        opacity: fade,
      }}
    >
      <Freeze frame={reelFrame}>
        <OffthreadVideo src={staticFile(REEL)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Freeze>
      {/* 镜头边缘压暗一点，像贴在纸上的照片 */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 26px rgba(120, 90, 60, 0.28)" }} />
    </div>
  );
};

// 看完的镜头定格成拍立得，「啪」地贴到左上角，两沓轮流叠
const Polaroids: React.FC<{ plan: Plan; seconds: number }> = ({ plan, seconds }) => {
  const { fps } = useVideoConfig();
  const current = cutIndexAt(plan, seconds);
  const cards: React.ReactNode[] = [];
  // 每一沓只有最上面几张看得见，更早的不用画
  for (let i = Math.max(0, current - 6); i < current; i++) {
    const pile = PILES[i % PILES.length];
    const age = Math.round((seconds - plan.cuts[i + 1].time) * fps);
    // 三格飞到位：先大后小，最后压扁一下
    const u = age < 3 ? 0.3 : age < 6 ? 0.78 : 1;
    const squash = age >= 6 && age < 9 ? 0.94 : 1;
    const x = CARD.x + (pile.x + (random(`pile-x-${i}`) - 0.5) * 34 - CARD.x) * u;
    const y = CARD.y + (pile.y + (random(`pile-y-${i}`) - 0.5) * 26 - CARD.y) * u;
    const tilt = pile.tilt + (random(`pile-r-${i}`) - 0.5) * 16;
    const scale = (2.4 - 1.4 * u) * squash;
    cards.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: x - 124,
          top: y - 112,
          width: 248,
          height: 224,
          background: "#fffdf8",
          boxShadow: "0 3px 10px rgba(110, 80, 60, 0.28)",
          transform: `rotate(${tilt * u}deg) scale(${scale})`,
        }}
      >
        <Img src={staticFile(asset(`clips/shot-${String(plan.cuts[i].shot).padStart(2, "0")}.jpg`))} style={{ position: "absolute", left: 12, top: 12, width: 224, height: 166, objectFit: "cover" }} />
      </div>,
    );
  }
  return <>{cards}</>;
};

const HEART = "M 0 8 C -14 -6, -30 6, -16 20 L 0 34 L 16 20 C 30 6, 14 -6, 0 8 Z";
const STAR = "M 0 -22 L 6 -6 L 22 0 L 6 6 L 0 22 L -6 6 L -22 0 L -6 -6 Z";

// 每换一个镜头，卡片四周蹦出两三个小贴纸
const Sparks: React.FC<{ plan: Plan; seconds: number }> = ({ plan, seconds }) => {
  const { fps } = useVideoConfig();
  const index = cutIndexAt(plan, seconds);
  if (index < 0) {
    return null;
  }
  const age = Math.round((seconds - plan.cuts[index].time) * fps);
  if (age >= 15) {
    return null;
  }
  const size = age < 3 ? 0.6 : age < 6 ? 1.2 : 1;
  const alpha = age < 12 ? 1 : 0.5;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
      {[0, 1, 2].map((n) => {
        const side = random(`spark-side-${index}-${n}`) > 0.5 ? 1 : -1;
        const x = CARD.x + side * (CARD.w / 2 + 6 + random(`spark-x-${index}-${n}`) * 40);
        const y = CARD.y + (random(`spark-y-${index}-${n}`) - 0.5) * CARD.h * 0.9;
        const heart = random(`spark-k-${index}-${n}`) > 0.45;
        return (
          <g key={n} transform={`translate(${x} ${y}) rotate(${(random(`spark-r-${index}-${n}`) - 0.5) * 50}) scale(${size * (0.8 + random(`spark-s-${index}-${n}`) * 0.6)})`} opacity={alpha}>
            <path d={heart ? HEART : STAR} fill={heart ? INK.pinkDeep : INK.yellow} stroke="#fffdf8" strokeWidth={7} strokeLinejoin="round" paintOrder="stroke" />
          </g>
        );
      })}
    </svg>
  );
};

const PETALS = new Array(11).fill(0).map((_, i) => ({
  x: random(`petal-x-${i}`) * WIDTH,
  start: random(`petal-y-${i}`),
  speed: 46 + random(`petal-v-${i}`) * 40,
  sway: 30 + random(`petal-w-${i}`) * 50,
  size: 0.7 + random(`petal-s-${i}`) * 0.7,
  spin: (random(`petal-r-${i}`) - 0.5) * 80,
}));

// 几片花瓣慢慢飘下来，也是一格一格地动
const Petals: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const t = stepped(frame, 3) / fps;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
      {PETALS.map((petal, i) => {
        const y = ((petal.start * (HEIGHT + 120) + t * petal.speed) % (HEIGHT + 120)) - 60;
        const x = petal.x + Math.sin(t * 0.8 + i) * petal.sway;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${petal.spin * t * 0.4 + i * 40}) scale(${petal.size})`} opacity={0.85}>
            <path d="M 0 -16 C 12 -12, 14 6, 0 16 C -14 6, -12 -12, 0 -16 Z" fill={INK.pink} />
            <path d="M 0 -10 C 4 -4, 4 4, 0 12" fill="none" stroke="#fde3e8" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};

// 页脚的小人：姿势按安排切换，线条每一格抖一点
const ChibiSprite: React.FC<{ plan: Plan; seconds: number }> = ({ plan, seconds }) => {
  const { fps } = useVideoConfig();
  const frame = Math.round(seconds * fps);
  const chibi = chibiAt(plan, seconds, fps);
  const shake = boil("chibi", frame);
  return (
    <>
      {/* 所有姿势都挂着，只显示当前这一张，换姿势时不用等图片加载 */}
      {POSES.map((pose) => (
        <Img
          key={pose}
          src={staticFile(asset(`pose/${pose}.png`))}
          style={{
            position: "absolute",
            height: POSE_HEIGHT[pose],
            left: chibi.x + shake.x,
            top: GROUND - chibi.lift + shake.y,
            // 以脚底中点为轴：左右翻面和抖动都不会让她挪位置
            transformOrigin: "50% 100%",
            transform: `translate(-50%, -100%) rotate(${shake.tilt}deg) scaleX(${chibi.flip ? -1 : 1})`,
            opacity: chibi.visible && chibi.pose === pose ? 1 : 0,
            // 一圈白边加一点投影：像一枚裁好的贴纸
            filter: "drop-shadow(4px 0 0 #fffdf8) drop-shadow(-4px 0 0 #fffdf8) drop-shadow(0 4px 0 #fffdf8) drop-shadow(0 -4px 0 #fffdf8) drop-shadow(0 4px 6px rgba(110, 80, 60, 0.35))",
          }}
        />
      ))}
    </>
  );
};

export const Film: React.FC<{ score: AudioScore }> = ({ score }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const plan = useMemo(() => makePlan(score), [score]);

  // 底图里的女孩：隔几秒眨一下眼；尾声里闭上眼睛不再睁开
  const blinkEvery = Math.round(3.6 * fps);
  const blinking = frame % blinkEvery >= blinkEvery - 5 && frame % blinkEvery < blinkEvery - 1;
  const eyesClosed = blinking || seconds > PARTS.fade + 1.6;
  const curtain = interpolate(stepped(frame, 3) / fps, [PARTS.end - 1.8, PARTS.end - 0.2], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: INK.paper }}>
      <Img src={staticFile(asset("img/base.jpg"))} style={{ position: "absolute", width: WIDTH, height: HEIGHT, filter: TONE }} />
      <Reel plan={plan} seconds={seconds} />
      {/* 同一张底图，卡片的底色抠掉了：胶带、夹子、花瓣盖在镜头上面 */}
      <Img src={staticFile(asset("img/base-top.png"))} style={{ position: "absolute", width: WIDTH, height: HEIGHT, filter: TONE }} />
      {/* 闭眼的那一块要盖在两层底图之上 */}
      <Img
        src={staticFile(asset("img/blink.jpg"))}
        style={{
          position: "absolute",
          left: BLINK.x,
          top: BLINK.y,
          width: BLINK.w,
          height: BLINK.h,
          opacity: eyesClosed ? 1 : 0,
          filter: TONE,
          maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 72%, transparent 100%)",
        }}
      />
      <Polaroids plan={plan} seconds={seconds} />
      <Petals frame={frame} />
      <Sparks plan={plan} seconds={seconds} />
      <ChibiSprite plan={plan} seconds={seconds} />
      <AbsoluteFill style={{ backgroundColor: INK.paper, opacity: curtain }} />
    </AbsoluteFill>
  );
};
