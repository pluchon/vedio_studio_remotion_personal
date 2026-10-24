// 那个生灵：沿一条脊柱按粗细生成平滑的轮廓（尾尖到鼻尖），上亮下暗，受光一侧有边缘光，
// 背上一排会发光的暖色斑点——后来的火和城市的灯都从这一点暖光来。四条腿是会走的细长弧线，一只大眼睛
import { BlurMask, Circle, Group, LinearGradient, Oval, Path, Skia, vec } from "@shopify/react-native-skia";
import type { SkPath } from "@shopify/react-native-skia";
import React from "react";
import { lerp } from "./sk";

export type Pose = {
  lift?: number; // 0..1 抬头
  walk?: number; // 走路的相位（弧度，随时间增加）
  swim?: number; // 0..1 游动：身体波动、腿收起
  look?: [number, number]; // 眼睛看的方向
  blink?: number; // 0..1 眨眼
  glow?: number; // 背上斑点的亮度 0..1
  sit?: number; // 0..1 坐下：前身立起
  mouth?: number; // 说话时头往前一探
};

const N = 46;
// 粗细：尾尖细、身体最粗、脖子收、头再鼓一点、鼻尖收
const radius = (s: number) => {
  const k: [number, number][] = [
    [0, 2],
    [0.18, 9],
    [0.36, 24],
    [0.52, 34],
    [0.66, 28],
    [0.76, 17],
    [0.86, 23],
    [0.95, 17],
    [1, 6],
  ];
  for (let i = 1; i < k.length; i++) {
    if (s <= k[i][0]) {
      const p = (s - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      const e = p * p * (3 - 2 * p);
      return lerp(k[i - 1][1], k[i][1], e);
    }
  }
  return 6;
};

// 脊柱：从尾尖 (s=0) 到鼻尖 (s=1)，身长约 360 像素，原点在身体中间、脚底在 y≈62
const spine = (s: number, pose: Pose): [number, number] => {
  const { lift = 0, walk = 0, swim = 0, sit = 0, mouth = 0 } = pose;
  let x = (s - 0.5) * 360;
  let y = -Math.sin(s * Math.PI) * 6;
  // 尾巴自然下垂再翘起一点
  if (s < 0.36) y += (0.36 - s) * 40 - Math.pow((0.36 - s) / 0.36, 2) * 26;
  // 游：一道从头传到尾的波
  y += swim * Math.sin(s * 9 - walk * 2.6) * 16 * (1.2 - s);
  // 走：身体轻轻起伏
  y += (1 - swim) * Math.sin(walk * 2) * 2.5;
  // 坐：前半身绕腰（s=0.45）向上转
  const pivot = 0.45;
  if (s > pivot && sit > 0) {
    const ang = -sit * 1.05;
    const px = (pivot - 0.5) * 360;
    const dx = x - px;
    const dy = y;
    x = px + dx * Math.cos(ang) - dy * Math.sin(ang);
    y = dx * Math.sin(ang) + dy * Math.cos(ang);
  }
  // 抬头：脖子（s=0.72）以前绕脖根往上转
  const neck = 0.7;
  if (s > neck && lift > 0) {
    const [nx, ny] = spineBase(neck, pose);
    const ang = -lift * 1.15;
    const dx = x - nx;
    const dy = y - ny;
    x = nx + dx * Math.cos(ang) - dy * Math.sin(ang);
    y = ny + dx * Math.sin(ang) + dy * Math.cos(ang);
  }
  if (s > 0.8) x += mouth * 10 * (s - 0.8) * 5;
  return [x, y];
};
// 抬头前的脊柱（只算到坐姿），抬头时绕它转
const spineBase = (s: number, pose: Pose): [number, number] => spine(s, { ...pose, lift: 0, mouth: 0 });

const outline = (pose: Pose) => {
  const pts = Array.from({ length: N + 1 }, (_, i) => spine(i / N, pose));
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(N, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l;
    const ny = tx / l;
    const r = radius(i / N);
    // 肚子比背略鼓
    left.push([pts[i][0] + nx * r * 0.92, pts[i][1] + ny * r * 0.92]);
    right.push([pts[i][0] - nx * r * 1.08, pts[i][1] - ny * r * 1.08]);
  }
  const ring = [...left, ...right.reverse()];
  const p = Skia.Path.Make();
  // 用相邻点的中点做二次曲线，轮廓圆润
  const mid = (u: [number, number], v: [number, number]): [number, number] => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
  const m0 = mid(ring[ring.length - 1], ring[0]);
  p.moveTo(m0[0], m0[1]);
  for (let i = 0; i < ring.length; i++) {
    const cur = ring[i];
    const nxt = ring[(i + 1) % ring.length];
    const m = mid(cur, nxt);
    p.quadTo(cur[0], cur[1], m[0], m[1]);
  }
  p.close();
  return { path: p, pts };
};

// 腿：从髋到脚的一段弧，走路时前后摆、抬脚
const leg = (hip: [number, number], phase: number, pose: Pose, len: number): SkPath => {
  const { walk = 0, swim = 0 } = pose;
  const sw = Math.sin(walk * 2 + phase);
  const up = Math.max(0, Math.cos(walk * 2 + phase));
  const tuck = swim;
  const foot: [number, number] = [hip[0] + sw * 16 * (1 - tuck) - tuck * 26, hip[1] + lerp(len, 14, tuck) - up * 9 * (1 - tuck)];
  const knee: [number, number] = [(hip[0] + foot[0]) / 2 + 9, (hip[1] + foot[1]) / 2 - 2];
  const p = Skia.Path.Make();
  p.moveTo(hip[0], hip[1]);
  p.quadTo(knee[0], knee[1], foot[0], foot[1]);
  return p;
};

export const Critter: React.FC<{
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
  pose: Pose;
  body?: string;
  belly?: string;
  rim?: string;
  rimSide?: number; // 光从哪边来：1 右上，-1 左上
  silhouette?: number; // 0..1 变成剪影（逆光）
  ink?: string; // 剪影的颜色
}> = ({ x, y, s = 1, flip = false, rot = 0, pose, body = "#f2994a", belly = "#a8532a", rim = "#ffe2b0", rimSide = 1, silhouette = 0, ink = "#0a0716" }) => {
  const { path, pts } = outline(pose);
  const glow = pose.glow ?? 0.4;
  const hips: [number, number][] = [spine(0.42, pose), spine(0.62, pose)];
  const legLen = 40;
  const legsFar = hips.map((h, i) => leg([h[0] + 6, h[1] + 14], i * 1.6 + Math.PI, pose, legLen));
  const legsNear = hips.map((h, i) => leg([h[0], h[1] + 18], i * 1.6, pose, legLen));
  const head = spine(0.9, pose);
  const neckDir = (() => {
    const a = spine(0.86, pose);
    const b = spine(0.97, pose);
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  })();
  const eye: [number, number] = [head[0] + Math.cos(neckDir - 1.2) * 12, head[1] + Math.sin(neckDir - 1.2) * 12];
  const { look = [1, 0], blink = 0 } = pose;
  const shade = (c: string) => (silhouette > 0 ? mixHex(c, ink, silhouette) : c);
  // 背上的发光斑点：在脊柱上方一侧
  const spots = [0.3, 0.38, 0.46, 0.54, 0.62, 0.7].map((u, i) => {
    const a = pts[Math.round(u * N)];
    const b = pts[Math.round(u * N) + 1];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const r = radius(u) * 0.62;
    return { x: a[0] + (ty / l) * r, y: a[1] - (tx / l) * r, k: 0.8 + 0.2 * Math.sin((pose.walk ?? 0) * 0.7 + i) };
  });
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scaleX: flip ? -s : s }, { scaleY: s }]}>
      {legsFar.map((p, i) => (
        <Path key={i} path={p} style="stroke" strokeWidth={13} strokeCap="round" color={shade(belly)} />
      ))}
      <Path path={path}>
        <LinearGradient start={vec(0, -40)} end={vec(0, 34)} colors={[shade(lighten(body, 0.12)), shade(body), shade(belly)]} positions={[0, 0.45, 1]} />
      </Path>
      {/* 边缘光：只描受光的上沿 */}
      <Group opacity={0.85 * (1 - silhouette * 0.3)}>
        <Path path={path} style="stroke" strokeWidth={3.2}>
          <LinearGradient start={vec(rimSide * 60, -40)} end={vec(-rimSide * 20, 10)} colors={[rim, "rgba(255,255,255,0)"]} />
          <BlurMask blur={1.2} style="normal" />
        </Path>
      </Group>
      {legsNear.map((p, i) => (
        <Path key={i} path={p} style="stroke" strokeWidth={14} strokeCap="round" color={shade(body)} />
      ))}
      {spots.map((sp, i) => (
        <Group key={i}>
          <Circle cx={sp.x} cy={sp.y} r={9} color="#ffb547" opacity={glow * 0.55 * sp.k}>
            <BlurMask blur={8} style="normal" />
          </Circle>
          <Circle cx={sp.x} cy={sp.y} r={3.2} color="#fff0c8" opacity={Math.min(1, glow * 1.3) * sp.k} />
        </Group>
      ))}
      {silhouette < 0.95 ? (
        <Group opacity={1 - silhouette}>
          <Oval x={eye[0] - 11} y={eye[1] - 11 * (1 - blink * 0.92)} width={22} height={22 * (1 - blink * 0.92)} color="#fffaf2" />
          <Circle cx={eye[0] + look[0] * 3.5} cy={eye[1] + look[1] * 3.5} r={7.2 * (1 - blink)} color="#1d1430" />
          <Circle cx={eye[0] + look[0] * 3.5 + 2.4} cy={eye[1] + look[1] * 3.5 - 3} r={2.4 * (1 - blink)} color="#ffffff" />
        </Group>
      ) : null}
    </Group>
  );
};

// 颜色小工具
const parse = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
export const mixHex = (a: string, b: string, p: number) => {
  const x = parse(a);
  const y = parse(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * p));
};
export const lighten = (a: string, p: number) => mixHex(a, "#ffffff", p);
