// 布景：树、花、云、太阳、房子、书架、窗户、彩旗、气球、月亮……都是放在 <svg> 里的小组件
// 每一样都以自己的「脚底」为原点来画，用 <At> 摆到画面上；k 是「从地里长出来」的程度
import { noise2D } from "@remotion/noise";
import { makeStar } from "@remotion/shapes";
import React from "react";
import { random } from "remotion";
import { C } from "./theme";

const LINE = 5;

export const At: React.FC<{
  x: number;
  y: number;
  s?: number;
  k?: number;
  turn?: number;
  children: React.ReactNode;
}> = ({ x, y, s = 1, k = 1, turn = 0, children }) =>
  k <= 0.001 ? null : (
    <g
      transform={`translate(${x} ${y}) rotate(${turn}) scale(${s * (0.7 + 0.3 * k)} ${s * k})`}
    >
      {children}
    </g>
  );

type Round = { cx: number; cy: number; rx: number; ry?: number };

// 几个圆叠成一团，只描最外面一圈边
const Lump: React.FC<{ parts: Round[]; fill: string; line?: number }> = ({
  parts,
  fill,
  line = LINE,
}) => (
  <>
    {parts.map((p, i) => (
      <ellipse
        key={`e-${i}`}
        cx={p.cx}
        cy={p.cy}
        rx={p.rx}
        ry={p.ry ?? p.rx}
        fill={C.ink}
        stroke={C.ink}
        strokeWidth={line * 2}
      />
    ))}
    {parts.map((p, i) => (
      <ellipse
        key={`f-${i}`}
        cx={p.cx}
        cy={p.cy}
        rx={p.rx}
        ry={p.ry ?? p.rx}
        fill={fill}
      />
    ))}
  </>
);

const Face: React.FC<{ y?: number; gap?: number; sleepy?: boolean }> = ({
  y = 0,
  gap = 16,
  sleepy = false,
}) => (
  <g>
    {[-1, 1].map((side) =>
      sleepy ? (
        <path
          key={side}
          d={`M ${side * gap - 6} ${y} q 6 6 12 0`}
          stroke={C.ink}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <ellipse
          key={side}
          cx={side * gap}
          cy={y}
          rx={4}
          ry={5.5}
          fill={C.ink}
        />
      ),
    )}
    {[-1, 1].map((side) => (
      <ellipse
        key={`b-${side}`}
        cx={side * (gap + 13)}
        cy={y + 9}
        rx={7}
        ry={4}
        fill={C.blush}
        opacity={0.75}
      />
    ))}
    <path
      d={`M -5 ${y + 8} q 5 5 10 0`}
      stroke={C.ink}
      strokeWidth={3.5}
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

export const Cloud: React.FC<{
  t: number;
  face?: boolean;
  fill?: string;
  seed?: number;
}> = ({ t, face = false, fill = C.white, seed = 0 }) => (
  <g transform={`translate(0 ${Math.sin(t * 0.7 + seed * 2) * 6})`}>
    <Lump
      fill={fill}
      parts={[
        { cx: 0, cy: -34, rx: 104, ry: 34 },
        { cx: -44, cy: -58, rx: 46, ry: 36 },
        { cx: 26, cy: -70, rx: 58, ry: 46 },
      ]}
    />
    {face ? <Face y={-46} /> : null}
  </g>
);

const RAYS = makeStar({
  points: 12,
  innerRadius: 86,
  outerRadius: 118,
  cornerRadius: 8,
}).path;

export const Sun: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <g transform={`rotate(${t * 14}) translate(-118 -118)`}>
      <path
        d={RAYS}
        fill={C.lemon}
        stroke={C.ink}
        strokeWidth={LINE}
        strokeLinejoin="round"
      />
    </g>
    <circle r={70} fill="#FFDD6B" stroke={C.ink} strokeWidth={LINE} />
    <Face y={-4} gap={22} />
  </g>
);

