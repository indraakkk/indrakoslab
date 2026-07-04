import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'

import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { SerifEm } from '@/components/type'
import { Button } from '@/components/ui/button'
import { SITE } from '@/lib/site'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#f4f6f9' },
      // Fallbacks — every real route overrides these via seo()
      { title: SITE.title },
      { name: 'description', content: SITE.description },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteNav variant="solid" />
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-mist px-6 py-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_65%_at_70%_35%,rgba(15,157,140,0.13),rgba(255,255,255,0)_70%)]" />
        <div className="flutes-wide pointer-events-none absolute inset-0" />
        <div className="relative flex flex-col items-center">
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            404
          </span>
          <h1 className="mt-[18px] text-[clamp(38px,5.4vw,68px)] font-medium leading-[1.06] tracking-[-0.035em] text-ink">
            This page drifted <SerifEm>off the glass.</SerifEm>
          </h1>
          <p className="mt-6 max-w-[460px] text-[16.5px] leading-[1.65] text-slate">
            The link may be old, or the page may have moved. Head back home and
            take it from the top.
          </p>
          <Button asChild variant="pill" size="pill" className="mt-10 gap-[9px]">
            <Link to="/">
              Back home <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
