import { createFileRoute } from '@tanstack/react-router'

import { PostRow } from '@/components/post-row'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { Kicker, SerifEm } from '@/components/type'
import { fetchPosts } from '@/lib/blog'
import { seo } from '@/lib/seo'
import { SITE } from '@/lib/site'

export const Route = createFileRoute('/blog/')({
  loader: () => fetchPosts(),
  head: () => ({
    ...seo({
      title: `Blog — ${SITE.author}`,
      description:
        "Occasional writing on shipping web products — what worked, what didn't, and what I'd do differently.",
      path: '/blog',
    }),
  }),
  component: BlogIndexPage,
})

function BlogIndexPage() {
  const posts = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteNav variant="solid" active="blog" />

      <main className="flex-1">
        {/* header band */}
        <div className="relative overflow-hidden bg-mist">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_80%_at_82%_30%,rgba(15,157,140,0.13),rgba(255,255,255,0)_70%)]" />
          <div className="flutes-wide pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-b from-white/0 to-white" />
          <div className="relative mx-auto max-w-[860px] px-[clamp(20px,5vw,40px)] pb-[100px] pt-[90px]">
            <Kicker>Blog</Kicker>
            <h1 className="mt-[18px] text-[clamp(40px,5vw,64px)] font-medium leading-[1.08] tracking-[-0.035em] text-ink">
              Notes from <SerifEm>the build.</SerifEm>
            </h1>
            <p className="mt-[22px] max-w-[480px] text-[16.5px] leading-[1.65] text-slate">
              Occasional writing on shipping web products — what worked, what
              didn't, and what I'd do differently.
            </p>
          </div>
        </div>

        {/* list */}
        <div className="mx-auto max-w-[860px] px-[clamp(20px,5vw,40px)] pb-[120px] pt-[30px]">
          <div className="flex flex-col">
            {posts.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
