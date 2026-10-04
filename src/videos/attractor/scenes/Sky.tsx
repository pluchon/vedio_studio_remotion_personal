// 第一幕「入睡」：从一张床上看到的夜空起，一路升起，看见地球、银河系，和它朝着某个方向的移动
import React from "react";
import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { Dots, FIELD, GALAXY } from "../../nebula/Stars";
import { Credit, Tag } from "../labels";
import { Canvas, Rig, StarField, dir, gal, project, rad } from "../space";
import { COLORS, FONT, FPS, asset } from "../theme";
import { ramp, toReal, track, useReal, useT } from "../time";
import type { V3 } from "../time";

// 片名：「巨」「引」「源」一个字一个字从雾里显出来，字距慢慢展开；底下一条细线、英文名和一句问话。
// 收尾时字向上飘一点、淡成雾，字距再展开一点，线向中间收回去
const TITLE = ["巨", "引", "源"];
const soft = (t: number, a: number, b: number) => {
  const p = ramp(t, a, b);
  return p * p * (3 - 2 * p);
};

export const Title: React.FC = () => {
  const t = useReal();
  const veil = soft(t, 0.2, 1.8) * (1 - soft(t, 5.6, 7.4));
  if (t > 8) return null;
  const spacing = 44 + 38 * soft(t, 0.7, 3.8) + 26 * soft(t, 5.0, 7.2);
  const line = soft(t, 2.3, 3.9) * (1 - soft(t, 5.3, 6.6));
  const eng = soft(t, 3.0, 4.4) * (1 - soft(t, 5.2, 6.4));
  const ask = soft(t, 3.6, 4.9) * (1 - soft(t, 5.1, 6.2));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.7 * veil, background: "radial-gradient(ellipse 52% 40% at 50% 50%, rgba(2,4,11,0.78) 0%, rgba(2,4,11,0.35) 55%, rgba(2,4,11,0) 100%)" }} />
      <div style={{ position: "relative", display: "flex", fontFamily: FONT, fontSize: 190, lineHeight: 1.1, color: "#eef1fa", paddingLeft: spacing }}>
        {TITLE.map((ch, i) => {
          const into = soft(t, 0.9 + 0.5 * i, 2.5 + 0.5 * i);
          const out = soft(t, 5.0 + 0.18 * i, 6.5 + 0.18 * i);
          const alpha = into * (1 - out);
          return (
            <span
              key={ch}
              style={{
                display: "inline-block",
                marginRight: spacing,
                opacity: alpha,
                transform: `translateY(${(1 - into) * 20 - out * 24}px) scale(${0.97 + 0.03 * into})`,
                filter: `blur(${(1 - into) * 14 + out * 12}px)`,
                textShadow: `0 0 ${24 + 30 * into}px rgba(140,170,255,${0.4 * alpha})`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ position: "relative", marginTop: 26, height: 2, width: 560 * line, background: "linear-gradient(90deg, rgba(190,205,255,0), rgba(190,205,255,0.85), rgba(190,205,255,0))", opacity: line }} />
      <div style={{ position: "relative", marginTop: 34, fontFamily: FONT, fontSize: 30, letterSpacing: 18, paddingLeft: 18, color: "#aeb9d6", opacity: 0.9 * eng, transform: `translateY(${(1 - eng) * 8}px)` }}>THE GREAT ATTRACTOR</div>
      <div style={{ position: "relative", marginTop: 22, fontFamily: FONT, fontSize: 28, letterSpacing: 12, paddingLeft: 12, color: COLORS.amber, opacity: 0.8 * ask, transform: `translateY(${(1 - ask) * 8}px)` }}>是什么，在牵引着我们</div>
    </div>
  );
};

// 躺着看天：真实的银河延时，慢慢换成从空间站看到的地球夜景，再升到银河系
export const Ground: React.FC = () => {
  const t = useT();
  const night = 1 - ramp(t, 9.5, 12.5);
  const earth = ramp(t, 9.5, 12.5) * (1 - ramp(t, 21, 23));
  const earthFrom = Math.max(0, Math.round((toReal(9.5) - toReal(-2)) * FPS));
  const cover = { position: "absolute", left: 0, top: 0, width: 1920, height: 1080, objectFit: "cover" } as const;
  return (
    <>
      {night > 0.003 ? (
        <div style={{ position: "absolute", inset: 0, opacity: night }}>
          <OffthreadVideo src={staticFile(asset("video/night_a.mp4"))} muted style={cover} />
        </div>
      ) : null}
      {earth > 0.003 ? (
        <div style={{ position: "absolute", inset: 0, opacity: earth }}>
          {/* 片段从它自己的开头放：后半段有日出的强光，不适合助眠 */}
          <Sequence from={earthFrom} layout="none">
            <OffthreadVideo src={staticFile(asset("video/earth_iss.mp4"))} muted style={cover} />
          </Sequence>
        </div>
      ) : null}
      <Tag chip x={1500} y={300} p={ramp(t, 12.5, 14) * (1 - ramp(t, 18, 19.5))} size={30} color={COLORS.amber} sub="地球绕太阳">
        ≈ 30 km/s
      </Tag>
      <Credit p={ramp(t, 10, 12) * (1 - ramp(t, 21, 23))}>ESA / NASA · Alexander Gerst（CC BY-SA 3.0 IGO）</Credit>
    </>
  );
};

// 银河系和它的邻居，以及它走的方向（相对微波背景）
const MOTION = dir(271.9, 29.6); // 本星系群相对微波背景：620 ± 15 km/s，(l, b) = (271.9°, 29.6°)
const SUN_AT = gal(-0.55, 0, 0);
const M31 = (() => {
  const v = dir(121.2, -21.6);
  return [SUN_AT[0] + v[0] * 52, SUN_AT[1] + v[1] * 52, SUN_AT[2] + v[2] * 52] as V3;
})();

export const Galaxy: React.FC = () => {
  const t = useT();
  const dist = track(t, [[21, 2.4], [25, 3.0], [28, 14], [32, 60], [38, 105], [48, 120]]);
  const az = 0.5 + t * 0.018;
  const el = rad(track(t, [[21, 34], [38, 24]]));
  const cam: V3 = [Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist];
  const look: V3 = [0, 0, 0];
  const fov = 46;
  const arrow = ramp(t, 29, 34);
  const len = Math.max(0.5, dist * 0.2) * arrow;
  const tip: V3 = [MOTION[0] * len, MOTION[1] * len, MOTION[2] * len];
  const [x0, y0] = project([0, 0, 0], cam, look, fov);
  const [x1, y1] = project(tip, cam, look, fov);
  const [sx, sy] = project(SUN_AT, cam, look, fov);
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const head = 18;
  const fadeIn = ramp(t, 21, 24.5);
  return (
    <>
      <Canvas>
        <Rig pos={cam} look={look} fov={fov} far={600} />
        <StarField time={t} alpha={0.5} />
        <Dots data={GALAXY()} alpha={0.6 * fadeIn} time={t} rotation={[-Math.PI / 2, 0, 0]} />
        <Dots data={GALAXY()} alpha={0.55 * ramp(t, 26, 31)} time={t} position={M31} rotation={[-0.9, 0.3, 0.2]} scale={1.2} />
        <Dots data={FIELD()} alpha={0.5 * ramp(t, 27, 33)} time={t} rotation={[0, 0, 0]} scale={0.9} />
      </Canvas>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ramp(t, 22, 23.5) * (1 - ramp(t, 28, 29.4))}>
          <circle cx={sx} cy={sy} r={16} fill="none" stroke={COLORS.amber} strokeWidth={1.8} />
          <circle cx={sx} cy={sy} r={3} fill={COLORS.amber} />
        </g>
        <g opacity={arrow * (1 - ramp(t, 47, 49))} stroke={COLORS.amber} strokeWidth={2.4} fill="none" strokeLinecap="round">
          <line x1={x0} y1={y0} x2={x1} y2={y1} />
          <line x1={x1} y1={y1} x2={x1 - head * Math.cos(ang - 0.45)} y2={y1 - head * Math.sin(ang - 0.45)} />
          <line x1={x1} y1={y1} x2={x1 - head * Math.cos(ang + 0.45)} y2={y1 - head * Math.sin(ang + 0.45)} />
        </g>
      </svg>
      <Tag x={sx + 30} y={sy - 34} p={ramp(t, 22.4, 23.6) * (1 - ramp(t, 28, 29.4))} size={26} align="left" color={COLORS.amber} sub="太阳绕银心 ≈ 230 km/s">
        我们在这里
      </Tag>
      <Tag x={x1 + 30} y={y1 - 26} p={ramp(t, 35, 37) * (1 - ramp(t, 47, 49))} size={30} align="left" color={COLORS.amber} sub="相对宇宙微波背景">
        ≈ 620 km/s
      </Tag>
      <Tag x={960} y={150} p={ramp(t, 39, 41.5) * (1 - ramp(t, 47, 49))} size={30} color={COLORS.amber} sub="620 km/s × 8 小时">
        ≈ 1800 万公里
      </Tag>
    </>
  );
};
