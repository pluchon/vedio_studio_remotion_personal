// 3D 打样：从星空深处飞向地球，看本机能不能正常出 WebGL 画面、每帧要多久。验证完就删
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig } from "../three/CameraRig";
import { Earth } from "../three/Earth";
import { SkySphere, StarField } from "../three/StarField";
import { useTextures } from "../three/useTextures";
import { EASE_IN_OUT, asset } from "../theme";

const TEXTURES = {
  day: asset("textures/earth_day.jpg"),
  night: asset("textures/earth_night.jpg"),
  clouds: asset("textures/earth_clouds.jpg"),
  sky: asset("textures/milky_way.jpg"),
};

export const Spike3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const tex = useTextures(TEXTURES);
  const p = interpolate(frame, [0, durationInFrames - 1], [0, 1], { easing: EASE_IN_OUT });
  const z = interpolate(p, [0, 1], [420, 34]);
  const x = interpolate(p, [0, 1], [-30, 8]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#02030a" }}>
      {tex && (
        <ThreeCanvas width={width} height={height}>
          <CameraRig position={[x, 4, z]} target={[0, 0, 0]} fov={42} />
          <SkySphere map={tex.sky} radius={1800} />
          <StarField seed="spike" count={6000} near={600} far={-900} spread={420} hole={14} />
          <Earth day={tex.day} night={tex.night} clouds={tex.clouds} radius={10} spin={2.2 + frame * 0.0025} sunDir={[-1, 0.2, 0.25]} />
        </ThreeCanvas>
      )}
    </AbsoluteFill>
  );
};
