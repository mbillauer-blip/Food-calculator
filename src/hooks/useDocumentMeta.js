import { useEffect } from 'react'

function setMetaTag(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

// Sets the document title and description meta tag for the current page.
// Runs client-side, so it covers browser tabs/history and JS-rendering
// crawlers; it does not change the static index.html served on first load.
export function useDocumentMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title
    if (description) setMetaTag('description', description)
  }, [title, description])
}
