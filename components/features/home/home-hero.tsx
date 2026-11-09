import { ArrowDown } from "lucide-react"

import { buildEmblem } from "@/lib/quiz/emblem"
import { PersonaEmblem } from "../persona-emblem"

// 封面人物：固定種子，讓首頁每次看到的都是同一位「還沒揭曉的你」
const coverEmblem = buildEmblem({
  seed: "cover-vol-01",
  shares: [0.34, 0.22, 0.27, 0.17, 0.25],
  highlight: 0,
})

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-ink/15">
      {/* 背景大圓：夢的月亮 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 size-[38rem] rounded-full bg-haze/35 blur-3xl md:-right-20"
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pt-8 pb-14 sm:px-6 md:grid-cols-12 md:gap-6 md:pt-12 md:pb-20">
        {/* 刊頭資訊列 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-ink/80 py-2 text-xs tracking-[0.18em] uppercase md:col-span-12">
          <span className="font-display italic tracking-normal normal-case font-wonk text-sm">Vol. 01</span>
          <span aria-hidden className="h-3 w-px bg-ink/40" />
          <span>2026 冬季號</span>
          <span aria-hidden className="hidden h-3 w-px bg-ink/40 sm:block" />
          <span className="hidden sm:inline">本期主題：在夢裡認識自己</span>
          <span className="ml-auto font-display italic tracking-normal normal-case font-wonk text-sm">
            a magazine about you
          </span>
        </div>

        <div className="stagger flex flex-col gap-7 md:col-span-7 md:pt-6">
          <p className="font-display text-lg italic text-ink-soft font-wonk">
            — 致今晚翻開這本雜誌的你
          </p>
          <h1 className="font-serif text-[clamp(2.9rem,9vw,6.4rem)] leading-[1.02] font-black tracking-tight text-balance-cjk">
            今晚，
            <br />
            讀一篇關於
            <span className="relative mx-1 inline-block">
              <span className="relative z-10">你</span>
              {/* 手繪圈 */}
              <svg
                aria-hidden
                viewBox="0 0 120 100"
                className="absolute -inset-x-[38%] -inset-y-[22%] z-0 h-[144%] w-[176%] text-coral"
                preserveAspectRatio="none"
              >
                <path
                  d="M62 8 C 22 6, 6 34, 12 60 C 20 92, 92 96, 110 62 C 124 34, 96 6, 52 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1"
                  style={{ animation: "draw 1.4s var(--ease-dream) 0.6s both" }}
                />
              </svg>
            </span>
            的報導。
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-ink-soft">
            回答幾個生活裡的小問題，我們會把你的選擇排版成一期專屬人格特刊——附上可以下載、分享的封面。
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#contents"
              className="group inline-flex items-center gap-3 rounded-full bg-ink py-3 pr-3 pl-6 text-paper transition-colors hover:bg-coral hover:text-ink"
            >
              翻開本期目錄
              <span className="grid size-8 place-items-center rounded-full bg-paper text-ink transition-transform duration-500 ease-[var(--ease-dream)] group-hover:translate-y-0.5">
                <ArrowDown className="size-4" aria-hidden />
              </span>
            </a>
            <p className="text-sm text-ink-soft">
              約 3 分鐘 · 不需註冊 · 匿名作答
            </p>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-md md:col-span-5 md:max-w-none md:self-center">
          <div className="animate-float">
            <PersonaEmblem emblem={coverEmblem} className="w-full" />
          </div>
          <figcaption className="mt-2 flex items-baseline justify-between gap-4 border-t border-ink/30 pt-2 text-xs text-ink-soft">
            <span className="font-display italic font-wonk">fig. 01</span>
            <span>封面人物：還沒揭曉的你</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
