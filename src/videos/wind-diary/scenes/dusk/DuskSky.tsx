// 暮色的天：灰蓝到夕阳粉的渐变，几朵云跟着节拍一张一缩（「整片天空都在练习一种不用力的呼吸」），起风时被吹向右边
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { DUSK, EASE_IN_OUT } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const BREATH = 8 * 21.95;

const CLOUDS = Array.from({ length: 8 }, (_, i) => {
  const r = (k: string) => random(`cloud-${i}-${k}`);
  return {
    x: -200 + r("x") * 2100,
    y: 90 + r("y") * 380,
    w: 380 + r("w") * 520,
    h: 70 + r("h") * 90,
    phase: r("p") * Math.PI * 2,
    color: r("c") < 0.5 ? "236, 206, 190" : "226, 222, 216",
    alpha: 0.45 + r("a") * 0.35,
    drift: 0.1 + r("d") * 0.25,
  };
});

export const DuskSky: React.FC<{ duration: number; windFrom: number; deepenFrom: number; deepenTo: number }> = ({
  duration,
  windFrom,
  deepenFrom,
  deepenTo,
}) => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [windFrom, windFrom + 150], [0, 420], { ...clamp, easing: EASE_IN_OUT });
  const dusk = interpolate(frame, [0, duration], [0, 0.12], clamp) + interpolate(frame, [deepenFrom, deepenTo], [0, 0.42], clamp);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${DUSK.skyTop} 0%, ${DUSK.skyMid} 45%, ${DUSK.skyLow} 72%, ${DUSK.pink} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 40% 35% at 78% 62%, rgba(255, 214, 170, 0.55) 0%, rgba(255, 214, 170, 0) 100%)" }} />
      {CLOUDS.map((c, i) => {
        const breathe = 1 + 0.08 * Math.sin((frame / BREATH) * Math.PI * 2 + c.phase);
        const x = c.x + frame * c.drift + push * (0.6 + c.drift);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - (c.w * breathe) / 2,
              top: c.y - (c.h * breathe) / 2,
              width: c.w * breathe,
              height: c.h * breathe,
              borderRadius: "50%",
              background: `radial-gradient(closest-side, rgba(${c.color}, ${c.alpha}) 0%, rgba(${c.color}, ${c.alpha * 0.5}) 55%, rgba(${c.color}, 0) 100%)`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ backgroundColor: "#231f28", opacity: dusk }} />
    </AbsoluteFill>
  );
};
