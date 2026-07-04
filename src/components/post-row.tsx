import { Link } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import type { PostMeta } from '@/lib/content'

/** One row of the post list — shared by the landing teaser and /blog. */
export function PostRow({
  post,
  headingLevel: Heading = 'h2',
}: {
  post: PostMeta
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="grid cursor-pointer gap-3 rounded-xl border-b border-[rgba(20,23,28,0.08)] px-3 py-8 no-underline transition-colors duration-200 hover:bg-[rgba(20,23,28,0.025)] md:grid-cols-[minmax(90px,130px)_1fr_auto] md:items-baseline md:gap-5"
    >
      <span className="text-[13.5px] font-medium text-faint">
        {post.dateDisplay}
      </span>
      <div className="flex flex-col gap-2">
        <Heading className="text-[23px] font-semibold leading-[1.25] tracking-[-0.02em] text-ink">
          {post.title}
        </Heading>
        <p className="max-w-[540px] text-[15px] leading-[1.6] text-slate">
          {post.description}
        </p>
      </div>
      <div className="flex items-baseline gap-3.5">
        <Badge variant="chip">{post.tag}</Badge>
        <span className="text-[17px] text-teal" aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  )
}
