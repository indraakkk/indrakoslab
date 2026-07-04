# Execution Plan: indr.web.id Migration

> Companion to ADR-001. Work top to bottom — each phase gates the next.
> Estimated total: ~5 working days to cutover.

---

## Phase 0 — Scaffold (½ day)

- [x] `bun create cloudflare -- indr-web --framework=tanstack-start`
- [x] Trim template to dependency budget:
      runtime → `react`, `react-dom`, `@tanstack/react-start`, `marked`, `tailwindcss`
      dev → `vite`, `@cloudflare/vite-plugin`, `wrangler`, `typescript`
- [x] Add Tailwind v4 vite plugin, remove any template extras
- [x] shadcn/ui — Tailwind v4 mode, theme tokens in CSS vars,
      components land in `src/components/ui/` (vendored, owned in-repo)
- [x] `bun run dev` works locally (Workers emulation via vite plugin)
- [ ] `bun run deploy` → SSR hello-world live on `*.workers.dev`
      _(needs your Cloudflare account — `wrangler login` then `bun run deploy`)_
- [x] Init git, push to GitHub, commit ADR-001 into `docs/adr/`

**Gate:** SSR page live on workers.dev.

---

## Phase 1 — Core UI Revamp (2–3 days) — do first, highest job-hunt ROI

- [x] `__root.tsx`: layout shell, nav, footer, global meta defaults, favicon
- [x] Hero (100vh): name, positioning line, location + availability,
      CTAs, interactive glass-canvas motion (from the Claude Design handoff;
      honors `prefers-reduced-motion`)
- [x] shadcn `button`, `card`, `badge` vendored (add more only as needed)
- [x] Projects grid: JobForge, TapRunning, Trailmark, PathFinder —
      shadcn `card` base, styled placeholder media (drop screenshots into
      `/public` and set `image` in `src/lib/site.ts`), stack chips via
      `badge`, one-line outcome, links
- [x] Customize shadcn theme tokens (CSS vars) — design-handoff palette
      (ink/mist/teal, Geist + Instrument Serif), not default-shadcn
- [x] Experience strip: Arrow, BetterOS, Quark Spark, ALBD — 10-second scannable
      _(periods/roles are placeholders — update `src/lib/site.ts`)_
- [x] Contact/footer: email, GitHub, LinkedIn
      _(LinkedIn URL is a placeholder; CV.pdf not yet in `/public`)_
- [x] Mobile-first responsive pass (incl. mobile menu)

**Gate:** Lighthouse ≥ 95 (performance / SEO / a11y) on landing page.
_Run locally (`npx lighthouse`) — the remote build sandbox blocks Lighthouse's
Chrome; fundamentals are in place (prerendered HTML, semantic landmarks,
AA-contrast tokens, complete meta, minimal JS)._

---

## Phase 2 — Blog Pipeline (1–2 days)

- [x] `lib/content.ts`: `import.meta.glob` over `content/blog/*.md`,
      frontmatter parse, `marked` render — build time only
- [x] `/blog` index route: post cards sorted by date
- [x] `/blog/$slug` route: rendered post + per-post head
      (title, description, OG image, canonical)
- [x] Enable prerender for all routes in Start config
- [ ] Migrate existing posts from Vercel blog into `content/blog/`
      _(4 clearly-marked placeholder posts in place — swap in real writing)_
- [x] Landing page blog teaser (latest 3 posts)

**Gate:** view-source on a post shows full HTML; OG preview renders correctly.

---

## Phase 3 — SEO Hardening (½ day)

- [x] Build-time `sitemap.xml` (framework-native) + `robots.txt`
      (+ `scripts/postbuild-sitemap.mjs` cleanup, no new dep)
- [x] Canonical URL + `og:*` + `twitter:card` on every route
- [x] JSON-LD: `Person` on landing, `BlogPosting` per post
- [x] Custom 404 page
- [x] Default OG image (`public/og.png`, design-handoff visual language)

**Gate:** pages pass structured-data / Rich Results validation.

---

## Phase 4 — Cutover (½ day) — needs your Cloudflare/Vercel accounts

- [ ] Attach `indr.web.id` custom domain to the Worker
      (uncomment `routes` in `wrangler.jsonc`, deploy)
- [ ] Connect repo to Workers Builds → auto-deploy on push to main
- [ ] Vercel: 301 both old projects → `https://indr.web.id`,
      map old blog subdomain paths → `/blog/...`
- [ ] Search Console: verify domain property, submit sitemap
- [ ] Update CV, LinkedIn, GitHub links to `indr.web.id`
- [ ] T+2 weeks: confirm redirects propagated, delete Vercel projects

**Gate:** old URLs 301 correctly; Search Console indexing pages.

---

## Phase 5 — Post-Launch (ongoing)

- [ ] Write posts (each = SEO surface + seniority signal)
- [ ] Watch Search Console for crawl issues
- [ ] Deferred capabilities — add only on trigger (ADR-001 §6):
      - `effect` → first real server function (e.g., contact form)
      - D1 + `@effect/sql-d1` → first persistence need (view counts)
      - R2 → runtime uploads / large assets
      - MDX / shiki → richer post content
