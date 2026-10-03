# vedio_studio_remotion_personal

用代码生成视频的仓库，记录每一次想法。

公用的 Remotion 视频工作室。无论是项目介绍还是自己的想法，视频都放在这一个工程里，共用一份依赖（Remotion 4.0.529）和通用组件，不必每次重装一遍。

## 已有的视频

| 期 | 成片 ID | 片名 | 时长 | 用到的做法 |
| --- | --- | --- | --- | --- |
| 1 | `WindDiary` | 风经过的地方 | 约 90 秒 | 2D 程序化画面、手写式字幕、拍立得 |
| 2 | `CloudSky` | 云走过的地方，天空都记得 | 77 秒 | 一团团叠起来的云与形变 |
| 3 | `LookingUp` | 我们一直在仰望 | 5 分钟 | 按年代换画法，three.js 3D |
| 4 | `Horizon` | 光到不了的地方 | 132 秒 | 一个镜头跨二十多个数量级，真实星表与巡天数据 |
| 5 | `Rain` | 一场雨 | 30 秒 | 画面由配乐波形驱动，噪声、路径动画、弹簧，首尾循环 |
| 6 | `Moe` | 萌系手帐 | 82 秒 | 手帐底图里嵌动漫镜头，换镜头跟着配乐的起音，一格一格动的步进动画 |
| 7 | `Amazon` | 亚马逊河 | 82 秒 | 真实高程、河网和卫星底图铺成的三维地图，着色器算光影、雾和河面，亮线沿河道画到入海口 |
| 8 | `Hanzi` | 汉字的演变 | 88 秒 | 人声念白加逐字字幕，八个字从甲骨文一路化成楷书，字形之间靠「离笔画边缘的距离」互相变 |
| 9 | `ThatDay` | 那一天 | 约 1 分钟，随留言长短变 | 输入一个日期和地点，算出那天的日出日落、星空、月相和地球的位置；一支能换参数的片子，另可导出透明角标、月相动图和单独的配乐 |

## 目录

