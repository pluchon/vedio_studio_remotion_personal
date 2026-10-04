# AGENTS.md

> 放在项目根目录，Claude Code / Codex 等 agent 进入项目时会自动读取，记录这个工程的约定。

## 这是什么

公用的 Remotion 视频工作室（Remotion 4.0.529，React 19，rspack 打包）。所有视频都在这一个工程里做，共用一份依赖。内容不限于项目介绍，也有用户自己的想法。远端是 GitHub 上的公开仓库 `pluchon/vedio_studio_remotion_personal`（`main`）。

## 先读哪里（按需深入，不要一次读完）

1. 本文件：规矩和地图。
2. `src/videos/episodes.json`：所有视频的登记表（成片 ID、片名、时长、一句话、渲染参数）。
3. `src/videos/<名字>/README.md`：要改或参考某一期时读这一份——文件地图、素材与不入库的东西、做法、来源、已知局限。
4. 根 `README.md`：给人看的总览和命令。

## 东西放哪

| 路径 | 放什么 | 入库 |
| --- | --- | --- |
| `src/videos/<名字>/` | 一期的代码和 `README.md`；`Compositions.tsx` 用 `<Folder>` 包住自己的组合，组合 ID 带视频前缀 | 是 |
| `src/Root.tsx` | 只负责登记各视频 | 是 |
| `src/shared/` | 跨视频复用的组件：颜色和样式通过参数传入，不引用某个视频的 `theme.ts` | 是 |
| `public/<名字>/` | 这一期渲染要读的素材；视频里通过自己 `theme.ts` 的 `asset()` 拼路径 | 能公开的是 |
| `tools/common/` | 通用工具：渲染、静帧、截图、通用配乐、采样下载、人声分离 | 是 |
| `tools/<名字>/` | 只属于某一期的脚本和配置 | 是 |
| `refer/<期名>/` | 用户给的原始素材，一期一个文件夹；开新一期先读这里 | 否 |
| `library/` | 跨期复用的图片、音乐（只收真实来源的，不收 AI 生成的、念白、文章）。开新一期先看 `library/INDEX.md`，有现成的就**复制一份**到这一期自己的文件夹用，不直接读；放进去的要在 INDEX 登记 | 只有 README 和 INDEX |
| `samples/` | 乐器采样库（VCSL、VSCO 2 CE，CC0） | 否 |
| `out/` | 渲染好的成片视频，**只放视频**（含小尺寸版本） | 否 |
| `exports/` | 成片以外的导出：透明角标、动图、单独的配乐等 | 否 |

自查静帧、测试渲染、日志放仓库外的临时目录，用完删掉。

## 做法与取向

- 风格不固定，每一期按主题和素材自己定，一期里也可以几种混着用（线稿、手帐、像素、2D 着色器、3D、体积渲染都用过）。
- 网页素材用截图，不录屏；截图登录令牌只写入已忽略的 `tools/**/tokens.json`，不打印、不入库。细节见 `src/videos/moheng-oj/README.md`。
- 配乐优先自己合成：通用的 `tools/common/music.py`，各期自己的 `tools/<名字>/music.py`（每期用不同的乐器和调式；本机 pip 装不上 numpy，纯 Python）。要把现成音频里的人声去掉用 `tools/common/separate.py`。
- 仓库是公开的：有版权的配乐（`public/**/*.mp3`）、个人照片（`public/*/photos/`）、朋友录的念白不入库；提交邮箱用 GitHub 的 noreply 邮箱。

## 验证

- `npm run lint`（ESLint + tsc）必须通过。
- 改了画面就用 `node tools/common/stills.mjs <输出目录> <组合ID:帧>...` 渲染关键帧，亲自看过再交付；有 3D 画面时加 `--gl=angle`。
- 渲染成片：`npm run render -- <成片ID>`，参数在 `episodes.json`。渲完看一眼日志有没有着色器的 ERROR。

## 新增或改动视频时同步

改了 `episodes.json` 之后跑 `npm run docs`；每期的 `README.md` 跟着代码改，别让它过时。

## 不要做的事

- 不要自行 commit，提交由用户决定。
- 不要为某一个视频去改 `src/shared/` 的默认行为；需要不同效果就加参数。
