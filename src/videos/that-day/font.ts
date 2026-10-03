// 字体：载入后才加进页面；片头的 fitText 要等这一步完成才能量字宽
import { useEffect, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";
import { FONT } from "./theme";

let loading: Promise<void> | null = null;

const load = () => {
  loading ??= new FontFace(
    FONT,
    `url('${staticFile("looking-up/fonts/NotoSerifSC-Regular.otf")}')`,
  )
    .load()
    .then((face) => {
      document.fonts.add(face);
    });
  return loading;
};

export const useFont = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender(`载入字体 ${FONT}`));
  useEffect(() => {
    load()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return ready;
};
