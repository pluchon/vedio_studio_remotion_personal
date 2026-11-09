// 主持人奶糖：萌部落桌宠的分层图（身体、30 帧尾巴、眨眼、6 种嘴型、欢呼三连姿势），嘴型跟着念白的响度动
import React from "react";
import { Img, interpolate } from "remotion";
import { asset } from "../theme";
import { BEAT, mouthAt } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pet = (n: string) => asset(`img/pet/${n}.webp`);
const LAYER: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
const W = 275;
const H = 375;
const CHEER = 30; // 欢呼 0.75 秒：蹲 5 帧、跳起 15 帧、落地笑 10 帧

// 响度 → 嘴型：1 闭嘴微笑，2 小开，3 中开，6 大开；偶尔用 5（圆口）换换
const mouthFor = (v: number, f: number) => {
  if (v < 0.12) return "mouth-1";
  if (v < 0.32) return "mouth-2";
  if (v < 0.55) return Math.floor(f / 5) % 7 === 3 ? "mouth-5" : "mouth-3";
  return "mouth-6";
};

// 眨眼：大约每 3.7 秒一次，半闭-全闭-半闭
const eyesFor = (f: number) => {
  const p = f % 112;
  if (p === 0 || p === 3) return "eyes-half";
  if (p === 1 || p === 2) return "eyes-closed";
  return null;
};

export const Naitang: React.FC<{
  f: number; x: number; feet: number; height: number; cheers: number[]; flip?: boolean; enter?: number; bounce?: boolean;
}> = ({ f, x, feet, height, cheers, flip, enter = -999, bounce = true }) => {
  const scale = height / H;
  const cheer = cheers.find((c) => f >= c && f < c + CHEER);
  const t = cheer === undefined ? -1 : f - cheer;
  const pose = t < 0 ? null : t < 5 ? "pose-crouch" : t < 20 ? "pose-leap" : "pose-smile";
  const jump = t >= 5 && t < 20 ? Math.sin(((t - 5) / 15) * Math.PI) * 120 : 0;
  // 说话时每拍轻轻点一下头；平时慢慢呼吸
  const talking = mouthAt(f) > 0.05;
  const beatP = (((f % BEAT) + BEAT) % BEAT) / BEAT;
  const nod = bounce && talking ? Math.exp(-beatP * 6) * 6 : 0;
  const breath = 1 + 0.008 * Math.sin(f / 14);
  // 入场：从画面下面跳上来
  const e = interpolate(f, [enter, enter + 14], [0, 1], clamp);
  const enterY = enter > -999 ? (1 - e) * 500 - Math.sin(e * Math.PI) * 80 : 0;
  const tail = Math.floor(f * 0.75) % 30; // 尾巴 30 张一圈 1.5 秒（40 帧/秒）
  const eyes = eyesFor(f);
  return (
    <div
      style={{
        position: "absolute", left: x - (W * scale) / 2, top: feet - H * scale * 0.9547, width: W * scale, height: H * scale,
        transform: `translateY(${enterY - jump + nod}px) scaleX(${flip ? -1 : 1})`,
        filter: "drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff) drop-shadow(0 12px 14px rgba(41,72,106,0.25))",
      }}
    >
      <div style={{ ...LAYER, transformOrigin: "50% 95.47%", transform: `scaleY(${pose ? 1 : breath})` }}>
        {pose ? (
          <Img src={pet(pose)} style={LAYER} />
        ) : (
          <>
            <div style={{ position: "absolute", top: "54.133%", left: "11.273%", width: "34.909%", height: "22.933%", overflow: "hidden" }}>
              <Img src={pet("tail-strip")} style={{ display: "block", width: "3000%", maxWidth: "none", height: "100%", transform: `translateX(${(-tail / 30) * 100}%)` }} />
            </div>
            <Img src={pet("body")} style={LAYER} />
            {eyes ? <Img src={pet(eyes)} style={LAYER} /> : null}
            <Img src={pet(mouthFor(mouthAt(f), f))} style={LAYER} />
          </>
        )}
      </div>
    </div>
  );
};
