// 人格徽章（Persona Bloom）的幾何資料：
// 每片花瓣代表一種結果類型，長度依作答得分比例決定；其餘裝飾由種子決定，
// 因此同一份作答永遠得到同一個徽章，不同作答則各自不同。

export const PERSONA_COLOR_COUNT = 6

export interface EmblemPetal {
  angle: number
  length: number
  width: number
  /** 1～PERSONA_COLOR_COUNT，對應 CSS 變數 --persona-N */
  colorIndex: number
  highlight: boolean
}

export interface EmblemStar {
  x: number
  y: number
  r: number
  delay: number
}

export type EmblemFace = "sleepy" | "wink" | "dots"

export interface Emblem {
  petals: EmblemPetal[]
  stars: EmblemStar[]
  face: EmblemFace
  ringTilt: number
  ringRadius: number
  coreRadius: number
}

/** FNV-1a 32-bit */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** 可重現的亂數產生器（mulberry32） */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function personaColorIndex(resultIndex: number): number {
  return (resultIndex % PERSONA_COLOR_COUNT) + 1
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * @param shares 各結果類型的得分比例，依結果類型排列順序
 * @param highlight 勝出結果類型的索引
 */
export function buildEmblem({
  seed,
  shares,
  highlight,
}: {
  seed: string
  shares: readonly number[]
  highlight: number
}): Emblem {
  const random = seededRandom(hashString(seed))
  const entries = shares.map((share, index) => ({ share, index }))
  // 結果類型太少時重複排列，讓花冠至少有 4 片
  const petalsSource = entries.length === 0 ? [] : [...entries]
  while (petalsSource.length > 0 && petalsSource.length < 4) {
    petalsSource.push(...entries)
  }

  const max = Math.max(0, ...shares)
  const rotation = random() * 360
  const petals = petalsSource.map(({ share, index }, i) => ({
    angle: round(rotation + (i * 360) / petalsSource.length),
    length: round(max === 0 ? 52 : 34 + 52 * (share / max)),
    width: round(11 + random() * 7),
    colorIndex: personaColorIndex(index),
    highlight: index === highlight,
  }))

  const starCount = 5 + Math.floor(random() * 3)
  const stars = Array.from({ length: starCount }, () => {
    const angle = random() * Math.PI * 2
    const distance = 74 + random() * 20
    return {
      x: round(Math.cos(angle) * distance),
      y: round(Math.sin(angle) * distance),
      r: round(1.4 + random() * 2.2),
      delay: round(random() * 3),
    }
  })

  const faces: EmblemFace[] = ["sleepy", "wink", "dots"]
  return {
    petals,
    stars,
    face: faces[Math.floor(random() * faces.length)],
    ringTilt: round(-30 + random() * 60),
    ringRadius: round(60 + random() * 10),
    coreRadius: round(22 + random() * 5),
  }
}
