#!/usr/bin/env node
// 檢查測驗案例與驗收條件（docs/user-stories.md）是否 1:1 對齊：
//   1. 每個測試名稱都必須標上至少一個 [AC-x.y]；
//   2. 標上的 AC 必須存在於文件中；
//   3. 文件中的每條 AC 都至少有一個測試。
// 任一項不符即以非零代碼結束，供 CI 擋下。
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const root = new URL("..", import.meta.url).pathname
const TEST_DIRS = ["lib", "tests"]
const TEST_FILE = /\.(test|spec)\.ts$/
const AC_ID = /AC-\d+\.\d+/g

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : TEST_FILE.test(name) ? [path] : []
  })
}

const docAcs = new Set(
  [...readFileSync(join(root, "docs/user-stories.md"), "utf8").matchAll(/^\|\s*(AC-\d+\.\d+)\s*\|/gm)].map(
    (m) => m[1],
  ),
)

// it("…") / test("…") / it.each(...)("…")，名稱可為 " ' `
const TEST_CALL = /\b(?:it|test)(?:\.each\([\s\S]*?\))?\(\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g

const errors = []
const covered = new Map()
let testCount = 0

for (const file of TEST_DIRS.flatMap((d) => walk(join(root, d)))) {
  const source = readFileSync(file, "utf8")
  for (const match of source.matchAll(TEST_CALL)) {
    const title = match[2]
    const line = source.slice(0, match.index).split("\n").length
    const where = `${relative(root, file)}:${line}`
    testCount++
    const ids = title.match(AC_ID) ?? []
    if (ids.length === 0) errors.push(`${where} 測試「${title}」沒有標註 AC`)
    for (const id of ids) {
      if (!docAcs.has(id)) errors.push(`${where} 標註了不存在的 ${id}`)
      covered.set(id, [...(covered.get(id) ?? []), where])
    }
  }
}

for (const id of docAcs) {
  if (!covered.has(id)) errors.push(`${id} 沒有任何測試（遺漏）`)
}

if (errors.length > 0) {
  console.error(`AC 對齊檢查失敗（${errors.length} 項）：\n- ${errors.join("\n- ")}`)
  process.exit(1)
}

console.log(`AC 對齊檢查通過：${testCount} 個測試對應 ${docAcs.size} 條 AC。`)
for (const id of [...docAcs].sort((a, b) => a.localeCompare(b, "en", { numeric: true }))) {
  console.log(`  ${id}  ← ${covered.get(id).length} 個測試`)
}
