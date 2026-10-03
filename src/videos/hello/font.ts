// 字体：四个文件都载入并加进页面后才开始画，量字宽（measureText、fitText）才是准的
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { asset, FONT_EN, FONT_KAO, FONT_MONO, FONT_ZH } from "./theme";

let loading: Promise<void> | null = null;

const load = () => {
  loading ??= Promise.all([
    new FontFace(
      FONT_ZH,
      `url('${asset("fonts/ZCOOLKuaiLe-Regular.ttf")}')`,
    ).load(),
    new FontFace(FONT_EN, `url('${asset("fonts/Fredoka.ttf")}')`, {
      weight: "300 700",
    }).load(),
    new FontFace(FONT_MONO, `url('${asset("fonts/JetBrainsMono.ttf")}')`, {
      weight: "100 800",
    }).load(),
    new FontFace(
      FONT_KAO,
      `url('${asset("fonts/MPLUSRounded1c-Bold.ttf")}')`,
    ).load(),
  ]).then((faces) => {
    faces.forEach((face) => document.fonts.add(face));
  });
  return loading;
};

export const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("载入字体"));
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
