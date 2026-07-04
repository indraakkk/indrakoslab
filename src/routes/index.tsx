import { Link, createFileRoute } from '@tanstack/react-router'
import { Mail } from 'lucide-react'

import { Hero } from '@/components/hero'
import { GitHubIcon, LinkedInIcon } from '@/components/icons'
import { PostRow } from '@/components/post-row'
import { SiteFooter } from '@/components/site-footer'
import { Kicker, SerifEm } from '@/components/type'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fetchPosts } from '@/lib/blog'
import type { PostMeta } from '@/lib/content'
import { personJsonLd, seo } from '@/lib/seo'
import { EXPERIENCE, PROJECTS, SITE, STACK, type Project } from '@/lib/site'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  loader: () => fetchPosts(),
  head: () => {
    const { meta, links } = seo({
      title: SITE.title,
      description: SITE.description,
      path: '/',
    })
    return {
      meta,
      links,
      scripts: [{ type: 'application/ld+json', children: personJsonLd() }],
    }
  },
  component: HomePage,
})

function HomePage() {
  const posts = Route.useLoaderData()

  return (
    <>
      <main>
        <Hero />
        <WorkSection />
        <StackSection />
        <ExperienceSection />
        <WritingSection posts={posts.slice(0, 3)} />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  )
}

/* ============ 01 · SELECTED WORK ============ */

