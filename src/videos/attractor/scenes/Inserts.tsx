// 穿插镜头：真实的影像（哈勃超深场飞越、宇宙网、矩尺座里的星系、银河延时……）按念白的句子插进较长的幕里，
// 盖在那一幕上面几秒再淡开，让一幕里不总停在同一种画面。时间是放映时间，直接按句子算（narration.json 的 lines）
import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import narration from "../narration.json";
import { Credit } from "../labels";
import { FPS, LEAD, asset } from "../theme";
import { ease } from "../time";

// 第 i 句念白在放映时间里从第几秒开始 / 到第几秒结束
export const lineStart = (i: number) => LEAD + narration.lines[i].start;
export const lineEnd = (i: number) => LEAD + narration.lines[i].end;

type Shot = {
  src: string; // public/attractor/video/ 下的文件
  at?: number; // 从素材的第几秒开始放
  from: number; // 放映时间（秒）
  to: number;
  zoom?: [number, number]; // 镜头里慢慢推近
  dim?: number; // 压暗：0..1，越小越暗
  dome?: boolean; // 圆形球幕素材：放在画面中间一个圆里，四周是夜色
  credit?: string;
  fade?: number;
};

const ShotBody: React.FC<{ shot: Shot }> = ({ shot }) => {
  // Sequence 里的帧号是从这个镜头开始算的
  const local = useCurrentFrame() / FPS;
  const fade = shot.fade ?? 0.9;
  const len = shot.to - shot.from;
  const opacity = ease(local, 0, fade) * (1 - ease(local, len - fade, len));
  const [z0, z1] = shot.zoom ?? [1.0, 1.06];
  const z = z0 + (z1 - z0) * Math.min(1, Math.max(0, local / len));
  const dim = shot.dim ?? 0.85;
  const video = <OffthreadVideo src={staticFile(asset(`video/${shot.src}`))} trimBefore={Math.round((shot.at ?? 0) * FPS)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <AbsoluteFill style={{ opacity, background: "#02040b" }}>
      {shot.dome ? (
        <div style={{ position: "absolute", left: 960 - 470, top: 540 - 470, width: 940, height: 940, borderRadius: "50%", overflow: "hidden", transform: `scale(${z})`, filter: `brightness(${dim})`, WebkitMaskImage: "radial-gradient(circle, #000 62%, transparent 71%)" }}>
          {video}
        </div>
      ) : (
        <AbsoluteFill style={{ transform: `scale(${z})`, filter: `brightness(${dim}) saturate(0.9)` }}>{video}</AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(2,4,11,0) 55%, rgba(2,4,11,0.55) 100%)" }} />
      {shot.credit ? <Credit p={opacity} y={36}>{shot.credit}</Credit> : null}
    </AbsoluteFill>
  );
};

const HUBBLE = "ESA/Hubble & Digitized Sky Survey 2（CC BY 4.0）";
const HUDF = "NASA, ESA, F. Summers 等 (STScI) · 哈勃超深场";
const WEB = "NASA SVS · 宇宙网模拟";

// 每个穿插镜头挂在一句念白上：这句说什么，就插一段对得上的真实影像
export const SHOTS: Shot[] = [
  // 太阳带着地球，绕着银河系的中心旋转
  { src: "gal_band.mp4", from: lineStart(3) - 0.4, to: lineStart(4) + 1.6, zoom: [1.0, 1.08], dim: 0.8, credit: HUBBLE },
  // 漫天古老的光；宇宙诞生之初留下的余晖……
  { src: "hudf.mp4", at: 0, from: lineStart(7) - 0.8, to: lineStart(9) - 0.2, zoom: [1.0, 1.04], dim: 0.85, credit: HUDF },
  // 测出成千上万个星系的特殊速度
  { src: "hudf.mp4", at: 16, from: lineStart(17) - 0.2, to: lineStart(18) + 0.4, dim: 0.85, credit: HUDF },
  // 单凭这一个星系团，根本拉不动……（从银河推近到矩尺座里的 ESO 137-001）
  { src: "eso137.mp4", at: 14, from: lineStart(34) - 0.3, to: lineStart(36) - 0.6, zoom: [1.0, 1.05], dim: 0.68, credit: `${HUBBLE} · ESO 137-001` },
  // 宇宙的立体流场被完整重构出来
  { src: "web.mp4", at: 0, from: lineStart(36) - 0.2, to: lineStart(37) + 0.2, zoom: [0.96, 1.04], dim: 0.9, dome: true, credit: WEB },
  // 视线如果再往更深处延伸
  { src: "hudf.mp4", at: 24, from: lineStart(42) - 0.4, to: lineStart(43) + 0.6, zoom: [1.0, 1.06], dim: 0.85, credit: HUDF },
  // 身后横亘着一片广袤空洞
  { src: "web.mp4", at: 12, from: lineStart(44) - 0.2, to: lineStart(45) + 0.4, zoom: [1.04, 0.98], dim: 0.85, dome: true, credit: WEB },
  // 近处、远处、明处、暗处……无数引力与空洞共同交织出的合力
  { src: "web.mp4", at: 26, from: lineStart(50) - 0.2, to: lineStart(51) - 0.3, zoom: [0.98, 1.06], dim: 0.9, dome: true, credit: WEB },
  // 你的房间，窗外的树影，整座城市，乃至这颗蔚蓝的星球
  { src: "night_b.mp4", at: 0, from: lineStart(54) - 0.6, to: lineEnd(54) + 1.0, zoom: [1.0, 1.05], dim: 0.75, credit: "Oasis of Mara 银河延时 · Commons" },
];

export const Inserts: React.FC<{ shots: Shot[] }> = ({ shots }) => (
  <>
    {shots.map((shot) => (
      <Sequence key={`${shot.src}${shot.from}`} from={Math.round(shot.from * FPS)} durationInFrames={Math.round((shot.to - shot.from) * FPS)} layout="none">
        <ShotBody shot={shot} />
      </Sequence>
    ))}
  </>
);
