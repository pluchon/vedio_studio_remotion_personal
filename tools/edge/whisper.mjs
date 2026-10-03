// 把念白转成带时间的文字，只用来核对内容和句子的大致位置：node tools/edge/whisper.mjs
// 程序和模型沿用第八期放在 tools/hanzi/whisper.cpp/ 里的那一份（不入库）
import fs from "node:fs";
import path from "node:path";
import { toCaptions, transcribe } from "@remotion/install-whisper-cpp";

const VERSION = "1.5.5";
const root = process.cwd();
const folder = path.join(root, "tools", "hanzi", "whisper.cpp");
const out = path.join(root, "tools", "edge", "whisper.json");

const whisperCppOutput = await transcribe({
  model: "small",
  whisperPath: folder,
  whisperCppVersion: VERSION,
  inputPath: path.join(folder, "edge.wav"),
  tokenLevelTimestamps: true,
  language: "zh",
  splitOnWord: false,
});
const { captions } = toCaptions({ whisperCppOutput });
fs.writeFileSync(out, JSON.stringify(captions, null, 2));
process.stdout.write(`${captions.length} 段，写到 ${out}\n`);
