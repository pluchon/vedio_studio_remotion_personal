// 把八个字五种字体的字形整理成「离笔画边缘多远」的数据，视频里靠它让一个字形化成另一个：node tools/hanzi/build_glyphs.mjs
// 甲骨文、金文、小篆来自维基共享资源的古文字矢量图（缺的会自动下载到 refer/汉字的演变/glyphs/），隶书、楷书用本机字体画出来
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RAW = path.join(PROJECT, 'refer', '汉字的演变', 'glyphs')
const OUT = path.join(PROJECT, 'public', 'hanzi', 'data')
const CHROME = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const AGENT = 'video-studio/1.0 (https://github.com/pluchon/vedio_studio_remotion_personal)'

const CHARS = ['日', '月', '山', '水', '人', '木', '休', '明']
const ANCIENT = ['oracle', 'bronze', 'seal']
const FONTS = { clerical: 'LiSu', regular: 'KaiTi' }

// 先在大画布上画，再缩成小的存下来
const BIG = 1024
const SIZE = 384
// 字的最长一边占画布的多少
const FILL = 0.76

fs.mkdirSync(RAW, { recursive: true })
fs.mkdirSync(OUT, { recursive: true })

for (const char of CHARS) {
  for (const kind of ANCIENT) {
    const name = `${char}-${kind}.svg`
    const dest = path.join(RAW, name)
    if (fs.existsSync(dest)) continue
    const hash = crypto.createHash('md5').update(name).digest('hex')
    const url = `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(name)}`
    const response = await fetch(url, { headers: { 'User-Agent': AGENT } })
    if (!response.ok) throw new Error(`下载失败 ${name}：${response.status}`)
    fs.writeFileSync(dest, Buffer.from(await response.arrayBuffer()))
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.setContent('<canvas id="c"></canvas>')

// 在页面里画一个字形，返回每个像素有多少墨（0 到 255）；画两遍：第一遍量出墨迹的范围，第二遍把它摆到正中、缩放到统一大小
const draw = (source) =>
  page.evaluate(
    async ({ source, BIG, FILL }) => {
      const canvas = document.getElementById('c')
      canvas.width = BIG
      canvas.height = BIG
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      let paint
      if (source.svg) {
        const image = new Image()
        image.src = `data:image/svg+xml;base64,${source.svg}`
        await image.decode()
        const scale = Math.min(BIG / image.naturalWidth, BIG / image.naturalHeight) * 0.9
        const w = image.naturalWidth * scale
        const h = image.naturalHeight * scale
        paint = () => ctx.drawImage(image, (BIG - w) / 2, (BIG - h) / 2, w, h)
      } else {
        const font = `${BIG * 0.6}px "${source.font}"`
        await document.fonts.load(font, source.char)
        if (!document.fonts.check(font, source.char)) throw new Error(`本机没有字体 ${source.font}`)
        paint = () => {
          ctx.font = font
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#000'
          ctx.fillText(source.char, BIG / 2, BIG / 2)
        }
      }

      const ink = () => {
        const { data } = ctx.getImageData(0, 0, BIG, BIG)
        const out = new Uint8Array(BIG * BIG)
        for (let i = 0; i < out.length; i++) {
          const light = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255
          out[i] = Math.round(255 * (1 - light))
        }
        return out
      }
      const clear = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, BIG, BIG)
      }

      clear()
      paint()
      const first = ink()
      let x0 = BIG
      let y0 = BIG
      let x1 = 0
      let y1 = 0
      for (let y = 0; y < BIG; y++) {
        for (let x = 0; x < BIG; x++) {
          if (first[y * BIG + x] > 127) {
            if (x < x0) x0 = x
            if (x > x1) x1 = x
            if (y < y0) y0 = y
            if (y > y1) y1 = y
          }
        }
      }
      if (x1 <= x0 || y1 <= y0) throw new Error('画出来是空的')

      const scale = (BIG * FILL) / Math.max(x1 - x0, y1 - y0)
      clear()
      ctx.setTransform(scale, 0, 0, scale, BIG / 2 - ((x0 + x1) / 2) * scale, BIG / 2 - ((y0 + y1) / 2) * scale)
      paint()
      const second = ink()
      let text = ''
      for (let i = 0; i < second.length; i += 8192) {
        text += String.fromCharCode(...second.subarray(i, i + 8192))
      }
      return btoa(text)
    },
    { source, BIG, FILL },
  )

