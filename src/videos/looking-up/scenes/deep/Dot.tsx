// 深空 · 1990：它拍下的那张照片。镜头慢慢推向光带里那一粒几乎看不见的点，一个细圈圈住它——那就是地球，不到一个像素
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Camera, Mist } from "../../components/Ink";
import { Subtitle } from "../../components/Subtitle";
import { EASE_OUT, FONTS, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.dot);

// 照片 5230×5175，按宽铺满后高 1900，取竖向 52% 处；地球在原图 (0.5943, 0.519)
const FOCUS_Y = 0.52;
const DOT = { x: 0.5943 * 1920, y: 0.519 * 1900 - (1900 - 1080) * FOCUS_Y };

export const Dot: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, t(178.37)], [1, 1.5], { easing: (x) => x * (2 - x) });
  const ring = interpolate(frame, [t(169.4), t(170.4)], [0, 1], { ...clamp, easing: EASE_OUT });
  const origin = `${(DOT.x / 1920) * 100}% ${(DOT.y / 1080) * 100}%`;

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      <Camera scale={push} origin={origin}>
        <Img src={staticFile(asset("plates/pale_blue_dot.jpg"))} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${FOCUS_Y * 100}%` }} />
      </Camera>
      {/* 圈与标注不跟着放大：圆心落在推近后的地球位置上，也就是原位（推镜以它为中心） */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={DOT.x} cy={DOT.y} r={34 + (1 - ring) * 40} fill="none" stroke={SPACE.cream} strokeWidth={1.8} opacity={ring * 0.9} />
        <line x1={DOT.x + 34} y1={DOT.y - 10} x2={DOT.x + 150} y2={DOT.y - 70} stroke={SPACE.cream} strokeWidth={1.2} opacity={ring * 0.8} />
      </svg>
      <div style={{ position: "absolute", left: DOT.x + 162, top: DOT.y - 108, whiteSpace: "nowrap", ...inkIn(frame, t(170.2), 14) }}>
        <div style={{ fontFamily: FONTS.songBlack, fontSize: 40, color: SPACE.cream, letterSpacing: "0.1em" }}>地球</div>
        <div style={{ fontFamily: FONTS.song, fontSize: 22, color: SPACE.creamSoft, letterSpacing: "0.14em", marginTop: 6 }}>不到一个像素</div>
      </div>
      <Mist tone="space" strength={0.6} height={300} />
      <Subtitle
        zh={["它回过头，拍下一粒淡蓝色的尘埃。", "我们所有的历史，都在那粒尘埃上。"]}
        en={["It turned around and photographed a speck of pale blue dust.", "All of our history is on that speck."]}
        at={t(168.5)}
        out={t(177.8)}
        tone="space"
        stagger={2.6}
      />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
