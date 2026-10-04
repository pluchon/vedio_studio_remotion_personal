// 第九幕「也许并没有一个」：2026 年那篇论文的摘要，框出关键的数；背后是本地宇宙的约束模拟
import React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import { Box, Credit, Quote, Tag } from "../labels";
import { COLORS, asset } from "../theme";
import { ramp, track, useT } from "../time";
import { Page } from "./Paper";

export const Maybe: React.FC = () => {
  const t = useT();
  const fy = track(t, [[371, 1000], [376, 1100], [381, 1190], [388, 1300], [393, 1400]]);
  const zoom = 0.62;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 * ramp(t, 371, 376) * (1 - ramp(t, 407, 410.5)), background: "#000" }}>
        <OffthreadVideo src={staticFile(asset("video/clues.mp4"))} muted style={{ position: "absolute", left: 840, top: 0, width: 1080, height: 1080 }} />
      </div>
      <div style={{ opacity: ramp(t, 371, 375) * (1 - ramp(t, 407, 410.5)) }}>
        <Page src="img/paper_stiskalek2026.jpg" ax={470} ay={540} fx={750} fy={fy} zoom={zoom}>
          <Box x={212} y={1152} w={1080} h={56} p={ramp(t, 380, 384)} />
          <Box x={212} y={1436} w={1080} h={82} p={ramp(t, 388, 392)} />
        </Page>
      </div>
      <Tag x={1470} y={250} p={ramp(t, 381.5, 384) * (1 - ramp(t, 390, 392))} size={90} color={COLORS.amber} sub="能解释的本星系群速度">
        ≈ 72%
      </Tag>
      <Tag x={1470} y={420} p={ramp(t, 384, 386.5) * (1 - ramp(t, 390, 392))} size={90} color={COLORS.amber} sub="方向还差的角度">
        ≈ 38°
      </Tag>
      <Quote
        x={1010}
        y={520}
        w={800}
        p={ramp(t, 383, 386) * (1 - ramp(t, 390, 392))}
        en="…mass within 155 h⁻¹ Mpc accounts for only ~72% of that velocity magnitude with ~38 deg directional offset."
        zh="155 h⁻¹ Mpc 以内的质量，只能解释这个速度的约 72%，方向还差约 38°"
        source="Stiskalek 等，Open Journal of Astrophysics 9（2026）· 摘要"
      />
      <Quote
        x={1010}
        y={470}
        w={800}
        p={ramp(t, 391, 394) * (1 - ramp(t, 407, 409))}
        en="…the classical Great Attractor is not a dynamically dominant structure but an artefact of the instantaneous velocity field…"
        zh="经典的「巨引源」不是动力学上占主导的结构，而是瞬时速度场的假象"
        source="同上 · 摘要最后一段"
      />
      <Credit p={ramp(t, 375, 378) * (1 - ramp(t, 407, 410))}>背景：CLUES 约束模拟，本地宇宙的纤维结构（CC BY 4.0）</Credit>
    </>
  );
};
