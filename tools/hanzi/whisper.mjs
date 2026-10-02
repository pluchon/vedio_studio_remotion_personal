// 把念白转成带时间的字幕：node tools/hanzi/whisper.mjs install | model | run
// 语音识别程序和模型放在仓库外的 tools/hanzi/whisper.cpp/（不入库）
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";

const VERSION = "1.5.5";
const MODEL = process.env.WHISPER_MODEL ?? "medium";
const root = process.cwd();
const to = path.join(root, "tools", "hanzi", "whisper.cpp");
const source = path.join(root, "refer", "汉字的演变", "汉字演变.mp3");
const wav = path.join(to, "voice.wav");
const out = path.join(root, "tools", "hanzi", "whisper.json");

const step = process.argv[2];

if (step === "install") {
  await installWhisperCpp({ to, version: VERSION });
}

if (step === "model") {
  await downloadWhisperModel({ model: MODEL, folder: to });
}

if (step === "run") {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", source, "-ar", "16000", "-ac", "1", wav]);
  const whisperCppOutput = await transcribe({
    model: MODEL,
    whisperPath: to,
    whisperCppVersion: VERSION,
    inputPath: wav,
    tokenLevelTimestamps: true,
    language: "zh",
    splitOnWord: false,
  });
  const { captions } = toCaptions({ whisperCppOutput });
  fs.writeFileSync(out, JSON.stringify(captions, null, 2));
  process.stdout.write(`${captions.length} 段，写到 ${out}\n`);
}
