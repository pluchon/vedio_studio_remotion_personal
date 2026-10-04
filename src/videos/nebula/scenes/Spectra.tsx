// 第九幕「哈金斯的光谱」：1864 年，哈金斯用分光仪看天龙座的星云，看到的不是一条彩虹，而是几条亮线
import React from "react";
import { Tag } from "../labels";
import { Spectrum, wavelengthColor } from "../Spectrum";
import { COLORS } from "../theme";
import { ramp, track, useT } from "../time";
import { Canvas, VolumeMesh } from "../Volume";

// 棱镜：白光进去，按波长散开
const Prism: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0.003) return null;
  const rays = Array.from({ length: 36 }, (_, i) => {
    const u = i / 35;
    const nm = 700 - u * 300;
    const c = wavelengthColor(nm);
    return { y: 400 + u * 190, color: `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})` };
  });
  return (
    <g opacity={p}>
      <line x1={420} y1={500} x2={925} y2={497} stroke="#f4f0ff" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
      {rays.map((r, i) => (
        <line key={i} x1={1000} y1={497} x2={1500} y2={r.y} stroke={r.color} strokeWidth={5} opacity={0.5 * ramp(p, 0.3, 0.8)} strokeLinecap="round" />
      ))}
      <path d="M895,590 L960,410 L1030,590 Z" fill="rgba(210,220,255,0.08)" stroke="#dfe6ff" strokeWidth={2.4} strokeOpacity={0.8} strokeLinejoin="round" />
    </g>
  );
};

export const Spectra: React.FC = () => {
  const t = useT();
  const prism = ramp(t, 200.6, 202) * (1 - ramp(t, 206.2, 207.6));
  const upperY = track(t, [[206.5, 440], [221.5, 300]]);
  const upper = ramp(t, 207.4, 209.4);
  const lowerAlpha = ramp(t, 220.2, 222.2);
  const catsEye = ramp(t, 213.8, 215.6);
  const night = 0.7;
  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t * 0.5}
          mix={1}
          cam={[0, 0, 50]}
          look={[0, 0, 60]}
          cam2={[0, 0.3, 9]}
          look2={[2.9, 0, 0]}
          fov={50}
          kind={1}
          shell={1.15}
          ionK={0.7}
          starK={1}
          seed={[3, 1, 4]}
          exposure={night * (0.15 + 0.85 * catsEye)}
        />
      </Canvas>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Prism p={prism} />
        <Spectrum x={660} y={upperY} w={900} h={130} kind="absorption" p={upper} name="恒星" />
        <Spectrum x={660} y={600} w={900} h={130} kind="emission" p={lowerAlpha} name="天龙座的星云" />
      </svg>
      <Tag x={960} y={150} p={ramp(t, 204.8, 205.8) * (1 - ramp(t, 207.6, 208.4))} size={36} sub="把光拆开来看">
        分光仪
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 208.4, 209.4) * (1 - ramp(t, 213.4, 214.2))} size={36} sub="验证了赫歇尔的说法">
        哈金斯
      </Tag>
      <Tag x={480} y={820} p={ramp(t, 214.6, 215.6) * (1 - ramp(t, 220.0, 220.8))} size={32} sub="1864 年 · 天龙座">
        一团发光的星云
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 220.6, 221.6) * (1 - ramp(t, 225.2, 225.9))} size={36} sub="明线" color={COLORS.teal}>
        不是彩虹，是几条亮线
      </Tag>
      <Tag x={960} y={880 - 60} p={ramp(t, 222.8, 223.8) * (1 - ramp(t, 229.2, 230.0))} size={30} sub="发光气体形成的光谱">
        气体
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 230.4, 231.4) * (1 - ramp(t, 236.0, 236.8))} size={34} sub="相似的暗纹，但不是恒星团形成的痕迹">
        两种光谱
      </Tag>
    </>
  );
};