```
src/
├─ Root.tsx                 # 登记所有视频
├─ shared/                  # 通用组件
│  ├─ motion.ts             # 缓动曲线、淡入上浮 enter、区间可见 visibleBetween
│  ├─ fonts.ts              # 加载 public/ 下的字体，渲染前等字体就绪
│  ├─ audioScore.ts         # 从配乐波形里读出每个音的起点、轻重、低音占比，以及逐帧的响度
│  ├─ preview.tsx           # withMusic：单独预览某一段时，配乐从该段在曲中的位置接入
│  ├─ Caption.tsx           # 手写式字幕：中文逐字洇开，英文随后淡入（字体由各视频传入）
│  ├─ Polaroid.tsx          # 拍立得：落下、显影、手写题注
│  ├─ Grain.tsx             # 胶片颗粒与暗角
│  ├─ WindLines.tsx         # 一阵风掠过的细线
│  ├─ ColorFade.tsx         # 整屏颜色的淡入淡出，用来接色
│  └─ Plate.tsx             # 截图图版与镜头推拉、Shot、朱砂圈注 InkCircle、流光边框 GlowRing、流式展开 StreamReveal
└─ videos/
   ├─ moheng-oj/            # 墨衡 OJ 介绍视频（120 秒）
   │  ├─ Compositions.tsx   # 本视频的成片与各场景
   │  ├─ theme.ts           # 配色、字体、时长，asset() 拼素材路径
   │  └─ components/ scenes/
   ├─ wind-diary/           # 风经过的地方 · 日常生活三则（约 90 秒）
   │  ├─ Compositions.tsx   # 成片 WindDiary 与片头、三则、尾声各章
   │  ├─ theme.ts           # 各章配色、霞鹜文楷、配乐节拍网格与章节起止拍
   │  └─ components/ scenes/
   ├─ cloud-sky/            # 云走过的地方，天空都记得 · 日常生活（77 秒）
   │  ├─ Compositions.tsx   # 成片 CloudSky 与窗边、云的旅程、天空、黄昏、后来各段
   │  ├─ theme.ts           # 配色、配乐的实测乐句点与各段起止秒数
   │  └─ components/ scenes/  # Cloud.tsx 用一团团叠起来的云做形变（水汽、积云、羊、龙）
   └─ looking-up/           # 我们一直在仰望 · 人类文明探索史（5 分钟，32 幕）
      ├─ Compositions.tsx   # 成片 LookingUp 与每一幕的单独预览
      ├─ theme.ts           # 墨、海报、深空三套配色，宋体，配乐乐句点与每一幕的起止秒数
      ├─ components/        # 年份地点标 Locator、旁白字幕、逐行跳出的记录 Rows、编年 Ticker、宣纸、纸上的星
      ├─ three/             # 3D：昼夜地球、平涂行星、旅行者号、韦布、点云、深空背景（three.js）
      └─ scenes/            # 按年代换画法：ink 铜版画 → poster 复古海报 → deep 写实深空 → light 光与回路
   └─ horizon/              # 光到不了的地方 · 光速、宇宙膨胀与事件视界（132 秒，一个镜头）
      ├─ Compositions.tsx   # 成片 Horizon
      ├─ Film.tsx           # 整片的总装：各层何时出现、标注、旁白、读数
      ├─ theme.ts           # 取景地与天球方向、镜头一路的距离和朝向（时间点落在配乐重音上）、读数的写法
      ├─ cosmology.ts       # 按普朗克 2018 参数积分出的距离、回溯时间和三条界线
      ├─ Coda.tsx           # 尾声：斯隆长城
      └─ three/             # 真实星表的恒星、巡天的星系点云、重建的银河系与本星系群、地球月球太阳、微波背景、辉光与拖影后期
   └─ rain/                 # 一场雨 · 一个镜头跟着一滴雨，从窗玻璃落进水洼（30 秒，首尾相接可循环）
      ├─ Compositions.tsx   # 成片 Rain
      ├─ score.ts           # 在公用的谱之上，读出这首曲子雨下大、换气、重新起音三个时刻
      ├─ plan.ts            # 由曲子里雨下大、换气、重新起音三个时刻推出水滴和镜头的走位
      ├─ theme.ts           # 配色与整张竖长画面的布景尺寸
      ├─ parts/             # 窗外失焦的街灯与雨丝、像透镜一样映着窗外的水珠
      └─ scenes/            # Glass 窗玻璃到窗台，Yard 屋檐、灯笼、枝叶和水洼
   └─ moe/                  # 萌系手帐 · 一页手帐不换，卡片里放动漫镜头，Q 版小人在页脚陪着看（82 秒）
      ├─ Compositions.tsx   # 成片 Moe
      ├─ Film.tsx           # 整片的总装：底图、卡片里的镜头、拍立得、花瓣、小人
      ├─ plan.ts            # 从配乐的起音里挑换镜头的时刻，小人的姿势和走位，步进与线条抖动
      └─ theme.ts           # 卡片位置、配乐分段、合集里每个镜头的起止
   └─ amazon/               # 亚马逊河 · 像看地图一样往下看，亮线从安第斯山沿河道画到大西洋，到有名的地方停一停（82 秒）
      ├─ Compositions.tsx   # 成片 Amazon，以及这趟旅程的时间表和旁白
      ├─ Film.tsx           # 整片的总装：地面、河网、大气，叠上地名、旁白、读数和水系小图
      ├─ plan.ts            # 主河道这条线怎么走、镜头怎么跟
      ├─ sites.ts           # 标在地图上的城市、支流和停靠点
      ├─ Places.tsx Chart.tsx Overlay.tsx   # 地名、右上角同步勾勒的水系小图、旁白和读数
      ├─ theme.ts           # 数据范围、经纬度和球面的换算、机位
      └─ three/             # 着色器：按高程起伏的地面（山影、云、晨雾、河面）、河网的线、大气
   └─ hanzi/                # 汉字的演变 · 跟着一段念白，日、山、水等八个字从甲骨文变到楷书（88 秒）
      ├─ Compositions.tsx   # 成片 Hanzi
      ├─ Film.tsx           # 整片的总装：每个字在什么时候、什么位置、变到哪一种字体
      ├─ Ink.tsx            # 一个墨写的字：混合两个字形的距离表，让一个化成另一个
      ├─ glyphs.ts          # 载入字形数据，把两个字拼进一格
      ├─ script.ts          # 念白的时间表，拆成一个字一条的字幕
      ├─ Subtitles.tsx Strip.tsx Sketch.tsx   # 逐字字幕、顶上的年代线、朱砂色的简图
      └─ theme.ts           # 配色、字体、五种字体的名字和年代
   └─ that-day/             # 那一天 · 给一个日期和地点，演那天的天空、月亮、昼长和地球在轨道上的位置（约 1 分钟）
      ├─ Compositions.tsx   # 成片 ThatDay，以及导出用的 ThatDay-Badge（透明角标）、ThatDay-Phases（月相动图）；参数表单和片长的计算
      ├─ Film.tsx           # 整片的总装
      ├─ astro.ts day.ts    # 天文计算，以及由参数算出整支片子要用的数据
      ├─ Sky.tsx Moon.tsx   # Skia 画的天空（天色、太阳轨迹、真实星表、月亮）和月亮特写
      ├─ Year.tsx Orbit.tsx Card.tsx Title.tsx   # 一年的昼长圆环、地球公转（带运动模糊）、留言卡、片头
      ├─ birds.ts Extras.tsx   # 代码里拼出来的 Lottie 鸟群；两个导出用的小组合
      └─ theme.ts           # 参数的定义、配色、各段的起止
public/
├─ moheng-oj/               # 截图、底图、配乐
├─ wind-diary/              # 照片、字体、配乐
├─ cloud-sky/               # 照片、字体、配乐
├─ looking-up/              # 铜版画与海报插图、史料图版、3D 贴图、字体、配乐
├─ horizon/                 # 开头的生成片段、贴图、配乐，以及 data/ 下由星表和巡天数据转成的二进制
├─ rain/                    # 配乐（画面全部由代码画，没有图片）
├─ moe/                     # 手帐底图、Q 版小人的八个姿势；配乐和动漫片段不入库
├─ amazon/                  # 低清的世界底图；高程、河网、卫星底图和配乐不入库，由脚本生成
├─ hanzi/                   # 字形数据、配乐和念白都不入库，由脚本生成或自己录
└─ that-day/                # 月面贴图；配乐不入库，由脚本合成
refer/                      # 用户给的原始素材，每期一个文件夹（不入库）
samples/                    # 各期共用的乐器采样库（不入库）
tools/
├─ shoot.mjs                # 批量截图（puppeteer-core + 本机 Chrome）
├─ stills.mjs               # 批量渲染静帧，自查画面用
├─ music.py                 # 纯 Python 合成配乐
├─ fetch_samples.py         # 从 CC0 采样库里按需下载某一种乐器到 samples/
├─ moheng-oj/               # 墨衡 OJ 的截图清单、登录与清理脚本
├─ horizon/                 # build_data.py：把 refer/光速_时间/ 里的星表和巡天数据转成 public/horizon/data/
├─ moe/                     # prepare.py：把 refer/二次元萌系/ 里的底图、姿势、片段和配乐整理到 public/moe/
├─ amazon/                  # build_data.py：把 refer/亚马逊河/ 里的高程、河网和卫星底图整理到 public/amazon/，说明见其 README
├─ hanzi/                   # build_glyphs.mjs 生成字形数据，music.py 合成配乐，whisper.mjs 在本机转写念白，说明见其 README
└─ that-day/                # music.py 用乐器采样合成配乐，参数和导出的说明见其 README
```

