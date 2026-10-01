// 《一场雨》的谱：在公用的谱（每个音的起点、轻重、逐帧响度）之上，再读出这首曲子的三个时刻。画面只认这份谱，换一首曲子雨也跟着变
import { useMemo } from "react";
import { AudioScore, Note, useAudioScore } from "../../shared/audioScore";

export type { Note };

export type Score = AudioScore & {
  // 低音第一次明显进来的时刻（秒）：雨从这里下大
  pour: number;
  // 曲子中途换气最轻的那一刻，以及换气后重新起音的时刻（秒）
  breath: number;
  resume: number;
};

const readScore = (audio: AudioScore, fps: number): Score => {
  const { notes, loudness, bass } = audio;
  const frames = loudness.length;
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

// 读配乐并算出谱；音频还没解码完时返回 null
export const useScore = (music: string, fps: number): Score | null => {
  const audio = useAudioScore(music, fps);
  return useMemo(() => (audio ? readScore(audio, fps) : null), [audio, fps]);
};
