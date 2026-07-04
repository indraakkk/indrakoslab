/**
 * Site-wide constants + structured content.
 *
 * Anything marked TODO is placeholder copy carried over from the design
 * handoff — swap in the real details before (or right after) cutover.
 */

export const SITE = {
  url: 'https://indr.web.id',
  name: 'indrakoslab',
  author: 'Indra Putra',
  title: 'Indra Putra — Fullstack Developer',
  description:
    'Fullstack developer with 5+ years of experience shipping web products end to end — from clean interfaces to the systems behind them.',
  email: 'indrakoslab@gmail.com',
  github: 'https://github.com/indraakkk',
  // TODO: replace with the real LinkedIn profile URL
  linkedin: 'https://www.linkedin.com',
  ogImage: '/og.png',
} as const

export interface Project {
  slug: string
  title: string
  featured?: boolean
  tags: Array<string>
  description: string
  href: string
  /** Optional screenshot under /public (e.g. '/projects/jobforge.png'). */
  image?: string
  imageAlt?: string
  /** Position of the teal gradation in the placeholder media area. */
  glowAt: string
}

// TODO: real one-liners, stacks, live/repo links, and screenshots in /public
export const PROJECTS: Array<Project> = [
  {
    slug: 'jobforge',
    title: 'JobForge',
    featured: true,
    tags: ['TanStack Start', 'Effect', 'Featured'],
    description:
      'Two or three lines on the problem this solved, your role in it, and the outcome — the numbers or the change it made for its users.',
    href: 'https://github.com/indraakkk',
    glowAt: '30% 65%',
  },
  {
    slug: 'taprunning',
    title: 'TapRunning',
    tags: ['React', 'TypeScript'],
    description: 'One or two lines on what it does and why it mattered.',
    href: 'https://github.com/indraakkk',
    glowAt: '70% 40%',
  },
  {
    slug: 'trailmark',
    title: 'Trailmark',
    tags: ['Next.js', 'PostgreSQL'],
    description: 'One or two lines on what it does and why it mattered.',
    href: 'https://github.com/indraakkk',
    glowAt: '30% 60%',
  },
  {
    slug: 'pathfinder',
    title: 'PathFinder',
    tags: ['TypeScript', 'Open Source'],
    description: 'One or two lines on what it does and why it mattered.',
    href: 'https://github.com/indraakkk',
    glowAt: '65% 55%',
  },
]

export const STACK: Array<{ label: string; items: Array<string> }> = [
  // TODO: correct anything that's off — pulled from the ADR positioning
  { label: 'Frontend', items: ['TypeScript', 'React', 'TanStack', 'Tailwind CSS'] },
  { label: 'Backend', items: ['Node.js', 'Effect', 'PostgreSQL', 'Cloudflare D1'] },
  { label: 'Infra & Tools', items: ['Cloudflare Workers', 'Docker', 'Git', 'Linux'] },
]

export interface ExperienceEntry {
  period: string
  role: string
  company: string
  summary: string
}

// TODO: real periods, titles, and one-liners for each role
export const EXPERIENCE: Array<ExperienceEntry> = [
  {
    period: '2023 — Now',
    role: 'Senior Fullstack Engineer',
    company: 'Arrow',
    summary:
      'One or two lines on what you own there — the product, the team, the impact.',
  },
  {
    period: '2022 — 2023',
    role: 'Fullstack Engineer',
    company: 'BetterOS',
    summary: 'What you built and shipped in this chapter.',
  },
  {
    period: '2020 — 2022',
    role: 'Fullstack Developer',
    company: 'Quark Spark',
    summary: 'What you built and shipped in this chapter.',
  },
  {
    period: '2019 — 2020',
    role: 'Software Engineer',
    company: 'ALBD',
    summary: 'The role that got you hooked on building for the web.',
  },
]
