import { expect, test, type Page } from "@playwright/test";

const SAMPLE_LINK = "開始「你是哪一種森林動物？」";

/** 從首頁進入範例測驗並作答到結果頁（貓頭鷹路線） */
async function answerSampleQuiz(page: Page) {
  await page.goto("/quiz/sample");
  await page.getByRole("button", { name: "開始測驗" }).click();
  await page.getByRole("radio", { name: "在家看書或研究有興趣的主題" }).click();
  await page.getByRole("radio", { name: "整理資料，找出問題的根本原因" }).click();
  await expect(page.getByText("第 3 / 6 題")).toBeVisible();
  await page.getByRole("checkbox", { name: "理性" }).click();
  await page.getByRole("checkbox", { name: "好奇心旺盛" }).click();
  await page.getByRole("button", { name: "下一題" }).click();
  await page.getByRole("radio", { name: "找個角落，先觀察現場氣氛" }).click();
  await page.getByRole("radio", { name: "數據與優缺點分析" }).click();
  await expect(page.getByText("第 6 / 6 題")).toBeVisible();
  await page.getByRole("checkbox", { name: "學會一項新知識" }).click();
}

async function openSampleResult(page: Page) {
  await answerSampleQuiz(page);
  await page.getByRole("button", { name: "看結果" }).click();
  await expect(page.getByTestId("result-title")).toContainText("貓頭鷹");
}

test("[AC-1.1][AC-3.1] 目錄列出可作答測驗的標題、題數、分類與預估時間", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("link", { name: SAMPLE_LINK });
  await expect(card).toContainText("你是哪一種森林動物？");
  await expect(card).toContainText("6 題");
  await expect(card).toContainText("個性探索");
  await expect(card).toContainText("約 2 分鐘");
});

test("[AC-3.5] 搜尋沒有符合項目時顯示查無結果，並可清除搜尋", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("搜尋測驗").fill("沒有這個測驗");
  await expect(page.getByText("找不到符合條件的測驗")).toBeVisible();
  await expect(page.getByRole("link", { name: SAMPLE_LINK })).toHaveCount(0);

  await page.getByRole("button", { name: "清除搜尋與篩選" }).click();
  await expect(page.getByLabel("搜尋測驗")).toHaveValue("");
  await expect(page.getByRole("link", { name: SAMPLE_LINK })).toBeVisible();
});

test("[AC-3.4] 套用不存在的分類值時不顯示不符合的測驗，並可清除篩選", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: SAMPLE_LINK })).toBeVisible();
  // 選單只列出既有分類，這裡直接塞入一個不存在的分類值來模擬
  await page.getByLabel("測驗分類").evaluate((select: HTMLSelectElement) => {
    select.add(new Option("不存在的分類", "不存在的分類"));
  });
  await page.getByLabel("測驗分類").selectOption("不存在的分類");

  await expect(page.getByText("找不到符合條件的測驗")).toBeVisible();
  await expect(page.getByRole("link", { name: SAMPLE_LINK })).toHaveCount(0);
  await page.getByRole("button", { name: "清除搜尋與篩選" }).click();
  await expect(page.getByRole("link", { name: SAMPLE_LINK })).toBeVisible();
});

