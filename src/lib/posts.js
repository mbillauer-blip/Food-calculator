import { marked } from 'marked'

// Very small frontmatter parser: a leading `---` block of flat `key: value`
// lines, followed by the markdown body. No nested structures needed here.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const [, frontmatterBlock, content] = match
  const data = {}
  frontmatterBlock.split('\n').forEach((line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) return
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    data[key] = value
  })
  return { data, content }
}

const rawPosts = import.meta.glob('../content/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export const posts = Object.entries(rawPosts)
  .map(([path, raw]) => {
    const slug = path.split('/').pop().replace(/\.md$/, '')
    const { data, content } = parseFrontmatter(raw)
    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || '',
      html: marked.parse(content),
    }
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1))

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug)
}
