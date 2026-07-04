// Post-build sitemap cleanup.
//
// TanStack Start's prerender crawler registers every discovered URL for the
// sitemap *before* applying `prerender.filter` (start-plugin-core
// prerender.js), so hash fragments (/#work) and trailing-slash duplicates
// (/blog/ next to /blog) leak into sitemap.xml. This strips fragments,
// normalizes trailing slashes (root excepted), and dedupes.
import { readFileSync, writeFileSync } from 'node:fs'

const path = 'dist/client/sitemap.xml'
const xml = readFileSync(path, 'utf8')

const blocks = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0])
const seen = new Set()
const kept = []

for (const block of blocks) {
  const m = /<loc>([^<]*)<\/loc>/.exec(block)
  if (!m) continue
  const loc = m[1]
  const url = new URL(loc)
  if (url.hash) continue
  let normalized = loc
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
    normalized = url.toString()
  }
  if (seen.has(normalized)) continue
  seen.add(normalized)
  kept.push(block.replace(loc, normalized))
}

// The generator emits an https sitemaps.org namespace; the protocol
// mandates the literal http URI, and validators compare it verbatim.
const header = xml
  .slice(0, xml.indexOf('<url>'))
  .replace(
    'https://www.sitemaps.org/schemas/sitemap/0.9',
    'http://www.sitemaps.org/schemas/sitemap/0.9',
  )
writeFileSync(path, header + kept.join('\n  ') + '\n</urlset>')
console.log(`[postbuild-sitemap] kept ${kept.length} of ${blocks.length} URLs`)
