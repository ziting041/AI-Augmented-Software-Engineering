"use client"

import { AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function LoadingState({ label = "載入中…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex flex-1 items-center justify-center gap-3 py-24 font-display text-lg italic text-ink-soft font-wonk"
    >
      <Loader2 className="size-4 animate-spin not-italic" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center text-destructive"
    >
      <AlertCircle className="size-6" aria-hidden />
      <p>{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          重試
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/30 px-4 py-16 text-center">
      <p className="font-serif text-xl font-bold">{title}</p>
      {children}
    </div>
  )
}
