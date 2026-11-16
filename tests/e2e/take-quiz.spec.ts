import { expect, test } from "@playwright/test";

test("[AC-1.1][AC-1.3][AC-2.1][AC-2.2][AC-2.6][AC-3.1][AC-3.3][AC-3.4][AC-3.5][AC-6.1] 使用者作答範例測驗並看到結果", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "開始「你是哪一種森林動物？」" }),
  ).toContainText("個性探索");
  await expect(page.getByText("約 2 分鐘")).toBeVisible();
  await page.getByLabel("搜尋測驗").fill("沒有這個測驗");
  await expect(page.getByText("找不到符合條件的測驗")).toBeVisible();
  await page.getByRole("button", { name: "清除搜尋與篩選" }).click();
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
  await page.getByRole("button", { name: "看結果" }).evaluate((button) => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  });

  const title = page.getByTestId("result-title");
  await expect(title).toContainText("貓頭鷹");
  await expect(title).toContainText("冷靜的思考者");
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("quiz-site:submissions") ?? "[]").length),
    )
    .toBe(1);

  // 依據：列出實際作答
  await expect(page.getByRole("heading", { name: /為什麼是你/ })).toBeVisible();
  await expect(page.getByText("你選了「在家看書或研究有興趣的主題」")).toBeVisible();
  await expect(
    page.getByText("本結果僅供娛樂與自我探索，不構成心理診斷。"),
  ).toBeVisible();

  // 下載結果卡
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下載結果卡" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);

  await page.evaluate(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      value: (callback: BlobCallback) => callback(null),
    });
  });
  const failedDownload = page
    .waitForEvent("download", { timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  await page.getByRole("button", { name: "下載結果卡" }).click();
  await expect(page.getByRole("status")).toContainText("請再按一次");
  expect(await failedDownload).toBe(false);

  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => Promise.reject(new Error("clipboard unavailable")) },
    });
  });
  await page.getByRole("button", { name: "分享結果" }).click();
  await expect(page.getByRole("status")).toContainText("無法自動複製");
  const shareUrl = await page.getByLabel("結果分享連結").inputValue();
  expect(new URL(shareUrl).searchParams.get("result")).not.toBeNull();

  await page.goto(shareUrl);
  await expect(page.getByTestId("result-title")).toContainText("貓頭鷹");
  await page.getByRole("button", { name: "再測一次" }).click();
  await expect(page.getByRole("button", { name: "開始測驗" })).toBeVisible();

  await page.goto("/quiz/sample?result=not-json");
  await expect(page.getByText("結果無法取得")).toBeVisible();
});

test("[AC-2.5] 找不到測驗時顯示提示", async ({ page }) => {
  await page.goto("/quiz/not-exist");
  await expect(page.getByText("找不到這份測驗")).toBeVisible();
});

test("[AC-1.4] 目錄載入失敗不會呈現空列表，服務恢復後可重試", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "開始「你是哪一種森林動物？」" })).toBeVisible();
  const validData = await page.evaluate(() => localStorage.getItem("quiz-site:quizzes"));
  expect(validData).not.toBeNull();

  await page.evaluate(() => localStorage.setItem("quiz-site:quizzes", "{"));
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "本機資料格式錯誤" }),
  ).toBeVisible();

  await page.evaluate((data) => localStorage.setItem("quiz-site:quizzes", data!), validData);
  await page.getByRole("button", { name: "重試" }).click();
  await expect(page.getByRole("link", { name: "開始「你是哪一種森林動物？」" })).toBeVisible();
});

test("[AC-1.2] 未發布或無效題目不列入目錄，直接開啟時拒絕作答", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "開始「你是哪一種森林動物？」" })).toBeVisible();
  await page.evaluate(() => {
    const quizzes = JSON.parse(localStorage.getItem("quiz-site:quizzes") ?? "[]");
    quizzes[0].questions[0].options = [];
    localStorage.setItem("quiz-site:quizzes", JSON.stringify(quizzes));
  });

  await page.reload();
  await expect(page.getByText("目前還沒有測驗")).toBeVisible();
  await page.goto("/quiz/sample");
  await expect(page.getByText("測驗目前無法使用")).toBeVisible();
});
