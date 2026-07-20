# indr.web.id

Personal site of **Indra Putra** (`indr_`) — TanStack Start on
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

## Toolchain

Needs **Node ≥ 22.15** (`@cloudflare/vite-plugin` uses `node:module.registerHooks`)
and **bun**. A Nix flake pins both:

```sh
nix develop            # drops you into a shell with node 22 + bun + wrangler
# or, with direnv: `direnv allow` once, then it auto-loads on cd
```

No Nix? Use any Node 22+ (`nvm install 22` / `brew install node@22`) plus bun.

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

## Content status

Copy is sourced from the résumé (title, location, experience, stack, and the
JobForge / Pathfinder / Tiles by Tiles / Trailmark project cards with live
links). Still open:

- A real one-line description for **Trailmark** (`src/lib/site.ts`)
- Project screenshots in `/public` (cards fall back to a styled wordmark)
- Optional `public/portrait.jpg` (About) and `public/CV.pdf`
- The blog is **hidden** (`SHOW_BLOG` in `src/lib/site.ts`); the 4 placeholder
  posts in `content/blog/` are unused until it's re-enabled

## Cutover runbook (needs your Cloudflare/Vercel accounts)

Attaching `indr.web.id` and redirecting the old Vercel site off it →
**[docs/DOMAIN-SETUP.md](docs/DOMAIN-SETUP.md)**. Phased status:
[docs/EXECUTION-PLAN.md](docs/EXECUTION-PLAN.md).
