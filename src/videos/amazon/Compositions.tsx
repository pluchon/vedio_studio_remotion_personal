// 亚马逊河：像看地图一样往下看，一条亮线从安第斯山的雪线沿着河道画到大西洋，镜头跟着线头走，到有名的地方停一停
import React from "react";
import { Audio } from "@remotion/media";
import { Composition, Folder, staticFile } from "remotion";
import { Film } from "./Film";
import type { Sentence } from "./Overlay";
import type { Journey } from "./plan";
import { FPS, HEIGHT, MUSIC, WIDTH } from "./theme";

// 配乐 81.6 秒，没有明显的段落，70 秒后渐渐收声：路上五站，最后十二秒拉远看整个流域。
// 起止时刻和 sites.ts 里各站的 arrive、leave 对应
const JOURNEY: Journey = {
  seconds: 81.6,
  legs: [
    { from: 5.0, arrive: 13.5, to: 991 },
    { from: 16.0, arrive: 26.0, to: 2411 },
    { from: 30.0, arrive: 43.5, to: 4583 },
    { from: 48.5, arrive: 55.5, to: 5225 },
    { from: 59.0, arrive: 66.5, to: 5900 },
  ],
  distance: [
    [0, 300],
    [5, 330],
    [9.5, 760],
    [13.5, 470],
    [16, 470],
    [21, 980],
    [26, 540],
    [30, 540],
    [37, 1150],
    [43.5, 400],
    [48.5, 400],
    [52, 760],
    [55.5, 440],
    [59, 440],
    [63, 820],
    [66.5, 720],
    [69.5, 760],
    [76, 3000],
    [81.6, 3150],
  ],
  pitch: [
    [0, 66],
    [69.5, 64],
    [76, 74],
    [81.6, 75],
  ],
  lead: [
    [0, 0],
    [81.6, 0],
  ],
  relief: [
    [0, 2.4],
    [30, 2],
    [81.6, 2],
  ],
  turn: [
    [0, 0],
    [81.6, 0],
  ],
  steady: 110,
  sun: { lon: -72, lat: -13, azimuth: 74, elevation: 12 },
  finale: { from: 69.5, to: 76, lon: -62, lat: -5.5 },
};

const LINES: Sentence[] = [
  { zh: "它从一座雪山的北坡出发，只是一道细流", en: "It begins as a trickle on the northern slope of a snow peak.", at: 6.6, out: 11.6 },
  { zh: "两条大河在这里相遇，从此它叫亚马逊", en: "Two great rivers meet here. From now on, it is the Amazon.", at: 26.4, out: 30.6 },
  { zh: "黑水与黄水并排流了六公里，才慢慢相融", en: "Black water and brown run side by side for six kilometres before they mix.", at: 44.0, out: 49.0 },
  { zh: "整条河从不到两公里宽的河道里挤过去", en: "The whole river squeezes through a channel less than two kilometres wide.", at: 56.0, out: 59.4 },
  { zh: "每秒二十万立方米的淡水，流进大西洋", en: "Two hundred thousand cubic metres of fresh water a second, into the Atlantic.", at: 66.9, out: 71.0 },
  { zh: "地球上流进海洋的河水，约五分之一来自这里", en: "About a fifth of all the river water that reaches the sea comes from here.", at: 73.6, out: 78.6 },
];

const Amazon: React.FC = () => (
  <>
    <Film journey={JOURNEY} lines={LINES} />
    <Audio src={staticFile(MUSIC)} volume={0.9} />
  </>
);

export const AmazonCompositions: React.FC = () => (
  <Folder name="Amazon">
    <Composition id="Amazon" component={Amazon} durationInFrames={Math.round(JOURNEY.seconds * FPS)} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
);
