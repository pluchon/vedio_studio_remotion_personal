// 一盏小路灯：闪几下后亮稳，在地上照出一圈暖光；swellFrom 起光圈扩散到铺满画面
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { GravelNoise } from "./Asphalt";
import { NIGHT } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 光圈在地上的位置
export const POOL = { x: 960, y: 660, rx: 560, ry: 300 };

// 刚通电时的闪烁（每帧亮度）
const FLICKER = [0.5, 0, 0, 0.7, 0.15, 0, 0, 0, 0.9, 1, 0.3, 0, 0.8, 1, 1, 0.6, 1, 1, 1, 0.85];

// 光圈扩散的进度（0~1），画面其他层（如暗角）也按它一起退去
export const swellProgress = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

export const Lamp: React.FC<{ onAt: number; swellFrom: number; swellTo: number }> = ({ onAt, swellFrom, swellTo }) => {
  const frame = useCurrentFrame();
  const t = frame - onAt;
  if (t < 0) return null;

  const flicker = t < FLICKER.length ? FLICKER[t] : 1;
  const intensity = Math.min(1, flicker * (1 + 0.025 * Math.sin(frame / 11)));
  const swell = swellProgress(frame, swellFrom, swellTo);
  const grow = 1 + swell * 4.5;
  const rx = POOL.rx * grow;
  const ry = POOL.ry * grow;

  // 扩散时光也变得更浓，避免在暗底上显得发灰
  const poolGradient = `radial-gradient(ellipse ${rx}px ${ry}px at ${POOL.x}px ${POOL.y}px, rgba(255, 226, 170, ${0.5 + swell * 0.5}) 0%, rgba(242, 184, 110, ${0.2 + swell * 0.6}) 42%, rgba(242, 184, 110, 0) 100%)`;
  const litMask = `radial-gradient(ellipse ${rx * 0.8}px ${ry * 0.8}px at ${POOL.x}px ${POOL.y}px, #000 0%, transparent 100%)`;

  return (
    <AbsoluteFill style={{ opacity: intensity }}>
      {/* 灯杆方向投下来的一束淡光：先裁成光束再整体模糊，边缘才是软的；到地面前已淡到没有 */}
      <AbsoluteFill style={{ filter: "blur(36px)", opacity: 1 - swell }}>
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 224, 170, 0.12) 0%, rgba(255, 224, 170, 0.05) 40%, rgba(255, 224, 170, 0) 60%)",
            clipPath: `polygon(${POOL.x - 30}px -60px, ${POOL.x + 30}px -60px, ${POOL.x + POOL.rx * 0.6}px ${POOL.y}px, ${POOL.x - POOL.rx * 0.6}px ${POOL.y}px)`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: poolGradient }} />
      {/* 光圈里的砂石被照亮 */}
      <GravelNoise
        id="wd-gravel-lit"
        rgb={[1, 0.86, 0.62]}
        cut={0.5}
        style={{ opacity: 0.35, maskImage: litMask, WebkitMaskImage: litMask }}
      />
      {/* 扩散到最后，整个画面被暖光填满 */}
      <AbsoluteFill style={{ backgroundColor: NIGHT.lampCore, opacity: interpolate(swell, [0.3, 1], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
