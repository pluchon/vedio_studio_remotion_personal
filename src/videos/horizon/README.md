# 《光到不了的地方》（成片 ID `Horizon`）

> 一个镜头跨二十多个数量级，真实星表与巡天数据，three.js
> 第 4 期 · 132 秒 · 渲染：`npm run render -- Horizon`（带 `--gl=angle`）

## 文件

- `Compositions.tsx`：成片 `Horizon`
- `Film.tsx`：整片的总装：各层何时出现、标注、旁白、读数
- `theme.ts`：取景地与天球方向、镜头一路的距离和朝向（时间点落在配乐重音上）、读数的写法
- `cosmology.ts`：按普朗克 2018 参数积分出的距离、回溯时间和三条界线
- `Coda.tsx`：尾声：斯隆长城
- `three/`：真实星表的恒星、巡天的星系点云、重建的银河系与本星系群、地球月球太阳、微波背景、辉光与拖影后期

## 素材与不入库的东西

- 配乐 `public/horizon/audio/cornfield-chase.mp3` 不入库。`public/horizon/data/` 下的二进制由 `tools/horizon/build_data.py` 从 `refer/光速_时间/` 的星表生成；其中 `local.bin`（2MRS 星表，使用条款不允许再分发）不入库。

---

恒星、星系的位置来自公开的星表与巡天，原始文件放在 `refer/光速_时间/`（不入库），用 `python tools/horizon/build_data.py` 转成视频读的二进制，输出到 `public/horizon/data/`：

| 文件 | 来源 | 说明 |
| --- | --- | --- |
| `stars.bin` | HYG v4.4（CC BY-SA 4.0） | 约 11 万颗恒星的三维位置、亮度、颜色 |
| `local.bin` | 2MASS Redshift Survey（Huchra 等，2012） | 4.3 万个近邻星系。其使用条款不允许再分发，所以这个文件不入库，需要自己下载星表后生成 |
| `cosmos.bin` | SDSS DR18 | 抽样的 37 万个星系、25 万个类星体 |
| `wall.bin` | SDSS DR18 | 斯隆长城所在天区的 11.8 万个星系 |

微波背景图来自 ESA/Planck Collaboration。银河系和本星系群没有外部视角的实测数据，是按测量结果重建的。
