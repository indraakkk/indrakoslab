/**
 * Site-wide constants + structured content.
 *
 * Content is sourced from Indra's résumé. A few live project URLs are still
 * marked TODO — drop them in and the cards link out.
 */

export const SITE = {
  url: 'https://indr.web.id',
  name: 'indrakoslab',
  author: 'Indra Putra',
  title: 'Indra Putra — Senior Fullstack Engineer',
  description:
    '7+ years building and shipping production web apps end to end — from clean interfaces to the service-layer TypeScript systems behind them.',
  email: 'indrakoslab@gmail.com',
  github: 'https://github.com/indraakkk',
  linkedin: 'https://www.linkedin.com/in/indra-putra',
  ogImage: '/og.png',
} as const

/**
 * Blog is hidden for now. Flip to `true` to re-surface the /blog routes, the
 * nav link, the landing writing teaser, and the hero/about blog CTAs — no
 * other change needed.
 */
export const SHOW_BLOG = false

export interface Project {
  slug: string
  title: string
  featured?: boolean
  tags: Array<string>
  description: string
  /** Live URL / repo. Omit to render the card without a "View project" link. */
  href?: string
  /** Optional screenshot under /public (e.g. '/projects/jobforge.png'). */
  image?: string
  imageAlt?: string
  /** Position of the teal gradation in the placeholder media area. */
  glowAt: string
}

export const PROJECTS: Array<Project> = [
  {
    slug: 'jobforge',
    title: 'JobForge',
    tags: ['TanStack Start', 'Effect', 'PostgreSQL'],
    description:
      'An AI job-application platform in full-stack TypeScript: a service-layer architecture with dependency-injected Effect modules, typed error handling and runtime validation, and a CV-to-JD gap analysis backed by an LLM. The same stack this site runs on.',
    href: 'https://github.com/indraakkk/jobforge',
    glowAt: '30% 65%',
  },
  {
    slug: 'pathfinder',
    title: 'Pathfinder',
    tags: ['React', 'Node.js', 'WebSocket'],
    description:
      'A real-time school platform I built end to end, solo — encrypted messaging over WebSockets, optimistic updates, and multi-role admin operations.',
    href: 'https://pathfinderedu.ca',
    glowAt: '65% 55%',
  },
  {
    slug: 'tiles-by-tiles',
    title: 'Tiles by Tiles',
    tags: ['React', 'Three.js', 'GraphQL'],
    description:
      'An interactive 3D product visualizer for an interior marketplace — React over a headless WordPress GraphQL API — that became the platform’s primary conversion driver.',
    href: 'https://tiles-by-tiles.tothemoondigital.workers.dev',
    glowAt: '30% 60%',
  },
  {
    slug: 'trailmark',
    title: 'Trailmark',
    featured: true,
    tags: ['TypeScript', 'Full-stack', 'Featured'],
    // TODO: replace with a real one-line description of Trailmark
    description:
      'A personal full-stack project — self-hosted and live. A proper write-up is on the way.',
    href: 'https://trailmark.duckdns.org',
    glowAt: '70% 40%',
  },
]

export const STACK: Array<{ label: string; items: Array<string> }> = [
  {
    label: 'Frontend',
    items: ['TypeScript', 'React', 'Next.js', 'Vue / Nuxt', 'Tailwind CSS'],
  },
  {
    label: 'Backend',
    items: ['Node.js', 'REST & GraphQL', 'WebSocket', 'PostgreSQL', 'Effect'],
  },
  {
    label: 'Architecture & Quality',
    items: ['SOLID', 'Zod', 'TS strict mode', 'Jest / Vitest', 'CI gates'],
  },
  {
    label: 'Infra & Tools',
    items: ['Docker', 'GCP', 'GitHub Actions', 'Cloudflare Workers', 'Linux'],
  },
]

export interface ExperienceEntry {
  period: string
  role: string
  company: string
  summary: string
}

export const EXPERIENCE: Array<ExperienceEntry> = [
  {
    period: 'Nov 2024 — Feb 2026',
    role: 'Senior Software Engineer',
    company: 'BetterOS',
    summary:
      'Built SaaS student-mobility platforms for international schools end to end — service-layer TypeScript, a shared React component library, and CI gates that held zero critical incidents while scaling to 130+ tenants.',
  },
  {
    period: 'Aug 2023 — Jan 2024',
    role: 'Software Developer',
    company: 'A Life By Design',
    summary:
      'Built the interactive 3D product visualizer that became a rug marketplace’s primary conversion driver, and stepped in as Scrum Master for the team.',
  },
  {
    period: 'Oct 2022 — Aug 2023',
    role: 'Software Developer',
    company: 'CPR Vision',
    summary:
      'Shipped 5+ high-traffic campaign sites with custom, pixel-perfect frontends — including an interactive game for Acuvue (J&J) — under tight launch deadlines.',
  },
  {
    period: 'Jan 2022 — Sep 2022',
    role: 'Backend Developer',
    company: 'Arrow',
    summary:
      'Wrote a reusable Shopify Storefront GraphQL library in Node.js that cut merchant integration time by ~40%.',
  },
  {
    period: 'May 2019 — Jan 2022',
    role: 'Full Stack Developer',
    company: 'Quark Spark',
    summary:
      'Led a 4-person team building the Theseafoodxchange B2B marketplace from zero to production, owning architecture, API design, and UI.',
  },
  {
    period: 'Oct 2018 — May 2019',
    role: 'Full Stack Developer',
    company: 'Re:Work AI',
    summary:
      'Built production React frontends for conversational-AI interfaces with WebSocket response streaming — spec to demo in under a week per client.',
  },
]
