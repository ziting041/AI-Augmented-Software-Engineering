"use client"

import { useState, type RefObject } from "react"
import { Download, Loader2, Share2 } from "lucide-react"

import { renderResultCard } from "@/lib/share/result-card"
import type { Quiz } from "@/lib/quiz/types"

type Status = { kind: "idle" } | { kind: "busy"; action: "download" | "share" } | { kind: "message"; text: string }

export function ResultActions({
  emblemRef,
  quiz,
  issue,
  name,
  tagline,
  spectrum,
}: {
  emblemRef: RefObject<SVGSVGElement | null>
  quiz: Quiz
  issue: string
  name: string
  tagline: string | null
  spectrum: { label: string; share: number; colorVar: string; highlight: boolean }[]
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" })

  async function makeCard(): Promise<File> {
    if (!emblemRef.current) throw new Error("圖騰尚未準備好")
    const blob = await renderResultCard({
      emblem: emblemRef.current,
      issue,
      quizTitle: quiz.title,
      name,
      tagline,
      spectrum,
      footer: window.location.host,
    })
    return new File([blob], `${quiz.title}-${name}.png`, { type: "image/png" })
  }

  async function download() {
    setStatus({ kind: "busy", action: "download" })
    try {
      const file = await makeCard()
      const url = URL.createObjectURL(file)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus({ kind: "message", text: "結果卡已下載" })
    } catch (error) {
      console.error(error)
      setStatus({ kind: "message", text: "下載失敗，請稍後再試" })
    }
  }

  async function share() {
    setStatus({ kind: "busy", action: "share" })
    const url = `${window.location.origin}/quiz/${quiz.id}`
    const text = `我在《${quiz.title}》測出「${name}${tagline ? `：${tagline}` : ""}」，你呢？`
    try {
      if (navigator.share) {
        const file = await makeCard().catch(() => null)
        const data: ShareData =
          file && navigator.canShare?.({ files: [file] })
            ? { title: quiz.title, text, url, files: [file] }
            : { title: quiz.title, text, url }
        await navigator.share(data)
        setStatus({ kind: "idle" })
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        setStatus({ kind: "message", text: "已複製分享文字與連結" })
      }
    } catch (error) {
      // 使用者取消分享不算錯誤
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus({ kind: "idle" })
      } else {
        setStatus({ kind: "message", text: "無法分享，請改用下載結果卡" })
      }
    }
  }

  const busy = status.kind === "busy"

  return (
    <div className="flex flex-col gap-2 md:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-paper transition-colors hover:bg-coral hover:text-ink disabled:opacity-60"
        >
          {busy && status.action === "download" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Download className="size-4" aria-hidden />
          )}
          下載結果卡
        </button>
        <button
          type="button"
          onClick={share}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
        >
          {busy && status.action === "share" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Share2 className="size-4" aria-hidden />
          )}
          分享結果
        </button>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-ink-soft">
        {status.kind === "message" ? status.text : ""}
      </p>
    </div>
  )
}
