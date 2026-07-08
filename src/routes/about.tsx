import { Link, createFileRoute } from '@tanstack/react-router'

import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { Kicker, SerifEm } from '@/components/type'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { seo } from '@/lib/seo'
import { EXPERIENCE, SHOW_BLOG, SITE } from '@/lib/site'

export const Route = createFileRoute('/about')({
  head: () => ({
    ...seo({
      title: `About — ${SITE.author}`,
      description:
        "I'm Indra Putra — a senior fullstack engineer based in Indonesia. For the past seven-plus years I've built web products end to end: the interface people touch, the API behind it, and the infrastructure underneath.",
      path: '/about',
    }),
  }),
  component: AboutPage,
})

const PRINCIPLES = [
  {
    n: '01',
    title: 'Ship end to end',
    body: 'Owning a feature from database schema to pixel means nothing gets lost between handoffs.',
  },
  {
    n: '02',
    title: 'Simple over clever',
    body: 'Boring, well-understood tech ships faster and breaks less. Cleverness is a budget, spent rarely.',
  },
  {
    n: '03',
    title: 'Details are the product',
    body: 'Empty states, loading, errors, keyboard flow — the edges are where software earns trust.',
  },
]

function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* header band */}
        <div className="relative overflow-hidden bg-mist">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_78%_40%,rgba(15,157,140,0.14),rgba(255,255,255,0)_70%)]" />
          <div className="flutes-wide pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-white/0 to-white" />

          <SiteNav variant="band" active="about" />

          {/* intro */}
          <div className="relative z-20 mx-auto grid max-w-[1120px] grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-[clamp(40px,6vw,80px)] px-[clamp(20px,5vw,40px)] pb-[110px] pt-[90px]">
            <div className="flex flex-col">
              <Kicker>About</Kicker>
              <h1 className="mt-[18px] text-[clamp(40px,5vw,64px)] font-medium leading-[1.08] tracking-[-0.035em] text-ink">
                Engineer from front <SerifEm>to back.</SerifEm>
              </h1>
              <p className="mt-7 text-[17px] leading-[1.7] text-slate">
                I'm Indra Putra — a senior fullstack engineer based in
                Indonesia. For the past seven-plus years I've built web products
                end to end: the interface people touch, the API behind it, and
                the infrastructure underneath.
              </p>
              <p className="mt-[18px] text-[17px] leading-[1.7] text-slate">
                I care about the whole arc of shipping — understanding the
                problem, cutting scope honestly, and sweating the details that
                make software feel considered. Most of my work lives at the seam
                between design and engineering.
              </p>
            </div>

            <div className="relative w-full max-w-[400px] justify-self-center">
              <div
                className="absolute -inset-[18px] rounded-[32px]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(80deg, rgba(20,23,28,0.06) 0 1.5px, rgba(255,255,255,0) 1.5px 30px), radial-gradient(ellipse 70% 70% at 60% 40%, rgba(15,157,140,0.18), rgba(255,255,255,0) 75%)',
                }}
              />
              {/* TODO: drop /public/portrait.jpg and swap this placeholder
                  for <img src="/portrait.jpg" ... /> */}
              <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-3xl border border-[rgba(20,23,28,0.08)] bg-[linear-gradient(135deg,#f2f4f8_0%,#e9edf3_100%)]">
                <div className="flutes-fine absolute inset-0" />
                <span className="select-none font-serif text-[44px] italic text-ink/15">
                  IP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* how I work */}
        <section className="bg-white px-[clamp(20px,5vw,40px)] pb-[60px] pt-[100px]">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-11">
            <div className="flex flex-col gap-4">
              <Kicker>01 · How I Work</Kicker>
              <h2 className="text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.1] tracking-[-0.03em] text-ink">
                A few things I <SerifEm>hold on to.</SerifEm>
              </h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
              {PRINCIPLES.map((p) => (
                <Card key={p.n} className="gap-2.5 rounded-[20px] px-8 py-[30px]">
                  <span className="font-serif text-[22px] italic text-teal">
                    {p.n}
                  </span>
                  <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
                    {p.title}
                  </h3>
                  <p className="text-[15px] leading-[1.65] text-slate">{p.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* experience */}
        <section className="bg-white px-[clamp(20px,5vw,40px)] pb-[120px] pt-[60px]">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-11">
            <div className="flex flex-col gap-4">
              <Kicker>02 · Experience</Kicker>
              <h2 className="text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.1] tracking-[-0.03em] text-ink">
                Where I've <SerifEm>been.</SerifEm>
              </h2>
            </div>
            <div className="flex flex-col border-t border-[rgba(20,23,28,0.10)]">
              {EXPERIENCE.map((e) => (
                <div
                  key={e.company}
                  className="grid items-baseline gap-2 border-b border-[rgba(20,23,28,0.08)] py-[30px] md:grid-cols-[minmax(140px,220px)_1fr] md:gap-6"
                >
                  <span className="text-sm font-medium text-faint">{e.period}</span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xl font-semibold tracking-[-0.015em] text-ink">
                      {e.role} · {e.company}
                    </h3>
                    <p className="max-w-[640px] text-[15px] leading-[1.65] text-slate">
                      {e.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="relative overflow-hidden bg-mist px-[clamp(20px,5vw,40px)] py-[100px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_22%_65%,rgba(15,157,140,0.14),rgba(255,255,255,0)_70%)]" />
          <div className="flutes-wide pointer-events-none absolute inset-0" />
          <div className="relative mx-auto flex max-w-[760px] flex-col items-center text-center">
            <h2 className="text-[clamp(32px,4.4vw,52px)] font-medium leading-[1.08] tracking-[-0.03em] text-ink">
              Want the longer <SerifEm>story?</SerifEm>
            </h2>
            <div className="mt-[34px] flex flex-wrap items-center justify-center gap-3.5">
              <Button asChild variant="pill" size="pill" className="gap-[9px]">
                <Link to="/" hash="contact">
                  Get in touch <span aria-hidden="true">→</span>
                </Link>
              </Button>
              <Button asChild variant="glass-pill" size="pill">
                {SHOW_BLOG ? (
                  <Link to="/blog">Read the blog</Link>
                ) : (
                  <Link to="/" hash="work">
                    View my work
                  </Link>
                )}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
