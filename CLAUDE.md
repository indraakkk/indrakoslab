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
- **Hero canvas:** WebGL via three.js + React Three Fiber + drei.
  `src/components/hero-canvas.tsx` is the SSR-safe shell (static CSS fallback
  incl. masked `repeating-linear-gradient(80deg)` flute stripes + `ClientOnly`
  + `lazy`, so three never runs during prerender);
  `src/components/hero-scene.tsx` holds the R3F scene, built like the pmndrs
  lens-refraction demo: the design's procedural background (base gradient,
  slowly hue-animated teal gradation, seeded blade streaks) renders to an FBO
  each frame with the vivid content confined to a soft organic-disc mask, and
  a shaped fluted-glass accent (cos^k flute heightfield, analytic normals,
  stripe axis = 90°+`angle` ≡ 80deg; flute depth + RGBA vertex alpha melt
  away at the wobbled rim, longer at the bottom for the scroll hand-off;
  disc sized ry = `shapeScale`·vh with rx width-capped by `shapeMaxW` so
  portrait keeps margins + the melt near the hero bottom; rebuilds are
  vertex-budgeted and `useDeferredValue`-deferred) refracts that buffer
  through drei's `MeshTransmissionMaterial` (per-flute lensing, chromatic
  aberration, anisotropic frosting, locally-generated PMREM studio
  reflections — no network); the unrefracted buffer doubles as the calm page
  around the glass, and its bottom span blends to pure `#ffffff` (`pageFade`)
  for a seamless hand-off into the white section (the CSS fallback mirrors
  the mask + fade in svh/vw units). Cursor drives gradation parallax, blade
  brightening, glass tilt and a key-light sweep. Honors
  `prefers-reduced-motion` (static frame) and pauses off-screen via
  `frameloop='demand'`. Every knob lives in `HeroConfig` — floating tune
  panel (dev only) copies JSON to pin via `glassConfig`.
- **Blog:** `content/blog/*.md` is the CMS (git = CMS). `src/lib/content.ts`
  inlines them at build (`import.meta.glob`), parses frontmatter, renders with
  `marked` — server-only. `src/lib/blog.ts` wraps it in server functions so
  markdown never enters the client bundle. The blog is currently hidden
  site-wide via `SHOW_BLOG` in `src/lib/site.ts` (nav link, landing teaser,
  and hero/about CTAs gated; `/blog*` routes 404) — flip it to re-surface.
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

## Content status

Copy in `src/lib/site.ts`, `hero.tsx`, and `about.tsx` is sourced from Indra's
résumé (Senior Fullstack Engineer, Indonesia, 7+ years; real experience + stack;
projects JobForge / Pathfinder / Tiles by Tiles / Trailmark with live links).
Remaining `TODO`s: a real one-line description for Trailmark, project
screenshots in `/public` (cards fall back to a styled wordmark), and optional
`public/portrait.jpg` + `public/CV.pdf`. The 4 placeholder posts in
`content/blog/` are unused while the blog is hidden.

## Deploy / cutover

`bun run deploy` (build + `wrangler deploy`) ships the Worker; `wrangler` is in
the Nix devshell for ad-hoc commands. Custom domain (`indr.web.id`) is a
commented `routes` block in `wrangler.jsonc`; the full cutover runbook —
attaching the domain and 301-redirecting the old Vercel site — is in
`docs/DOMAIN-SETUP.md`. Phased status: `docs/EXECUTION-PLAN.md`.

## Advisor usage (Sonnet 5 executor / Fable 5 advisor)

Consult the advisor before committing to an approach on anything
touching more than one file, and once more before declaring a task
done. If the same failure recurs, stop and consult instead of trying
a third variation solo.

Treat its guidance as a senior review, not a rubber stamp — if a test
fails after following it, or file contents contradict a specific
claim, surface that and ask again rather than quietly picking a side.

## NO CO-AUTHOR

Repo should clean from co-author commit. I paying this service I no longer advertise⏎
