import { describe, expect, it } from "vitest"

import { createSingleFlight } from "./single-flight"

describe("createSingleFlight", () => {
  it("[AC-2.3][AC-4.8] 請求進行中時再次觸發會被忽略，不送出重複請求", () => {
    const flight = createSingleFlight()
    expect(flight.tryStart()).toBe(true)
    expect(flight.busy).toBe(true)
    expect(flight.tryStart()).toBe(false)
    expect(flight.tryStart()).toBe(false)
  })

  it("[AC-2.1][AC-2.2] 請求結束（成功或失敗）後可以再次重試", () => {
    const flight = createSingleFlight()
    flight.tryStart()
    flight.finish()
    expect(flight.busy).toBe(false)
    expect(flight.tryStart()).toBe(true)
  })
})