// 一维的距离变换（Felzenszwalb），f 里是 0 或很大的数
const INF = 1e20
const edt1d = (f, n, d, v, z) => {
  let k = 0
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  for (let q = 1; q < n; q++) {
    let s
    do {
      const r = v[k]
      s = (f[q] + q * q - (f[r] + r * r)) / (2 * q - 2 * r)
    } while (s <= z[k] && --k > -1)
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }
  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++
    const r = v[k]
    d[q] = (q - r) * (q - r) + f[r]
  }
}

// 每个格子到最近的「目标格子」有多远
const distance = (inside) => {
  const grid = new Float64Array(BIG * BIG)
  for (let i = 0; i < grid.length; i++) grid[i] = inside[i] ? 0 : INF
  const f = new Float64Array(BIG)
  const d = new Float64Array(BIG)
  const v = new Int32Array(BIG)
  const z = new Float64Array(BIG + 1)
  for (let x = 0; x < BIG; x++) {
    for (let y = 0; y < BIG; y++) f[y] = grid[y * BIG + x]
    edt1d(f, BIG, d, v, z)
    for (let y = 0; y < BIG; y++) grid[y * BIG + x] = d[y]
  }
  for (let y = 0; y < BIG; y++) {
    for (let x = 0; x < BIG; x++) f[x] = grid[y * BIG + x]
    edt1d(f, BIG, d, v, z)
    for (let x = 0; x < BIG; x++) grid[y * BIG + x] = Math.sqrt(d[x])
  }
  return grid
}

const names = []
const all = new Int16Array(CHARS.length * 5 * SIZE * SIZE)
let index = 0

for (const char of CHARS) {
  const sources = [
    ...ANCIENT.map((kind) => ({ kind, source: { svg: fs.readFileSync(path.join(RAW, `${char}-${kind}.svg`)).toString('base64') } })),
    ...Object.entries(FONTS).map(([kind, font]) => ({ kind, source: { font, char } })),
  ]
  for (const { kind, source } of sources) {
    const ink = Buffer.from(await draw(source), 'base64')
    const filled = new Uint8Array(BIG * BIG)
    const empty = new Uint8Array(BIG * BIG)
    for (let i = 0; i < filled.length; i++) {
      filled[i] = ink[i] > 127 ? 1 : 0
      empty[i] = 1 - filled[i]
    }
    // 笔画外面是正数，里面是负数
    const outside = distance(filled)
    const within = distance(empty)
    const ratio = BIG / SIZE
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const sx = Math.min(BIG - 1, Math.floor((x + 0.5) * ratio))
        const sy = Math.min(BIG - 1, Math.floor((y + 0.5) * ratio))
        const i = sy * BIG + sx
        const signed = (filled[i] ? 0.5 - within[i] : outside[i] - 0.5) / ratio
        // 存成 1/64 格
        all[index * SIZE * SIZE + y * SIZE + x] = Math.max(-32767, Math.min(32767, Math.round(signed * 64)))
      }
    }
    names.push(`${char}-${kind}`)
    index++
    process.stdout.write(`${char}-${kind} `)
  }
}

await browser.close()
fs.writeFileSync(path.join(OUT, 'glyphs.bin'), Buffer.from(all.buffer))
fs.writeFileSync(path.join(OUT, 'glyphs.json'), JSON.stringify({ size: SIZE, names }))
process.stdout.write(`\n${names.length} 个字形，写到 ${OUT}\n`)
