/**
 * 同一時間只允許一個請求進行。
 * 進行中再次 tryStart() 會回傳 false，呼叫端應忽略這次操作，避免送出重複請求。
 */
export interface SingleFlight {
  readonly busy: boolean
  /** 開始請求；已有請求進行中時回傳 false */
  tryStart(): boolean
  /** 請求結束（成功或失敗）後呼叫 */
  finish(): void
}

export function createSingleFlight(): SingleFlight {
  let busy = false
  return {
    get busy() {
      return busy
    },
    tryStart() {
      if (busy) return false
      busy = true
      return true
    },
    finish() {
      busy = false
    },
  }
}
