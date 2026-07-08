import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchPost } from '@/lib/blog'
import { blogPostingJsonLd, seo } from '@/lib/seo'
import { SHOW_BLOG, SITE } from '@/lib/site'

export const Route = createFileRoute('/blog/$slug')({
  // Blog is hidden for now (SHOW_BLOG in src/lib/site.ts) — 404 direct hits.
  beforeLoad: () => {
    if (!SHOW_BLOG) throw notFound()
  },
  loader: async ({ params }) => {
    const post = await fetchPost({ data: params.slug })
    if (!post) throw notFound()
    return post
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { meta, links } = seo({
      title: `${loaderData.title} — ${SITE.author}`,
      description: loaderData.description,
      path: `/blog/${loaderData.slug}`,
      type: 'article',
    })
    return {
      meta,
      links,
      scripts: [
        { type: 'application/ld+json', children: blogPostingJsonLd(loaderData) },
      ],
    }
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const post = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteNav variant="solid" active="blog" />

      <main className="flex-1">
        <article className="mx-auto max-w-[720px] px-[clamp(20px,5vw,40px)] pb-[110px] pt-[60px]">
          <Button
            asChild
            variant="glass-pill"
            size="pill-sm"
            className="text-sm text-ink-soft hover:border-[rgba(20,23,28,0.3)] hover:bg-white hover:text-ink"
          >
            <Link to="/blog" activeOptions={{ exact: true }}>
              ← All posts
            </Link>
          </Button>

          <div className="mt-11 flex flex-wrap items-baseline gap-3.5">
            <span className="text-[13.5px] font-medium text-faint">
              {post.dateDisplay}
            </span>
            <span className="text-[rgba(20,23,28,0.22)]" aria-hidden="true">
              ·
            </span>
            <span className="text-[13.5px] font-medium text-faint">
              {post.read}
            </span>
            <span className="text-[rgba(20,23,28,0.22)]" aria-hidden="true">
              ·
            </span>
            <Badge
              variant="chip"
              className="bg-transparent p-0 text-teal"
            >
              {post.tag}
            </Badge>
          </div>

          <h1 className="mt-4 text-[clamp(34px,4.6vw,52px)] font-medium leading-[1.12] tracking-[-0.03em] text-ink">
            {post.title}
          </h1>

          <div className="my-10 h-px bg-[rgba(20,23,28,0.08)]" />

          <div
            className="post-body"
            // Safe: content is our own markdown, rendered by `marked` at build
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div className="mb-9 mt-12 h-px bg-[rgba(20,23,28,0.08)]" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              asChild
              variant="pill"
              className="gap-[9px] rounded-full px-[26px] py-3.5 text-[15px] shadow-[0_10px_30px_rgba(20,23,28,0.18)]"
            >
              <Link to="/blog" activeOptions={{ exact: true }}>
                ← Back to all posts
              </Link>
            </Button>
            <span className="text-sm text-faint">
              Written by{' '}
              <span className="font-medium text-ink">{SITE.author}</span>
            </span>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
