// 第六幕「矩尺座星系团」：三张真实的照片，慢慢推近，标出星系团和它的数字
import React from "react";
import { Img, staticFile } from "remotion";
import { Callout, Credit, Tag } from "../labels";
import { COLORS, asset } from "../theme";
import { ramp, track, useT } from "../time";

// 一张照片铺在画面里：fx、fy 是图上要放在屏幕中心偏一点的位置；zoom 为放大倍数（相对图片自己的像素）
const Photo: React.FC<{ src: string; w: number; h: number; fx: number; fy: number; zoom: number; ax?: number; ay?: number; opacity: number }> = ({ src, w, h, fx, fy, zoom, ax = 960, ay = 540, opacity }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0", transform: `translate(${ax - fx * zoom}px, ${ay - fy * zoom}px) scale(${zoom})`, opacity }}>
    <Img src={staticFile(asset(src))} style={{ width: w, height: h }} />
  </div>
);

// 图上一点 → 屏幕上的点
const at = (px: number, py: number, fx: number, fy: number, zoom: number, ax = 960, ay = 540): [number, number] => [ax + (px - fx) * zoom, ay + (py - fy) * zoom];

export const Norma: React.FC = () => {
  const t = useT();
  // 1. DECaPS：矩尺座方向的一片天，里面成群的黄色星系是星系团的成员
  const o1 = ramp(t, 230.8, 233.5) * (1 - ramp(t, 252, 254));
  const z1 = track(t, [[231, 0.85], [253, 0.97]]);
  const f1 = at(512, 1304, 640, 1250, z1, 480, 540);
  // 2. 哈勃：视场里最大的是 ESO 137-002，侧向的旋涡星系
  const o2 = ramp(t, 252, 254) * (1 - ramp(t, 264.5, 267));
  const z2 = track(t, [[251, 0.96], [266, 1.04]]);
  const f2 = at(1235, 756, 1100, 900, z2);
  // 3. Chandra：X 射线里的热气体被星系团的气体吹成长长的尾巴
  const o3 = ramp(t, 264.5, 267) * (1 - ramp(t, 280.5, 283));
  const z3 = track(t, [[265, 0.72], [282, 0.78]]);
  const f3 = at(386, 1414, 1170, 950, z3);
  const tail = at(1959, 477, 1170, 950, z3);
  return (
    <>
      <Photo src="img/norma_decaps.jpg" w={2400} h={2400} fx={640} fy={1250} ax={480} ay={540} zoom={z1} opacity={o1} />
      <Photo src="img/norma_hubble.jpg" w={2000} h={2062} fx={1100} fy={900} zoom={z2} opacity={o2} />
      <Photo src="img/norma_chandra.jpg" w={2400} h={2008} fx={1170} fy={950} zoom={z3} opacity={o3} />

      <Callout x={f1[0]} y={f1[1]} tx={f1[0] + 40} ty={f1[1] + 250 * z1 + 90} p={ramp(t, 246, 248.5) * (1 - ramp(t, 252, 253.5))} size={34} r={Math.round(250 * z1)} sub="星系团的核心 · 约 2.2 亿光年 · 296 个成员星系">
        Abell 3627
      </Callout>
      <Tag chip x={960} y={108} p={ramp(t, 233, 236) * (1 - ramp(t, 245, 247))} size={34} sub="矩尺座方向的一片天 · 前景是我们银河系里密密的恒星">
        那一片被遮住的天空
      </Tag>
      <Credit p={o1}>DECaPS / Legacy Surveys / D. Lang（CC BY 4.0）</Credit>

      <Callout x={f2[0]} y={f2[1]} tx={f2[0] - 240} ty={f2[1] - 190} p={ramp(t, 255, 257.5) * (1 - ramp(t, 263, 265))} size={32} r={Math.round(95 * z2)} sub="侧向的旋涡星系，在同一个星系团里">
        ESO 137-002
      </Callout>
      <Tag chip x={960} y={108} p={ramp(t, 254, 256) * (1 - ramp(t, 262, 263.5))} size={34} sub="哈勃空间望远镜 · 这一带也在隐匿带的边上">
        巨引源这一片里最重的已知星系团
      </Tag>
      <Tag chip x={960} y={108} p={ramp(t, 257, 259.5) * (1 - ramp(t, 264, 266))} size={34} sub="质量约 10¹⁵ 个太阳（Woudt 等 2008，动力学质量）">
        一千万亿个太阳
      </Tag>
      <Credit p={o2}>A busy patch of the Great Attractor — ESA/Hubble &amp; NASA — CC BY 4.0</Credit>

      <Callout x={f3[0]} y={f3[1]} tx={f3[0] + 300} ty={f3[1] - 20} p={ramp(t, 269, 272) * (1 - ramp(t, 280, 282))} size={30} r={44} sub="被星系团里的气体「吹」出一条长尾巴">
        ESO 137-001
      </Callout>
      <Callout x={tail[0]} y={tail[1]} tx={tail[0] - 60} ty={tail[1] + 120} p={ramp(t, 273, 276) * (1 - ramp(t, 280, 282))} size={26} r={30} color={COLORS.blue} sub="X 射线（蓝）约 70 kpc 长">
        热气体
      </Callout>
      <Tag chip x={960} y={108} p={ramp(t, 267, 270) * (1 - ramp(t, 280, 282))} size={34} sub="Abell 3627 是其中最重的星系团 · 整片区域比一个星系团大得多">
        巨引源是一整片区域
      </Tag>
      <Credit p={o3}>X-ray: NASA/CXC/UVa/M. Sun et al.; Hα: SOAR（公有领域）</Credit>
    </>
  );
};
