// 由 src/videos/episodes.json 重写根 README 里的视频列表，并检查每期都有自己的 README：node tools/common/docs.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const episodes = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'videos', 'episodes.json'), 'utf8'))

const rows = episodes.map((e) => {
  const flags = e.render.length ? `\`${e.render.join(' ')}\`` : '—'
  return `| ${e.n} | [\`${e.id}\`](src/videos/${e.dir}/README.md) | ${e.title} | ${e.duration} | ${e.summary} | ${flags} |`
})
const table = ['| 期 | 成片 ID | 片名 | 时长 | 一句话 | 渲染参数 |', '| --- | --- | --- | --- | --- | --- |', ...rows].join('\n')

const readmePath = path.join(ROOT, 'README.md')
const readme = fs.readFileSync(readmePath, 'utf8')
const start = '<!-- episodes:start -->'
const end = '<!-- episodes:end -->'
const a = readme.indexOf(start)
const b = readme.indexOf(end)
if (a < 0 || b < 0) throw new Error('README 里找不到 episodes 标记')
fs.writeFileSync(readmePath, `${readme.slice(0, a + start.length)}\n${table}\n${readme.slice(b)}`)

let missing = 0
for (const e of episodes) {
  if (!fs.existsSync(path.join(ROOT, 'src', 'videos', e.dir, 'README.md'))) {
    console.warn(`缺 src/videos/${e.dir}/README.md`)
    missing++
  }
}
console.log(`视频列表已更新（${episodes.length} 期）${missing ? `，${missing} 期缺 README` : ''}`)
