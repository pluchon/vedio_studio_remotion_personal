// 第十三幕「春天里的花朵」：行星、恒星是田野里的小草，星云是春天里的花；没有规则，没有明确的边界；玫瑰星云，环状星云
import React from "react";
import { Tag } from "../labels";
import { COLORS } from "../theme";
import { CLUSTER, Dots, Rig } from "../Stars";
import { dip, ramp, track, useT } from "../time";
import type { V3 } from "../time";
import { Canvas, VolumeMesh } from "../Volume";

export const Flowers: React.FC = () => {
  const t = useT();
  const meadow = t >= 326.0 && t < 330.4;
  const fade = Math.min(dip(t, 326.0, 0.45), dip(t, 330.3, 0.45), dip(t, 337.0, 0.5), dip(t, 339.0, 0.4));
  const dist = track(t, [[316, 5.6], [322.8, 5.6], [325.6, 1.5], [326.0, 1.5], [330.4, 7.6], [332, 7.6], [336, 5.4], [337, 5.4], [339, 5.2]]);
  const a = 0.5 + (t - 317) * 0.028;
  const seed: V3 = t < 326 ? [0, 0, 0] : t < 337 ? [8, 2, 4] : t < 339 ? [3, 3, 3] : [1, 0, 2];
  const blue = t >= 330.3 && t < 337 ? 0.3 : 0;
  const kind = track(t, [[336.4, 0], [337.4, 0.55], [338.6, 0.55], [339.6, 1]]);
  const shell = track(t, [[336, 1.0], [337.4, 1.15], [339.6, 1.3]]);
  const exposure = track(t, [[316, 1.05], [323, 0.95], [330.4, 0.8], [332.2, 1.3], [337, 1.1], [341, 1.0]]);
  const ringLook = ramp(t, 336.6, 337.6);
  const aa = a * (1 - ringLook) + (0.1 + Math.sin(t * 0.3) * 0.08) * ringLook;
  const camPos: V3 = [dist * Math.sin(aa), 0.45 * (1 - ringLook * 0.6), dist * Math.cos(aa)];
  const grass = ramp(t, 326.6, 327.8) * (1 - ramp(t, 329.8, 330.6));
  const sway = Math.sin(t * 0.8) * 0.04;
  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t}
          mix={1}
          cam={[0, 0, 50]}
          look={[0, 0, 60]}
          cam2={meadow ? [0, 0, 50] : camPos}
          look2={meadow ? [0, 0, 60] : [0, 0, 0]}
          fov={52}
          seed={seed}
          blue={blue}
          kind={kind}
          shell={shell}
          ionK={kind > 0.8 ? 0.7 : 4}
          starK={1.1}
          exposure={exposure}
          fade={fade}
        />
        <Rig pos={[0, 0.6, 2.4]} look={[0, -0.05, 0]} fov={60} />
        <Dots data={CLUSTER()} alpha={0.75 * grass} time={t} rotation={[1.35, sway, 0]} scale={2.2} position={[0, -0.9, -0.4]} pixel={0.8} />
      </Canvas>
      <Tag x={960} y={150} p={ramp(t, 317.8, 318.8) * (1 - ramp(t, 322.4, 323.0))} size={38} sub="相对于恒星、行星、彗星">
        一个美丽的存在
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 323.2, 324.2) * (1 - ramp(t, 325.8, 326.2))} size={36} sub="没有规则，没有明确的边界">
        没有边
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 327.0, 328.0) * (1 - ramp(t, 330.0, 330.5))} size={36} sub="行星、恒星，是田野里的小草">
        小草
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 330.6, 331.6) * (1 - ramp(t, 335.6, 336.4))} size={40} sub="星云，是春天里的花朵" color={COLORS.rose}>
        花朵
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 337.6, 338.4) * (1 - ramp(t, 338.9, 339.2))} size={42} sub="NGC 2237" color={COLORS.rose}>
        玫瑰星云
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 339.4, 340.2)} size={42} sub="M57" color={COLORS.teal}>
        环状星云
      </Tag>
    </>
  );
};
