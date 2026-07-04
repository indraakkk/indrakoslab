import { marked } from 'marked'

/**
 * Blog content pipeline (ADR-001 §2): markdown files in content/blog/ are
 * the CMS. `import.meta.glob` inlines them at build time; frontmatter is
 * parsed with the tiny parser below (title/date/tag/description are flat
 * strings — no need for a YAML dependency) and bodies render through
 * `marked`. This module is only ever imported from server functions, so
 * none of it ships to the client bundle.
 */

export interface PostMeta {
  slug: string
  title: string
  description: string
  /** ISO date, e.g. '2026-06-18'. */
  date: string
  /** Display date, e.g. 'Jun 2026'. */
  dateDisplay: string
  tag: string
  /** Estimated reading time, e.g. '4 min read'. */
  read: string
}

export interface Post extends PostMeta {
  html: string
}

const files = import.meta.glob('../../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parseFrontmatter(src: string): {
  data: Record<string, string>
  body: string
} {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src)
  if (!m) return { data: {}, body: src }
  const data: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i < 0) continue
    const key = line.slice(0, i).trim()
    let value = line.slice(i + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  return { data, body: src.slice(m[0].length) }
}

function displayDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function readingTime(body: string): string {
  const words = body.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}

const posts: Array<Post> = Object.entries(files)
  .map(([path, src]) => {
    const slug = path.split('/').pop()!.replace(/\.md$/, '')
    const { data, body } = parseFrontmatter(src)
    if (!data.title || !data.date) {
      throw new Error(`content/blog/${slug}.md is missing title or date frontmatter`)
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      Number.isNaN(new Date(data.date + 'T00:00:00Z').getTime())
    ) {
      throw new Error(
        `content/blog/${slug}.md has invalid date '${data.date}' — expected YYYY-MM-DD`,
      )
    }
    return {
      slug,
      title: data.title,
      description: data.description ?? '',
      date: data.date,
      dateDisplay: displayDate(data.date),
      tag: data.tag ?? 'Note',
      read: readingTime(body),
      html: marked.parse(body, { async: false }),
    }
  })
  // ISO dates compare correctly as strings; slug tie-break keeps the
  // order deterministic for same-day posts
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))

export function getAllPosts(): Array<PostMeta> {
  return posts.map(({ html: _html, ...meta }) => meta)
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}
