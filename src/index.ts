import { LoadSkia } from "@shopify/react-native-skia/lib/module/web";
import { registerRoot } from "remotion";

// 先载入 Skia 的 WebAssembly，再登记各个视频
(async () => {
  await LoadSkia();
  const { RemotionRoot } = await import("./Root");
  registerRoot(RemotionRoot);
})();
