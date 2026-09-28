// 第一则 · 猫：赶路的光斑停下，一盏小灯亮起，小猫走进光里蹭了蹭，最后灯光铺满画面，接到下一章的正午
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { ChapterHeader } from "../components/ChapterHeader";
import { Grain } from "../components/Grain";
import { Polaroid } from "../components/Polaroid";
import { Asphalt } from "./cat/Asphalt";
import { Checklist } from "./cat/Checklist";
import { Lamp, POOL, swellProgress } from "./cat/Lamp";
import { PawPrints, walkPrints } from "./cat/PawPrints";
import { Traffic } from "./cat/Traffic";
import { CHAPTERS, NIGHT, asset, localBeat } from "../theme";

// 章节内第 k 拍的帧
const b = (k: number) => localBeat(CHAPTERS.cat, k);

// 被蹭一下：从 at 帧起的一次衰减摆动
const nudge = (frame: number, at: number, strength: number) => {
  const t = frame - at;
  return t < 0 ? 0 : strength * Math.exp(-t / 9) * Math.sin(t / 3.4);
};

const PRINTS = walkPrints(
  { x: 1640, y: 1040 },
  { x: POOL.x + 30, y: POOL.y + 10 },
  5,
  [b(14), b(14.5), b(15), b(15.5), b(16), b(17), b(17.5)],
);

const CHECKLIST = [
  { zh: "蹭鞋成功", en: "nuzzled my shoe", at: b(25) },
  { zh: "撒娇成功", en: "acted cute", at: b(26) },
  { zh: "吃饭成功", en: "finished every bite", at: b(27) },
  { zh: "山竹爪爪暴击", en: "mangosteen paws: critical hit", at: b(28) },
];

const caption = { color: NIGHT.text, enColor: NIGHT.textSoft };

// 路灯的光扩散到铺满画面的区间
const SWELL: [number, number] = [b(32.5), b(36)];

export const CatChapter: React.FC = () => {
  const frame = useCurrentFrame();
  const push = nudge(frame, b(18), 1) + nudge(frame, b(20), 1.4);

  return (
    <AbsoluteFill style={{ backgroundColor: NIGHT.groundDeep }}>
      <AbsoluteFill
        style={{ transform: `translateX(${push * -24}px) rotate(${push * 1.2}deg) scale(1.05)`, transformOrigin: "50% 75%" }}
      >
        <Asphalt />
        <Traffic dimUntil={b(3.8)} stopFrom={b(10)} stopTo={b(12.5)} fadeFrom={b(11.5)} fadeTo={b(13.5)} />
        <Lamp onAt={b(12.5)} swellFrom={SWELL[0]} swellTo={SWELL[1]} />
        <PawPrints prints={PRINTS} dim={[b(21.5), b(29.5)]} out={b(33)} />
        <Polaroid
          src={asset("photos/cat.png")}
          width={700}
          aspect={804 / 499}
          at={b(22.4)}
          out={b(29.5)}
          rotate={-3.5}
          caption="路上偶遇 · 山竹哈基米"
          paper={NIGHT.paper}
          ink="#4a4238"
          style={{ left: 290, top: 200 }}
        />
        <Checklist title="今夜偶遇记录" items={CHECKLIST} at={b(24.2)} out={b(29.5)} style={{ left: 1210, top: 250 }} />
      </AbsoluteFill>

      <ChapterHeader
        numeral="第一则"
        title="猫"
        weather="夜 · 街角"
        en="I. The Cat — night, a street corner"
        out={b(3.6)}
        color={NIGHT.text}
        softColor={NIGHT.textSoft}
      />
      <Caption
        {...caption}
        zh={["我们每天都在赶路，", "路过很多人，也路过很多风景。"]}
        en={["Every day we hurry on,", "past so many people, so many views."]}
        at={b(4)}
        out={b(10.3)}
        style={{ left: 170, top: 720 }}
      />
      <Caption
        {...caption}
        zh={["可是今晚不一样。"]}
        en={["But tonight was different."]}
        at={b(11)}
        out={b(14.8)}
        align="center"
        style={{ left: 0, right: 0, top: 250 }}
      />
      <Caption {...caption} zh={["蹭一下。"]} en={["A little nudge."]} at={b(18)} out={b(21.6)} size={64} style={{ left: 240, top: 250 }} />
      <Caption {...caption} zh={["再蹭一下。"]} en={["And another."]} at={b(20)} out={b(21.6)} size={64} style={{ left: 330, top: 420 }} />
      <Caption
        {...caption}
        zh={["就像忙了一整天之后，", "忽然有人在你身边，", "放了一盏很小的灯。"]}
        en={["Like, after a long day,", "someone quietly set", "a small lamp beside you."]}
        at={b(29.8)}
        out={b(35)}
        stagger={2}
        align="center"
        style={{ left: 0, right: 0, top: 170 }}
      />
      <Grain vignette={0.55 * (1 - swellProgress(frame, SWELL[0], SWELL[1]))} />
    </AbsoluteFill>
  );
};
