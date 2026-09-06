import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { posts } from '../lib/posts'

export default function BlogIndex() {
  useDocumentMeta(
    'Blog — Party Food Calculator',
    'Guides on portion sizes, party planning math, and how to shop for a crowd.'
  )

  return (
    <div className="app">
      <header>
        <h1>Blog</h1>
        <p className="subtitle">Portion sizing guides and party-planning math.</p>
      </header>

      <section className="card">
        {posts.length === 0 && <p className="hint">No posts yet.</p>}
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="post-list-link">
                <span className="post-list-title">{post.title}</span>
                {post.description && (
                  <span className="post-list-description">{post.description}</span>
                )}
                {post.date && <span className="post-list-date">{post.date}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
