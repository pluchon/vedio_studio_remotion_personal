// 《雨未愁眠》成片：长纸上的海报叠层，镜头跟着念白走。
import { Audio } from "@remotion/media";
import { noise2D } from "@remotion/noise";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { KEYS } from "./camera";
import { Desk } from "./Desk";
import { ScreenGrain, track, useFonts } from "./kit";
import { SECTIONS } from "./script";
import { Subtitles } from "./Subtitles";
import { C, DURATION, FONT_EN, FONT_ZH, FPS, HEIGHT, LEAD, MUSIC, RAIN, SFX, VOICE, VOICE_SECONDS, WIDTH, WORLD } from "./theme";

const musicVolume = (frame: number) => {
  const t = frame / FPS;
  const talking = t > LEAD - 0.4 && t < LEAD + VOICE_SECONDS + 0.8 ? 1 : 0;
  const fadeIn = Math.min(1, t / 1.6);
  const fadeOut = Math.min(1, (DURATION - t) / 3.2);
  return (0.36 - 0.2 * talking) * fadeIn * fadeOut;
};

export const Film: React.FC = () => {
  const ready = useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const x = track(t, KEYS, (k) => k.x) + noise2D("yw-x", t * 0.11, 0) * 5;
  const y = track(t, KEYS, (k) => k.y) + noise2D("yw-y", 0, t * 0.13) * 4;
  const s = track(t, KEYS, (k) => k.s);
  const r = track(t, KEYS, (k) => k.r) + noise2D("yw-r", t * 0.07, 1) * 0.15;

  const section = Object.values(SECTIONS).find((sec) => t >= sec.start - 0.4 && t <= sec.end + 0.5);

  if (!ready) {
    return <AbsoluteFill style={{ background: C.paper }} />;
  }

  return (
    <AbsoluteFill style={{ background: C.fiber }}>
      <div
        style={{
          position: "absolute",
          width: WORLD.w,
          height: WORLD.h,
          transformOrigin: "0 0",
          transform: `translate(${WIDTH / 2}px, ${HEIGHT / 2}px) rotate(${r}deg) scale(${s}) translate(${-x}px, ${-y}px)`,
          willChange: "transform",
        }}
      >
        <Desk t={t} />
      </div>
      {section ? (
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 28,
            fontFamily: FONT_ZH,
            fontSize: 20,
            letterSpacing: 4,
            color: C.inkSoft,
            opacity: 0.7,
          }}
        >
          <span style={{ fontFamily: FONT_EN, letterSpacing: 3, marginRight: 10 }}>{section.id.toUpperCase()}</span>
          {section.id === "window"
            ? "窗"
            : section.id === "sound"
              ? "声"
              : section.id === "light"
                ? "光"
                : section.id === "refuge"
                  ? "窗与被"
                  : section.id === "permit"
                    ? "许可"
                    : section.id === "tempo"
                      ? "匀速"
                      : section.id === "truth"
                        ? "实话"
                        : "关小"}
        </div>
      ) : null}
      <Subtitles t={t} />
      <ScreenGrain />
      <Audio src={staticFile(RAIN)} volume={0.4} />
      <Audio src={staticFile(MUSIC)} volume={musicVolume} />
      <Audio src={staticFile(SFX)} volume={0.5} />
      <Sequence from={Math.round(LEAD * FPS)} layout="none">
        <Audio src={staticFile(VOICE)} volume={0.68} />
      </Sequence>
    </AbsoluteFill>
  );
};
