// 第十幕「哈勃」：星云的光从哪来——来自附近的恒星，恒星越亮，光芒的范围越大
// 第十一幕「两类星云」：昴星团旁的是星光的反射（暗线），猎户座大星云是自己发光（明线）
// 第十二幕「极光」：反射的不是反射光，是被热星激发的光，像极光
import React from "react";
import { Tag } from "../labels";
import { Spectrum } from "../Spectrum";
import { COLORS } from "../theme";
import { dip, ramp, track, useT } from "../time";
import type { V3 } from "../time";
import { Canvas, VolumeMesh } from "../Volume";

const orbit = (a: number, r: number, y: number): V3 => [r * Math.sin(a), y, r * Math.cos(a)];

export const Hubble: React.FC = () => {
  const t = useT();
  const starK = track(t, [[235, 0.3], [249.0, 0.35], [250.6, 0.9], [257, 1.0], [261, 1.8]]);
  const exposure = track(t, [[235, 0.9], [249, 0.9], [251, 1.1]]);
  const a = 0.2 + (t - 236) * 0.025;
  return (
    <>
      <Canvas>
        <VolumeMesh time={t} mix={1} cam={[0, 0, 50]} look={[0, 0, 60]} cam2={orbit(a, 5.3, 0.45)} look2={[0, 0, 0]} fov={52} seed={[6, 2, 3]} blue={1} starK={starK} exposure={exposure} />
      </Canvas>
      <Tag x={540} y={400} p={ramp(t, 237.4, 238.4) * (1 - ramp(t, 241.8, 242.6))} size={80} color={COLORS.soft}>
        ？
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 244.8, 245.8) * (1 - ramp(t, 248.6, 249.3))} size={38} sub="威尔逊山 · 2.5 米反光镜">
        哈勃
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 249.4, 250.4) * (1 - ramp(t, 256.4, 257.2))} size={34} sub="星云的光，来自附近的恒星" color={COLORS.warm}>
        恒星在照亮它
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 257.2, 258.2)} size={34} sub="恒星越亮，光芒的范围越大" color={COLORS.warm}>
        越亮 · 越大
      </Tag>
    </>
  );
};

export const Classes: React.FC = () => {
  const t = useT();
  const second = t >= 277.7;
  const fade = Math.min(dip(t, 277.7, 0.5));
  const a = 0.3 + (t - 261) * 0.022;
  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t}
          mix={1}
          cam={[0, 0, 50]}
          look={[0, 0, 60]}
          cam2={orbit(a, 5.2, 0.4)}
          look2={[0, 0, 0]}
          fov={52}
          seed={second ? [0, 0, 0] : [6, 2, 3]}
          blue={second ? 0 : 1}
          starK={second ? 1.2 : 1.5}
          exposure={1.05}
          fade={fade}
        />
      </Canvas>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Spectrum x={1320} y={780} w={460} h={70} kind="absorption" p={ramp(t, 269.6, 271.4) * (1 - ramp(t, 276.6, 277.4))} labels={false} />
        <Spectrum x={1320} y={780} w={460} h={70} kind="emission" p={ramp(t, 283.4, 285.2) * (1 - ramp(t, 290.6, 291.4))} labels={false} />
      </svg>
      <Tag x={960} y={150} p={ramp(t, 262.2, 263.2) * (1 - ramp(t, 266.4, 267.2))} size={34} sub="并不是所有的星云都一样">
        两类星云
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 267.4, 268.4) * (1 - ramp(t, 277.0, 277.6))} size={36} sub="昴星团附近" color={COLORS.teal}>
        第一类 · 反射星光
      </Tag>
      <Tag x={1550} y={740} p={ramp(t, 270.6, 271.8) * (1 - ramp(t, 276.6, 277.4))} size={26} sub="和星光一样的暗线" color={COLORS.soft}>
        暗线花样
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 278.2, 279.2) * (1 - ramp(t, 290.2, 291.0))} size={36} sub="猎户座大星云" color={COLORS.rose}>
        第二类 · 自己发光
      </Tag>
      <Tag x={1550} y={740} p={ramp(t, 284.4, 285.6) * (1 - ramp(t, 290.6, 291.4))} size={26} sub="明线花样，明显不同" color={COLORS.soft}>
        明线花样
      </Tag>
    </>
  );
};

// 一颗彗星从夜空里划过
const SkyComet: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0.003 || p >= 0.997) return null;
  const x = 1500 - 1100 * p;
  const y = 260 + 210 * p;
  return (
    <g opacity={Math.sin(p * Math.PI)}>
      <defs>
        <linearGradient id="nebula-skytail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e6f0ff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#e6f0ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${x},${y - 3} L${x + 280},${y - 40} L${x + 280},${y - 22} L${x},${y + 3} Z`} fill="url(#nebula-skytail)" />
      <circle cx={x} cy={y} r={7} fill="#ffffff" />
      <circle cx={x} cy={y} r={22} fill="#dce8ff" opacity={0.25} />
    </g>
  );
};

export const Aurora: React.FC = () => {
  const t = useT();
  const mix = track(t, [[291.0, 1], [298.8, 1], [300.2, 0], [307.0, 0], [309.2, 1]]);
  const blue = track(t, [[291.0, 1], [296.0, 1], [298.4, 0]]);
  const aurora = track(t, [[299.6, 0], [301.4, 1], [306.2, 1], [308.2, 0]]);
  const a = 0.3 + (t - 291) * 0.02;
  const starK = track(t, [[291, 1.5], [297, 1.2], [309, 1.2], [314, 1.7]]);
  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t}
          mix={mix}
          cam={[0, 0.3, 0]}
          look={[0.3, 1.0, -3]}
          cam2={orbit(a, 5.2, 0.4)}
          look2={[0, 0, 0]}
          fov={68}
          night={1}
          dark={0.3}
          cloud={0.3}
          aurora={aurora}
          seed={[0, 0, 0]}
          blue={blue}
          starK={starK}
          exposure={1.05}
        />
      </Canvas>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <SkyComet p={ramp(t, 304.6, 307.0)} />
      </svg>
      <Tag x={960} y={150} p={ramp(t, 292.2, 293.2) * (1 - ramp(t, 296.0, 296.8))} size={34} sub="第一类星云的光，是反射的星光" color={COLORS.teal}>
        反射
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 296.8, 297.8) * (1 - ramp(t, 299.4, 300.0))} size={34} sub="第二类显然不是反射光" color={COLORS.rose}>
        不是反射
      </Tag>
      <Tag x={960} y={180} p={ramp(t, 303.0, 304.0) * (1 - ramp(t, 304.9, 305.5))} size={38} sub="我们可以联想极光的形成" color={COLORS.teal}>
        极光
      </Tag>
      <Tag x={960} y={180} p={ramp(t, 305.2, 306.0) * (1 - ramp(t, 306.8, 307.4))} size={34} sub="彗星发出的光">
        彗星
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 309.8, 310.8) * (1 - ramp(t, 316.6, 317.4))} size={34} sub="受到附近热星的作用，发出类似极光的光" color={COLORS.rose}>
        热星在激发它
      </Tag>
    </>
  );
};
