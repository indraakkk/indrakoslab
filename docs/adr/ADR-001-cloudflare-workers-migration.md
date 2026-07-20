# ADR-001: Migrate Profile Website from Vercel to Cloudflare Workers

- **Status:** Accepted
- **Date:** 2026-07-02
- **Owner:** Indra
- **Domain:** `indr.web.id` (DNS already on Cloudflare)
- **Replaces:** the previous Vercel-hosted site + blog subdomain project on Vercel

---

## 1. Context

The current profile website is a static site on Vercel, with the blog as a separate
Vercel project on a subdomain. Goals for the new site:

1. **SEO must be fully solved** — real server-rendered HTML, no hacky workarounds.
   The architecture must scale to future dynamic routes without rework.
2. **Single domain, path-based routing** — `indr.web.id/blog`, `/about`, etc.
   No subdomains.
3. **Blog posting mechanic** — markdown files in the repo. Git is the CMS.
4. **UI revamp targeting hiring managers / HR** — 100vh hero, project cards,
   scannable experience, blog as seniority signal.
5. **Zero hosting cost** — Cloudflare free tier (Workers + static assets;
   D1/R2 reserved for later).
6. **No bloat** — minimal dependency count; capabilities are added when a real
   need appears, not preemptively.

## 2. Decision

**One Cloudflare Worker, one repo, TanStack Start.**

| Concern | Decision |
|---|---|
| Framework | TanStack Start (TanStack Router + SSR), officially supported on Cloudflare Workers |
| Rendering | Build-time **prerender** for all current routes (hero, about, blog index, posts) → static HTML at the edge. SSR capability stays available for future dynamic routes with zero architectural change |
| Blog content | `content/blog/*.md` in repo, frontmatter for metadata, parsed with `marked` at build |
| Styling / UI | Tailwind CSS v4 (vite plugin, zero runtime JS) + shadcn/ui — components copied into `src/components/ui/`, owned in-repo, not a package dependency |
| Backend logic | None day one. Effect + server functions added at first real server feature |
| Database | **Deferred.** D1 + `@effect/sql-d1` added when view counts/reactions/etc. become real |
| Object storage | **Deferred.** Images live in `/public` as static assets. R2 added only for runtime uploads or large files |
| Deploy | `wrangler deploy` locally; Workers Builds (GitHub integration) for CI on push |
| Domain | `indr.web.id` attached as Worker custom domain; Vercel projects 301 → new domain, then deleted |

### Dependency budget (day one)

- Runtime: `react`, `react-dom`, `@tanstack/react-start`, `marked`, `tailwindcss`
- shadcn/ui support: `class-variance-authority`, `clsx`, `tailwind-merge`,
  `lucide-react`, plus per-component `@radix-ui/*` primitives — installed only
  for components actually added via `bunx shadcn add`
- Dev: `vite`, `@cloudflare/vite-plugin`, `wrangler`, `typescript`

shadcn/ui stays lean by design: components are vendored source in
`src/components/ui/`, so only the Radix primitives of components you actually
use enter the bundle. Rule: add components one at a time as needed
(`button`, `card`, `badge` cover Phase 1) — never bulk-install the catalog.
Anything beyond this list requires a justified need (see §6 Deferred Capabilities).

## 3. Rationale

- **SEO:** Prerendered routes give crawlers complete HTML instantly (SSG-grade),
  while the framework remains a true SSR framework — no migration needed when
  dynamic routes arrive. Per-route head management handles title/meta/OG tags.
- **Not bloated:** ~6 runtime deps, smaller than a typical Next.js starter.
  Every deferred capability (D1, R2, Effect) is a config/socket addition later,
  not a rewrite.
- **Cost:** Static assets on Workers are free with unlimited requests. Prerendered
  pages mean the Worker itself is rarely invoked — usage is a rounding error on
  the 100k req/day free tier.
