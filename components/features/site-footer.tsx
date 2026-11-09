export function SiteFooter() {
  return (
    <footer className="border-t border-ink/15">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10 text-sm text-ink-soft sm:grid-cols-[1fr_auto] sm:px-6">
        <div className="grid gap-1">
          <p>
            <span className="font-serif font-black text-ink">心理測驗室</span>
            <span className="mx-2 font-display italic font-wonk">The Somnambulist</span>
          </p>
          <p className="max-w-xl leading-relaxed">
            每份結果僅供娛樂與自我探索參考，不構成任何心理診斷。作答以匿名方式統計，不會記錄你的身分。
          </p>
        </div>
        <p className="font-display italic font-wonk sm:self-end">Printed on dreams · 2026</p>
      </div>
    </footer>
  )
}
