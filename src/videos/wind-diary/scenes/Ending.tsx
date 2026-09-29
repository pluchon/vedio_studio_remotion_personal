// 尾声 · 归来：回到家灯还亮着，这几天的照片贴在一页信纸上；信纸对折、盖上朱砂印，成了一封不必寄出的信；灯暗，全片结束
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Grain } from "../../../shared/Grain";
import { HomeDesk } from "../components/HomeDesk";
import { Polaroid } from "../components/Polaroid";
import { CHAPTERS, EASE_IN_OUT, EASE_OUT, FONTS, HOME, asset, chapterDuration } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const END = chapterDuration(CHAPTERS.ending);
const FOLD: [number, number] = [112, 152];
const SEAL_AT = 160;

const SHEET = { left: 510, top: 250, w: 900, h: 600 };

// 信纸上的内容：三张小照片和一行字
const SheetContent: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#f7f0e2",
      backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 47px, rgba(120, 98, 74, 0.16) 47px, rgba(120, 98, 74, 0.16) 48px)",
    }}
  >
    <Polaroid src={asset("photos/cat.png")} width={230} aspect={804 / 499} at={8} rotate={-5} paper="#fffaf0" ink={HOME.ink} style={{ left: 60, top: 70 }} />
    <Polaroid src={asset("photos/sand_02.png")} width={230} aspect={1631 / 918} at={16} rotate={3} paper="#fffaf0" ink={HOME.ink} style={{ left: 330, top: 110 }} />
    <Polaroid src={asset("photos/city_walk.png")} width={230} aspect={805 / 498} at={24} rotate={-2} paper="#fffaf0" ink={HOME.ink} style={{ left: 600, top: 60 }} />
    <Caption zh={["猫、海、暮色，还有风。"]} at={34} color={HOME.ink} enColor={HOME.inkSoft} size={40} align="center" style={{ left: 0, right: 0, top: 420 }} />
  </AbsoluteFill>
);

const Letter: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [FOLD[0], FOLD[1]], [0, -180], { ...clamp, easing: EASE_IN_OUT });
  const settle = interpolate(frame, [FOLD[1], FOLD[1] + 16], [0, 1], { ...clamp, easing: EASE_OUT });
  const seal = interpolate(frame, [SEAL_AT, SEAL_AT + 8], [0, 1], { ...clamp, easing: EASE_OUT });
  const half = SHEET.h / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: SHEET.left,
        top: SHEET.top,
        width: SHEET.w,
        height: SHEET.h,
        perspective: 1800,
        transform: `translateY(${settle * -80}px) rotate(${settle * -2}deg)`,
      }}
    >
      {/* 下半页不动 */}
      <div style={{ position: "absolute", left: 0, top: half, width: SHEET.w, height: half, overflow: "hidden", boxShadow: "0 26px 40px -20px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "absolute", left: 0, top: -half, width: SHEET.w, height: SHEET.h }}>
          <SheetContent />
        </div>
      </div>
      {/* 上半页沿中线向下翻折 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SHEET.w,
          height: half,
          transformOrigin: "50% 100%",
          transformStyle: "preserve-3d",
          transform: `rotateX(${angle}deg)`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", backfaceVisibility: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: SHEET.w, height: SHEET.h }}>
            <SheetContent />
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#efe6d4", transform: "rotateX(180deg)", backfaceVisibility: "hidden", boxShadow: "inset 0 -30px 40px -30px rgba(90, 70, 50, 0.35)" }} />
      </div>
      {/* 朱砂印：一个「风」字 */}
      {seal > 0 && (
        <div
          style={{
            position: "absolute",
            left: SHEET.w / 2 - 44,
            top: half + half / 2 - 44,
            width: 88,
            height: 88,
            borderRadius: 8,
            backgroundColor: HOME.seal,
            color: "#f7ecdf",
            fontFamily: FONTS.hand,
            fontSize: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: seal * 0.92,
            transform: `scale(${1.6 - seal * 0.6}) rotate(-6deg)`,
            boxShadow: "inset 0 0 0 4px rgba(247, 236, 223, 0.25)",
          }}
        >
          风
        </div>
      )}
    </div>
  );
};

const ink = { color: HOME.ink, enColor: HOME.inkSoft };
const top = { left: 0, right: 0, top: 80 };

export const Ending: React.FC = () => (
  <AbsoluteFill>
    <HomeDesk lampOn={2} dimFrom={END - 52} dimTo={END - 2}>
      <Letter />
      <Caption {...ink} zh={["回到家，灯还亮着。"]} en={["Back home, the light was still on."]} at={18} out={100} align="center" style={top} />
      <Caption {...ink} zh={["就当是一封不必寄出的信。"]} en={["Call it a letter I never need to send."]} at={118} out={200} align="center" style={top} />
      <Caption {...ink} zh={["暮色已经读过了，", "这就够了。"]} en={["The dusk has already read it.", "That is enough."]} at={206} align="center" style={{ ...top, top: 40 }} />
    </HomeDesk>
    <Grain opacity={0.07} vignette={0.4} />
  </AbsoluteFill>
);
