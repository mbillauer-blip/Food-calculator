import { Link, useParams } from 'react-router-dom'
import AdSlot from '../components/AdSlot'
import { AD_SLOTS } from '../lib/adsConfig'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getPostBySlug } from '../lib/posts'

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)

  useDocumentMeta(
    post ? `${post.title} — Party Food Calculator` : 'Post not found — Party Food Calculator',
    post ? post.description : undefined
  )

  if (!post) {
    return (
      <div className="app">
        <header>
          <h1>Post not found</h1>
        </header>
        <section className="card">
          <p>That post doesn't exist.</p>
          <Link to="/blog" className="btn-add" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Back to blog
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <p className="eyebrow-link">
          <Link to="/blog">← Blog</Link>
        </p>
        <h1>{post.title}</h1>
        {post.date && <p className="subtitle">{post.date}</p>}
      </header>

      <article className="card post-content" dangerouslySetInnerHTML={{ __html: post.html }} />

      <AdSlot slot={AD_SLOTS.belowBlogPost} />

      <p>
        <Link to="/">Try the Party Food Calculator →</Link>
      </p>
    </div>
  )
}
