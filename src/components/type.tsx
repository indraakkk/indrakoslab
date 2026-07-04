import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Uppercase section kicker, e.g. "01 · Selected Work". */
export function Kicker({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-[12.5px] font-semibold uppercase tracking-[0.14em] text-faint',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * The Instrument Serif italic accent inside headings. Letter-spacing is
 * inherited from the parent heading (the design only loosens it to -0.01em
 * in the hero h1, passed via className there).
 */
export function SerifEm({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <em
      className={cn('font-serif font-normal italic text-ink-2', className)}
    >
      {children}
    </em>
  )
}