export const Tree: React.FC<{ t: number; seed?: number; fill?: string }> = ({
  t,
  seed = 0,
  fill = C.leaf,
}) => (
  <g transform={`rotate(${Math.sin(t * 1.3 + seed) * 1.6})`}>
    <rect
      x={-13}
      y={-120}
      width={26}
      height={122}
      rx={8}
      fill={C.wood}
      stroke={C.ink}
      strokeWidth={LINE}
    />
    <Lump
      fill={fill}
      parts={[
        { cx: 0, cy: -190, rx: 78 },
        { cx: -52, cy: -150, rx: 54 },
        { cx: 54, cy: -146, rx: 56 },
      ]}
    />
    <circle cx={-30} cy={-206} r={10} fill={C.white} opacity={0.4} />
    <circle cx={30} cy={-150} r={7} fill={C.white} opacity={0.3} />
  </g>
);

export const Bush: React.FC<{ fill?: string }> = ({ fill = C.leaf }) => (
  <Lump
    fill={fill}
    parts={[
      { cx: 0, cy: -34, rx: 58, ry: 44 },
      { cx: -52, cy: -22, rx: 38, ry: 30 },
      { cx: 54, cy: -20, rx: 36, ry: 28 },
    ]}
  />
);

export const Flower: React.FC<{ t: number; seed?: number; fill?: string }> = ({
  t,
  seed = 0,
  fill = C.pink,
}) => (
  <g transform={`rotate(${Math.sin(t * 1.8 + seed * 1.7) * 5})`}>
    <path
      d="M 0 0 Q 6 -34 0 -66"
      stroke={C.leafDeep}
      strokeWidth={7}
      strokeLinecap="round"
      fill="none"
    />
    <ellipse
      cx={14}
      cy={-28}
      rx={15}
      ry={7}
      transform="rotate(-28 14 -28)"
      fill={C.leaf}
      stroke={C.ink}
      strokeWidth={4}
    />
    <g transform="translate(0 -74)">
      {[0, 72, 144, 216, 288].map((angle) => (
        <circle
          key={angle}
          cx={Math.cos((angle * Math.PI) / 180) * 15}
          cy={Math.sin((angle * Math.PI) / 180) * 15}
          r={12}
          fill={fill}
          stroke={C.ink}
          strokeWidth={4}
        />
      ))}
      <circle r={10} fill={C.lemon} stroke={C.ink} strokeWidth={4} />
    </g>
  </g>
);

export const House: React.FC<{ t: number }> = ({ t }) => (
  <g stroke={C.ink} strokeWidth={LINE} strokeLinejoin="round">
    <rect x={64} y={-330} width={36} height={80} rx={6} fill={C.coralDeep} />
    {[0, 1, 2].map((i) => {
      const p = (t * 0.5 + i / 3) % 1;
      return (
        <circle
          key={i}
          cx={82 + Math.sin(p * 6 + i) * 10}
          cy={-340 - p * 90}
          r={10 + p * 14}
          fill={C.white}
          strokeOpacity={0.3}
          opacity={1 - p}
        />
      );
    })}
    <rect x={-130} y={-200} width={260} height={202} rx={10} fill="#FFF1D6" />
    <path d="M -168 -190 L 0 -330 L 168 -190 Z" fill={C.coral} />
    <rect x={-44} y={-128} width={88} height={130} rx={44} fill={C.wood} />
    <circle cx={22} cy={-58} r={6} fill={C.ink} stroke="none" />
    <rect x={62} y={-150} width={48} height={48} rx={8} fill={C.sky} />
    <path d="M 86 -150 L 86 -102 M 62 -126 L 110 -126" strokeWidth={4} />
  </g>
);

export const Fence: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <g stroke={C.ink} strokeWidth={LINE} strokeLinejoin="round">
    <rect
      x={-10}
      y={-44}
      width={count * 46 + 4}
      height={12}
      rx={6}
      fill={C.white}
    />
    {Array.from({ length: count }, (_, i) => (
      <path
        key={i}
        d={`M ${i * 46} 0 L ${i * 46} -58 L ${i * 46 + 14} -72 L ${i * 46 + 28} -58 L ${i * 46 + 28} 0 Z`}
        fill={C.white}
      />
    ))}
  </g>
);

