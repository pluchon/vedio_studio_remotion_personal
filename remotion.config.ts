/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableSkia } from "@remotion/skia/enable";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// 让打包器认得 Skia 的 WebAssembly（第九期《那一天》用到）
Config.overrideBundlerConfig((config, context) => enableSkia(config, context));