## 常用命令

```bash
npm i                                              # 首次安装
npm run dev                                        # 打开 Studio 预览
npx remotion render MohengOJ out/moheng-oj.mp4     # 渲染成片
npx remotion render WindDiary out/wind-diary.mp4
npx remotion render CloudSky out/cloud-sky.mp4
npx remotion render LookingUp out/looking-up.mp4 --gl=angle   # 有 3D 画面，要走显卡
npx remotion render Horizon out/horizon.mp4 --gl=angle
npx remotion render Rain out/rain.mp4
npx remotion render Moe out/moe.mp4 --color-space=bt709   # 高调的画面要用标准色彩范围，否则不少播放器里会发白
npx remotion render Amazon out/amazon.mp4 --gl=angle --color-space=bt709 --concurrency=2   # 贴图很大，同时开的页面别太多
npx remotion render Hanzi out/hanzi.mp4 --color-space=bt709
npx remotion render ThatDay out/that-day.mp4 --props=<参数.json> --color-space=bt709   # 不给参数就用默认的日期
npm run lint                                       # ESLint + 类型检查
```

## 新增一个视频

1. 在 `src/videos/<名字>/` 下建 `Compositions.tsx`，外层用 `<Folder name="...">` 包住；组合 ID 带上视频前缀，避免与其他视频重名。
2. 在 `src/Root.tsx` 里加上这个组件。
3. 素材放 `public/<名字>/`，在 `theme.ts` 里写一个 `asset()` 拼路径。
4. 需要网页截图时，在 `tools/<名字>/` 放 `site.json`（各端地址、登录 Cookie、视口）和截图清单，用 `tools/shoot.mjs` 拍。不涉及网页的视频用不到这一步。

