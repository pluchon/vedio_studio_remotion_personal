# 《墨衡 OJ 介绍》（成片 ID `MohengOJ`）

> 项目介绍视频：网页截图做成图版，镜头推拉，朱砂圈注
> 第 0 期 · 120 秒 · 渲染：`npm run render -- MohengOJ`

## 文件

- `Compositions.tsx`：成片 `MohengOJ` 与各场景（`MohengVideo.tsx` 是总装）
- `theme.ts`：配色、字体、时长，`asset()` 拼素材路径
- `components/`、`scenes/`：图版、各场景

## 素材与不入库的东西

- 网页截图、底图、配乐都在 `public/moheng-oj/`（入库）。截图由 `tools/moheng-oj/` 里的清单和脚本拍：`site.json`（各端地址、视口）、`pages.json`、`ai.json`（镜头清单），`tokens.py` 取登录令牌，`cleanup.py` 清理拍摄时写入的业务数据，`oj.py` 是辅助。登录令牌只写进已忽略的 `tools/**/tokens.json`。

## 要点

- 网页素材用截图，不录屏（无头 Chrome 的 `page.screencast` 帧序会乱）。动态过程（AI 生成、流式输出）拍「进行中」「完成」两张，动效在 Remotion 里按帧做。
- 截图统一 1600×900 视口、2 倍像素，`src/shared/Plate.tsx` 的镜头和叠加层都用这套 CSS 坐标。拍摄命令：`node tools/common/shoot.mjs <site.json> <清单.json> <输出目录> [只拍的名字...]`。
