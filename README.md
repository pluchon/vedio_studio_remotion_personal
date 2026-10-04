# vedio_studio_remotion_personal

用代码生成视频的仓库，记录每一次想法。

公用的 Remotion 视频工作室（Remotion 4.0.529，React 19）。无论是项目介绍还是自己的想法，视频都放在这一个工程里，共用一份依赖和通用组件。

**每一期的风格都不固定**：线稿、手帐、像素、2D 着色器、3D 建模、体积渲染都用过，一期里也可以几种混着来，由这一期的主题和素材决定。

## 快速开始

```bash
npm i                          # 首次安装
npm run dev                    # 打开 Studio 预览
npm run render -- Nebula       # 渲染成片到 out/，参数按 src/videos/episodes.json 里登记的带上
npm run render -- --list       # 列出所有成片
npm run lint                   # ESLint + 类型检查
npm run docs                   # 由 episodes.json 重写下面的视频列表，并检查每期都有 README
```

## 视频列表

每期的做法、素材来源、不入库的东西怎么生成，都写在它自己的 `src/videos/<名字>/README.md` 里，点成片 ID 进去。列表由 `src/videos/episodes.json` 生成，要改请改那份 JSON 再 `npm run docs`。

<!-- episodes:start -->
| 期 | 成片 ID | 片名 | 时长 | 一句话 | 渲染参数 |
| --- | --- | --- | --- | --- | --- |
| 0 | [`MohengOJ`](src/videos/moheng-oj/README.md) | 墨衡 OJ 介绍 | 120 秒 | 项目介绍视频：网页截图做成图版，镜头推拉，朱砂圈注 | — |
| 1 | [`WindDiary`](src/videos/wind-diary/README.md) | 风经过的地方 | 约 90 秒 | 日常生活三则：2D 程序化画面、手写式字幕、拍立得 | — |
| 2 | [`CloudSky`](src/videos/cloud-sky/README.md) | 云走过的地方，天空都记得 | 77 秒 | 一团团叠起来的云与形变 | — |
| 3 | [`LookingUp`](src/videos/looking-up/README.md) | 我们一直在仰望 | 5 分钟 | 人类仰望星空的历史，32 幕，按年代换画法（铜版画、海报、写实深空、光与回路），three.js 3D | `--gl=angle` |
| 4 | [`Horizon`](src/videos/horizon/README.md) | 光到不了的地方 | 132 秒 | 一个镜头跨二十多个数量级，真实星表与巡天数据，three.js | `--gl=angle` |
| 5 | [`Rain`](src/videos/rain/README.md) | 一场雨 | 30 秒 | 画面由配乐波形驱动，噪声、路径动画、弹簧，首尾循环 | — |
| 6 | [`Moe`](src/videos/moe/README.md) | 萌系手帐 | 82 秒 | 手帐底图里嵌动漫镜头，换镜头跟着配乐的起音，一格一格动的步进动画 | `--color-space=bt709` |
| 7 | [`Amazon`](src/videos/amazon/README.md) | 亚马逊河 | 82 秒 | 真实高程、河网和卫星底图铺成的三维地图，着色器算光影、雾和河面，亮线沿河道画到入海口 | `--gl=angle --color-space=bt709 --concurrency=2` |
| 8 | [`Hanzi`](src/videos/hanzi/README.md) | 汉字的演变 | 88 秒 | 人声念白加逐字字幕，八个字从甲骨文化成楷书，字形之间靠「离笔画边缘的距离」互相变 | `--color-space=bt709` |
| 9 | [`ThatDay`](src/videos/that-day/README.md) | 那一天 | 约 1 分钟，随留言长短变 | 输入日期和地点，算出那天的日出日落、星空、月相和地球的位置；可换参数，另可导出透明角标、月相动图和单独的配乐 | `--color-space=bt709` |
| 10 | [`Hello`](src/videos/hello/README.md) | 你好，我是 Claude | 约 130 秒 | Claude 的自我介绍：像素小螃蟹从头讲到尾，转场、镜头推拉、分层布景、颜文字，芯片音乐 | `--gl=angle --color-space=bt709` |
| 11 | [`Edge`](src/videos/edge/README.md) | 宇宙的尽头 | 约 3 分 37 秒 | 朋友的朗读配一张不断被重画的老地图（全 SVG 墨线）；古地图海怪、哈勃和韦伯的真实照片；深空氛围配乐 | `--color-space=bt709` |
| 12 | [`Nebula`](src/videos/nebula/README.md) | 星云 | 约 5 分 48 秒 | 朋友的朗读，放松助眠的科普：体积渲染把地球的云一路画成宇宙的云，目镜、光谱、行星状星云、极光；全是自己算的 3D；摇篮曲配乐 | `--gl=angle --color-space=bt709 --concurrency=3` |

