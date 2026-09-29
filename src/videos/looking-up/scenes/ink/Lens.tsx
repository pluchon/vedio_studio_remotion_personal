// 墨 · 1609：屏息。弗拉马利翁版画里的人跪在天穹边，把头探了出去；一枚镜片的圆圈在画上张开，
// 镜头朝着天穹外面推进去，越推越快，最后整个画面被光吞掉——下一幕颜色涌进来
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { EASE_OUT, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.lens);

// 版画铺成画面高度，居中；推进的目标是天穹外那些轮子和云（画面左上）
const IMG = { w: (1080 * 3614) / 3027, h: 1080 };
const LEFT = (1920 - IMG.w) / 2;
const TARGET = { x: LEFT + IMG.w * 0.2, y: IMG.h * 0.32 };

export const Lens: React.FC = () => {
  const frame = useCurrentFrame();
  const slow = interpolate(frame, [0, t(85.9)], [1, 1.45]);
  const rush = interpolate(frame, [t(85.9), t(86.85)], [1, 5], { ...clamp, easing: (x) => x * x });
  const white = interpolate(frame, [t(86.3), t(86.85)], [0, 1], clamp);
  const lens = interpolate(frame, [t(83.4), t(84.6)], [0, 1], { ...clamp, easing: EASE_OUT });

  return (
    <AbsoluteFill>
      <Xuan />
      <AbsoluteFill style={{ transform: `scale(${slow * rush})`, transformOrigin: `${TARGET.x}px ${TARGET.y}px`, filter: `blur(${(rush - 1) * 1.5}px)` }}>
        <div style={{ position: "absolute", left: LEFT, top: 0, width: IMG.w, height: IMG.h, mixBlendMode: "multiply" }}>
          <Img src={staticFile(asset("plates/flammarion.jpg"))} style={{ width: "100%", height: "100%", filter: "sepia(0.25) contrast(1.05)" }} />
        </div>
        {/* 镜片：一道圆圈张开，圈外的画面压暗一点 */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <mask id="lu-lens-mask">
              <rect width={1920} height={1080} fill="white" />
              <circle cx={TARGET.x} cy={TARGET.y} r={150 * lens} fill="black" />
            </mask>
          </defs>
          <rect width={1920} height={1080} fill={PAPER.base} opacity={lens * 0.45} mask="url(#lu-lens-mask)" />
          <circle cx={TARGET.x} cy={TARGET.y} r={150 * lens} fill="none" stroke={PAPER.cinnabar} strokeWidth={2.4} opacity={lens} />
          <circle cx={TARGET.x} cy={TARGET.y} r={158 * lens} fill="none" stroke={PAPER.ink} strokeWidth={1} opacity={lens * 0.6} />
        </svg>
      </AbsoluteFill>
      <Locator year="1609" place="帕多瓦" at={t(82.5)} out={t(85.8)} tone="ink" />
      <Subtitle zh={["一片玻璃被磨成镜片，指向了天空。"]} en={["A piece of glass, ground into a lens, was turned to the sky."]} at={t(82.7)} out={t(85.8)} tone="ink" stagger={2.6} />
      <Grain opacity={0.05} vignette={0.2} />
      <AbsoluteFill style={{ backgroundColor: "#fffaf0", opacity: white }} />
    </AbsoluteFill>
  );
};
