// 深空 · 1990：六十亿公里外，旅行者号慢慢转过身去；远处的太阳只是一个很亮的点。颜色都褪了，只剩真实的黑与光
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Locator } from "../../components/Locator";
import { CameraRig } from "../../three/CameraRig";
import { DeepSky } from "../../three/DeepSky";
import { Glow } from "../../three/Points";
import { useTextures } from "../../three/useTextures";
import { Voyager } from "../../three/Voyager";
import { EASE_IN_OUT, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const t = localTime(SEGMENTS.turn);
const TEXTURES = { sky: asset("textures/milky_way.jpg") };
const SUN_POS: [number, number, number] = [-260, 60, -900];

export const Turn: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  const p = interpolate(frame, [0, t(168.0)], [0, 1], { easing: EASE_IN_OUT });
  // 镜头从侧后方绕过来，碟面斜着看，才认得出是一口天线
  const orbit = 1.5 + p * 1.1;
  const turn = -0.6 + p * 2.2;

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      {tex && (
        <ThreeCanvas width={1920} height={1080}>
          <CameraRig position={[Math.sin(orbit) * 11, 2.5 - p, Math.cos(orbit) * 11]} target={[0, 0, 0]} fov={40} />
          <DeepSky sky={tex.sky} brightness={0.45} />
          <ambientLight intensity={0.18} />
          <directionalLight position={SUN_POS} intensity={2.6} />
          {/* 一点冷色的补光，让背光面也看得出形状 */}
          <directionalLight position={[8, 4, 10]} intensity={0.7} color="#9fb4d8" />
          <Glow color="#fff4dd" size={60} intensity={1.4} position={SUN_POS} />
          <group rotation={[0, turn, 0]}>
            <Voyager look="real" sunDir={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]} scale={0.9} />
          </group>
        </ThreeCanvas>
      )}
      <Locator year="1990" place="距地球约六十亿公里" at={t(159.9)} tone="space" />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