function ProjectMedia({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative bg-[linear-gradient(135deg,#f2f4f8_0%,#e9edf3_100%)]',
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(80deg, rgba(20,23,28,0.05) 0 1.5px, rgba(255,255,255,0) 1.5px 34px), radial-gradient(ellipse 60% 70% at ${project.glowAt}, rgba(15,157,140,${project.featured ? '0.14' : '0.12'}), rgba(255,255,255,0) 70%)`,
        }}
      />
      {project.image ? (
        <img
          src={project.image}
          alt={project.imageAlt ?? `${project.title} screenshot`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // TODO: drop real screenshots into /public and set `image` in
        // src/lib/site.ts — this wordmark is the styled placeholder
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="select-none font-serif text-[clamp(28px,3.5vw,44px)] italic text-ink/15">
            {project.title}
          </span>
        </div>
      )}
    </div>
  )
}

function ProjectLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-auto inline-flex items-center gap-[7px] self-start border-b border-transparent text-[15px] font-medium text-ink no-underline transition-colors hover:border-[rgba(20,23,28,0.4)]"
    >
      View project{' '}
      <span className="text-teal" aria-hidden="true">
        ↗
      </span>
    </a>
  )
}

const cardHover =
  'transition-[transform,box-shadow,border-color] duration-[250ms] hover:-translate-y-[3px] hover:border-[rgba(20,23,28,0.18)] hover:shadow-[0_22px_50px_rgba(20,23,28,0.10)]'

function WorkSection() {
  const featured = PROJECTS.find((p) => p.featured) ?? PROJECTS[0]
  const rest = PROJECTS.filter((p) => p !== featured)

  return (
    <section
      id="work"
      className="relative scroll-mt-6 bg-white px-[clamp(20px,5vw,40px)] pb-[70px] pt-[120px]"
    >
      <div className="mx-auto flex max-w-[1120px] flex-col gap-[52px]">
        <div className="flex flex-col gap-4">
          <Kicker>01 · Selected Work</Kicker>
          <div className="flex flex-wrap items-end justify-between gap-[18px]">
            <h2 className="text-[clamp(34px,4.2vw,54px)] font-medium leading-[1.08] tracking-[-0.03em] text-ink">
              Things I've <SerifEm>shipped.</SerifEm>
            </h2>
            <p className="mb-1.5 max-w-[320px] text-[15px] leading-[1.6] text-faint">
              A few projects that show how I think and build.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
          {/* featured project */}
          <Card className={cn('col-span-full flex-row flex-wrap', cardHover)}>
            <ProjectMedia
              project={featured}
              className="min-h-[340px] min-w-[300px] flex-[1.35]"
            />
            <div className="flex min-w-[280px] flex-1 flex-col gap-4 px-[38px] pb-10 pt-[38px]">
              <div className="flex flex-wrap gap-2">
                {featured.tags.map((t) => (
                  <Badge key={t} variant="chip">
                    {t}
                  </Badge>
                ))}
              </div>
              <h3 className="text-[27px] font-semibold tracking-[-0.02em] text-ink">
                {featured.title}
              </h3>
              <p className="text-[15.5px] leading-[1.68] text-slate">
                {featured.description}
              </p>
              <ProjectLink href={featured.href} />
            </div>
          </Card>

          {rest.map((p) => (
            <Card key={p.slug} className={cardHover}>
              <ProjectMedia project={p} className="aspect-[16/10]" />
              <div className="flex flex-1 flex-col gap-[13px] px-8 pb-[34px] pt-[30px]">
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="chip">
                      {t}
                    </Badge>
                  ))}
                </div>
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
                  {p.title}
                </h3>
                <p className="text-[15px] leading-[1.65] text-slate">
                  {p.description}
                </p>
                <ProjectLink href={p.href} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ 02 · TECH STACK ============ */

function StackSection() {
  return (
    <section
      id="stack"
      className="scroll-mt-6 bg-white px-[clamp(20px,5vw,40px)] py-[70px]"
    >
      <div className="mx-auto flex max-w-[1120px] flex-col gap-11">
        <div className="flex flex-col gap-4">
          <Kicker>02 · Tech Stack</Kicker>
          <h2 className="text-[clamp(34px,4.2vw,54px)] font-medium leading-[1.08] tracking-[-0.03em] text-ink">
            Tools I <SerifEm>reach for.</SerifEm>
          </h2>
        </div>

        <div className="flex flex-col border-t border-[rgba(20,23,28,0.10)]">
          {STACK.map((row) => (
            <div
              key={row.label}
              className="grid items-baseline gap-3 border-b border-[rgba(20,23,28,0.08)] py-7 md:grid-cols-[minmax(140px,220px)_1fr] md:gap-6"
            >
              <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-faint">
                {row.label}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-2 text-xl font-medium tracking-[-0.01em] text-ink">
                {row.items.map((item, i) => (
                  <span key={item} className="contents">
                    <span>{item}</span>
                    {i < row.items.length - 1 ? (
                      <span className="text-[rgba(20,23,28,0.22)]" aria-hidden="true">
                        ·
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ 03 · EXPERIENCE ============ */

function ExperienceSection() {
  return (
    <section
      id="experience"
      className="scroll-mt-6 bg-white px-[clamp(20px,5vw,40px)] py-[70px]"
    >
      <div className="mx-auto flex max-w-[1120px] flex-col gap-11">
        <div className="flex flex-col gap-4">
          <Kicker>03 · Experience</Kicker>
          <h2 className="text-[clamp(34px,4.2vw,54px)] font-medium leading-[1.08] tracking-[-0.03em] text-ink">
            Where I've <SerifEm>been.</SerifEm>
          </h2>
        </div>

        <div className="flex flex-col border-t border-[rgba(20,23,28,0.10)]">
          {EXPERIENCE.map((e) => (
            <div
              key={e.company}
              className="grid items-baseline gap-2 border-b border-[rgba(20,23,28,0.08)] py-7 md:grid-cols-[minmax(140px,220px)_1fr] md:gap-6"
            >
              <span className="text-sm font-medium text-faint">{e.period}</span>
              <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-ink">
                  {e.role} · {e.company}
                </h3>
                <p className="max-w-[540px] text-[15px] leading-[1.65] text-slate">
                  {e.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ 04 · WRITING ============ */

function WritingSection({ posts }: { posts: Array<PostMeta> }) {
  return (
    <section
      id="writing"
      className="scroll-mt-6 bg-white px-[clamp(20px,5vw,40px)] pb-[120px] pt-[70px]"
    >
      <div className="mx-auto flex max-w-[1120px] flex-col gap-11">
        <div className="flex flex-col gap-4">
          <Kicker>04 · Writing</Kicker>
          <div className="flex flex-wrap items-end justify-between gap-[18px]">
            <h2 className="text-[clamp(34px,4.2vw,54px)] font-medium leading-[1.08] tracking-[-0.03em] text-ink">
              Notes from <SerifEm>the build.</SerifEm>
            </h2>
            <Link
              to="/blog"
              className="mb-1.5 inline-flex items-center gap-[7px] text-[15px] font-medium text-ink no-underline"
            >
              All posts{' '}
              <span className="text-teal" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col border-t border-[rgba(20,23,28,0.10)]">
          {posts.map((post) => (
            <PostRow key={post.slug} post={post} headingLevel="h3" />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ 05 · CONTACT ============ */

function ContactSection() {
  return (
    <section
      id="contact"
      className="relative scroll-mt-6 overflow-hidden bg-mist px-[clamp(20px,5vw,40px)] py-[140px]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_18%_70%,rgba(15,157,140,0.16),rgba(255,255,255,0)_70%),radial-gradient(ellipse_50%_60%_at_84%_25%,rgba(15,157,140,0.12),rgba(255,255,255,0)_70%)]" />
      <div className="flutes-wide pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,rgba(244,246,249,0.9)_0%,rgba(244,246,249,0.4)_55%,rgba(244,246,249,0)_100%)]" />

      <div className="relative mx-auto flex max-w-[760px] flex-col items-center text-center">
        <Kicker>05 · Contact</Kicker>
        <h2 className="mt-[18px] text-[clamp(38px,5.4vw,68px)] font-medium leading-[1.06] tracking-[-0.035em] text-ink">
          Have something in mind?
          <br />
          Let's <SerifEm>build it.</SerifEm>
        </h2>
        <p className="mt-6 max-w-[460px] text-[16.5px] leading-[1.65] text-slate">
          The fastest way to reach me is a quick email — or find me on GitHub
          and LinkedIn. I'm always up for talking shop.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
          <Button asChild variant="pill" size="pill" className="gap-2.5">
            <a href={`mailto:${SITE.email}`}>
              <Mail className="size-[18px]" aria-hidden />
              Email me
            </a>
          </Button>
          <Button
            asChild
            variant="glass-pill"
            size="pill"
            className="gap-2.5 hover:-translate-y-px"
          >
            <a href={SITE.github} target="_blank" rel="noreferrer">
              <GitHubIcon />
              GitHub
            </a>
          </Button>
          <Button
            asChild
            variant="glass-pill"
            size="pill"
            className="gap-2.5 hover:-translate-y-px"
          >
            {/* TODO: real LinkedIn URL in src/lib/site.ts */}
            <a href={SITE.linkedin} target="_blank" rel="noreferrer">
              <LinkedInIcon />
              LinkedIn
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
