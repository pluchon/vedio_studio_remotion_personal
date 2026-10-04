# 《汉字的演变》（成片 ID `Hanzi`）

> 人声念白加逐字字幕，八个字从甲骨文化成楷书，字形之间靠「离笔画边缘的距离」互相变
> 第 8 期 · 88 秒 · 渲染：`npm run render -- Hanzi`（带 `--color-space=bt709`）

## 文件

- `Compositions.tsx`：成片 `Hanzi`
- `Film.tsx`：整片的总装：每个字在什么时候、什么位置、变到哪一种字体
- `Ink.tsx`：一个墨写的字：混合两个字形的距离表，让一个化成另一个
- `glyphs.ts`：载入字形数据，把两个字拼进一格
- `script.ts`：念白的时间表，拆成一个字一条的字幕
- `Subtitles.tsx`、`Strip.tsx`、`Sketch.tsx`：逐字字幕、顶上的年代线、朱砂色的简图
- `theme.ts`：配色、字体、五种字体的名字和年代

## 素材与不入库的东西

- `public/hanzi/data/`（字形数据）、`public/hanzi/audio/bgm.wav`（配乐）、`public/hanzi/audio/voice.mp3`（朋友录的念白）都不入库，生成方法见下面。

---

三样东西都不入库，克隆后按下面的顺序在本机生成。

| 生成什么 | 命令 | 需要 |
| --- | --- | --- |
| 字形数据 `public/hanzi/data/` | `node tools/hanzi/build_glyphs.mjs` | 本机装有 Chrome，以及「隶书」（LiSu）、「楷体」（KaiTi）两种字体，只能在 Windows 上跑 |
| 配乐 `public/hanzi/audio/bgm.wav` | `python tools/hanzi/music.py` | PATH 上有 ffmpeg |
| 念白 `public/hanzi/audio/voice.mp3` | 自己录，稿子的时间表在 `src/videos/hanzi/script.ts` | |

Chrome 不在默认位置时用环境变量 `CHROME` 指定路径。

## 字形

`build_glyphs.mjs` 把八个字（日、月、山、水、人、木、休、明）的五种字体各画一遍，算出每一格离笔画边缘多远，存成 384 见方的表。视频里把两张表按比例混合，一个字形就化成了另一个。

- 甲骨文、金文、小篆：维基共享资源「Ancient Chinese characters project」里的矢量图，文件名形如 `日-oracle.svg`、`日-bronze.svg`、`日-seal.svg`，公有领域。脚本会把缺的自动下载到 `refer/汉字的演变/glyphs/`。下载时要带写明联系方式的 User-Agent，否则会一直被限流（429）。
- 隶书、楷书：用本机字体画出来，字体本身不入库，生成的数据也不入库。

## 念白的时间

`whisper.mjs` 用 `@remotion/install-whisper-cpp` 在本机转写录音（`install` 装程序，`model` 下模型，`run` 转写）。它对中文逐字的时间不准，只用来核对念的内容；`script.ts` 里每一小段的起止秒数是用 ffmpeg 的 `silencedetect` 从停顿里量出来的，段内的字按时间均分。

## 片子里的说法

「三千多年前」「秦朝统一写法」「隶书把圆的线拉直」用的是通行的说法。甲骨文的「日」是刻出来的，实物偏方；「明」在甲骨文里是月在左、日在右。
