# indr.web.id

Personal site of **Indra Putra** (`indrakoslab_`) — TanStack Start on
Cloudflare Workers, implementing the hero + site design from a Claude Design
handoff.

Architecture and rationale: [ADR-001](docs/adr/ADR-001-cloudflare-workers-migration.md) ·
Status: [Execution Plan](docs/EXECUTION-PLAN.md)

## Stack

- **TanStack Start** (React SSR + file routes) — all routes **prerendered** at
  build; the Worker keeps SSR headroom for future dynamic routes
- **Cloudflare Workers** — `wrangler.jsonc`, `main = @tanstack/react-start/server-entry`
- **Tailwind CSS v4** + vendored **shadcn/ui** primitives (`src/components/ui/`)
- **marked** — markdown blog, build-time only
- Canvas glass hero — `src/components/hero-canvas.tsx`, ported from the design
  prototype

## Commands

```sh
bun install
bun run dev        # local dev with Workers emulation (port 3000)
bun run build      # vite build → prerender → sitemap
bun run preview    # build + serve the built Worker locally
bun run deploy     # build + wrangler deploy
```

## Writing a post

Git is the CMS: add `content/blog/my-post.md`, push, done.

```md
---
title: My post title
date: 2026-07-15
tag: Opinion
description: One or two lines used for the list, meta description, and OG.
---

Body in markdown. `> blockquotes` render as centered serif pull-quotes.
```

The filename becomes the slug (`/blog/my-post`). Reading time is computed.

## Content TODOs before cutover

All marked `TODO` in the source, concentrated in `src/lib/site.ts`:

- Real project one-liners, stacks, links + screenshots in `/public`
- Real experience periods/roles (Arrow, BetterOS, Quark Spark, ALBD)
- LinkedIn URL (currently a placeholder)
- Availability badge text / location in `src/components/hero.tsx`
- Replace the 4 placeholder posts in `content/blog/`
- Optional: `public/portrait.jpg` for the About page, `public/CV.pdf`

## Cutover runbook (Phase 4, needs your accounts)

1. `wrangler login` → `bun run deploy` → verify on `*.workers.dev`
2. Uncomment `routes` in `wrangler.jsonc` → deploy → `indr.web.id` live
3. Cloudflare dash: connect repo to **Workers Builds** (auto-deploy on push)
4. Vercel: 301 both old projects to `https://indr.web.id`
   (map old blog paths → `/blog/...`)
5. Search Console: verify `indr.web.id`, submit `https://indr.web.id/sitemap.xml`
6. Update CV / LinkedIn / GitHub profile links; delete Vercel projects after
   ~2 weeks of clean redirects
