const STEPS = [
  {
    no: "I",
    title: "作答",
    en: "Answer",
    body: "一次只讀一題。沒有標準答案，選最像你的那個就好；單選題選了就會自動翻頁。",
  },
  {
    no: "II",
    title: "顯影",
    en: "Develop",
    body: "我們把你的每一個選擇換算成人格光譜，並告訴你是哪幾個回答讓結果成形。",
  },
  {
    no: "III",
    title: "收藏",
    en: "Keep",
    body: "每個人的封面圖騰都由作答生成，獨一無二。下載結果卡，或直接分享給朋友。",
  },
]

export function HomeSteps() {
  return (
    <section className="border-t border-ink/15 bg-paper-deep/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-12 md:py-20">
        <h2 className="md:col-span-3">
          <span className="block font-display text-sm italic text-ink-soft font-wonk">How to read</span>
          <span className="font-serif text-3xl font-black">閱讀方式</span>
        </h2>
        <ol className="grid gap-10 sm:grid-cols-3 md:col-span-9">
          {STEPS.map((step) => (
            <li key={step.no} className="grid content-start gap-3 border-t-2 border-ink pt-4">
              <span className="flex items-baseline justify-between">
                <span className="font-serif text-2xl font-black">{step.title}</span>
                <span className="font-display text-sm italic text-ink-soft font-wonk">
                  {step.no}. {step.en}
                </span>
              </span>
              <p className="leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
