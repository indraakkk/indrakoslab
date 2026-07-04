# CLAUDE.md

Guidance for Claude Code (and humans) working in this repo.

> **Branch context:** this is `claude/cloudflare-workers-rebuild` — a from-scratch
> rebuild of indrakoslab, separate from `master`. `master` is the existing
> TanStack Start site on **Vercel**; this branch targets **Cloudflare Workers**
> and has an unrelated git history. Do not merge/force-push onto `master`
> without an explicit decision. See `docs/adr/ADR-001-cloudflare-workers-migration.md`.

## What this is

Personal site of Indra Putra (`indrakoslab_`), implementing a Claude Design
handoff. TanStack Start (React SSR + file routes), all routes prerendered at
build, deployed as one Cloudflare Worker.

## Toolchain

Needs Node ≥ 22.15 (`@cloudflare/vite-plugin` → `node:module.registerHooks`) +
bun. `flake.nix` pins both — `nix develop` (or `direnv allow` via `.envrc`).
System Node 20 and bun's runtime both lack `registerHooks` and will fail the build.

## Commands

```sh
bun install
bun run dev        # dev server on :3000 (Workers emulation via vite plugin)
bun run build      # vite build → prerender all routes → sitemap cleanup
bun run preview    # build + serve the built Worker locally
bun run deploy     # build + wrangler deploy
bunx tsc --noEmit  # typecheck
```

Note: `bun run dev`/`build` print a benign `Request.cf ... Host not i... is not
valid JSON` warning in sandboxed/proxied environments — miniflare failing to
fetch CF geo-metadata. Harmless; ignore.

## Architecture

- **Routing:** file-based in `src/routes/` (`__root.tsx` shell + 404,
  `index.tsx` landing, `about.tsx`, `blog.index.tsx`, `blog.$slug.tsx`).
  `src/routeTree.gen.ts` is generated — do not edit.
- **Rendering:** `vite.config.ts` enables prerender for every route (SSG-grade
  SEO) while the Worker keeps SSR headroom for future dynamic routes.
- **Hero canvas:** `src/components/hero-canvas.tsx` is a faithful port of the
  design prototype's `<canvas>` engine. Diagonal glass blades + cursor-driven
  refraction of a centered teal gradation. Honors `prefers-reduced-motion`.
  Keep the port's math in sync with the prototype if you touch it.
- **Blog:** `content/blog/*.md` is the CMS (git = CMS). `src/lib/content.ts`
  inlines them at build (`import.meta.glob`), parses frontmatter, renders with
  `marked` — server-only. `src/lib/blog.ts` wraps it in server functions so
  markdown never enters the client bundle.
- **SEO:** `src/lib/seo.ts` — per-route canonical/OG/Twitter + JSON-LD helpers.
  `scripts/postbuild-sitemap.mjs` cleans the generated sitemap.
- **UI kit:** Tailwind v4 (tokens in `src/styles.css`) + vendored shadcn/ui in
  `src/components/ui/` (button/card/badge, with design `pill`/`chip`/`glass-pill`
  variants). `cn()` in `src/lib/utils.ts`.

## Conventions

- Design tokens live as CSS vars in `src/styles.css` (`--ink`, `--mist`,
  `--teal`, `--faint`, etc.) surfaced to Tailwind via `@theme inline`. Prefer
  these over raw hexes.
- Fonts: Geist (sans) + Instrument Serif (italic accents via `<SerifEm>`).
- Path alias `@/*` → `src/*`.

## Placeholder content (all marked `TODO`, mostly in `src/lib/site.ts`)

Real project blurbs/links/screenshots, experience periods/roles, LinkedIn URL,
location copy, and the 4 placeholder posts in `content/blog/` all need real
data before cutover. `public/portrait.jpg` and `public/CV.pdf` are not yet added.

## Deploy / cutover

Phase 4 needs a Cloudflare account — see `README.md` runbook and
`docs/EXECUTION-PLAN.md`. Custom domain (`indr.web.id`) is a commented `routes`
block in `wrangler.jsonc`.
