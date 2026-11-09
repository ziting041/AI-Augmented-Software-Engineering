// 產生可下載／分享的結果卡（1080×1350，適合社群貼文）。
// 只用瀏覽器內建的 Canvas，不需額外套件；顏色與字體從頁面的 CSS 變數讀取，與網站保持一致。

export interface ResultCardInput {
  emblem: SVGSVGElement
  issue: string
  quizTitle: string
  name: string
  tagline: string | null
  spectrum: { label: string; share: number; colorVar: string; highlight: boolean }[]
  footer: string
}

const W = 1080
const H = 1350
const PAD = 84

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** 把 SVG 內的 var(--x) 換成實際色值，序列化成獨立圖片 */
async function svgToImage(svg: SVGSVGElement, size: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute("width", String(size))
  clone.setAttribute("height", String(size))
  clone.removeAttribute("class")
  clone.querySelectorAll("[class]").forEach((el) => el.removeAttribute("class"))
  clone.querySelectorAll<SVGElement>("[style]").forEach((el) => el.removeAttribute("style"))
  const markup = new XMLSerializer()
    .serializeToString(clone)
    .replace(/var\((--[\w-]+)\)/g, (_, name: string) => cssVar(name) || "black")
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }))
  try {
    const image = new Image()
    image.decoding = "async"
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** 逐字換行（適用中文）；超過 maxLines 以「…」結尾 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = []
  let line = ""
  for (const char of text.replace(/\s+/g, " ")) {
    if (ctx.measureText(line + char).width > maxWidth) {
      lines.push(line)
      line = char.trimStart()
      if (lines.length === maxLines) break
    } else {
      line += char
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  const consumed = lines.join("").length
  if (consumed < text.replace(/\s+/g, " ").trim().length && lines.length > 0) {
    const last = lines.length - 1
    let tail = lines[last]
    while (tail && ctx.measureText(tail + "…").width > maxWidth) tail = tail.slice(0, -1)
    lines[last] = tail + "…"
  }
  return lines
}

export async function renderResultCard(input: ResultCardInput): Promise<Blob> {
  const paper = cssVar("--paper")
  const ink = cssVar("--ink")
  const inkSoft = cssVar("--ink-soft")
  const coral = cssVar("--coral")
  const haze = cssVar("--haze")
  const display = `${cssVar("--font-fraunces")}, serif`
  const serif = `${cssVar("--font-noto-serif-tc")}, "Songti TC", serif`
  const sans = `${cssVar("--font-geist-sans")}, "PingFang TC", "Noto Sans TC", sans-serif`

  // 確保中文字形分片已下載，避免畫出備用字體
  const allText = [input.name, input.tagline ?? "", input.quizTitle, ...input.spectrum.map((s) => s.label)].join("")
  await Promise.all([
    document.fonts.load(`900 120px ${serif}`, allText),
    document.fonts.load(`500 40px ${serif}`, allText),
    document.fonts.load(`italic 400 32px ${display}`, "Persona Issue"),
  ]).catch(() => undefined)
  await document.fonts.ready

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("瀏覽器不支援 Canvas")

  // 紙張
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, W, H)

  // 刊頭
  ctx.fillStyle = ink
  ctx.textBaseline = "alphabetic"
  ctx.font = `900 34px ${serif}`
  ctx.fillText("心理測驗室", PAD, PAD + 20)
  ctx.font = `italic 400 30px ${display}`
  ctx.textAlign = "right"
  ctx.fillText(input.issue, W - PAD, PAD + 20)
  ctx.textAlign = "left"
  ctx.fillRect(PAD, PAD + 44, W - PAD * 2, 3)

  // 月亮色塊＋徽章
  const emblemSize = 560
  const cx = W / 2
  const cy = PAD + 70 + emblemSize / 2
  ctx.fillStyle = haze
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  ctx.arc(cx, cy, emblemSize * 0.42, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  const emblem = await svgToImage(input.emblem, emblemSize)
  ctx.drawImage(emblem, cx - emblemSize / 2, cy - emblemSize / 2, emblemSize, emblemSize)

  // 標題
  let y = cy + emblemSize / 2 + 40
  ctx.fillStyle = inkSoft
  ctx.font = `500 30px ${sans}`
  ctx.fillText(`《${input.quizTitle}》的本期人格`, PAD, y)
  y += 112
  ctx.fillStyle = ink
  ctx.font = `900 112px ${serif}`
  const nameLines = wrapText(ctx, input.name, W - PAD * 2, 2)
  for (const line of nameLines) {
    ctx.fillText(line, PAD, y)
    y += 120
  }
  y -= 120
  if (input.tagline) {
    y += 64
    ctx.fillStyle = coral
    ctx.font = `700 46px ${serif}`
    ctx.fillText(wrapText(ctx, input.tagline, W - PAD * 2, 1)[0] ?? "", PAD, y)
  }

  // 光譜（只列前三名）
  y += 64
  const top = [...input.spectrum].sort((a, b) => b.share - a.share).slice(0, 3)
  const barX = PAD + 300
  const barW = W - PAD - barX - 90
  for (const item of top) {
    ctx.fillStyle = ink
    ctx.font = `${item.highlight ? 700 : 500} 28px ${sans}`
    ctx.fillText(wrapText(ctx, item.label, 280, 1)[0] ?? "", PAD, y + 22)
    ctx.fillStyle = cssVar(item.colorVar) || coral
    ctx.strokeStyle = ink
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(barX, y, Math.max(8, barW * item.share), 26, 13)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = ink
    ctx.font = `italic 400 28px ${display}`
    ctx.textAlign = "right"
    ctx.fillText(`${Math.round(item.share * 100)}%`, W - PAD, y + 22)
    ctx.textAlign = "left"
    y += 48
  }

  // 頁尾
  ctx.fillStyle = ink
  ctx.fillRect(PAD, H - PAD - 34, W - PAD * 2, 2)
  ctx.font = `500 26px ${sans}`
  ctx.fillStyle = inkSoft
  ctx.fillText(input.footer, PAD, H - PAD)
  ctx.textAlign = "right"
  ctx.font = `italic 400 26px ${display}`
  ctx.fillText("The Somnambulist", W - PAD, H - PAD)

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("無法產生圖片"))), "image/png"),
  )
}
