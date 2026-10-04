// 第十幕「晚安」：回到夜空，什么都不标了，画面慢慢暗下去，只剩一点光
import React from "react";
import { useTextures } from "../../looking-up/three/useTextures";
import { Canvas, Rig, SkyMap, StarField, dir } from "../space";
import { COLORS, DESIGN_END, asset } from "../theme";
import { ramp, useT } from "../time";
import type { V3 } from "../time";

export const Night: React.FC = () => {
  const t = useT();
  const tex = useTextures({ sky: asset("img/milkyway.jpg") });
  const look = dir(40 + (t - 408) * 0.8, 35).map((v) => v * 10) as V3;
  const fade = ramp(t, DESIGN_END - 7, DESIGN_END - 1.5);
  const star = ramp(t, DESIGN_END - 9, DESIGN_END - 6.5) * (1 - ramp(t, DESIGN_END - 2.6, DESIGN_END - 0.3));
  return (
    <>
      {tex ? (
        <Canvas>
          <Rig pos={[0, 0, 0]} look={look} fov={70} far={100} />
          <SkyMap map={tex.sky} gain={4} spin={(t - 408) * 0.004} />
          <StarField time={t} alpha={0.9} />
        </Canvas>
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: COLORS.night, opacity: fade }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: star }}>
        <div style={{ width: 340, height: 340, borderRadius: 170, background: "radial-gradient(circle, rgba(255,240,215,0.95) 0%, rgba(255,214,170,0.32) 8%, rgba(255,214,170,0) 60%)" }} />
      </div>
    </>
  );
};
