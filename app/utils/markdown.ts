import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

marked.use({ gfm: true, breaks: true })

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string

  return sanitizeHtml(html, {
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

export function markdownSegments(markdown: string): string[] {
  return markdown
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}
