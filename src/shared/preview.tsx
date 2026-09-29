// 单独预览某一段：配乐从该段在曲中的位置截取，头尾各做短淡入淡出
import React from "react";
import { Audio } from "@remotion/media";
import { interpolate, staticFile } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 在模块顶层调用一次，避免每次渲染都生成新组件导致重新挂载
export const withMusic = (Scene: React.FC, music: string, from: number, duration: number, volume: number): React.FC => {
  const SceneWithMusic: React.FC = () => (
    <>
      <Scene />
      <Audio
        src={staticFile(music)}
        trimBefore={from}
        volume={(f) => interpolate(f, [0, 12, duration - 20, duration], [0, volume, volume, 0], clamp)}
      />
    </>
  );
  return SceneWithMusic;
};