test("[AC-1.3][AC-2.1][AC-2.2][AC-2.3] 目錄載入失敗時顯示錯誤與重試，服務恢復後重試成功", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: SAMPLE_LINK })).toBeVisible();
  const validData = await page.evaluate(() => localStorage.getItem("quiz-site:quizzes"));
  expect(validData).toContain("你是哪一種森林動物？");

  // 讓資料來源讀取失敗
  await page.evaluate(() => localStorage.setItem("quiz-site:quizzes", "{"));
  await page.reload();
  const error = page.getByRole("alert").filter({ hasText: "本機資料格式錯誤" });
  const retry = page.getByRole("button", { name: "重試" });
  await expect(error).toBeVisible();
  await expect(retry).toBeVisible();
  await expect(page.getByText("目前還沒有測驗")).toHaveCount(0);

  // 計算讀取測驗資料的次數，用來確認是否送出重複請求
  await page.evaluate(() => {
    const w = window as unknown as { quizReads: number };
    w.quizReads = 0;
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string) {
      if (key === "quiz-site:quizzes") w.quizReads += 1;
      return original.call(this, key);
    };
  });
  const reads = () => page.evaluate(() => (window as unknown as { quizReads: number }).quizReads);

  // AC-2.2：服務仍不可用時重試，保留錯誤與重試入口，不顯示空狀態
  await retry.click();
  await expect(error).toBeVisible();
  await expect(retry).toBeVisible();
  await expect(page.getByText("目前還沒有測驗")).toHaveCount(0);
  const readsPerRetry = await reads();
  expect(readsPerRetry).toBeGreaterThan(0);

  // AC-2.3：連按兩次重試只會送出一次請求
  await retry.evaluate((button) => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await expect(error).toBeVisible();
  expect(await reads()).toBe(readsPerRetry * 2);

  // AC-2.1：服務恢復後重試，清除錯誤並顯示最新列表
  await page.evaluate((data) => localStorage.setItem("quiz-site:quizzes", data!), validData);
  await retry.click();
  await expect(page.getByRole("link", { name: SAMPLE_LINK })).toBeVisible();
  await expect(error).toHaveCount(0);
});

test("[AC-1.2][AC-4.5] 沒有可作答測驗時顯示空狀態；題目沒有有效選項時阻止作答", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: SAMPLE_LINK })).toBeVisible();
  await page.evaluate(() => {
    const quizzes = JSON.parse(localStorage.getItem("quiz-site:quizzes") ?? "[]");
    quizzes[0].questions[0].options = [];
    localStorage.setItem("quiz-site:quizzes", JSON.stringify(quizzes));
  });

  await page.reload();
  await expect(page.getByText("目前還沒有測驗")).toBeVisible();
  await expect(page.getByRole("link", { name: /^開始「/ })).toHaveCount(0);

  await page.goto("/quiz/sample");
  await expect(page.getByText("測驗目前無法使用")).toBeVisible();
  await expect(page.getByRole("button", { name: "開始測驗" })).toHaveCount(0);
});

test("[AC-4.1][AC-4.2][AC-4.3][AC-4.4] 顯示作答進度，可返回修改答案，且不會超出題號範圍", async ({ page }) => {
  await page.goto("/quiz/sample");
  await page.getByRole("button", { name: "開始測驗" }).click();

  // AC-4.1 / AC-4.2：第一題顯示 1/6，無法再往前
  await expect(page.getByText("第 1 / 6 題")).toBeVisible();
  // 第一題的「上一題」停用且隱藏
  const prev = page.getByRole("button", { name: "上一題", includeHidden: true });
  await expect(prev).toBeDisabled();
  await expect(prev).toBeHidden();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("第 1 / 6 題")).toBeVisible();

  // AC-4.4：返回修改答案後保留新答案，進度正確更新
  await page.getByRole("radio", { name: "在家看書或研究有興趣的主題" }).click();
  await expect(page.getByText("第 2 / 6 題")).toBeVisible();
  await page.getByRole("button", { name: "上一題" }).click();
  await expect(page.getByText("第 1 / 6 題")).toBeVisible();
  await page.getByRole("radio", { name: "約一群朋友出去聚餐" }).click();
  await expect(page.getByText("第 2 / 6 題")).toBeVisible();
  await page.getByRole("button", { name: "上一題" }).click();
  await expect(page.getByRole("radio", { name: "約一群朋友出去聚餐" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "在家看書或研究有興趣的主題" })).not.toBeChecked();

  // AC-4.3：最後一題不會再前進，改為提供「看結果」
  await page.goto("/quiz/sample");
  await answerSampleQuiz(page);
  await expect(page.getByText("第 6 / 6 題")).toBeVisible();
  await expect(page.getByRole("button", { name: "下一題" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "看結果" })).toBeEnabled();
});