export const Butterfly: React.FC<{
  t: number;
  seed?: number;
  fill?: string;
}> = ({ t, seed = 0, fill = C.lilac }) => {
  const flap = 0.35 + 0.65 * Math.abs(Math.sin(t * 11 + seed));
  return (
    <g
      transform={`translate(${noise2D(`fly-x-${seed}`, t * 0.5, 0) * 70} ${
        noise2D(`fly-y-${seed}`, 0, t * 0.5) * 50
      })`}
    >
      {[-1, 1].map((side) => (
        <g key={side} transform={`scale(${side * flap} 1)`}>
          <ellipse
            cx={13}
            cy={-8}
            rx={13}
            ry={11}
            fill={fill}
            stroke={C.ink}
            strokeWidth={3.5}
          />
          <ellipse
            cx={10}
            cy={8}
            rx={9}
            ry={8}
            fill={fill}
            stroke={C.ink}
            strokeWidth={3.5}
          />
        </g>
      ))}
      <rect x={-2.5} y={-12} width={5} height={24} rx={2.5} fill={C.ink} />
    </g>
  );
};

// 一条由近到远都能用的山坡剪影：几道正弦叠出来的起伏
export const Hills: React.FC<{
  y: number;
  amp: number;
  shift: number;
  fill: string;
  width?: number;
  seed?: number;
}> = ({ y, amp, shift, fill, width = 1920, seed = 0 }) => {
  let d = `M -20 1100 L -20 ${y}`;
  for (let x = -20; x <= width + 20; x += 40) {
    const u = (x + shift) / 400;
    const h =
      Math.sin(u + seed) * 0.6 +
      Math.sin(u * 2.3 + seed * 3) * 0.3 +
      Math.sin(u * 0.47 + seed * 5) * 0.5;
    d += ` L ${x} ${y - h * amp}`;
  }
  return <path d={`${d} L ${width + 20} 1100 Z`} fill={fill} />;
};

const FLAGS = [C.coral, C.lemon, C.mint, C.lilac, C.sky, C.pink];

