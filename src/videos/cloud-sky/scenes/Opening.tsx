// 窗边：午后的图书馆，大窗被切成一格一格，每格里一片云各走各的；片名写出，再写「云一直在动……只是走」；
// 引子收尾时镜头推进中间那一格，在那口长长的停顿里穿进云层
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../../../shared/Grain";
import { Caption } from "../components/Caption";
import { CloudVeil } from "../components/CloudVeil";
import { WindowSky } from "../components/WindowSky";
import { WindowView, paneCenter } from "../components/WindowView";
import { DAY, EASE_IN_OUT, ROOM, SEGMENTS, localTime } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.opening);
const PANE = paneCenter(1, 1);

const ink = { color: ROOM.ink, enColor: ROOM.inkSoft };

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [t(13.2), t(17.0)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const camera = {
    s: 1 + Math.pow(push, 1.6) * 6,
    fx: 960 + (PANE.x - 960) * Math.min(1, push * 1.6),
    fy: 540 + (PANE.y - 540) * Math.min(1, push * 1.6),
  };

  return (
    <AbsoluteFill>
      <WindowView camera={camera} sky={<WindowSky colors={DAY} cloud={{ light: DAY.cloud, mid: DAY.cloudMid, shade: DAY.cloudShade }} />} />
      <Caption {...ink} zh={["云走过的地方，", "天空都记得"]} at={t(0.3)} out={t(6.6)} size={84} stagger={5} style={{ left: 84, top: 200 }} />
      <Caption
        {...ink}
        zh={["日常生活 · 云与天空"]}
        en={["Where the Clouds Have Been, the Sky Remembers"]}
        at={t(3.0)}
        out={t(6.6)}
        size={34}
        enSize={22}
        style={{ left: 88, top: 470, color: ROOM.inkSoft }}
      />
      <Caption
        {...ink}
        zh={["云一直在动，", "却一点也不着急，", "好像很早以前就决定了，", "不去哪里，只是走。"]}
        en={["The clouds kept moving,", "yet never in a hurry,", "as if they had decided long ago:", "go nowhere, just keep going."]}
        at={t(7.2)}
        out={t(13.2)}
        size={50}
        enSize={24}
        stagger={2.4}
        style={{ left: 84, top: 220 }}
      />
      <CloudVeil from={t(15.9)} to={t(17.1)} mode="cover" />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
