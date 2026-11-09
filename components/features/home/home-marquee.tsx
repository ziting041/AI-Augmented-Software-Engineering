const ITEMS = [
  "不是占卜，是一面鏡子",
  "一次只讀一題",
  "匿名作答",
  "三分鐘讀完自己",
  "每個人的封面都不一樣",
  "結果可以下載分享",
]

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-6 font-serif text-lg font-bold whitespace-nowrap sm:text-xl">{item}</span>
          <span className="text-citron">✦</span>
        </span>
      ))}
    </div>
  )
}

/** 純裝飾的跑馬燈；內容另以 sr-only 提供 */
export function HomeMarquee() {
  return (
    <section className="overflow-hidden border-b border-ink bg-ink py-4 text-paper">
      <p className="sr-only">{ITEMS.join("、")}</p>
      <div aria-hidden className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        <Row />
        <Row />
      </div>
    </section>
  )
}
