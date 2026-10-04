// 椭圆全天图（Mollweide）的外框和经纬网；银经向左增加，银心在正中
import React from "react";
import { mollweide } from "../space";

export const MollGrid: React.FC<{ cx: number; cy: number; hw: number; hh: number }> = ({ cx, cy, hw, hh }) => {
  const xy = (l: number, b: number) => {
    const [nx, ny] = mollweide(l, b);
    return `${(cx + nx * hw).toFixed(1)},${(cy - ny * hh).toFixed(1)}`;
  };
  const lines: React.ReactNode[] = [];
  for (let l = -150; l <= 150; l += 30) {
    const poly: string[] = [];
    for (let b = -90; b <= 90; b += 5) poly.push(xy(-l, b));
    lines.push(<polyline key={`l${l}`} points={poly.join(" ")} fill="none" stroke="#6b7a96" strokeOpacity={0.28} strokeWidth={1} />);
  }
  for (let b = -60; b <= 60; b += 30) {
    const poly: string[] = [];
    for (let l = -180; l <= 180; l += 5) poly.push(xy(l, b));
    lines.push(<polyline key={`b${b}`} points={poly.join(" ")} fill="none" stroke="#6b7a96" strokeOpacity={b === 0 ? 0.5 : 0.28} strokeWidth={b === 0 ? 1.6 : 1} />);
  }
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={hw} ry={hh} fill="none" stroke="#8fa0c0" strokeOpacity={0.7} strokeWidth={2} />
      {lines}
    </>
  );
};
