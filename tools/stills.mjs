// 打包一次工程，按「组合ID:帧」批量渲染静帧用于自查：node tools/stills.mjs <输出目录> MohengOJ-Opening:200 MohengOJ:1500 ...
// 有 3D 画面时加 --gl=angle，用显卡出 WebGL
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const gl = args.find((a) => a.startsWith('--gl='))?.slice(5) ?? null
const [outDir, ...targets] = args.filter((a) => !a.startsWith('--'))
if (!outDir || !targets.length) {
  console.error('用法：node tools/stills.mjs <输出目录> <组合ID:帧>...')
  process.exit(1)
}
fs.mkdirSync(outDir, { recursive: true })

const serveUrl = await bundle({ entryPoint: path.join(PROJECT, 'src', 'index.ts'), rspack: true })
for (const target of targets) {
  const [id, frame] = target.split(':')
  const chromiumOptions = { gl }
  const composition = await selectComposition({ serveUrl, id, chromiumOptions })
  const output = path.join(outDir, `${id}_${frame}.jpeg`)
  const started = Date.now()
  await renderStill({ composition, serveUrl, output, frame: Number(frame), imageFormat: 'jpeg', jpegQuality: 85, overwrite: true, chromiumOptions })
  console.log('已渲染', output, `${Date.now() - started}ms`)
}
