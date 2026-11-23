"use client"

import { useCallback, useEffect, useState } from "react"

import { getRepositories } from "./index"
import { createSingleFlight } from "./single-flight"
import { toUserMessage, type AdminSession, type Repositories } from "./types"

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T }

/**
 * 在瀏覽器端載入資料。loader 依賴的值變動時請一併改變 key，以重新載入。
 */
export function useRepositoryData<T>(
  key: string,
  loader: (repos: Repositories) => Promise<T>,
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<{ key: string; value: AsyncState<T> }>({
    key,
    value: { status: "loading" },
  })
  const [version, setVersion] = useState(0)
  // 請求進行中時忽略重試，避免送出重複請求
  const [request] = useState(createSingleFlight)

  // key 變動時於 render 階段重設為載入中（React 建議做法，避免 effect 內同步 setState）
  if (state.key !== key) setState({ key, value: { status: "loading" } })

  useEffect(() => {
    let cancelled = false
    // 由 reload 觸發時已標記為進行中；首次載入或 key 變動時在此標記
    request.tryStart()
    getRepositories()
      .then(loader)
      .then(
        (data) => {
          if (cancelled) return
          request.finish()
          setState({ key, value: { status: "success", data } })
        },
        (error: unknown) => {
          if (cancelled) return
          request.finish()
          setState({ key, value: { status: "error", message: toUserMessage(error) } })
        },
      )
    return () => {
      cancelled = true
    }
    // loader 通常是行內函式，以 key 控制重新載入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version])

  const reload = useCallback(() => {
    if (!request.tryStart()) return
    setState((s) => ({ ...s, value: { status: "loading" } }))
    setVersion((v) => v + 1)
  }, [request])

  return { ...state.value, reload }
}

export function useAdminSession(): AdminSession {
  const [session, setSession] = useState<AdminSession>({ status: "loading" })

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    getRepositories().then((repos) => {
      if (!cancelled) unsubscribe = repos.auth.subscribe(setSession)
    }).catch((error: unknown) => {
      if (!cancelled) {
        setSession({ status: "error", message: toUserMessage(error) })
      }
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return session
}

/** 取得目前的資料後端種類（firebase / local），載入前為 null */
export function useBackend(): Repositories["backend"] | null {
  const [backend, setBackend] = useState<Repositories["backend"] | null>(null)
  useEffect(() => {
    getRepositories().then((r) => setBackend(r.backend))
  }, [])
  return backend
}
