"use client"

import { useState, type RefObject } from "react"
import { Download, Loader2, Share2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import type { Answers } from "@/lib/quiz/types"
import { renderResultCard } from "@/lib/share/result-card"
import { createResultLink } from "@/lib/share/result-link"
import type { Quiz } from "@/lib/quiz/types"

type Status = { kind: "idle" } | { kind: "busy"; action: "download" | "share" } | { kind: "message"; text: string }

export function ResultActions({
  emblemRef,
  quiz,
  answers,
  issue,
  name,
  tagline,
  spectrum,
}: {
  emblemRef: RefObject<SVGSVGElement | null>
  quiz: Quiz
  answers: Answers
  issue: string
  name: string
  tagline: string | null
  spectrum: { label: string; share: number; colorVar: string; highlight: boolean }[]
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [shareUrl, setShareUrl] = useState<string | null>(null)

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
      setStatus({ kind: "message", text: "下載失敗，請再按一次「下載結果卡」重試。" })
    }
  }

  async function copyLink(url: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("瀏覽器不支援剪貼簿")
      await navigator.clipboard.writeText(url)
      setShareUrl(null)
      setStatus({ kind: "message", text: "已複製結果分享連結" })
    } catch (error) {
      console.error("複製分享連結失敗", error)
      setShareUrl(url)
      setStatus({ kind: "message", text: "無法自動複製，請選取下方連結並手動複製。" })
    }
  }

  async function share() {
    setStatus({ kind: "busy", action: "share" })
    setShareUrl(null)
    const url = createResultLink(window.location.origin, quiz.id, answers)
    const text = `我在《${quiz.title}》測出「${name}${tagline ? `：${tagline}` : ""}」，你呢？`

    if (typeof navigator.share === "function") {
      const data: ShareData = { title: quiz.title, text, url }
      try {
        const file = await makeCard()
        if (navigator.canShare?.({ files: [file] })) data.files = [file]
      } catch (error) {
        console.error("建立分享圖片失敗", error)
      }

      try {
        await navigator.share(data)
        setStatus({ kind: "idle" })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setStatus({ kind: "idle" })
          return
        }
        console.error("裝置分享失敗", error)
      }
    }
    await copyLink(url)
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
      {shareUrl && (
        <div className="grid w-full gap-1">
          <label htmlFor="result-share-link" className="text-xs text-ink-soft">
            結果分享連結
          </label>
          <Input
            id="result-share-link"
            type="text"
            value={shareUrl}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </div>
  )
}
