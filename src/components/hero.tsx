import { Link } from '@tanstack/react-router'

import { HeroCanvas } from '@/components/hero-canvas'
import { SiteNav } from '@/components/site-nav'
import { Button } from '@/components/ui/button'
import { SerifEm } from '@/components/type'

/**
 * The 100vh hero from the design handoff: interactive glass canvas,
 * readability veil, overlay nav, centered copy, bottom fade into the page.
 */
export function Hero() {
  return (
    <div
      className="relative h-screen min-h-[640px] w-full cursor-default overflow-hidden bg-mist"
      style={{ height: '100svh' }}
    >
      <HeroCanvas />

      {/* soft readability veil behind the copy */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_46%_at_50%_46%,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.28)_55%,rgba(255,255,255,0)_100%)]" />

      <SiteNav variant="overlay" />

      {/* hero copy */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[rgba(20,23,28,0.10)] bg-white/55 px-4 py-[7px] text-[13px] font-medium text-ink-soft backdrop-blur-[10px]">
          <span className="size-[7px] rounded-full bg-avail" aria-hidden />
          Fullstack Developer · Singapore
        </div>

        <h1 className="mt-[26px] text-[clamp(44px,6.6vw,86px)] font-medium leading-[1.06] tracking-[-0.035em] text-ink">
          Hey, I'm Indra Putra.
          <br />
          I build for <SerifEm className="tracking-[-0.01em]">the web.</SerifEm>
        </h1>

        <p className="mt-[26px] max-w-[520px] text-[17px] leading-[1.65] text-slate">
          5+ years of experience shipping products end to end — from clean
          interfaces to the systems behind them.
        </p>

        <div className="pointer-events-auto mt-[38px] flex flex-wrap items-center justify-center gap-3.5">
          <Button asChild variant="pill" size="pill" className="gap-[9px]">
            <Link to="/" hash="work">
              View My Work <span aria-hidden="true">→</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="glass-pill"
            size="pill"
            className="bg-white/50 hover:bg-white/80"
          >
            <Link to="/blog">Read My Blog</Link>
          </Button>
        </div>
      </div>

      {/* bottom fade into the rest of the page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[90px] bg-gradient-to-b from-white/0 to-white" />
    </div>
  )
}
