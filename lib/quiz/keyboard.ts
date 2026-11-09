/** 選項的字母標記：A、B、C… */
export function optionMarker(index: number): string {
  return String.fromCharCode(65 + index)
}

/**
 * 把按鍵轉成選項索引：數字 1～9 或字母 A～Z（不分大小寫）。
 * 不是選項快捷鍵或超出範圍時回傳 null。
 */
export function optionIndexFromKey(key: string, optionCount: number): number | null {
  let index: number | null = null
  if (/^[1-9]$/.test(key)) index = Number(key) - 1
  else if (/^[a-z]$/i.test(key)) index = key.toUpperCase().charCodeAt(0) - 65
  return index !== null && index < optionCount ? index : null
}