test("[AC-4.7][AC-4.8][AC-5.1] 提交後只計算一次結果，結果頁顯示說明、依據與非診斷聲明", async ({ page }) => {
  await answerSampleQuiz(page);
  // 連點兩次「看結果」：只產生一份結果、只記錄一次
  await page.getByRole("button", { name: "看結果" }).evaluate((button) => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const title = page.getByTestId("result-title");
  await expect(title).toHaveCount(1);
  await expect(title).toContainText("貓頭鷹");
  await expect(title).toContainText("冷靜的思考者");
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("quiz-site:submissions") ?? "[]").length),
    )
    .toBe(1);

  await expect(page.getByText(/你習慣先觀察、再行動/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /為什麼是你/ })).toBeVisible();
  await expect(page.getByText("你選了「在家看書或研究有興趣的主題」")).toBeVisible();
  await expect(page.getByText("本結果僅供娛樂與自我探索，不構成心理診斷。")).toBeVisible();
});

test("[AC-5.4][AC-5.5] 下載結果卡；產生失敗時顯示錯誤與重試方式且不下載檔案", async ({ page }) => {
  await openSampleResult(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下載結果卡" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("你是哪一種森林動物？-貓頭鷹.png");

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
  await expect(page.getByRole("status")).toContainText("下載失敗，請再按一次「下載結果卡」重試");
  expect(await failedDownload).toBe(false);
});

test("[AC-5.6] 裝置支援分享時開啟分享功能並帶入本次結果", async ({ page }) => {
  await openSampleResult(page);
  await page.evaluate(() => {
    const w = window as unknown as { shared: ShareData[] };
    w.shared = [];
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        w.shared.push(data);
      },
    });
  });

  await page.getByRole("button", { name: "分享結果" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared.length))
    .toBe(1);
  const shared = await page.evaluate(() => {
    const data = (window as unknown as { shared: ShareData[] }).shared[0];
    return { title: data.title, text: data.text, url: data.url };
  });
  expect(shared.title).toBe("你是哪一種森林動物？");
  expect(shared.text).toContain("貓頭鷹");
  expect(new URL(shared.url!).pathname).toBe("/quiz/sample");
  expect(new URL(shared.url!).searchParams.get("result")).toContain("q1a");
});

test("[AC-5.7] 裝置不支援分享時複製分享連結", async ({ page }) => {
  await openSampleResult(page);
  await page.evaluate(() => {
    const w = window as unknown as { copied: string[] };
    w.copied = [];
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          w.copied.push(text);
        },
      },
    });
  });

  await page.getByRole("button", { name: "分享結果" }).click();
  await expect(page.getByRole("status")).toContainText("已複製結果分享連結");
  const copied = await page.evaluate(() => (window as unknown as { copied: string[] }).copied);
  expect(copied).toHaveLength(1);
  expect(new URL(copied[0]).searchParams.get("result")).toContain("q1a");
});

test("[AC-5.8][AC-5.3] 複製失敗時顯示連結供手動複製；連結可重開同一結果，無效連結顯示無法取得", async ({ page }) => {
  await openSampleResult(page);
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

  await page.goto(shareUrl);
  await expect(page.getByTestId("result-title")).toContainText("貓頭鷹");

  // AC-5.3：結果識別資料無效時不顯示任何結果
  await page.goto("/quiz/sample?result=not-json");
  await expect(page.getByText("結果無法取得")).toBeVisible();
  await expect(page.getByTestId("result-title")).toHaveCount(0);
  await page.goto(`/quiz/sample?result=${encodeURIComponent(JSON.stringify({ q1: ["not-an-option"] }))}`);
  await expect(page.getByText("結果無法取得")).toBeVisible();
  await expect(page.getByTestId("result-title")).toHaveCount(0);
});
