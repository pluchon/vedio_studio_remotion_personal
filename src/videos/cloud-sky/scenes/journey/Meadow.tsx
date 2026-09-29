// 草地：一丛丛草和零星的小花，小坡上躺着一个孩子，举起一只手指着天上的云
import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { REGION, groundY } from "./world";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const TUFTS = Array.from({ length: 150 }, (_, i) => {
  const r = (k: string) => random(`tuft-${i}-${k}`);
  return { x: 5600 + r("x") * 3000, dy: 14 + Math.pow(r("y"), 1.3) * 330, s: 0.7 + r("s") * 0.8, flower: r("f") < 0.22, hue: r("h") };
});
const FLOWER = ["#fbf6ec", "#f2d37c", "#eab3b8"];

// 孩子：仰面躺着，膝盖弓起，一只手枕在脑后，另一只手指向天上；point 为 0~1，指得越高
const Child: React.FC<{ point: number }> = ({ point }) => {
  const frame = useCurrentFrame();
  const wave = Math.sin(frame / 7) * 4 * point;
  const hand = { x: 46 + point * 16 + wave, y: -44 - point * 40 };
  return (
    <g stroke="#3b3f45" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M16 4 L72 10" />
      <path d="M72 10 L94 -18 L114 12" />
      <path d="M72 10 L100 -10 L120 14" />
      <path d="M22 2 L6 -16 L-10 -6" />
      <path d={`M26 4 L${(26 + hand.x) / 2 + 6} ${(4 + hand.y) / 2 + 4} L${hand.x} ${hand.y}`} />
      <circle cx={0} cy={0} r={14} fill="#f3e6d2" />
    </g>
  );
};

export const Meadow: React.FC<{ camX: number; ty: number; point: number }> = ({ camX, ty, point }) => {
  const frame = useCurrentFrame();
  if (camX + 1920 < 5600) return null;
  const cy = groundY(REGION.child) + 4;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${-camX} ${ty})`}>
        {TUFTS.map((tf, i) => {
          if (tf.x < camX - 40 || tf.x > camX + 1960) return null;
          const y = groundY(tf.x) + tf.dy;
          const sway = 3 * Math.sin(frame / 18 + tf.x / 80);
          const s = tf.s * (0.6 + (tf.dy / 344) * 0.8);
          return (
            <g key={i} transform={`translate(${tf.x} ${y}) scale(${s})`}>
              <path
                d={`M-8 0 Q -8 -10 ${-12 + sway} -20 M0 0 Q 0 -14 ${sway} -26 M8 0 Q 8 -10 ${12 + sway} -18`}
                stroke="#6f8a57"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={0.7}
              />
              {tf.flower && <circle cx={sway} cy={-28} r={4.5} fill={FLOWER[Math.floor(tf.hue * 3)]} stroke="rgba(80,70,60,0.35)" />}
            </g>
          );
        })}
        <g transform={`translate(${REGION.child} ${cy}) scale(1.35) rotate(-4)`}>
          <Child point={point} />
        </g>
      </g>
    </svg>
  );
};

// 孩子举手的程度：羊出现前举起来，龙成形后慢慢放下
export const pointAt = (frame: number, raise: [number, number], lower: [number, number]) =>
  interpolate(frame, [raise[0], raise[1], lower[0], lower[1]], [0, 1, 1, 0.3], clamp);
