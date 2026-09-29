// 后来：从一格窗里退出来，回到图书馆的窗边，天已经晚了；星星一颗一颗亮起，那朵云慢慢飘出窗框。
// 墙上贴着那天在窗边拍的照片，最后一句写完，画面暗下去
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { ColorFade } from "../../../shared/ColorFade";
import { Grain } from "../../../shared/Grain";
import { Caption } from "../components/Caption";
import { Cloud, cumulus } from "../components/Cloud";
import { Polaroid } from "../components/Polaroid";
import { WindowSky } from "../components/WindowSky";
import { WindowView, paneCenter } from "../components/WindowView";
import { DIP, DUSK, EASE_IN_OUT, NIGHT, ROOM, SEGMENTS, asset, localTime } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.later);
const PANE = paneCenter(1, 1);
// 和旅程里是同一朵云
const HERO = cumulus("hero", 36, 300, 150);

const glow = { color: DUSK.cream, enColor: "rgba(248, 239, 227, 0.8)" };
const shadow = { textShadow: "0 2px 12px rgba(10, 12, 24, 0.5)" };

export const Later: React.FC = () => {
  const frame = useCurrentFrame();
  const back = interpolate(frame, [t(67.4), t(70.0)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const camera = { s: 1 + 2.2 * (1 - back), fx: PANE.x + (960 - PANE.x) * back, fy: PANE.y + (540 - PANE.y) * back };
  const night = interpolate(frame, [0, t(73.5)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const sky = {
    top: interpolateColors(night, [0, 1], [DUSK.top, NIGHT.top]),
    mid: interpolateColors(night, [0, 1], [DUSK.mid, NIGHT.mid]),
    low: interpolateColors(night, [0, 1], [DUSK.low, NIGHT.low]),
  };

  const hero = (
    <Cloud
      id="later-hero"
      puffs={HERO}
      x={interpolate(frame, [0, t(76.6)], [470, 1300], clamp)}
      y={300}
      scale={0.8}
      base={15}
      light={interpolateColors(night, [0, 1], ["#ffd8c0", "#7d84a3"])}
      mid={interpolateColors(night, [0, 1], ["#f2b7a8", "#5f6789"])}
      shade={interpolateColors(night, [0, 1], [DUSK.shade, "#2a3050"])}
      glow={DUSK.pink}
      glowOpacity={(1 - night) * 0.5}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: DIP }}>
      <WindowView
        camera={camera}
        sun={0}
        dim={interpolate(frame, [0, t(72)], [0.45, 0.85], clamp)}
        sky={
          <WindowSky colors={sky} cloud={{ light: "#fff", mid: "#fff", shade: "#fff" }} cloudOpacity={0} stars={interpolate(frame, [t(69.5), t(75.5)], [0, 1], clamp)}>
            {hero}
          </WindowSky>
        }
      >
        <Polaroid
          src={asset("photos/library_01.png")}
          width={360}
          aspect={1672 / 941}
          at={t(70.2)}
          rotate={-4}
          caption="坪山区图书馆 · 窗边"
          paper="#f3ecdf"
          ink={ROOM.ink}
          style={{ left: 170, top: 560, filter: "brightness(0.78)" }}
        />
      </WindowView>
      <ColorFade color={DIP} from={t(67.4)} to={t(68.3)} mode="in" />
      <Caption
        {...glow}
        zh={["有时候是云，走着，落着，", "不知道会去哪里；", "有时候得学着做一会儿天空。"]}
        en={["Sometimes we are the cloud, drifting, falling,", "not knowing where to;", "sometimes we must learn to be the sky for a while."]}
        at={t(67.7)}
        out={t(72.4)}
        size={46}
        enSize={22}
        stagger={2.2}
        style={{ left: 84, top: 150, ...shadow }}
      />
      <Caption
        {...glow}
        zh={["谁也不拴着谁，", "所以这个故事才能一直讲下去。"]}
        en={["Neither holds the other,", "and so the story goes on."]}
        at={t(72.7)}
        size={44}
        enSize={23}
        stagger={2.4}
        style={{ left: 84, top: 190, ...shadow }}
      />
      <Grain opacity={0.06} vignette={0.45} />
      <ColorFade color="#000" from={t(76.2)} to={t(77.0)} mode="out" />
    </AbsoluteFill>
  );
};
