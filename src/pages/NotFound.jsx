import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

export default function NotFound() {
  useDocumentMeta('Page not found — Party Food Calculator', undefined)

  return (
    <div className="app">
      <header>
        <h1>Page not found</h1>
        <p className="subtitle">That page doesn't exist.</p>
      </header>
      <section className="card">
        <p>
          <Link to="/">Back to the calculator</Link>
        </p>
      </section>
    </div>
  )
}
