import { expect, test } from "@playwright/test";

test("使用者作答範例測驗並看到結果", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "開始「你是哪一種森林動物？」" }).click();

  await expect(page.getByRole("heading", { name: "你是哪一種森林動物？" })).toBeVisible();
  await page.getByRole("button", { name: "開始測驗" }).click();

  const next = page.getByRole("button", { name: "下一題" });

  // 第 1 題（單選）：未作答前不能前往下一題；選了之後自動翻頁
  await expect(page.getByText("第 1 / 6 題")).toBeVisible();
  await expect(next).toBeDisabled();
  await page.getByRole("radio", { name: "在家看書或研究有興趣的主題" }).click();
  await expect(page.getByText("第 2 / 6 題")).toBeVisible();

  // 回上一題，原本的答案仍保留，可用「下一題」前進
  await page.getByRole("button", { name: "上一題" }).click();
  await expect(page.getByRole("radio", { name: "在家看書或研究有興趣的主題" })).toBeChecked();
  await next.click();

  // 第 2 題：用鍵盤快捷鍵 1 選第一個選項
  await expect(page.getByText("第 2 / 6 題")).toBeVisible();
  await page.keyboard.press("1");
  await expect(page.getByText("第 3 / 6 題")).toBeVisible();

  // 第 3 題（多選）：不會自動翻頁
  await page.getByRole("checkbox", { name: "理性" }).click();
  await page.getByRole("checkbox", { name: "好奇心旺盛" }).click();
  await expect(page.getByText("第 3 / 6 題")).toBeVisible();
  await next.click();

  await page.getByRole("radio", { name: "找個角落，先觀察現場氣氛" }).click();
  await expect(page.getByText("第 5 / 6 題")).toBeVisible();
  await page.getByRole("radio", { name: "數據與優缺點分析" }).click();

  // 第 6 題（多選，最後一題）
  await expect(page.getByText("第 6 / 6 題")).toBeVisible();
  await page.getByRole("checkbox", { name: "學會一項新知識" }).click();
  await page.getByRole("button", { name: "看結果" }).click();

  const title = page.getByTestId("result-title");
  await expect(title).toContainText("貓頭鷹");
  await expect(title).toContainText("冷靜的思考者");

  // 依據：列出實際作答
  await expect(page.getByRole("heading", { name: /為什麼是你/ })).toBeVisible();
  await expect(page.getByText("你選了「在家看書或研究有興趣的主題」")).toBeVisible();

  // 下載結果卡
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下載結果卡" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);

  await page.getByRole("button", { name: "再測一次" }).click();
  await expect(page.getByRole("button", { name: "開始測驗" })).toBeVisible();
});

test("找不到測驗時顯示提示", async ({ page }) => {
  await page.goto("/quiz/not-exist");
  await expect(page.getByText("找不到這份測驗")).toBeVisible();
});
