# 《那一天》这一期

输入一个日期和一个地方，片子算出那天天上的样子。所有天象都由 `src/videos/that-day/astro.ts` 现算，不需要下载数据。

## 参数

在 Remotion Studio 里选中 `ThatDay`，右侧的表单可以直接改日期、城市、经纬度、时区、名字、留言和强调色。命令行渲染时把参数写进一个 JSON 文件：

```bash
npx remotion render ThatDay out/that-day.mp4 --props=refer/那一天/props.json --color-space=bt709
```

仓库里的默认参数是一个中性的日期。真实的日期往往是某个人的生日，属于个人信息，放在 `refer/` 下（不入库），只在渲染时传进去。

片长随留言的字数变（`calculateMetadata`）。纬度限制在 ±65° 以内：再往两极去会有极昼极夜，天空那一段的画法不适用。

## 另外导出的三样

```bash
npx remotion render ThatDay-Badge out/that-day-badge.webm --props=<参数文件> --codec=vp9 --image-format=png --pixel-format=yuva420p
npx remotion render ThatDay-Phases out/that-day-phases.gif --props=<参数文件> --codec=gif --every-nth-frame=2
npx remotion render ThatDay out/that-day-music.mp3 --props=<参数文件> --codec=mp3
```

依次是透明底的日期角标、循环的月相动图、单独的配乐。

## 配乐

G 大调，每分钟 120 拍，轻快：低音提琴和大提琴拨弦打底，小提琴拨弦垫在反拍上，马林巴奏主题，后半加长笛断奏；月亮那一段慢下来，换成卡林巴和竖琴；地球转圈时木琴一路往上跑，铃鼓滚奏加吊镲渐强，落在一下齐奏和拍手上。

```bash
python tools/that-day/music.py 68
```

参数是片长（秒），留言卡那一段会按片长排小节数。合成到 `public/that-day/audio/bgm.wav`（不入库）。

乐器采样来自 Versilian Studios 的两个 CC0 采样库 VCSL 和 VSCO 2 CE，放在仓库根目录的 `samples/`（不入库）。可以整库下载后解压到 `samples/VCSL/`、`samples/VSCO-2-CE/`，也可以用 `tools/fetch_samples.py` 只下用到的乐器：VSCO 的低音提琴、大提琴、小提琴的拨弦，长笛断奏，竖琴，吊镲；VCSL 的马林巴、木琴、卡林巴、钟琴、沙锤、拍手、木鱼、三角铁、铃鼓。

## 素材与算法的来源

- 月面贴图 `public/that-day/textures/moon.jpg`：NASA Scientific Visualization Studio 的 CGI Moon Kit（`lroc_color_2k.jpg`），公有领域。
- 星空：第四期的 HYG 星表（`public/horizon/data/stars.bin`，CC BY-SA 4.0），只取 5.2 等以内肉眼可见的星。
- 太阳位置、日出日落：NOAA 的太阳位置算法。月亮的位置和月相：Jean Meeus《天文算法》第 47、48 章的低精度公式。两者的误差都在零点几度、一两分钟以内。
- 天空的颜色、山的轮廓是画出来的示意，不是那天真实的天气。
