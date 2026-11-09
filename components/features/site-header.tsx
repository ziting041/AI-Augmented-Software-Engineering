import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/15 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2" aria-label="心理測驗室 首頁">
          <span className="font-serif text-lg font-black tracking-wide">心理測驗室</span>
          <span className="hidden font-display text-sm italic text-ink-soft font-wonk transition-colors group-hover:text-coral sm:inline">
            The Somnambulist
          </span>
        </Link>
        <nav aria-label="主要導覽" className="flex items-center gap-1 text-sm">
          <Link
            href="/#contents"
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-ink hover:text-paper"
          >
            目錄
          </Link>
          <Link
            href="/admin"
            className="rounded-full px-3 py-1.5 text-ink-soft transition-colors hover:bg-ink hover:text-paper"
          >
            管理後台
          </Link>
        </nav>
      </div>
    </header>
  )
}
