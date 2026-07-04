import { SITE } from '@/lib/site'

export interface SeoOptions {
  title: string
  description: string
  /** Route path, e.g. '/blog/boring-tech'. Used for the canonical URL. */
  path: string
  /** OpenGraph type — 'article' for blog posts. */
  type?: 'website' | 'article'
  image?: string
}

/**
 * Per-route head tags: title/description, canonical URL, OpenGraph and
 * Twitter cards. Spread the result into a route's `head()` return value.
 */
export function seo({ title, description, path, type = 'website', image }: SeoOptions) {
  const url = SITE.url + (path === '/' ? '' : path)
  const img = SITE.url + (image ?? SITE.ogImage)

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: SITE.name },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: img },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: img },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}

/** JSON-LD `Person` for the landing page. */
export function personJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.author,
    url: SITE.url,
    email: `mailto:${SITE.email}`,
    jobTitle: 'Fullstack Developer',
    sameAs: [SITE.github],
  })
}

/** JSON-LD `BlogPosting` for a post page. */
export function blogPostingJsonLd(post: {
  slug: string
  title: string
  description: string
  date: string
}) {
  const url = `${SITE.url}/blog/${post.slug}`
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: SITE.url + SITE.ogImage,
    datePublished: post.date,
    dateModified: post.date,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Person', name: SITE.author, url: SITE.url },
  })
}