// 一串三角彩旗，中间往下坠一点
export const Bunting: React.FC<{
  t: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sag?: number;
  count?: number;
  k?: number;
}> = ({ t, x1, y1, x2, y2, sag = 70, count = 12, k = 1 }) => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag * 2;
  const at = (u: number) => ({
    x: (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2,
    y: (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2,
  });
  if (k <= 0.001) return null;
  return (
    <g>
      <path
        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
        stroke={C.ink}
        strokeWidth={LINE}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.min(1, k)}
      />
      {Array.from({ length: count }, (_, i) => {
        const u = (i + 0.5) / count;
        if (u > k) return null;
        const p = at(u);
        const grow = Math.min(1, (k - u) * count * 0.6);
        return (
          <g
            key={i}
            transform={`translate(${p.x} ${p.y}) rotate(${Math.sin(t * 2.4 + i * 0.9) * 7}) scale(${grow})`}
          >
            <path
              d="M -24 0 L 24 0 L 0 46 Z"
              fill={FLAGS[i % FLAGS.length]}
              stroke={C.ink}
              strokeWidth={LINE}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </g>
  );
};

export const Balloon: React.FC<{ t: number; fill?: string; seed?: number }> = ({
  t,
  fill = C.coral,
  seed = 0,
}) => {
  const sway = Math.sin(t * 1.4 + seed * 2) * 5;
  return (
    <g transform={`rotate(${sway})`}>
      <path
        d={`M 0 0 q ${10 + sway} 40 0 80 q ${-10 - sway} 40 0 80`}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M -10 6 L 10 6 L 0 -8 Z"
        fill={fill}
        stroke={C.ink}
        strokeWidth={LINE}
        strokeLinejoin="round"
      />
      <ellipse
        cx={0}
        cy={-72}
        rx={52}
        ry={64}
        fill={fill}
        stroke={C.ink}
        strokeWidth={LINE}
      />
      <ellipse
        cx={-18}
        cy={-96}
        rx={10}
        ry={18}
        transform="rotate(24 -18 -96)"
        fill={C.white}
        opacity={0.5}
      />
    </g>
  );
};

export const Moon: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <circle r={120} fill={C.lemon} opacity={0.12} />
    <path
      d="M 30 -76 A 82 82 0 1 0 76 30 A 62 62 0 1 1 30 -76 Z"
      fill="#FFE08A"
      stroke={C.ink}
      strokeWidth={LINE}
      strokeLinejoin="round"
    />
    <path
      d="M -34 -6 q 8 8 16 0"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinecap="round"
      fill="none"
    />
    <ellipse cx={-30} cy={14} rx={8} ry={5} fill={C.blush} opacity={0.8} />
    {[0, 1, 2].map((i) => {
      const p = (t * 0.35 + i / 3) % 1;
      return (
        <text
          key={i}
          x={60 + p * 50}
          y={-70 - p * 70}
          fontSize={24 + p * 22}
          fontWeight={700}
          fill={C.white}
          opacity={Math.sin(p * Math.PI) * 0.8}
          fontFamily="HelloFredoka"
        >
          z
        </text>
      );
    })}
  </g>
);

const SPINES = [
  C.coral,
  C.lemon,
  C.mint,
  C.lilac,
  C.sky,
  C.pink,
  C.coralLight,
  "#FFF1D6",
];

// 一面书架：每一格里的书宽窄高矮不同，偶尔有一本歪着
export const Bookshelf: React.FC<{
  w: number;
  h: number;
  rows: number;
  seed?: string;
  glow?: number; // 书在发光：读书的时候用
}> = ({ w, h, rows, seed = "shelf", glow = 0 }) => {
  const rowH = h / rows;
  return (
    <g>
      <rect
        x={-w / 2}
        y={-h}
        width={w}
        height={h}
        rx={14}
        fill="#F3D9B1"
        stroke={C.ink}
        strokeWidth={LINE}
      />
      {Array.from({ length: rows }, (_, row) => {
        const books: React.ReactNode[] = [];
        let x = -w / 2 + 16;
        let i = 0;
        while (x < w / 2 - 44) {
          const bw = 20 + random(`${seed}-w-${row}-${i}`) * 20;
          const bh = rowH * (0.58 + random(`${seed}-h-${row}-${i}`) * 0.26);
          const lean = random(`${seed}-l-${row}-${i}`) > 0.86 ? 12 : 0;
          const color =
            SPINES[Math.floor(random(`${seed}-c-${row}-${i}`) * SPINES.length)];
          const base = -h + (row + 1) * rowH - 8;
          books.push(
            <g key={i} transform={`rotate(${lean} ${x} ${base})`}>
              <rect
                x={x}
                y={base - bh}
                width={bw}
                height={bh}
                rx={4}
                fill={color}
                stroke={C.ink}
                strokeWidth={4}
              />
              <rect
                x={x + 4}
                y={base - bh + 10}
                width={bw - 8}
                height={5}
                rx={2.5}
                fill={C.white}
                opacity={0.6}
              />
              {glow > 0 ? (
                <rect
                  x={x}
                  y={base - bh}
                  width={bw}
                  height={bh}
                  rx={4}
                  fill={C.white}
                  opacity={glow * (0.25 + 0.3 * Math.sin(i * 1.7 + row))}
                />
              ) : null}
            </g>,
          );
          x += bw + (lean ? 16 : 3);
          i++;
        }
        return (
          <g key={row}>
            <rect
              x={-w / 2 + 6}
              y={-h + (row + 1) * rowH - 8}
              width={w - 12}
              height={8}
              rx={4}
              fill={C.wood}
              stroke={C.ink}
              strokeWidth={3}
            />
            {books}
          </g>
        );
      })}
    </g>
  );
};

export const Window: React.FC<{
  t: number;
  w?: number;
  h?: number;
  night?: boolean;
}> = ({ t, w = 300, h = 260, night = false }) => (
  <g>
    <clipPath id={`pane-${w}-${h}`}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={18} />
    </clipPath>
    <rect
      x={-w / 2}
      y={-h}
      width={w}
      height={h}
      rx={18}
      fill={night ? "#3A3266" : "#CDE7FB"}
    />
    <g clipPath={`url(#pane-${w}-${h})`}>
      {[0, 1].map((i) => {
        const x = ((t * 14 + i * (w * 0.8)) % (w * 1.6)) - w * 0.8;
        return (
          <g key={i} fill={C.white} opacity={night ? 0.25 : 0.95}>
            <ellipse cx={x} cy={-h * 0.62 + i * 46} rx={52} ry={18} />
            <ellipse cx={x + 16} cy={-h * 0.62 + i * 46 - 16} rx={30} ry={22} />
          </g>
        );
      })}
      <ellipse
        cx={0}
        cy={0}
        rx={w * 0.8}
        ry={h * 0.26}
        fill={night ? "#2B2347" : "#BFE5B4"}
      />
    </g>
    <rect
      x={-w / 2}
      y={-h}
      width={w}
      height={h}
      rx={18}
      fill="none"
      stroke={C.ink}
      strokeWidth={LINE + 1}
    />
    <path
      d={`M 0 ${-h} L 0 0 M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2}`}
      stroke={C.ink}
      strokeWidth={LINE}
    />
    <rect
      x={-w / 2 - 22}
      y={-6}
      width={w + 44}
      height={20}
      rx={10}
      fill={C.white}
      stroke={C.ink}
      strokeWidth={LINE}
    />
    {[-1, 1].map((side) => (
      <path
        key={side}
        d={`M ${side * (w / 2 + 16)} ${-h - 14} L ${side * (w / 2 - 40)} ${-h - 14} Q ${side * (w / 2 - 20)} ${-h * 0.5} ${
          side * (w / 2 + 16)
        } ${-h * 0.34} Z`}
        fill={C.pink}
        stroke={C.ink}
        strokeWidth={LINE}
        strokeLinejoin="round"
      />
    ))}
    <rect
      x={-w / 2 - 30}
      y={-h - 24}
      width={w + 60}
      height={16}
      rx={8}
      fill={C.wood}
      stroke={C.ink}
      strokeWidth={LINE}
    />
  </g>
);

export const Plant: React.FC<{ t: number; seed?: number }> = ({
  t,
  seed = 0,
}) => (
  <g>
    {[-34, -14, 8, 30].map((angle, i) => (
      <g
        key={angle}
        transform={`translate(0 -56) rotate(${angle + Math.sin(t * 1.5 + i + seed) * 4})`}
      >
        <ellipse
          cx={0}
          cy={-46}
          rx={17}
          ry={46}
          fill={i % 2 ? C.leaf : C.leafDeep}
          stroke={C.ink}
          strokeWidth={LINE}
        />
        <path
          d="M 0 -10 L 0 -78"
          stroke={C.ink}
          strokeWidth={3}
          opacity={0.35}
        />
      </g>
    ))}
    <path
      d="M -44 -62 L 44 -62 L 34 0 L -34 0 Z"
      fill={C.coral}
      stroke={C.ink}
      strokeWidth={LINE}
      strokeLinejoin="round"
    />
    <rect
      x={-50}
      y={-74}
      width={100}
      height={18}
      rx={8}
      fill={C.coralDeep}
      stroke={C.ink}
      strokeWidth={LINE}
    />
  </g>
);

export const Lamp: React.FC<{ glow?: number }> = ({ glow = 1 }) => (
  <g>
    <circle cx={0} cy={-330} r={150} fill={C.lemon} opacity={0.16 * glow} />
    <rect x={-6} y={-300} width={12} height={300} rx={6} fill={C.ink} />
    <ellipse
      cx={0}
      cy={-4}
      rx={50}
      ry={12}
      fill={C.wood}
      stroke={C.ink}
      strokeWidth={LINE}
    />
    <path
      d="M -44 -372 L 44 -372 L 68 -290 L -68 -290 Z"
      fill={C.lemon}
      stroke={C.ink}
      strokeWidth={LINE}
      strokeLinejoin="round"
    />
  </g>
);

export const Rug: React.FC<{ w?: number; fill?: string }> = ({
  w = 300,
  fill = C.pink,
}) => (
  <g>
    <ellipse
      rx={w}
      ry={w * 0.16}
      fill={fill}
      stroke={C.ink}
      strokeWidth={LINE}
    />
    <ellipse
      rx={w * 0.8}
      ry={w * 0.115}
      fill="none"
      stroke={C.white}
      strokeWidth={6}
      strokeDasharray="4 22"
      strokeLinecap="round"
    />
  </g>
);

// 舞台两边的幕布
export const Curtain: React.FC<{ t: number; side: 1 | -1; h?: number }> = ({
  t,
  side,
  h = 900,
}) => {
  const sway = Math.sin(t * 1.1 + side) * 8;
  return (
    <g transform={`scale(${side} 1)`}>
      <path
        d={`M -40 -40 L 190 -40 Q ${150 + sway} ${h * 0.35} ${96 + sway} ${h * 0.55} Q ${40 + sway} ${h * 0.75} ${
          70 + sway
        } ${h} L -40 ${h} Z`}
        fill={C.coralDeep}
        stroke={C.ink}
        strokeWidth={LINE + 1}
        strokeLinejoin="round"
      />
      {[30, 80, 130].map((x) => (
        <path
          key={x}
          d={`M ${x} -30 Q ${x * 0.7 + sway} ${h * 0.4} ${x * 0.42 + sway} ${h * 0.6}`}
          stroke={C.ink}
          strokeWidth={4}
          opacity={0.25}
          fill="none"
        />
      ))}
      <rect
        x={-10}
        y={h * 0.55 - 14}
        width={120 + sway}
        height={28}
        rx={14}
        fill={C.lemon}
        stroke={C.ink}
        strokeWidth={LINE}
      />
    </g>
  );
};

// 萤火虫：几粒慢慢游的亮点
export const Fireflies: React.FC<{
  t: number;
  count?: number;
  width?: number;
  top?: number;
  bottom?: number;
}> = ({ t, count = 14, width = 1920, top = 200, bottom = 760 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const x =
        random(`ff-x-${i}`) * width + noise2D(`ff-dx-${i}`, t * 0.25, 0) * 120;
      const y =
        top +
        random(`ff-y-${i}`) * (bottom - top) +
        noise2D(`ff-dy-${i}`, 0, t * 0.25) * 90;
      const blink =
        0.35 + 0.65 * Math.abs(Math.sin(t * (1.2 + random(`ff-b-${i}`)) + i));
      return (
        <g key={i} opacity={blink}>
          <circle cx={x} cy={y} r={16} fill={C.lemon} opacity={0.22} />
          <circle cx={x} cy={y} r={5} fill="#FFF3B8" />
        </g>
      );
    })}
  </g>
);

// 太阳周围很淡的几道光，慢慢转
export const Beams: React.FC<{ t: number; reach?: number }> = ({
  t,
  reach = 1300,
}) => (
  <g transform={`rotate(${t * 3})`}>
    {Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      const half = 0.11;
      return (
        <path
          key={i}
          d={`M 0 0 L ${Math.cos(a - half) * reach} ${Math.sin(a - half) * reach} L ${
            Math.cos(a + half) * reach
          } ${Math.sin(a + half) * reach} Z`}
          fill={C.white}
          opacity={0.09}
        />
      );
    })}
  </g>
);

// 从画面角上探进来的一枝叶子：离镜头近，所以画得大、有点虚
export const Foliage: React.FC<{ t: number; seed?: number }> = ({
  t,
  seed = 0,
}) => (
  <g style={{ filter: "blur(2.5px)" }} opacity={0.92}>
    <path
      d="M -30 -10 Q 120 40 250 150"
      stroke={C.wood}
      strokeWidth={14}
      strokeLinecap="round"
      fill="none"
    />
    {[
      [40, 30, 40],
      [100, 20, -30],
      [130, 80, 60],
      [190, 70, -10],
      [215, 140, 70],
      [262, 150, 20],
    ].map(([x, y, turn], i) => (
      <g
        key={i}
        transform={`translate(${x} ${y}) rotate(${turn + Math.sin(t * 1.4 + i * 1.3 + seed) * 7})`}
      >
        <ellipse
          cx={0}
          cy={44}
          rx={26}
          ry={50}
          fill={i % 2 ? C.leaf : C.leafDeep}
          stroke={C.ink}
          strokeWidth={LINE}
        />
        <path d="M 0 6 L 0 84" stroke={C.ink} strokeWidth={3} opacity={0.3} />
      </g>
    ))}
  </g>
);
