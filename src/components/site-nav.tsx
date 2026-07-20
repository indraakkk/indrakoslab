import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SHOW_BLOG, SITE } from '@/lib/site'
import { cn } from '@/lib/utils'

export interface SiteNavProps {
  /**
   * overlay — absolutely positioned over the hero canvas (landing)
   * band    — in-flow on a mist band (about)
   * solid   — in-flow on white with a hairline border (blog)
   */
  variant?: 'overlay' | 'band' | 'solid'
  active?: 'about' | 'blog'
}

const ALL_LINKS = [
  { label: 'Work', to: '/', hash: 'work' },
  { label: 'Stack', to: '/', hash: 'stack' },
  { label: 'About', to: '/about', key: 'about' },
  { label: 'Blog', to: '/blog', key: 'blog' },
  { label: 'Contact', to: '/', hash: 'contact' },
] as const

// Blog is gated behind SHOW_BLOG (src/lib/site.ts) — drop the link when off.
const LINKS = ALL_LINKS.filter(
  (l) => SHOW_BLOG || !('key' in l && l.key === 'blog'),
)

export function SiteNav({ variant = 'solid', active }: SiteNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <nav
      className={cn(
        'px-5 py-[22px] sm:px-10',
        variant === 'overlay' && 'absolute inset-x-0 top-0 z-30',
        variant === 'band' && 'relative z-30',
        variant === 'solid' && 'border-b border-[rgba(20,23,28,0.06)] bg-white',
      )}
    >
      <div className="flex items-center justify-between">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-baseline gap-[2px] text-base font-semibold tracking-[-0.01em] text-ink no-underline"
        >
          indr<span className="text-faint">_</span>
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-[26px] md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={'hash' in l ? l.hash : undefined}
              activeOptions={{ exact: true }}
              className={cn(
                'text-sm no-underline transition-colors',
                'key' in l && l.key === active
                  ? 'font-semibold text-ink'
                  : 'font-medium text-ink-soft hover:text-ink',
              )}
            >
              {l.label}
            </Link>
          ))}
          <Button
            asChild
            variant="pill"
            size="pill-sm"
            className="shadow-none hover:translate-y-0"
          >
            <a href={SITE.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </Button>
        </div>

        {/* mobile menu button */}
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[rgba(20,23,28,0.12)] bg-white/60 text-ink backdrop-blur-[10px] md:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {/* mobile panel */}
      {open ? (
        <div className="absolute inset-x-5 top-full z-40 mt-2 flex flex-col gap-1 rounded-2xl border border-[rgba(20,23,28,0.10)] bg-white/90 p-3 shadow-[0_22px_50px_rgba(20,23,28,0.12)] backdrop-blur-xl md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={'hash' in l ? l.hash : undefined}
              activeOptions={{ exact: true }}
              onClick={() => setOpen(false)}
              className={cn(
                'rounded-xl px-4 py-3 text-[15px] no-underline transition-colors hover:bg-[rgba(20,23,28,0.04)]',
                'key' in l && l.key === active
                  ? 'font-semibold text-ink'
                  : 'font-medium text-ink-soft',
              )}
            >
              {l.label}
            </Link>
          ))}
          <Button
            asChild
            variant="pill"
            size="pill-sm"
            className="mt-2 self-start hover:translate-y-0"
          >
            <a href={SITE.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </Button>
        </div>
      ) : null}
    </nav>
  )
}
