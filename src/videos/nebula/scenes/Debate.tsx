// 第七幕「早期的争论」：康德的遥远星系、赫歇尔的发光流体、拉普拉斯的气体云收缩成太阳系，罗斯爵士把雾看成一粒粒恒星
// 第八幕「行星状星云」：恒星到了尽头，抛出一层气体外壳，被电离，发出看得见的光
import React from "react";
import { Eyepiece, Tag } from "../labels";
import { COLORS } from "../theme";
import { CLUSTER, Collapse, Dots, GALAXY, Rig } from "../Stars";
import { dip, ease, ramp, track, useT } from "../time";
import type { V3 } from "../time";
import { Canvas, VolumeMesh } from "../Volume";

export const Debate: React.FC = () => {
  const t = useT();
  const nebWindow = (t >= 139 && t < 145.4) || (t >= 149.9 && t < 156.9) || (t >= 163.5 && t < 172.6);
  const seed: V3 = t < 148 ? [0, 0, 0] : t < 160 ? [2, 0, 0] : [5, 1, 1];
  const flow = t >= 149.9 && t < 156.9 ? 2.5 : 0.4;
  const blue = t >= 149.9 && t < 156.9 ? 0.25 : 0;
  const a = 0.4 + (t - 140) * 0.03;
  const fade =
    Math.min(dip(t, 145.4, 0.4), dip(t, 149.9, 0.4), dip(t, 156.9, 0.4), dip(t, 163.5, 0.4)) * (t > 168 ? 1 - ease(t, 169.2, 172.4) : 1);

  // 各段的镜头
  let cam: V3 = [0, 1.3, 3.0];
  let fov = 46;
  if (t >= 156.9 && t < 163.5) cam = [0, 1.1, 2.5];
  if (t >= 168) {
    cam = [0, 0, 2.3];
    fov = 50;
  }
  const kant = ramp(t, 145.0, 146.4) * (1 - ramp(t, 149.2, 150.2));
  const collapseA = ramp(t, 156.6, 157.8) * (1 - ramp(t, 163.0, 163.8));
  const s = ease(t, 157.4, 162.6);
  const clusterA = ramp(t, 169.4, 172.4);
  const eye = ramp(t, 172.8, 174.2);
  const spin = (t - 168) * 0.05;
  const resolve = ramp(t, 175, 181);

  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t * flow + 20}
          mix={1}
          cam={[0, 0, 50]}
          look={[0, 0, 60]}
          cam2={nebWindow ? [5.2 * Math.sin(a), 0.5, 5.2 * Math.cos(a)] : [0, 0, 50]}
          look2={nebWindow ? [0, 0, 0] : [0, 0, 60]}
          fov={52}
          seed={seed}
          blue={blue}
          exposure={t < 145 ? 0.8 : 1}
          fade={fade}
        />
        <Rig pos={cam} look={[0, 0, 0]} fov={fov} />
        <Dots data={GALAXY()} alpha={0.32 * kant} time={t} rotation={[-1.1, 0.1, 0.4 + t * 0.02]} />
        <Collapse s={s} tau={(t - 157) * 1.4} alpha={1.0 * collapseA} rotation={[-0.9, 0, 0]} />
        <Dots data={CLUSTER()} alpha={(0.55 + 0.25 * resolve) * clusterA} time={t} rotation={[0.3, spin, 0.1]} scale={1 + 0.35 * ease(t, 174, 182)} />
      </Canvas>
      <Eyepiece p={eye} radius={440} />
      <Tag x={960} y={150} p={ramp(t, 145.6, 146.6) * (1 - ramp(t, 149.2, 149.9))} size={38} sub="星云是遥远的星系">
        康德
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 150.2, 151.2) * (1 - ramp(t, 156.0, 156.7))} size={38} sub="星云是一种能够发光的流体">
        威廉·赫歇尔
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 157.0, 158.0) * (1 - ramp(t, 163.0, 163.5))} size={38} sub="气体聚在一起，形成了太阳系">
        拉普拉斯
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 168.9, 170.0) * (1 - ramp(t, 172.0, 172.8))} size={34} sub="许多星云是由恒星构成的">
        分辨
      </Tag>
      <Tag x={960} y={980 - 120} p={ramp(t, 174.6, 175.6) * (1 - ramp(t, 181.8, 182.6))} size={34} sub="1.8 米反射望远镜 · 19 世纪中期" color={COLORS.warm}>
        罗斯爵士
      </Tag>
    </>
  );
};

export const Shell: React.FC = () => {
  const t = useT();
  const kind = track(t, [[183.0, 0], [184.2, 0], [186.6, 1]]);
  const shell = track(t, [[184.2, 0.1], [190, 0.9], [199.5, 1.9]]);
  const starK = track(t, [[181, 1.8], [186, 1.4], [193, 1.0], [199.5, 0.8]]);
  const ionK = track(t, [[181, 4], [188, 3], [191, 0.9], [195, 0.6]]);
  const exposure = track(t, [[181, 0.9], [192, 1.0], [196, 1.3], [200, 1.2]]);
  const z = track(t, [[181, 6.6], [200.5, 5.0]]);
  const a = (0.3 + (t - 182) * 0.02) * (1 - kind) + 0.1 * kind;
  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t}
          mix={1}
          cam={[0, 0, 50]}
          look={[0, 0, 60]}
          cam2={[z * Math.sin(a), 0.5, z * Math.cos(a)]}
          look2={[0, 0, 0]}
          fov={50}
          seed={[1, 0, 2]}
          kind={kind}
          shell={shell}
          starK={starK}
          ionK={ionK}
          exposure={exposure}
        />
      </Canvas>
      <Tag x={960} y={150} p={ramp(t, 183.2, 184.2) * (1 - ramp(t, 187.3, 188.0))} size={34} sub="恒星的生命到了尽头">
        抛出气体外壳
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 187.9, 188.7) * (1 - ramp(t, 190.0, 190.8))} size={34} sub="气体被电离">
        电离
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 191.2, 192.2) * (1 - ramp(t, 197.8, 198.4))} size={34} sub="吸收紫外线，转变为可见光" color={COLORS.teal}>
        膨胀 · 发光
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 198.3, 199.2)} size={44} sub="我们看到的" color={COLORS.teal}>
        行星状星云
      </Tag>
    </>
  );
};
