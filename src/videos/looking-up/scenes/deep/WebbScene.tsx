// 深空 · 2021：又一面镜子。韦布在日地 L2 点一步步展开：遮阳板从中间往两头铺开，两翼的镜片翻上来，副镜支架伸出去，
// 每一步都踩在低鼓上（195.54、200.09 各一记）
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { CameraRig } from "../../three/CameraRig";
import { DeepSky } from "../../three/DeepSky";
import { useTextures } from "../../three/useTextures";
import { Webb } from "../../three/Webb";
import { EASE_IN_OUT, EASE_OUT, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.webb);
const TEXTURES = { sky: asset("textures/milky_way.jpg") };

export const WebbScene: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  const shield = interpolate(frame, [t(195.7), t(198.8)], [0, 1], { ...clamp, easing: EASE_OUT });
  const wings = interpolate(frame, [t(200.09), t(201.6)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const struts = interpolate(frame, [t(201.8), t(203.2)], [0.25, 1], { ...clamp, easing: EASE_OUT });
  const orbit = interpolate(frame, [0, t(204.62)], [0.5, 1.25]);
  const dist = interpolate(frame, [0, t(204.62)], [30, 24]);

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      {tex && (
        <ThreeCanvas width={1920} height={1080}>
          <CameraRig position={[Math.sin(orbit) * dist, 8, Math.cos(orbit) * dist]} target={[0, 0.5, 0]} fov={40} />
          <DeepSky sky={tex.sky} brightness={0.4} />
          <hemisphereLight args={["#fff3e0", "#1a1c2a", 0.8]} />
          <directionalLight position={[12, 20, 18]} intensity={2.4} />
          <directionalLight position={[-6, -14, -4]} intensity={1.2} color="#ffd9b0" />
          <Webb shield={shield} wings={wings} struts={struts} rotation={[0, 0.3, 0]} />
        </ThreeCanvas>
      )}
      <Mist tone="space" strength={0.5} height={260} />
      <Locator year="2021" place="日地 L2 点 · 距地球一百五十万公里" at={t(195.8)} tone="space" />
      <Subtitle
        zh={["又一面镜子被送往一百五十万公里之外，", "去接住宇宙最早的那些光。"]}
        en={["Another mirror was sent 1.5 million kilometres away", "to catch the earliest light of the universe."]}
        at={t(196.4)}
        out={t(204.4)}
        tone="space"
      />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
