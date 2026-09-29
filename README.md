# video-studio

公用的 Remotion 视频工作室。无论是项目介绍还是自己的想法，视频都放在这一个工程里，共用一份依赖（Remotion 4.0.529）和通用组件，不必每次重装一遍。

## 目录

```
src/
├─ Root.tsx                 # 登记所有视频
├─ shared/                  # 通用组件
│  ├─ motion.ts             # 缓动曲线、淡入上浮 enter、区间可见 visibleBetween
│  ├─ fonts.ts              # 加载 public/ 下的字体，渲染前等字体就绪
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
   └─ looking-up/           # 我们一直在仰望 · 人类文明与星辰大海（5 分钟，制作中）
      ├─ Compositions.tsx   # 成片 LookingUp 与序、七卷、跋各段
      ├─ theme.ts           # 宣纸与星空两套配色、宋体、配乐乐句点与各卷起止秒数
      ├─ components/        # 史书版式：宣纸、版框版心、竖排字幕、纪年、朱印、翻页
      ├─ three/             # 3D：星空、昼夜地球（three.js）
      └─ scenes/
public/
├─ moheng-oj/               # 截图、底图、配乐
├─ wind-diary/              # 照片、字体、配乐
├─ cloud-sky/               # 照片、字体、配乐
└─ looking-up/              # 铜版画插图、史料图版、3D 贴图、字体、配乐
refer/                      # 用户给的原始素材，每期一个文件夹（不入库）
tools/
├─ shoot.mjs                # 批量截图（puppeteer-core + 本机 Chrome）
├─ stills.mjs               # 批量渲染静帧，自查画面用
├─ music.py                 # 纯 Python 合成配乐
└─ moheng-oj/               # 墨衡 OJ 的截图清单、登录与清理脚本
```

## 常用命令

```bash
npm i                                              # 首次安装
npm run dev                                        # 打开 Studio 预览
npx remotion render MohengOJ out/moheng-oj.mp4     # 渲染成片
npx remotion render WindDiary out/wind-diary.mp4
npx remotion render CloudSky out/cloud-sky.mp4
npx remotion render LookingUp out/looking-up.mp4 --gl=angle   # 有 3D 画面，要走显卡
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

**静帧自查**：`node tools/stills.mjs <输出目录> MohengOJ-Tutor:150 MohengOJ:1800`，有 3D 画面时加 `--gl=angle`

## 墨衡 OJ 的截图流程

先在本地启动墨衡 OJ 两端和后端，然后：

```bash
python tools/moheng-oj/tokens.py                                               # 登录，令牌写入 tools/moheng-oj/tokens.json（不入库）
node tools/shoot.mjs tools/moheng-oj/site.json tools/moheng-oj/pages.json public/moheng-oj/shots
node tools/shoot.mjs tools/moheng-oj/site.json tools/moheng-oj/ai.json public/moheng-oj/shots
python tools/moheng-oj/cleanup.py "2026-09-28 11:37:00"                         # 填开拍 ai.json 前记下的时间
```

`ai.json` 会真实调用 AI，写入辅导会话、赛后复盘、难题分析缓存和当日次数。开拍前记下时间，拍完用 `cleanup.py` 按这个时间删掉。
