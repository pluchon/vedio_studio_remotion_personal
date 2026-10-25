// 自查用：打包一次、开一个浏览器，按「秒数」渲多张静帧，再拼一张缩略图总览
//   node tools/ember/frames.mjs <输出目录> 12.5 40 61.2 ...   [--sheet] [--scale=0.5]
import path from 'node:path'
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer'
import { enableSkia } from '@remotion/skia/enable'

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const sheet = args.includes('--sheet')
const scale = Number(args.find((a) => a.startsWith('--scale='))?.slice(8) ?? 1)
const [outDir, ...times] = args.filter((a) => !a.startsWith('--'))
fs.mkdirSync(outDir, { recursive: true })

const t0 = Date.now()
const serveUrl = await bundle({ entryPoint: path.join(PROJECT, 'src', 'index.ts'), rspack: true, bundlerOverride: (c, ctx) => enableSkia(c, ctx) })
console.log('打包', Date.now() - t0, 'ms')
const chromiumOptions = { gl: 'angle' }
const browser = await openBrowser('chrome', { chromiumOptions })
const composition = await selectComposition({ serveUrl, id: 'Ember', chromiumOptions, puppeteerInstance: browser, timeoutInMilliseconds: 300000 })
const files = []
for (const s of times) {
  const frame = Math.round(Number(s) * composition.fps)
  const output = path.join(outDir, `f${String(s).replace('.', '_')}.jpeg`)
  const started = Date.now()
  await renderStill({ composition, serveUrl, output, frame, imageFormat: 'jpeg', jpegQuality: 90, overwrite: true, chromiumOptions, puppeteerInstance: browser, scale, timeoutInMilliseconds: 300000 })
  console.log(s, 's', Date.now() - started, 'ms')
  files.push(output)
}
await browser.close({ silent: true })
// 缩略图总览：每 12 张拼一张 sheet1.jpeg、sheet2.jpeg……（只有一张时叫 sheet.jpeg）
if (sheet && files.length > 1) {
  const groups = []
  for (let i = 0; i < files.length; i += 12) groups.push(i)
  for (const [gi, start] of groups.entries()) {
    const part = files.slice(start, start + 12)
    const labels = times.slice(start, start + 12)
    if (part.length < 2) continue
    const cols = Math.min(3, part.length)
    const inputs = part.flatMap((f) => ['-i', f])
    const w = 640
    const filters = part.map((_, i) => `[${i}]scale=${w}:-1,drawtext=text='${labels[i]}':x=8:y=8:fontcolor=white:fontsize=20[v${i}]`).join(';')
    const layout = part.map((_, i) => `${i % cols === 0 ? '0' : Array.from({ length: i % cols }, () => 'w0').join('+')}_${Math.floor(i / cols) === 0 ? '0' : Array.from({ length: Math.floor(i / cols) }, () => 'h0').join('+')}`).join('|')
    const graph = `${filters};${part.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${part.length}:layout=${layout}:fill=gray[o]`
    const name = groups.length === 1 ? 'sheet.jpeg' : `sheet${gi + 1}.jpeg`
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[o]', path.join(outDir, name)], { stdio: 'inherit' })
    console.log('总览', r.status === 0 ? path.join(outDir, name) : '失败')
  }
}
