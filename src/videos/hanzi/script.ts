// 念白的时间表：每一小段从哪一秒念到哪一秒（从录音的停顿里量出来，再和语音识别的结果对过）；一段里的字按时间均分
import type { Caption } from "@remotion/captions";

// [起, 止, 字, 这一段念完后字幕是否换页]
type Phrase = [number, number, string, boolean?];

const PHRASES: Phrase[] = [
  [0.43, 1.78, "三千多年前，"],
  [2.33, 4.0, "有人在龟甲上"],
  [4.15, 4.62, "刻下"],
  [4.83, 5.32, "一个圈，", true],
  [6.47, 7.49, "中间点了一点。"],
  [8.51, 9.12, "那是太阳。", true],
  [11.13, 12.74, "三座峰并在一起，"],
  [13.47, 14.09, "是山。", true],
  [15.24, 16.14, "一道水流，"],
  [16.66, 17.79, "两边溅起水花，"],
  [18.67, 19.23, "是水。", true],
  [20.69, 21.59, "那时候的字，"],
  [22.14, 23.61, "是照着东西画出来的。", true],
  [24.48, 26.36, "画不出来的意思，"],
  [26.99, 28.69, "就把两个字放在一起。", true],
  [29.96, 30.77, "人靠着树，"],
  [31.26, 31.82, "是休。", true],
  [32.41, 33.87, "日和月挨着，"],
  [34.4, 35.11, "是明。", true],
  [36.42, 36.91, "后来，"],
  [37.2, 38.73, "字铸进了青铜，"],
  [39.25, 40.4, "笔画变得粗壮。", true],
  [41.31, 43.85, "秦朝把各地的写法统一成一种，", true],
  [44.79, 45.98, "线条匀称，"],
  [46.33, 47.25, "弯得很圆。", true],
  [49.0, 49.55, "可是"],
  [50.03, 51.85, "圆的线写起来太慢。", true],
  [52.5, 54.46, "抄写文书的人把它拉直、"],
  [54.8, 55.68, "折断，", true],
  [55.89, 56.57, "圆"],
  [57.01, 58.29, "变成了方。", true],
  [58.68, 59.58, "从这时起，"],
  [59.85, 61.09, "字不再像画。", true],
  [62.31, 62.95, "再往后，"],
  [63.39, 65.28, "一横一竖都有了规矩，", true],
  [65.76, 67.29, "就是我们今天写的样子。", true],
  [68.97, 69.53, "太阳"],
  [70.49, 71.62, "早就不是圆的了。", true],
  [73.09, 74.82, "可每次写下这个「日」字，", true],
  [75.69, 76.33, "写的"],
  [76.81, 78.04, "还是三千年前"],
  [78.78, 80.75, "那个人看见的太阳。", true],
];

const MARKS = "，。、「」";

// 拆成一个字一条；标点不占时间，跟着挨着的字走
export const CAPTIONS: Caption[] = PHRASES.flatMap(([start, end, text, pageBreak]) => {
  const tokens: string[] = [];
  let lead = "";
  for (const char of text) {
    if (char === "「") {
      lead = char;
    } else if (MARKS.includes(char) && tokens.length) {
      tokens[tokens.length - 1] += char;
    } else {
      tokens.push(lead + char);
      lead = "";
    }
  }
  const each = (end - start) / tokens.length;
  return tokens.map((token, i) => ({
    text: token,
    startMs: Math.round((start + i * each) * 1000),
    endMs: Math.round((start + (i + 1) * each) * 1000),
    timestampMs: Math.round((start + (i + 0.5) * each) * 1000),
    confidence: null,
    pageBreakAfter: Boolean(pageBreak) && i === tokens.length - 1,
  }));
});