- **Stack identity:** TanStack Start is the same stack as JobForge — familiar,
  and the site itself becomes an interview talking point ("SSR on Cloudflare
  Workers, md-driven prerendered blog").
- **Posting flow:** write `content/blog/my-post.md` → `git push` → auto-deploy.
  No admin panel to build or secure.

## 4. Alternatives Considered

| Alternative | Rejected because |
|---|---|
| SPA (TanStack Router only) + Effect HttpApi Worker | SEO for blog requires prerender bolt-ons / HTMLRewriter meta injection — hacky, doesn't scale cleanly |
| Astro | Best-in-class for content sites, but breaks stack consistency (not a portfolio talking point for his React/TanStack/Effect positioning) |
| Next.js on Workers (OpenNext) | Heavier deps, adapter indirection, no stack alignment |
| Keep Vercel | Two projects, subdomain blog, no bindings path to D1/R2, domain not on the platform where DNS lives |
| D1-backed blog + admin UI | More moving parts, auth surface, and deps for zero benefit over md-in-repo at this scale |

## 5. Architecture

```
indr-web/  (single repo, single Worker)
├── wrangler.jsonc            # main = @tanstack/react-start/server-entry, nodejs_compat
├── vite.config.ts            # cloudflare() + tanstackStart() + react()
├── content/
│   └── blog/
│       └── *.md              # frontmatter: title, date, description, tags, ogImage
├── public/                   # CV.pdf, project screenshots, OG images (static assets)
└── src/
    ├── routes/
    │   ├── __root.tsx        # shell, global head, nav, footer
    │   ├── index.tsx         # landing: hero + projects + experience + blog teaser + contact
    │   ├── about.tsx
    │   └── blog/
    │       ├── index.tsx     # post list from content/blog via import.meta.glob
    │       └── $slug.tsx     # post page, md → html at build, prerendered
    ├── components/           # Hero, ProjectCard, ExperienceItem, PostCard...
    └── lib/
        └── content.ts        # frontmatter parse + marked render (build-time)
```

**Routing behavior:** all current routes prerender to static HTML at build.
Cloudflare serves matching static assets first (free, cached at edge); the Worker
script only runs for routes that aren't prerendered — today, effectively none.

**Future sockets (not built now):**

- `d1_databases` binding + `@effect/sql-d1` → view counts, reactions, guestbook
- `r2_buckets` binding → runtime uploads / large assets
- `effect` + server functions with a module-scope ManagedRuntime → first real
  server feature (e.g., contact form)

## 6. Deferred Capabilities — Trigger Conditions

| Capability | Add when | Cost to add |
|---|---|---|
| `effect` core | First server function with real logic/error handling | 1 dep, tree-shakeable |
| D1 + `@effect/sql-d1` | First persistent data need (view counter, reactions) | 5-line wrangler config + 1 migration |
| R2 | Runtime file uploads or assets too large/dynamic for `/public` | 3-line wrangler config |
| MDX / shiki | Posts need embedded components / better code highlighting | swap in `lib/content.ts` only |

## 7. Execution Plan

See [EXECUTION-PLAN.md](../EXECUTION-PLAN.md) for the phased checklist and
current status.

## 8. Consequences

**Positive**

- SSG-grade SEO with an SSR framework's headroom; no future rework
- Free hosting with effectively zero Worker invocations at current scale
- One repo, one deploy, one domain; posting = git push
- Portfolio site doubles as an architecture talking point in interviews

**Negative / accepted trade-offs**

- Prerender happens at build → publishing a post requires a deploy (acceptable:
  push-to-deploy is the desired mechanic)
- TanStack Start is newer than Next.js — smaller ecosystem, occasional API churn
  (mitigated: officially supported by Cloudflare, same stack as JobForge)
- No admin UI for posts (by design)

## 9. Rollback

Vercel projects remain live until Phase 4 step 6. Rollback = point DNS back /
remove redirects. After deletion, the site is a static-friendly repo deployable
anywhere (Vercel, Netlify, VPS + Caddy) within an hour.
