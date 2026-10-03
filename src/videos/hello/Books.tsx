// 一摞厚书：三维的。书一本一本落下来摞好，整摞慢慢转
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { spring } from "remotion";
import { C, FPS } from "./theme";

const BOOKS = [
  { color: C.coral, thick: 0.62, wide: 3.5, turn: 0.1 },
  { color: C.lemon, thick: 0.5, wide: 3.2, turn: -0.22 },
  { color: C.mint, thick: 0.7, wide: 3.4, turn: 0.16 },
  { color: C.lilac, thick: 0.46, wide: 3.0, turn: -0.12 },
  { color: C.sky, thick: 0.58, wide: 3.3, turn: 0.24 },
];
const DEEP = 2.4;
const COVER = 0.07;

// 一本书：上下两片封面、左边的书脊，中间夹着白色的书页
const Book: React.FC<{ color: string; thick: number; wide: number }> = ({
  color,
  thick,
  wide,
}) => (
  <group>
    <mesh position={[0.04, 0, 0]}>
      <boxGeometry args={[wide - 0.14, thick - COVER * 2, DEEP - 0.12]} />
      <meshLambertMaterial color="#FFFDF6" />
    </mesh>
    {[-1, 1].map((side) => (
      <mesh key={side} position={[0, (side * (thick - COVER)) / 2, 0]}>
        <boxGeometry args={[wide, COVER, DEEP]} />
        <meshLambertMaterial color={color} />
      </mesh>
    ))}
    <mesh position={[-wide / 2 + COVER / 2, 0, 0]}>
      <boxGeometry args={[COVER, thick, DEEP]} />
      <meshLambertMaterial color={color} />
    </mesh>
  </group>
);

export const Books: React.FC<{
  t: number; // 从第一本书开始落算起的秒数
  width: number;
  height: number;
}> = ({ t, width, height }) => {
  let base = 0;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 4.4, 10.5], fov: 34 }}
    >
      <ambientLight intensity={2.1} />
      <directionalLight position={[4, 8, 6]} intensity={1.7} />
      <group
        position={[0, -1.6, 0]}
        rotation={[0, 0.55 + Math.sin(t * 0.7) * 0.18, 0]}
      >
        {BOOKS.map((book, i) => {
          const rest = base + book.thick / 2;
          base += book.thick;
          const land = spring({
            frame: (t - i * 0.3) * FPS,
            fps: FPS,
            config: { damping: 13, stiffness: 120, mass: 0.8 },
          });
          if (t < i * 0.3) return null;
          return (
            <group
              key={book.color}
              position={[0, rest + (1 - land) * 9, 0]}
              rotation={[0, book.turn + (1 - land) * 0.9, 0]}
            >
              <Book color={book.color} thick={book.thick} wide={book.wide} />
            </group>
          );
        })}
      </group>
    </ThreeCanvas>
  );
};
