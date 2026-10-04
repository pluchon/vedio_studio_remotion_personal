// 按 src/videos/episodes.json 里登记的参数渲染成片：npm run render -- <成片ID> [额外参数]
// 例：npm run render -- Nebula；要传参数的：npm run render -- ThatDay --props=refer/那一天/props.json
// npm run render -- --list 列出所有成片
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const episodes = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'videos', 'episodes.json'), 'utf8'))

const [id, ...extra] = process.argv.slice(2)
if (!id || id === '--list') {
  for (const e of episodes) console.log(`${String(e.n).padStart(2)}  ${e.id.padEnd(10)} ${e.title}  ${e.render.join(' ')}`)
  process.exit(id ? 0 : 1)
}
const ep = episodes.find((e) => e.id === id)
if (!ep) {
  console.error(`没有这个成片 ID：${id}（npm run render -- --list 看全部）`)
  process.exit(1)
}
const out = path.join('out', `${ep.dir}.mp4`)
const args = ['remotion', 'render', ep.id, out, ...ep.render, ...extra]
console.log('npx', args.join(' '))
const result = spawnSync('npx', args, { cwd: ROOT, stdio: 'inherit', shell: true })
process.exit(result.status ?? 1)
