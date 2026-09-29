// 深空 · 地球的夜面：只剩一弯受光的边，其余是黑的，黑里亮着城市的灯——几十万年仰望之后，我们终于开始自己点火。
// 最后沉进黑里，接下一段的屏息
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Subtitle } from "../../components/Subtitle";
import { CameraRig } from "../../three/CameraRig";
import { DeepSky } from "../../three/DeepSky";
import { Earth } from "../../three/Earth";
import { useTextures } from "../../three/useTextures";
import { EASE_IN_OUT, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.home);
const TEXTURES = {
  sky: asset("textures/milky_way.jpg"),
  day: asset("textures/earth_day.jpg"),
  night: asset("textures/earth_night.jpg"),
  clouds: asset("textures/earth_clouds.jpg"),
};

export const Home: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  const p = interpolate(frame, [0, t(232)], [0, 1], { easing: EASE_IN_OUT });
  const dark = interpolate(frame, [t(230.8), t(232.0)], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      {tex && (
        <ThreeCanvas width={1920} height={1080}>
          <CameraRig position={[4 - p * 4, 3, 42 - p * 12]} target={[0, 0, 0]} fov={40} />
          <DeepSky sky={tex.sky} brightness={0.4} />
          <Earth day={tex.day} night={tex.night} clouds={tex.clouds} radius={10} spin={3.3 + frame * 0.0012} sunDir={[1, 0.15, -0.55]} nightGain={2.2} />
        </ThreeCanvas>
      )}
      <Mist tone="space" strength={0.5} height={260} />
      <Subtitle zh={["仰望了几十万年，我们终于开始自己点火。"]} en={["After hundreds of thousands of years of looking up, we began to light fires of our own."]} at={t(223.2)} out={t(230.4)} tone="space" stagger={2.8} />
      <Grain opacity={0.06} vignette={0.3} />
      <AbsoluteFill style={{ backgroundColor: SPACE.bg, opacity: dark }} />
    </AbsoluteFill>
  );
};
