# Custom domain + Vercel → Cloudflare cutover

How to point **`indr.web.id`** at this Worker and permanently redirect the old
Vercel site (`<your-old-vercel-url>`) to it.

- **Worker name:** `indr-web` (see `wrangler.jsonc`)
- **Target domain:** `indr.web.id` — DNS currently lives on **sumopod** (which
  also hosts your email). Step 2 moves the zone to Cloudflare **without touching
  email**; after that, attaching it to the Worker is one deploy.
- **Canonical host:** apex `https://indr.web.id`, no `www` (matches
  `SITE.url` in `src/lib/site.ts` and the sitemap host in `vite.config.ts`).

Companion to the Phase 4 checklist in [`EXECUTION-PLAN.md`](./EXECUTION-PLAN.md).

---

## 0. Prerequisites

- A Cloudflare account (the **Free** plan is enough). You'll move the
  `indr.web.id` zone onto it in step 2 — it's on sumopod DNS today.
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

## 2. Move `indr.web.id` DNS to Cloudflare (email-safe)

Workers custom domains require the zone to be **on Cloudflare** — you can't point
the apex at a Worker from sumopod DNS (the free/Pro plans have no
external-CNAME path; that's a Business/Enterprise feature).

Moving nameservers to Cloudflare changes *who serves your DNS records*, not
*where your email lives*. Cloudflare re-serves the same `MX`/SPF/DKIM/DMARC
records; your mailboxes stay on sumopod and mail keeps flowing. The one rule:
**copy every record faithfully before you flip nameservers, and keep all mail
records DNS-only (grey cloud).**

### Inventory the current sumopod records

Before touching anything, snapshot what sumopod serves — you'll diff against
Cloudflare's import. Read them from the sumopod DNS panel, or:

```sh
dig +short NS  indr.web.id                        # current NS (sumopod)
dig +short MX  indr.web.id                         # mail exchangers
dig +short A   indr.web.id                         # apex (sumopod hosting IP today)
dig +short TXT indr.web.id                         # SPF lives here (v=spf1 …)
dig +short TXT _dmarc.indr.web.id                  # DMARC
dig +short TXT default._domainkey.indr.web.id      # DKIM (selector varies!)
for h in www mail webmail smtp imap pop autodiscover autoconfig; do \
  printf '%s: %s\n' "$h" "$(dig +short $h.indr.web.id)"; done
```

Note everything that resolves — especially the mail hosts. DKIM selectors differ
per provider (`default`, `mail`, `x._domainkey`, …); check your sumopod / webmail
settings for the exact one so you can copy that `TXT` record.

### Add the zone to Cloudflare

Dash → **Add a site** → `indr.web.id` → **Free** plan. Cloudflare scans your live
DNS and pre-fills the records it finds.

### Verify the import — email first

Cloudflare's scan usually catches most records but **not always all of them**,
and once nameservers point at Cloudflare, anything missing simply stops
resolving. Go through **DNS → Records** and confirm each of these exists and
matches the inventory above:

| Record | Purpose | Proxy |
|---|---|---|
| `MX` (all) | inbound mail → sumopod | **DNS only (grey)** |
| `TXT` `v=spf1 …` (apex) | SPF sender auth | grey (TXT never proxies) |
| `TXT` `<selector>._domainkey` | DKIM | grey |
| `TXT` `_dmarc` | DMARC | grey |
| `A`/`CNAME` `mail`,`smtp`,`imap`,`pop`,`webmail` | mail + webmail hosts → sumopod | **DNS only (grey)** |
| `A`/`CNAME` `autodiscover`,`autoconfig` | mail client autoconfig | grey |

Add by hand anything the scan missed, copying the value **verbatim** from the
inventory.

> **The one gotcha that breaks mail:** every mail-related record must stay
> **grey-cloud (DNS only)**. Proxying (orange) an `MX` target or a `mail.` host
> shoves SMTP/IMAP through Cloudflare's HTTP proxy and mail dies. Only the apex
> and `www` — served by the Worker in step 3 — get the orange cloud.

> Your apex `A` record today points at sumopod's shared-hosting IP (often the
> same box as mail). Leave it for now; step 3 replaces the apex with the Worker.
> Just make sure `mail.` (and friends) have their **own** grey-cloud records to
> the sumopod IP so mail keeps resolving after the apex moves off it.

