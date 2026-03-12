import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

marked.use({
  gfm: true,
  breaks: true
})

export function renderMarkdown(markdown: string): string {
  const unsafeHtml = marked.parse(markdown, { async: false }) as string

  return sanitizeHtml(unsafeHtml, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'blockquote',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'a',
      'hr'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  })
}
