// 第二则 · 海：从上一章的暖光里坐上公交，到站后在沙滩上被烫得一路小跑，撑伞站进浪里；唢呐进来时浪漫过一切，沉进水底的金色光网，
// 一声「呲」冒出满屏气泡，浮上来已是傍晚的海
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { ChapterHeader } from "../components/ChapterHeader";
import { ColorFade } from "../../../shared/ColorFade";
import { Grain } from "../../../shared/Grain";
import { Polaroid } from "../components/Polaroid";
import { Beach } from "./sea/Beach";
import { BusRide } from "./sea/BusRide";
import { Caustics } from "./sea/Caustics";
import { Fizz } from "./sea/Fizz";
import { Sunset } from "./sea/Sunset";
import { CHAPTERS, DAY, DUSK, asset, chapterDuration, localBeat } from "../theme";

const b = (k: number) => localBeat(CHAPTERS.sea, k);
const END = chapterDuration(CHAPTERS.sea);

const STEPS = [8, 8.5, 8.75, 9.25, 9.5, 10, 10.25, 10.75, 11, 11.5, 11.75, 12.25].map(b);
const TIDE = { rest: b(16), surge: b(17.2), hold: b(19), recede: b(20), rise: b(20.4), fill: b(21.2) };

const onSand = { color: DAY.ink, enColor: DAY.inkSoft };
const onWater = {
  color: "#fffaf0",
  enColor: "rgba(255, 250, 240, 0.8)",
  style: { textShadow: "0 2px 18px rgba(0, 60, 70, 0.45)" },
};

// 照片在水里轻轻浮动
const Bob: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ transform: `translate(${Math.sin(frame / 23) * 6}px, ${Math.sin(frame / 17) * 10}px) rotate(${Math.sin(frame / 29) * 0.8}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};

export const SeaChapter: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: DAY.paper }}>
    <ChapterHeader
      numeral="第二则"
      title="海"
      weather="晴 · 午后 · 杨梅坑"
      en="II. The Sea — a sunny afternoon, Yangmeikeng"
      out={b(2.6)}
      color={DAY.ink}
      softColor={DAY.inkSoft}
    />
    <BusRide from={b(2.4)} to={b(7.2)} arriveAt={b(5.4)} />

    <Beach from={b(6.8)} to={b(21.8)} tide={TIDE} steps={STEPS} umbrellaAt={b(12.75)} />
    <Caption
      {...onSand}
      zh={["第一脚踩下去就后悔了，", "好烫！"]}
      en={["First step — instant regret.", "So hot!"]}
      at={b(7.6)}
      out={b(12.4)}
      style={{ left: 1150, top: 700 }}
    />
    <Caption
      {...onSand}
      zh={["我撑着伞，一个人站在浪里，", "也不走。"]}
      en={["Under my umbrella, alone in the waves,", "I just stayed."]}
      at={b(13)}
      out={b(16.2)}
      style={{ left: 150, top: 560 }}
    />
    <Caption
      {...onWater}
      zh={["冰冰凉凉地漫过脚背，", "从脚底一路舒服到后脑勺。"]}
      en={["Cold water rushed over my feet —", "bliss, from soles to scalp."]}
      at={b(16.6)}
      out={b(20.1)}
      size={54}
      align="center"
      style={{ ...onWater.style, left: 0, right: 0, top: 70 }}
    />

    <Caustics from={b(20.6)} to={b(30.2)} />
    <Bob>
      <Polaroid
        src={asset("photos/sand_02.png")}
        width={640}
        aspect={1631 / 918}
        at={b(23)}
        out={b(27.6)}
        rotate={4}
        caption="向大海比个耶"
        paper="#fbf7ee"
        ink={DAY.ink}
        style={{ left: 1080, top: 260 }}
      />
    </Bob>
    <Caption
      {...onWater}
      zh={["那会儿脑子里什么都没有，", "只觉得很轻、很自由。"]}
      en={["My mind went quiet;", "I only felt light, and free."]}
      at={b(21.6)}
      out={b(27.6)}
      size={66}
      style={{ ...onWater.style, left: 150, top: 380 }}
    />

    <Sunset from={b(29.4)} to={END} />
    <Fizz at={b(28)} duration={b(31) - b(28)} />
    <Caption {...onWater} zh={["呲——"]} en={["tsss—"]} at={b(28)} out={b(29.6)} size={120} align="center" style={{ ...onWater.style, left: 0, right: 0, top: 380 }} />
    <Polaroid
      src={asset("photos/sand_05.png")}
      width={780}
      aspect={1631 / 919}
      at={b(30.6)}
      out={b(35.2)}
      rotate={-2.5}
      caption="落日把海面染成了橙色"
      paper="#fbf5ea"
      ink={DAY.ink}
      style={{ left: 150, top: 170 }}
    />
    <Caption
      {...onSand}
      zh={["太阳慢慢斜下去，", "光变软了，", "海也跟着温柔了一点。"]}
      en={["The sun slid lower, the light softened,", "and the sea grew a little gentler too."]}
      at={b(31.2)}
      out={b(35.2)}
      style={{ left: 1110, top: 250 }}
    />

    <ColorFade color={DUSK.skyMid} from={b(35.3)} to={END} mode="out" />
    <Grain opacity={0.06} vignette={0.3} />
  </AbsoluteFill>
);
