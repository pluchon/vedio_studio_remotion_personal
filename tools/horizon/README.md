# 《光到不了的地方》的数据

恒星、星系的位置来自公开的星表与巡天，原始文件放在 `refer/光速_时间/`（不入库），用 `python tools/horizon/build_data.py` 转成视频读的二进制，输出到 `public/horizon/data/`：

| 文件 | 来源 | 说明 |
| --- | --- | --- |
| `stars.bin` | HYG v4.4（CC BY-SA 4.0） | 约 11 万颗恒星的三维位置、亮度、颜色 |
| `local.bin` | 2MASS Redshift Survey（Huchra 等，2012） | 4.3 万个近邻星系。其使用条款不允许再分发，所以这个文件不入库，需要自己下载星表后生成 |
| `cosmos.bin` | SDSS DR18 | 抽样的 37 万个星系、25 万个类星体 |
| `wall.bin` | SDSS DR18 | 斯隆长城所在天区的 11.8 万个星系 |

微波背景图来自 ESA/Planck Collaboration。银河系和本星系群没有外部视角的实测数据，是按测量结果重建的。