### Disable DNSSEC (if on), then switch nameservers

1. If DNSSEC is currently enabled at sumopod / your registrar, **turn it off
   first** — a stale `DS` record makes the whole domain fail to resolve after the
   nameserver change. You can re-enable it later from Cloudflare → **DNS →
   Settings → DNSSEC**.
2. At your `.web.id` registrar (sumopod's domain panel, or wherever the domain is
   registered), replace the nameservers with the **two Cloudflare nameservers**
   shown in the dash. You're changing DNS delegation only — **keep the sumopod
   hosting/email service itself active.**

Cloudflare emails you when the zone goes active (minutes to a few hours). Because
Cloudflare now serves byte-identical records, there's no cutover moment for mail
— it keeps flowing throughout.

### Confirm before moving on

```sh
dig +short NS  indr.web.id      # → *.ns.cloudflare.com
dig +short MX  indr.web.id      # → same sumopod hosts as the inventory
dig +short TXT indr.web.id      # → same SPF as the inventory
```

Send yourself a test email in and out. Once mail round-trips cleanly and `NS`
shows Cloudflare, continue.

---

## 3. Attach `indr.web.id` to the Worker

Uncomment the `routes` block in **`wrangler.jsonc`**:

```jsonc
"routes": [
  { "pattern": "indr.web.id", "custom_domain": true },
  // optional — serve www too, then 301 it to the apex in step 4:
  { "pattern": "www.indr.web.id", "custom_domain": true }
]
```

Then:

```sh
bun run deploy
```

`custom_domain: true` makes Cloudflare create the proxied (orange-cloud) DNS
record **and** issue the TLS certificate automatically. Give it 1–2 minutes,
then:

```sh
curl -sI https://indr.web.id/ | head    # expect: HTTP/2 200, server: cloudflare
```

> If `deploy` or the dash reports a record already exists on `indr.web.id`,
> delete the apex `A` record you imported from sumopod (the old hosting IP) —
> the Worker custom domain owns the apex now. Leave `mail.` and `www` untouched.

> Skip the `www` route entirely if you don't want `www` to resolve at all.
> Keeping it (plus the redirect in step 4) is friendlier to people who type it.

---

## 4. Redirect `www` → apex (only if you added the www route)

Dashboard → **Rules → Redirect Rules → Create rule**:

- **When incoming requests match:** `Hostname` `equals` `www.indr.web.id`
- **Then... URL redirect → Dynamic:**
  - Expression: `concat("https://indr.web.id", http.request.uri.path)`
  - **Preserve query string:** on
  - **Status:** `301`

---

## 5. Redirect the old Vercel site → `indr.web.id`

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
- After redeploy: `<your-old-vercel-url>/about` →
  `https://indr.web.id/about`, and so on for every path.

Verify:

```sh
curl -sI <your-old-vercel-url>/about | grep -i location
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
> weeks, then delete it (step 7).

---

## 6. SEO housekeeping

- **Search Console:** add `https://indr.web.id` as a property, verify (DNS
  `TXT` via Cloudflare is easiest), and submit
  `https://indr.web.id/sitemap.xml`.
- If the old Vercel domain was a verified property, use Search Console's
  **Change of Address** tool (old → new) to accelerate the migration.
- Canonicals and `og:url` already point at `indr.web.id`
  (`src/lib/seo.ts`) — no code change needed. `robots.txt` already advertises
  the `indr.web.id` sitemap.

---

## 7. Verify & finish

```sh
curl -sI https://indr.web.id/            | head          # 200, cloudflare
curl -sI <your-old-vercel-url>/ | grep -i location   # → indr.web.id
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
- **Back out of Cloudflare DNS entirely:** point the registrar's nameservers
  back at sumopod's. Since sumopod still has the original zone, mail and DNS
  return to exactly their pre-migration state once the NS change propagates.