截图统一按 1600×900 视口、2 倍像素拍，`shared/Plate.tsx` 里的镜头与叠加层都用这套 CSS 坐标。

## 工具

**截图**：`node tools/shoot.mjs <site.json> <清单.json> <输出目录> [只拍的名字...]`

清单里每个镜头可以带步骤：`click`、`clickText`、`eval`、`waitFor`、`waitGone`、`shot`（中途截一张）、`rect`（把元素位置记进 `rects.json`）。

**配乐**：`python tools/music.py <输出.wav> [秒数] [随机种子]`

D 宫五声音阶的拨弦、铺底加低音，经 FFmpeg 混响并归一到 -16 LUFS，需要 PATH 上有 ffmpeg。

各期自己合成的配乐另有脚本，放在 `tools/<名字>/music.py`，每期用不同的乐器和调式。

**乐器采样**：`python tools/fetch_samples.py <VCSL 或 VSCO-2-CE> "<乐器文件夹>" [--match 字样]`

从两个 CC0 的采样库（Versilian Studios 的 VCSL 和 VSCO 2 CE）里按需只下某一种乐器，放到 `samples/`（不入库）；`--list` 列出库里有哪些乐器。整库共约 6 GB，也可以自己整库下载后解压到 `samples/VCSL/`、`samples/VSCO-2-CE/`。

**静帧自查**：`node tools/stills.mjs <输出目录> MohengOJ-Tutor:150 MohengOJ:1800`，有 3D 画面时加 `--gl=angle`，要给组合传参数时加 `--props=<json 文件>`

## 不入库的素材

下面这些不在仓库里，克隆后要自己放到对应位置，相关视频才能完整渲染：

| 路径 | 内容 |
| --- | --- |
| `public/wind-diary/audio/hanagoyomi.mp3` | 《风经过的地方》配乐 |
| `public/cloud-sky/audio/chill-out.mp3` | 《云走过的地方》配乐 |
| `public/looking-up/audio/if-i-should-return.mp3` | 《我们一直在仰望》配乐 |
| `public/horizon/audio/cornfield-chase.mp3` | 《光到不了的地方》配乐 |
| `public/rain/audio/su.mp3` | 《一场雨》配乐。画面是从这首曲子的波形里算出来的，换一首曲子雨也会跟着变 |
| `public/moe/audio/senko.mp3`、`public/moe/clips/` | 萌系手帐的配乐和动漫片段，由 `tools/moe/prepare.py` 从自备的素材生成 |
| `public/wind-diary/photos/`、`public/cloud-sky/photos/` | 两期日常视频用到的照片 |
| `public/amazon/audio/green-to-blue.mp3` | 《亚马逊河》配乐 |
| `public/amazon/data/`、`public/amazon/textures/land.jpg` | 高程、河网和卫星底图，由 `tools/amazon/build_data.py` 生成，原始文件的下载地址见 `tools/amazon/README.md` |
| `public/hanzi/audio/voice.mp3` | 《汉字的演变》的念白，朋友录的 |
| `public/that-day/audio/bgm.wav` | 《那一天》的配乐，由 `tools/that-day/music.py` 合成 |
| `samples/` | 各期共用的乐器采样库，用 `tools/fetch_samples.py` 按需下载 |
| `public/hanzi/data/`、`public/hanzi/audio/bgm.wav` | 字形数据和配乐，由 `tools/hanzi/` 下的脚本生成，做法见 `tools/hanzi/README.md` |
| `public/horizon/data/local.bin` | 由 2MRS 星表生成，做法见 `tools/horizon/README.md` |

配乐版权归原作者所有，照片是个人照片。代码按 MIT 许可，素材各有来源和许可，星表与巡天数据的署名见 `tools/horizon/README.md`，高程、河网与卫星底图的署名见 `tools/amazon/README.md`，古文字字形的来源见 `tools/hanzi/README.md`，月面贴图和乐器采样的来源见 `tools/that-day/README.md`。