## 目录

```
src/Root.tsx       登记所有视频
src/shared/        跨视频复用的组件（颜色、字体通过参数传入）
src/videos/<名字>/  一期一个文件夹：代码 + README.md；episodes.json 是所有视频的登记表
public/<名字>/      这一期用到的素材，渲染时读
tools/common/      通用工具（见下）
tools/<名字>/       只属于某一期的脚本（合成配乐、对齐念白、转数据……）
library/           公共资料库：跨期的图片、音乐（本体不入库，目录见 library/INDEX.md）
refer/             用户给的原始素材，一期一个文件夹（不入库）
samples/           乐器采样库（不入库）
out/               渲染好的成片视频，只放视频（不入库）
exports/           成片以外的导出：透明角标、动图、单独的配乐等（不入库）
```

素材的流向：`refer/`（原始）→ `library/`（挑出可复用的）→ 复制一份到 `public/<名字>/`（这一期用）。`out/` 和 `exports/` 是产出。自查静帧、测试渲染、日志放仓库外的临时目录，用完删掉。

## 通用工具（`tools/common/`）

| 工具 | 用法 |
| --- | --- |
| `render.mjs` | `npm run render -- <成片ID> [额外参数]`；参数来自 `episodes.json`；要传参数的片子（如 `ThatDay`）追加 `--props=<json>` |
| `docs.mjs` | `npm run docs`：重写上面的视频列表 |
| `stills.mjs` | `node tools/common/stills.mjs <输出目录> <组合ID:帧>... [--gl=angle] [--props=<json>]`，批量渲染静帧自查 |
| `shoot.mjs` | `node tools/common/shoot.mjs <site.json> <清单.json> <输出目录> [名字...]`，批量截图（puppeteer + 本机 Chrome），用法见 `src/videos/moheng-oj/README.md` |
| `music.py` | `python tools/common/music.py <输出.wav> [秒数] [种子]`，D 宫五声拨弦配乐，归一到 -16 LUFS；需要 ffmpeg。各期自己的配乐在 `tools/<名字>/music.py` |
| `fetch_samples.py` | `python tools/common/fetch_samples.py <VCSL 或 VSCO-2-CE> "<乐器文件夹>" [--match 字样]`，按需下 CC0 乐器采样到 `samples/`；`--list` 看有哪些 |
| `separate.py` | `python tools/common/separate.py <音频> [输出目录] [--keep-vocals]`，用 Demucs 去掉人声留下配乐；Demucs 装在仓库外，安装命令写在文件开头，换了位置设 `DEMUCS_PYTHON` |

## 新增一个视频

1. 在 `src/videos/<名字>/` 下建 `Compositions.tsx`，外层用 `<Folder name="...">` 包住；组合 ID 带视频前缀，避免与其他视频重名。
2. 在 `src/Root.tsx` 里登记。
3. 素材放 `public/<名字>/`，在 `theme.ts` 里写一个 `asset()` 拼路径。
4. 在 `src/videos/episodes.json` 加一条（期数、成片 ID、片名、时长、一句话、渲染参数），写 `src/videos/<名字>/README.md`（文件、素材与不入库的东西、要点），跑一遍 `npm run docs`。

## 不入库的东西

仓库是公开的：有版权的配乐、个人照片、朋友录的念白、本机合成的配乐、`refer/`、`samples/`、`library/` 里的内容、`out/`、`exports/` 都不入库。每一期具体有哪些、克隆后怎么补齐，写在那一期自己的 README 的「素材与不入库的东西」里。

配乐版权归原作者所有，照片是个人照片。代码按 MIT 许可，素材各有来源和许可，署名写在各期 README 里。
