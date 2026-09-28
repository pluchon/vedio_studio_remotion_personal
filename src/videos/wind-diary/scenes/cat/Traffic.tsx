// 赶路的人和车：虚焦的光斑左右流过，速度越快拖得越长；stopFrom 起减速停下，随后散去
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { EASE_IN_OUT, WIDTH } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MARGIN = 260;

type Light = { y: number; size: number; speed: number; dir: 1 | -1; phase: number; rgb: string; alpha: number };

// 远、中、近三层：越近越大、越快、越淡
const LAYERS = [
  { count: 34, y: [400, 560], size: [5, 11], speed: [2.5, 4.5], alpha: 0.85 },
  { count: 26, y: [300, 760], size: [16, 34], speed: [7, 12], alpha: 0.55 },
  { count: 9, y: [180, 920], size: [70, 140], speed: [16, 24], alpha: 0.2 },
];

// 往右的是车头灯（暖白、琥珀），往左的是尾灯（红、琥珀）
const HEAD = ["255, 238, 206", "246, 198, 120"];
const TAIL = ["226, 96, 76", "240, 150, 88"];

const LIGHTS: Light[] = LAYERS.flatMap((layer, li) =>
  Array.from({ length: layer.count }, (_, i) => {
    const r = (k: string) => random(`traffic-${li}-${i}-${k}`);
    const dir: 1 | -1 = r("dir") < 0.5 ? 1 : -1;
    const palette = dir === 1 ? HEAD : TAIL;
    return {
      y: layer.y[0] + r("y") * (layer.y[1] - layer.y[0]),
      size: layer.size[0] + r("s") * (layer.size[1] - layer.size[0]),
      speed: layer.speed[0] + r("v") * (layer.speed[1] - layer.speed[0]),
      dir,
      phase: r("p") * (WIDTH + MARGIN * 2),
      rgb: palette[Math.floor(r("c") * palette.length)],
      alpha: layer.alpha * (0.6 + r("a") * 0.4),
    };
  }),
);

const mod = (v: number, m: number) => ((v % m) + m) % m;

export const Traffic: React.FC<{
  dimUntil: number;
  stopFrom: number;
  stopTo: number;
  fadeFrom: number;
  fadeTo: number;
}> = ({ dimUntil, stopFrom, stopTo, fadeFrom, fadeTo }) => {
  const frame = useCurrentFrame();
  const speedAt = (f: number) => interpolate(f, [stopFrom, stopTo], [1, 0], { ...clamp, easing: EASE_IN_OUT });

  // 行进距离是速度对时间的累加，减速时光斑才会平滑地停住
  let travelled = 0;
  for (let f = 0; f < frame; f++) travelled += speedAt(f);
  const speedNow = speedAt(frame);

  const opacity =
    interpolate(frame, [0, dimUntil], [0.3, 1], clamp) * interpolate(frame, [fadeFrom, fadeTo], [1, 0], clamp);
  if (opacity <= 0) return null;

  return (
    <AbsoluteFill style={{ opacity }}>
      {LIGHTS.map((l, i) => {
        const x = mod(l.phase + l.dir * l.speed * travelled, WIDTH + MARGIN * 2) - MARGIN;
        const w = l.size + l.speed * speedNow * 7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - w / 2,
              top: l.y - l.size / 2,
              width: w,
              height: l.size,
              borderRadius: l.size / 2,
              background: `radial-gradient(closest-side, rgba(${l.rgb}, ${l.alpha}) 0%, rgba(${l.rgb}, ${l.alpha * 0.45}) 50%, rgba(${l.rgb}, 0) 100%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
