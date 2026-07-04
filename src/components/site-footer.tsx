import { SITE } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(20,23,28,0.08)] bg-white px-[clamp(20px,5vw,40px)] py-[30px]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3.5">
        <span className="text-[13.5px] text-faint">
          © {__BUILD_YEAR__} {SITE.author}
        </span>
        <span className="text-sm font-semibold tracking-[-0.01em] text-ink">
          indrakoslab<span className="text-faint">_</span>
        </span>
        <span className="text-[13.5px] text-faint">Made with care from SUB</span>
      </div>
    </footer>
  )
}
