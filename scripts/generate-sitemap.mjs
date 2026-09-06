// Generates dist/sitemap.xml after the Vite build by scanning the blog
// post markdown files directly (kept in sync with src/lib/posts.js's
// frontmatter format, but this runs in plain Node so it can't reuse Vite's
// import.meta.glob).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const SITE_URL = 'https://mbillauer-blip.github.io/Food-calculator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const postsDir = path.join(__dirname, '..', 'src', 'content', 'posts')
const distDir = path.join(__dirname, '..', 'dist')

function parseFrontmatterDate(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return undefined
  const dateLine = match[1].split('\n').find((line) => line.trim().startsWith('date:'))
  return dateLine ? dateLine.split(':').slice(1).join(':').trim() : undefined
}

const staticRoutes = [
  { loc: '/', priority: '1.0' },
  { loc: '/blog', priority: '0.8' },
  { loc: '/privacy', priority: '0.2' },
]

const postFiles = readdirSync(postsDir).filter((f) => f.endsWith('.md'))
const postRoutes = postFiles.map((file) => {
  const slug = file.replace(/\.md$/, '')
  const raw = readFileSync(path.join(postsDir, file), 'utf8')
  const date = parseFrontmatterDate(raw)
  return { loc: `/blog/${slug}`, priority: '0.6', lastmod: date }
})

const urls = [...staticRoutes, ...postRoutes]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

writeFileSync(path.join(distDir, 'sitemap.xml'), xml)
console.log(`sitemap.xml written with ${urls.length} URLs`)
