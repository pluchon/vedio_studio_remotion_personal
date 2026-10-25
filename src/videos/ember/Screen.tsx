// 整片唯一的 WebGL 画布：每一帧按镜头表算出图层，同步画完再交给 Remotion 截图
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Engine } from "./gl/engine";
import { PROGRAMS } from "./scenes";
import { layersAt, type Shot } from "./shot";
import { BAR, FPS, HEIGHT, PIC_H, PIC_W, WIDTH, asset } from "./theme";

export const Screen: React.FC<{ shots: Shot[] }> = ({ shots }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const canvases = useRef<HTMLCanvasElement[]>([]);
  const latest = useRef(frame);
  latest.current = frame;
  const [handle] = useState(() => delayRender("准备 WebGL", { timeoutInMilliseconds: 240000 }));

  const paint = (f: number) => {
    const e = engine.current;
    if (!e) return;
    const t = f / FPS;
    const { layers, post } = layersAt(shots, t, canvases.current);
    e.render(t, f, layers, post);
  };

  useEffect(() => {
    const run = async () => {
      canvases.current = [0, 1, 2].map(() => {
        const c = document.createElement("canvas");
        c.width = PIC_W;
        c.height = PIC_H;
        return c;
      });
      const e = new Engine(ref.current!, PROGRAMS, { w: PIC_W, h: PIC_H, y: BAR });
      await e.loadImage("hudf", staticFile(asset("img/hudf.jpg")));
      // 全部着色器先编译好：大的着色器在 ANGLE 上要编十几秒，放到某一帧里会超过单帧的时限
      await e.warm([...new Set(shots.map((s) => s.prog))]);
      engine.current = e;
      paint(latest.current);
      continueRender(handle);
    };
    run().catch((err) => cancelRender(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    paint(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <canvas ref={ref} width={WIDTH} height={HEIGHT} style={{ width: WIDTH, height: HEIGHT }} />
    </AbsoluteFill>
  );
};
