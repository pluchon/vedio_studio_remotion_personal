# AGENTS.md

> 放在项目根目录，Claude Code / Codex 等 agent 进入项目时会自动读取，记录这个工程的约定。

## 这是什么

公用的 Remotion 视频工作室（Remotion 4.0.529，React 19，rspack 打包）。所有视频都在这一个工程里做，共用一份依赖。内容不限于项目介绍，也有用户自己的想法。第一个视频是墨衡 OJ 的 120 秒介绍（`src/videos/moheng-oj/`，成片 ID `MohengOJ`）。

本地 git 仓库，没有远端。

## 目录约定

- `src/Root.tsx` 只负责登记各视频；每个视频在 `src/videos/<名字>/Compositions.tsx` 里用 `<Folder>` 包住自己的组合。组合 ID 带视频前缀（如 `MohengOJ-Tutor`），避免重名。
- 用户给的原始素材放 `refer/<期名>/`，每期一个文件夹（已忽略，不入库）。开新一期先读这里的素材，和用户讨论定下方向后再动手。
- 视频实际用到的素材放 `public/<名字>/`，视频里通过自己 `theme.ts` 的 `asset()` 拼路径，不直接写 `public` 下的相对路径。
- 可跨视频复用的组件放 `src/shared/`：颜色和样式通过参数传入，不引用某个视频的 `theme.ts`。只属于一个视频的组件留在那个视频的目录里。
- 工具脚本放 `tools/`；只属于某个视频的配置和脚本放 `tools/<名字>/`。
- 成片渲染到 `out/`（已忽略），不入库。

## 做法与取向

- 风格偏好「Claude 人文社科风」：羊皮纸底、铜版画线稿、宋体、朱砂点缀、缓慢克制的动效。
- 网页素材用截图，不录屏：无头 Chrome 的 `page.screencast` 帧序会乱。动态过程（AI 生成、流式输出）拍「进行中」「完成」两张，动效在 Remotion 里按帧做。
- 截图统一用 1600×900 视口、2 倍像素；`shared/Plate.tsx` 的镜头和叠加层都用这套 CSS 坐标。
- 配乐用 `tools/music.py` 纯 Python 合成（本机 pip 装不上 numpy），需要 PATH 上有 ffmpeg。
- 截图登录令牌只写入 `tools/**/tokens.json`（已忽略），不打印、不入库。截图过程中写入的业务数据，要在拍完后清理掉。

## 验证

- `npm run lint`（ESLint + tsc）必须通过。
- 改了画面就用 `node tools/stills.mjs <输出目录> <组合ID:帧>...` 渲染关键帧，亲自看过再交付。输出放到仓库外的临时目录。
- 渲染成片：`npx remotion render <组合ID> out/<名字>.mp4`。

## 不要做的事

- 不要自行 commit，提交由用户决定。
- 不要为某一个视频去改 `src/shared/` 的默认行为；需要不同效果就加参数。
