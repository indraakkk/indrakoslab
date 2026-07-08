# Custom domain + Vercel → Cloudflare cutover

How to point **`indr.web.id`** at this Worker and permanently redirect the old
Vercel site (`https://indrakoslab.vercel.app`) to it.

- **Worker name:** `indr-web` (see `wrangler.jsonc`)
- **Target domain:** `indr.web.id` — its DNS zone is already on Cloudflare
  (ADR-001), so attaching it is one deploy.
- **Canonical host:** apex `https://indr.web.id`, no `www` (matches
  `SITE.url` in `src/lib/site.ts` and the sitemap host in `vite.config.ts`).

Companion to the Phase 4 checklist in [`EXECUTION-PLAN.md`](./EXECUTION-PLAN.md).

---

## 0. Prerequisites

- The `indr.web.id` zone is active on your Cloudflare account
  (dash → **Websites** → it's listed, nameservers pointing at Cloudflare).
- You're logged in to Wrangler: `wrangler whoami` shows your account.
  (In this repo the CLI is on `PATH` via the Nix devshell, and `bun run deploy`
  uses the repo-pinned wrangler from `node_modules`.)
- The site deploys: `bun run deploy` succeeds.

---

## 1. Baseline deploy to `*.workers.dev`

```sh
bun run deploy
```

Gives `https://indr-web.<your-subdomain>.workers.dev`. Open it and confirm the
site renders before touching DNS. (If `workers.dev` isn't enabled yet, the
Cloudflare dash will prompt you to pick a subdomain once.)

---

## 2. Attach `indr.web.id` to the Worker

Uncomment the `routes` block in **`wrangler.jsonc`**:

```jsonc
"routes": [
  { "pattern": "indr.web.id", "custom_domain": true },
  // optional — serve www too, then 301 it to the apex in step 3:
  { "pattern": "www.indr.web.id", "custom_domain": true }
]
```

Then:

```sh
bun run deploy
```

`custom_domain: true` makes Cloudflare create the proxied DNS record **and**
issue the TLS certificate automatically. Give it 1–2 minutes, then:

```sh
curl -sI https://indr.web.id/ | head    # expect: HTTP/2 200, server: cloudflare
```

> Skip the `www` route entirely if you don't want `www` to resolve at all.
> Keeping it (plus the redirect in step 3) is friendlier to people who type it.

---

## 3. Redirect `www` → apex (only if you added the www route)

Dashboard → **Rules → Redirect Rules → Create rule**:

- **When incoming requests match:** `Hostname` `equals` `www.indr.web.id`
- **Then... URL redirect → Dynamic:**
  - Expression: `concat("https://indr.web.id", http.request.uri.path)`
  - **Preserve query string:** on
  - **Status:** `301`

---

## 4. Redirect the old Vercel site → `indr.web.id`

Goal: every old URL 301s to the same path on the new domain, and keeps doing so
even after you stop maintaining the Vercel app. The robust way is to make the
Vercel project **serve nothing but redirects**.

### Recommended — `vercel.json` in the old project

Add this file to the old Vercel project (replacing its app is fine) and redeploy:

```json
{
  "redirects": [
    { "source": "/:path*", "destination": "https://indr.web.id/:path*", "permanent": true }
  ]
}
```

- `permanent: true` emits a **308** (permanent; Google honors it like a 301 and
  preserves the path). Query strings carry over automatically.
- After redeploy: `https://indrakoslab.vercel.app/about` →
  `https://indr.web.id/about`, and so on for every path.

Verify:

```sh
curl -sI https://indrakoslab.vercel.app/about | grep -i location
# location: https://indr.web.id/about
```

### If the blog lived on a separate Vercel project/subdomain

Add the same `vercel.json` there. **But note the blog is currently hidden**
(`SHOW_BLOG = false` in `src/lib/site.ts`), so `indr.web.id/blog/*` returns 404
until you re-enable it. Pick one:

- **Re-enable the blog first** (flip `SHOW_BLOG` to `true`, redeploy), then map
  old post URLs to the new structure, e.g.
  `{ "source": "/posts/:slug", "destination": "https://indr.web.id/blog/:slug", "permanent": true }`.
- **Or hold**, and temporarily send old blog URLs to the homepage with a
  *non*-permanent redirect so you can switch it to permanent later:
  `{ "source": "/:path*", "destination": "https://indr.web.id/", "permanent": false }`.

> You can't 301 the bare `*.vercel.app` host from the dashboard without the
> project itself serving the redirect — which is exactly what `vercel.json`
> above does. Keep the Vercel project alive as a pure redirector for a few
> weeks, then delete it (step 6).

---

## 5. SEO housekeeping

- **Search Console:** add `https://indr.web.id` as a property, verify (DNS
  `TXT` via Cloudflare is easiest), and submit
  `https://indr.web.id/sitemap.xml`.
- If the old Vercel domain was a verified property, use Search Console's
  **Change of Address** tool (old → new) to accelerate the migration.
- Canonicals and `og:url` already point at `indr.web.id`
  (`src/lib/seo.ts`) — no code change needed. `robots.txt` already advertises
  the `indr.web.id` sitemap.

---

## 6. Verify & finish

```sh
curl -sI https://indr.web.id/            | head          # 200, cloudflare
curl -sI https://indrakoslab.vercel.app/ | grep -i location   # → indr.web.id
```

- Spot-check a deep link (`/about`) end to end.
- After ~2 weeks of clean redirects and Search Console showing the new URLs
  indexed, delete the Vercel project(s).

---

## Rollback

- **Detach the domain:** re-comment the `routes` block and `bun run deploy`
  (the site stays live on `*.workers.dev`), or remove it under
  Workers → `indr-web` → **Settings → Domains & Routes**.
- **Undo the Vercel redirect:** revert `vercel.json` and redeploy.
