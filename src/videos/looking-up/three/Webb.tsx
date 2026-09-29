// 韦布空间望远镜：五层遮阳板（长约 21 米、宽约 14 米）在下；上面是 18 块六边形金色镜片拼成的主镜，
// 左右各三块折在背后，展开时翻上来；三根支架伸出去撑住副镜。1 单位 = 1 米
import React, { useMemo } from "react";
import * as THREE from "three";

// 六边形镜片：对边 1.32 米，外接圆半径 0.76 米
const HEX_R = 0.78;
const hexShape = () => {
  const s = new THREE.Shape();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const x = Math.cos(a) * HEX_R * 0.97;
    const y = Math.sin(a) * HEX_R * 0.97;
    if (k === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
};

// 主镜 18 块：半径 2 以内的六边形网格去掉正中那一格；q = ±2 那两列是两翼
const SEGMENTS = (() => {
  const list: { q: number; r: number; x: number; y: number }[] = [];
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      const s = -q - r;
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) > 2 || (q === 0 && r === 0)) continue;
      list.push({ q, r, x: 1.5 * HEX_R * q, y: Math.sqrt(3) * HEX_R * (r + q / 2) });
    }
  }
  return list;
})();

// 遮阳板一层：拉长的六边形
const shieldShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-10.5, 0);
  s.lineTo(-4.5, 7);
  s.lineTo(4.5, 7);
  s.lineTo(10.5, 0);
  s.lineTo(4.5, -7);
  s.lineTo(-4.5, -7);
  s.closePath();
  return s;
};

export const Webb: React.FC<{
  // 0 → 1：遮阳板展开
  shield: number;
  // 0 → 1：两翼镜片翻上来
  wings: number;
  // 0 → 1：副镜支架伸出去
  struts: number;
  rotation?: [number, number, number];
}> = ({ shield, wings, struts, rotation = [0, 0, 0] }) => {
  const hex = useMemo(() => new THREE.ShapeGeometry(hexShape()), []);
  const layer = useMemo(() => new THREE.ShapeGeometry(shieldShape()), []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e0ad4c", metalness: 0.55, roughness: 0.28, emissive: "#3b2606", side: THREE.DoubleSide }), []);
  const foil = useMemo(() => new THREE.MeshStandardMaterial({ color: "#cdbbd8", metalness: 0.7, roughness: 0.32, side: THREE.DoubleSide }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b2d33", metalness: 0.3, roughness: 0.7 }), []);
  const wingX = 1.5 * HEX_R * 1.5;

  return (
    <group rotation={rotation}>
      {/* 遮阳板：五层叠着，从中间往两头展开 */}
      {[0, 1, 2, 3, 4].map((k) => {
        const open = THREE.MathUtils.clamp(shield * 1.4 - k * 0.1, 0.08, 1);
        return (
          <mesh key={k} geometry={layer} material={foil} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3 + k * 0.28, 0]} scale={[open, 0.3 + open * 0.7, 1]} />
        );
      })}
      {/* 塔与主镜背板 */}
      <mesh material={dark} position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 2.4, 8]} />
      </mesh>
      <group position={[0, 1.6, 0]} rotation={[-0.35, 0, 0]}>
        {SEGMENTS.map((s, i) => {
          const wing = Math.abs(s.q) === 2;
          const side = Math.sign(s.q);
          if (!wing) return <mesh key={i} geometry={hex} material={gold} position={[s.x, s.y, 0]} />;
          // 两翼：绕铰链往后折，展开时翻到和主镜齐平
          const fold = (1 - wings) * (Math.PI * 0.95);
          return (
            <group key={i} position={[side * wingX, 0, 0]} rotation={[0, side * fold, 0]}>
              <mesh geometry={hex} material={gold} position={[s.x - side * wingX, s.y, 0]} />
            </group>
          );
        })}
        {/* 副镜支架：三根，从主镜边缘伸到前方一点 */}
        {[0, 1, 2].map((k) => {
          const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
          const base = new THREE.Vector3(Math.cos(a) * 2.9, Math.sin(a) * 2.9, 0);
          const tip = new THREE.Vector3(0, 0, 7 * struts);
          const mid = base.clone().add(tip).multiplyScalar(0.5);
          const len = base.distanceTo(tip);
          const dir = tip.clone().sub(base).normalize();
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          return (
            <mesh key={k} material={dark} position={mid.toArray()} quaternion={q}>
              <cylinderGeometry args={[0.05, 0.05, len, 6]} />
            </mesh>
          );
        })}
        <mesh material={dark} position={[0, 0, 7 * struts]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.37, 0.37, 0.12, 16]} />
        </mesh>
      </group>
    </group>
  );
};
