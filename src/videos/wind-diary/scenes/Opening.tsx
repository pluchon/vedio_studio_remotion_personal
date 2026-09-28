// 片头：台灯亮起，照出一页日记；片名一个字一个字写出来，第一个钢琴音落下时一阵风掠过纸面，随后灯暗，进入第一则的夜
import React from "react";
import { AbsoluteFill } from "remotion";
import { Caption } from "../components/Caption";
import { Grain } from "../components/Grain";
import { HomeDesk } from "../components/HomeDesk";
import { WindLines } from "../components/WindLines";
import { CHAPTERS, HOME, beatFrame, chapterDuration } from "../theme";

// 片头从第 0 帧开始，本地帧即全片帧
const END = chapterDuration(CHAPTERS.opening);

export const Opening: React.FC = () => (
  <AbsoluteFill>
    <HomeDesk lampOn={0} dimFrom={END - 30} dimTo={END - 2}>
      <Caption zh={["风经过的地方"]} at={16} color={HOME.ink} enColor={HOME.inkSoft} size={124} stagger={6} align="center" style={{ left: 0, right: 0, top: 330 }} />
      <Caption
        zh={["日常生活 · 三则"]}
        en={["Wherever the Wind Goes"]}
        at={60}
        color={HOME.inkSoft}
        enColor={HOME.inkSoft}
        size={40}
        enSize={30}
        align="center"
        style={{ left: 0, right: 0, top: 560 }}
      />
      {/* 第一个钢琴音（第 0 拍）落下时起风 */}
      <WindLines at={beatFrame(0) - 2} duration={64} color={HOME.ink} count={12} band={[180, 900]} seed="opening" />
    </HomeDesk>
    <Grain opacity={0.07} vignette={0.35} />
  </AbsoluteFill>
);
