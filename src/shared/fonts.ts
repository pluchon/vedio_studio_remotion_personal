// 加载 public/ 下的字体文件：渲染前等字体就绪，避免首帧用回退字体
import { cancelRender, continueRender, delayRender } from "remotion";

export const loadLocalFont = (family: string, url: string) => {
  if (typeof document === "undefined") return;
  const handle = delayRender(`加载字体 ${family}`, { timeoutInMilliseconds: 60000 });
  const face = new FontFace(family, `url('${url}')`);
  face
    .load()
    .then(() => {
      document.fonts.add(face);
      continueRender(handle);
    })
    .catch((err) => cancelRender(err));
};
