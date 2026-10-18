// 《萌部落》演示片总装：各幕按配乐的小节排好，幕与幕之间用一阵彩色泡泡盖过去
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { C, EASE_IN_OUT, useFonts } from "./kit";
import { Arch } from "./scenes/Arch";
import { Account, Create, Detail, Home, Search } from "./scenes/Community";
import { Intro, Outro } from "./scenes/Intro";
import { MengCast, MengChat, MengMemory, MengTone } from "./scenes/Meng";
import { Creator, Growth, Messages, Profile } from "./scenes/Quick";
import { BAR, SCENES, asset } from "./theme";

const PARTS: [keyof typeof SCENES, React.FC][] = [
  ["intro", Intro],
  ["account", Account],
  ["home", Home],
  ["create", Create],
  ["detail", Detail],
  ["search", Search],
  ["creator", Creator],
  ["growth", Growth],
  ["messages", Messages],
  ["profile", Profile],
  ["meng", MengCast],
  ["chat", MengChat],
  ["memory", MengMemory],
  ["tone", MengTone],
  ["arch", Arch],
  ["outro", Outro],
];

// 转场：一排排圆泡从一边鼓起来盖住画面，换幕后再从同一边缩回去
const HALF = 7;
const COLS = 9;
const ROWS = 5;
const PALETTE = [C.blue, C.pink, C.lemon, C.mint, C.lilac, C.white];

const Bubbles: React.FC<{ cut: number; dir: 1 | -1; seed: number }> = ({ cut, dir, seed }) => {
  const f = useCurrentFrame();
  const t = f - cut;
  if (t < -HALF - 4 || t > HALF + 4) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const order = (dir === 1 ? col : COLS - 1 - col) / (COLS - 1);
        // 先到的先鼓起、先缩回
        const local = t + HALF - order * 5;
        const grow = interpolate(local, [-2, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT });
        const shrink = interpolate(local, [HALF + 3, HALF + 9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT });
        const s = Math.min(grow, shrink);
        if (s <= 0) return null;
        const x = col * 240 + (row % 2) * 120 - 60;
        const y = row * 250 + 40;
        const r = 200;
        return <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: PALETTE[(i * 7 + seed) % PALETTE.length], scale: `${s}` }} />;
      })}
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => {
  const ready = useFonts();
  const cuts = PARTS.slice(1).map(([name]) => SCENES[name][0] * BAR);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {ready
        ? PARTS.map(([name, Part]) => {
            const [a, b] = SCENES[name];
            return (
              <Sequence key={name} from={a * BAR} durationInFrames={(b - a) * BAR} name={name}>
                <Part />
              </Sequence>
            );
          })
        : null}
      {cuts.map((cut, i) => (
        <Bubbles key={cut} cut={cut} dir={i % 2 ? -1 : 1} seed={i} />
      ))}
      <Audio src={asset("audio/bgm.wav")} />
    </AbsoluteFill>
  );
};
