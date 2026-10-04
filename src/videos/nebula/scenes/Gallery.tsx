// 第三幕「像与不像」：地球的云一团团地换成星云，对应「成分完全不同，外观极其相似」
// 第四幕「星云们」：红的、蓝的、圆环、一片一片、没有规律、很小、很大
import React from "react";
import { Tag } from "../labels";
import { COLORS } from "../theme";
import { dip, ramp, track, track3, useT } from "../time";
import type { V3 } from "../time";
import { Canvas, VolumeMesh } from "../Volume";

const orbit = (a: number, r: number, y: number): V3 => [r * Math.sin(a), y, r * Math.cos(a)];

export const Morph: React.FC = () => {
  const t = useT();
  const mix = track(t, [[43.8, 0], [52.4, 1]]);
  const a = 0.1 + (t - 39) * 0.035;
  const night = track(t, [[39, 0.15], [44, 0.35], [52, 0.6]]);
  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t}
          mix={mix}
          cam={[0, 0.3, 0]}
          look={track3(t, [[38, [-0.6, 1.1, -3]], [52, [-0.2, 1.5, -2.8]]])}
          cam2={orbit(a, 5.6, 0.5)}
          look2={[0, 0, 0]}
          fov={58}
          sun={track(t, [[38, 0.5], [50, 0.8]])}
          night={night}
          exposure={1.1}
        />
      </Canvas>
      <Tag x={540} y={300} p={ramp(t, 40.0, 41.2) * (1 - ramp(t, 43.4, 44.4))} size={44} sub="水蒸气">
        地球的云
      </Tag>
      <Tag x={1380} y={300} p={ramp(t, 44.2, 45.4) * (1 - ramp(t, 51.0, 52.4))} size={44} sub="氢 · 氦" color={COLORS.rose}>
        宇宙的云
      </Tag>
    </>
  );
};

// 一团一团换种子的时候，先淡下去，在最暗处换，再淡回来
const SEEDS: { at: number; seed: V3 }[] = [
  { at: 0, seed: [0, 0, 0] },
  { at: 68.2, seed: [3, 1, 2] },
  { at: 69.9, seed: [7, 5, 1] },
];

export const Gallery: React.FC = () => {
  const t = useT();
  let seed = SEEDS[0].seed;
  for (const s of SEEDS) if (t >= s.at) seed = s.seed;
  const fade = Math.min(dip(t, 68.2, 0.45), dip(t, 69.9, 0.45), dip(t, 72.0, 0.4), dip(t, 74.0, 0.4));
  const blue = track(t, [[62.6, 0], [63.7, 1], [64.6, 1], [65.4, 0]]);
  const kind = track(t, [[66.2, 0], [67.2, 1], [68.0, 1], [68.9, 0]]);
  const a = (0.6 + (t - 58.8) * 0.05) * (1 - kind) + 0.12 * kind;
  const dist = track(t, [[58.8, 6.6], [61, 6.4], [62, 5.2], [64, 5.6], [66, 5.2], [68, 5.6], [70, 5.4], [72, 6.5], [73.4, 16], [74, 16], [75.2, 1.3]]);
  const exposure = track(t, [[58.8, 0.75], [60.8, 0.6], [61.8, 1.3], [64, 1.1], [72, 1.1], [74, 1.1], [75.5, 0.9]]);
  const starK = track(t, [[58.8, 0.9], [61.6, 0.8], [62.2, 1.3], [66, 1.1]]);
  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t}
          mix={1}
          cam={orbit(a, dist, 0.5)}
          look={[0, 0, 0]}
          fov={52}
          seed={seed}
          blue={blue}
          kind={kind}
          shell={1.25}
          ionK={kind > 0.5 ? 0.7 : 4}
          starK={starK}
          exposure={exposure}
          fade={fade}
        />
      </Canvas>
      <Tag x={960} y={150} p={ramp(t, 59.0, 60.0) * (1 - ramp(t, 61.2, 61.7))} size={34} sub="微弱的红光">
        红
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 61.7, 62.5) * (1 - ramp(t, 63.0, 63.3))} size={34} sub="娇艳的红光" color={COLORS.rose}>
        红
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 63.4, 64.0) * (1 - ramp(t, 64.4, 64.8))} size={34} sub="蓝色的光" color={COLORS.teal}>
        蓝
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 66.9, 67.5) * (1 - ramp(t, 68.0, 68.3))} size={34} sub="圆环形">
        环
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 72.3, 73.0) * (1 - ramp(t, 73.5, 73.9))} size={34} sub="非常小">
        小
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 74.3, 75.0) * (1 - ramp(t, 75.4, 75.9))} size={34} sub="像太阳那么大">
        大
      </Tag>
    </>
  );
};
