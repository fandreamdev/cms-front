import DOMPurify from 'dompurify'
import { marked } from 'marked'
import TurndownService from 'turndown'

export type ContentMode = 'rich' | 'markdown'

export const detectContentMode = (content: string): ContentMode =>
  /^\s*<(?:!doctype|html|body|p|div|h[1-6]|ul|ol|blockquote|pre|table|figure)\b/i.test(content)
    ? 'rich'
    : 'markdown'

export const markdownToHtml = (markdown: string) =>
  DOMPurify.sanitize(marked.parse(markdown, { async: false }))

export const htmlToMarkdown = (html: string) => {
  const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })
  return turndown.turndown(DOMPurify.sanitize(html))
}

export const renderContent = (content: string) => {
  const html = detectContentMode(content) === 'markdown'
    ? marked.parse(content, { async: false })
    : content
  return DOMPurify.sanitize(html)
}
