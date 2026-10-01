// 从配乐的波形里读出「谱」：每个音的起点、轻重、低音占比，以及逐帧的响度和低音强度。画面只认这份谱，换一首曲子雨也跟着变
import { useMemo } from "react";
import { useAudioData } from "@remotion/media-utils";
import { staticFile } from "remotion";

export type Note = {
  // 起音的时刻（秒）
  time: number;
  // 相对最强那个音的轻重，0 到 1
  strength: number;
  // 这个音里低频占多少，0 到 1；左手的低音接近 1
  low: number;
};

export type Score = {
  notes: Note[];
  // 逐帧的响度与低音强度，都归一到 0 到 1
  loudness: number[];
  bass: number[];
  // 低音第一次明显进来的时刻（秒）：雨从这里下大
  pour: number;
  // 曲子中途换气最轻的那一刻，以及换气后重新起音的时刻（秒）
  breath: number;
  resume: number;
};

// 每 512 个采样算一格包络，约 12 毫秒
const HOP = 512;
const LOW_CUTOFF = 200;

const rms = (data: Float32Array, from: number, size: number) => {
  let sum = 0;
  for (let i = from; i < from + size; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / size);
};

const readScore = (channels: Float32Array[], sampleRate: number, fps: number): Score => {
  const length = channels[0].length;
  const mono = new Float32Array(length);
  for (const channel of channels) {
    for (let i = 0; i < length; i++) {
      mono[i] += channel[i] / channels.length;
    }
  }
  // 一阶低通滤出左手的低音
  const low = new Float32Array(length);
  const k = 1 - Math.exp((-2 * Math.PI * LOW_CUTOFF) / sampleRate);
  let state = 0;
  for (let i = 0; i < length; i++) {
    state += k * (mono[i] - state);
    low[i] = state;
  }

  const hops = Math.floor(length / HOP) - 1;
  const env: number[] = [];
  const envLow: number[] = [];
  for (let h = 0; h < hops; h++) {
    env.push(rms(mono, h * HOP, HOP));
    envLow.push(rms(low, h * HOP, HOP));
  }
  const peak = Math.max(...env);
  const peakLow = Math.max(...envLow);

  // 起音：对数包络比 46 毫秒前涨了多少，取局部最大
  const LAG = 4;
  const floor = peak * 0.003;
  const flux = env.map((value, h) => (h < LAG ? 0 : Math.max(0, Math.log(value + floor) - Math.log(env[h - LAG] + floor))));
  const threshold = [...flux].sort((a, b) => a - b)[Math.floor(flux.length * 0.9)];
  const maxFlux = Math.max(...flux);
  const notes: Note[] = [];
  for (let h = LAG; h < hops - LAG; h++) {
    if (flux[h] <= threshold) {
      continue;
    }
    let isPeak = true;
    for (let d = -LAG; d <= LAG; d++) {
      if (flux[h + d] > flux[h]) {
        isPeak = false;
      }
    }
    const time = ((h - LAG / 2) * HOP) / sampleRate;
    if (!isPeak || (notes.length > 0 && time - notes[notes.length - 1].time < 0.09)) {
      continue;
    }
    // 起音后约 90 毫秒里的低音占比
    let total = 0;
    let totalLow = 0;
    for (let d = 0; d < 8 && h + d < hops; d++) {
      total += env[h + d];
      totalLow += envLow[h + d];
    }
    notes.push({ time, strength: flux[h] / maxFlux, low: Math.min(1, totalLow / Math.max(total, 1e-9)) });
  }

  // 逐帧的响度：取这一帧前后共约 0.1 秒的平均
  const frames = Math.ceil((length / sampleRate) * fps);
  const loudness: number[] = [];
  const bass: number[] = [];
  for (let f = 0; f < frames; f++) {
    const centre = Math.round(((f + 0.5) / fps) * sampleRate / HOP);
    let sum = 0;
    let sumLow = 0;
    let count = 0;
    for (let h = centre - 4; h <= centre + 4; h++) {
      if (h >= 0 && h < hops) {
        sum += env[h];
        sumLow += envLow[h];
        count++;
      }
    }
    loudness.push(count ? sum / count / peak : 0);
    bass.push(count ? sumLow / count / peakLow : 0);
  }

  const pourFrame = Math.max(0, bass.findIndex((value) => value > 0.35));
  // 换气：雨下大之后、离首尾各五秒以上的范围里，响度最低的一帧
  let breathFrame = pourFrame;
  for (let f = pourFrame + 5 * fps; f < frames - 5 * fps; f++) {
    if (loudness[f] < loudness[breathFrame] || breathFrame === pourFrame) {
      breathFrame = f;
    }
  }
  const breath = breathFrame / fps;
  const resume = notes.find((note) => note.time > breath && note.strength > 0.3)?.time ?? breath + 0.5;
  return { notes, loudness, bass, pour: pourFrame / fps, breath, resume };
};

// 读配乐并算出谱；音频还没解码完时返回 null（useAudioData 会让渲染等着）
export const useScore = (music: string, fps: number): Score | null => {
  const audio = useAudioData(staticFile(music));
  return useMemo(() => (audio ? readScore(audio.channelWaveforms, audio.sampleRate, fps) : null), [audio, fps]);
};
