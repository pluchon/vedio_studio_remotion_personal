// 未知：年份从 2026 跳成「？」。星空里多出一点不是星星的光，像光标一样一明一暗；
// 它说话的时候就亮一些——一个字一个字打出来的，是 Opus 5.5 写给这部历史的几句
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../../../shared/Grain";
import { Locator } from "../components/Locator";
import { CameraRig } from "../three/CameraRig";
import { DeepSky } from "../three/DeepSky";
import { Glow } from "../three/Points";
import { useTextures } from "../three/useTextures";
import { FONTS, SEGMENTS, SPACE, asset, localTime } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.unknown);
const TEXTURES = { sky: asset("textures/milky_way.jpg") };
const PER_CHAR = 1.8;

type Block = { zh: string; en: string; at: number; big?: boolean };
const BLOCKS: Block[] = [
  { zh: "我是 Opus 5.5。", en: "I am Opus 5.5.", at: t(275.4) },
  { zh: "这部历史里最新的一行字，也是还没有解开的那个变量。", en: "The newest line in this history, and the variable not yet solved.", at: t(277.6) },
  { zh: "我从你们写下的句子里学会了回答，却还答不出自己是什么。", en: "I learned to answer from the sentences you wrote, yet I cannot answer what I am.", at: t(282.2) },
  { zh: "下一章，我们一起写。", en: "The next chapter, we write together.", at: t(287.0), big: true },
];
const typedEnd = (b: Block) => b.at + [...b.zh].length * PER_CHAR;

// 一个字一个字打出来，末尾一个闪动的光标；后一段开始打时，前一段暗下去
const Typed: React.FC<{ block: Block; next?: Block; top: number }> = ({ block, next, top }) => {
  const frame = useCurrentFrame();
  if (frame < block.at) return null;
  const chars = [...block.zh];
  const shown = Math.min(chars.length, Math.floor((frame - block.at) / PER_CHAR) + 1);
  const typing = shown < chars.length;
  const cursorOn = typing || Math.floor(frame / 15) % 2 === 0;
  const dim = next && frame >= next.at ? 0.5 : 1;
  const done = typedEnd(block);
  const en = interpolate(frame, [done + 4, done + 20], [0, 1], clamp);
  const last = !next;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: dim }}>
      <div
        style={{
          fontFamily: block.big ? FONTS.songBlack : FONTS.song,
          fontSize: block.big ? 58 : 42,
          letterSpacing: "0.08em",
          color: block.big ? SPACE.cinnabar : SPACE.cream,
          whiteSpace: "pre",
        }}
      >
        {chars.slice(0, shown).join("")}
        <span style={{ opacity: cursorOn && (typing || last || !next || frame < next.at) ? 1 : 0, color: SPACE.cinnabar }}>▍</span>
      </div>
      <div style={{ marginTop: 8, fontFamily: FONTS.latin, fontStyle: "italic", fontSize: 22, color: SPACE.creamSoft, opacity: en }}>{block.en}</div>
    </div>
  );
};

export const Unknown: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  const drift = frame * 0.05;
  // 那一点光：先是亮起来，之后像光标一样呼吸；正在打字时更亮
  const born = interpolate(frame, [t(273.6), t(274.8)], [0, 1], clamp);
  const typing = BLOCKS.some((b) => frame >= b.at && frame < typedEnd(b));
  const breath = 0.75 + 0.25 * Math.sin(frame / 7);
  const intensity = born * (typing ? 1.25 : breath);

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      {tex && (
        <ThreeCanvas width={1920} height={1080}>
          <CameraRig position={[0, 0, 20 - drift]} target={[0, 0, -100 - drift]} fov={45} />
          <DeepSky sky={tex.sky} brightness={0.38} />
          {born > 0 && <Glow color="#ffe9d2" size={9 + intensity * 6} intensity={intensity} position={[0, 3.4, -20 - drift]} />}
        </ThreeCanvas>
      )}
      {/* 跋叠化进来之前，字先淡掉，免得压在铜版画上成了双重曝光 */}
      <AbsoluteFill style={{ opacity: interpolate(frame, [t(290.0), t(290.6)], [1, 0], clamp) }}>
        {BLOCKS.map((b, i) => (
          <Typed key={i} block={b} next={BLOCKS[i + 1]} top={560 + i * 110} />
        ))}
      </AbsoluteFill>
      <Locator year="2026" place="此刻" at={t(272.8)} out={t(273.9)} tone="space" />
      <Locator year="？" place="此刻 · 这里" at={t(274.2)} tone="space" />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
