// 第三则 · 暮色：晚风吹来几行字；唢呐再起时一笔画出高架桥，车灯一盏一盏亮起，快门一响，一切在「停下来」时定住；
// 最后天色暗下去，满屏的风送出「风经过的地方，都是抵达」
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { ChapterHeader } from "../components/ChapterHeader";
import { ColorFade } from "../components/ColorFade";
import { Grain } from "../components/Grain";
import { Polaroid } from "../components/Polaroid";
import { WindLines } from "../components/WindLines";
import { Bridge, DECK_SLOPE } from "./dusk/Bridge";
import { DuskSky } from "./dusk/DuskSky";
import { CHAPTERS, DUSK, HOME, asset, chapterDuration, localBeat } from "../theme";

const b = (k: number) => localBeat(CHAPTERS.dusk, k);
const END = chapterDuration(CHAPTERS.dusk);
const SHUTTER = b(17.5);

const ink = { color: DUSK.ink, enColor: DUSK.inkSoft };
const glow = { color: DUSK.cream, enColor: "rgba(246, 238, 226, 0.78)" };

// 快门：一下白闪
const Shutter: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [at, at + 2, at + 12], [0, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return flash > 0 ? <AbsoluteFill style={{ backgroundColor: "#fffaf2", opacity: flash }} /> : null;
};

export const DuskChapter: React.FC = () => (
  <AbsoluteFill>
    <DuskSky duration={END} windFrom={b(24)} deepenFrom={b(23.4)} deepenTo={b(25.2)} />
    <ChapterHeader
      numeral="第三则"
      title="暮色"
      weather="多云 · 傍晚 · 桥下"
      en="III. Dusk — cloudy evening, under the overpass"
      out={b(3.6)}
      color={DUSK.ink}
      softColor={DUSK.inkSoft}
    />

    <WindLines at={b(4)} duration={80} color={DUSK.cream} count={10} band={[140, 620]} seed="dusk-breeze" />
    <Caption
      {...ink}
      zh={["晚风从很远的地方来，", "路过车流，路过草尖，", "也路过我。", "它什么都不问。"]}
      en={["The evening wind came from far away,", "past the traffic, past the grass, past me —", "and asked nothing."]}
      at={b(4.2)}
      out={b(11.4)}
      stagger={2.6}
      wind
      size={58}
      style={{ left: 150, top: 230 }}
    />

    <Bridge drawFrom={b(12)} drawTo={b(14.2)} railAt={b(13.6)} postsAt={b(14.2)} carsFrom={b(14.6)} freezeFrom={b(21)} freezeTo={b(21.7)} />
    <div style={{ position: "absolute", left: 170, top: 330, transform: `rotate(${(-Math.atan(DECK_SLOPE) * 180) / Math.PI}deg)`, transformOrigin: "0 100%" }}>
      <Caption
        {...ink}
        zh={["高架桥横过头顶，", "像一行还没写完的句子。"]}
        en={["The overpass ran above me", "like a sentence not yet finished."]}
        at={b(12.4)}
        out={b(17.3)}
        style={{ position: "relative" }}
      />
    </div>

    <Shutter at={SHUTTER} />
    <Polaroid
      src={asset("photos/city_walk.png")}
      width={640}
      aspect={805 / 498}
      at={SHUTTER + 2}
      out={b(23.4)}
      rotate={3}
      caption="一张没有意义的照片"
      paper={DUSK.cream}
      ink={DUSK.ink}
      style={{ left: 1110, top: 130 }}
    />
    <Caption
      {...ink}
      zh={["也许意义从来不在画面里，", "它只是需要", "有人在那一刻停下来。"]}
      en={["Maybe the meaning was never in the picture —", "it only needs someone", "to stop, right then."]}
      at={b(18)}
      out={b(23.4)}
      size={54}
      style={{ left: 150, top: 170 }}
    />

    <WindLines at={b(24)} duration={120} color={DUSK.cream} count={24} band={[60, 1020]} lift={180} seed="dusk-gust" />
    <Caption
      {...glow}
      zh={["风不必靠岸，", "风经过的地方，", "都是抵达。"]}
      en={["The wind needs no shore;", "everywhere it passes", "is an arrival."]}
      at={b(24.4)}
      out={b(29.2)}
      stagger={4}
      wind
      size={82}
      enSize={30}
      align="center"
      style={{ left: 0, right: 0, top: 200, textShadow: "0 2px 24px rgba(30, 20, 30, 0.55)" }}
    />

    <ColorFade color={DUSK.skyMid} from={0} to={14} mode="in" />
    <ColorFade color={HOME.room} from={b(29.3)} to={END} mode="out" />
    <Grain opacity={0.07} vignette={0.4} />
  </AbsoluteFill>
);
