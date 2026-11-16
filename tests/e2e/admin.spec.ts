import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("電子郵件").fill("admin@example.com");
  await page.getByLabel("密碼").fill("admin1234");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByRole("heading", { name: "測驗管理" })).toBeVisible();
}

test("[AC-4.3] 未登入時無法進入管理頁", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "測驗管理" })).toHaveCount(0);
});

test("[AC-4.2] 密碼錯誤時無法登入", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("電子郵件").fill("admin@example.com");
  await page.getByLabel("密碼").fill("wrong");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "帳號或密碼錯誤" })).toBeVisible();
});

test("[AC-4.1][AC-5.1][AC-5.2][AC-1.1][AC-6.1] 管理員新增測驗、使用者作答、管理員查看統計", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "新增測驗" }).click();

  // 未填寫就儲存會顯示驗證錯誤
  await page.getByRole("button", { name: "儲存測驗" }).first().click();
  await expect(page.getByRole("alert").filter({ hasText: "請修正以下問題" })).toContainText("請輸入測驗標題");

  await page.getByLabel("測驗標題").fill("早餐性格測驗");
  await page.getByLabel("測驗說明").fill("從早餐看個性");
  await page.getByLabel("測驗分類").fill("生活風格");
  await page.getByText("發布（勾選後所有使用者都看得到）").click();

  await page.getByLabel("結果 1 名稱").fill("甜食派");
  await page.getByLabel("結果 1 說明").fill("你是浪漫的甜食派");
  await page.getByLabel("結果 2 名稱").fill("鹹食派");
  await page.getByLabel("結果 2 說明").fill("你是務實的鹹食派");

  await page.getByLabel("第 1 題題目內容").fill("早餐最想吃什麼？");
  await page.getByLabel("第 1 題選項 1內容").fill("鬆餅");
  await page.getByLabel("第 1 題選項 1對結果 1 的分數").fill("2");
  await page.getByLabel("第 1 題選項 2內容").fill("蘿蔔糕");
  await page.getByLabel("第 1 題選項 2對結果 2 的分數").fill("2");

  await page.getByRole("button", { name: "儲存測驗" }).last().click();
  await expect(page.getByRole("heading", { name: "測驗管理" })).toBeVisible();
  await expect(page.getByText("早餐性格測驗")).toBeVisible();

  // 使用者在首頁看到並作答
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "開始「早餐性格測驗」" }),
  ).toContainText("生活風格");
  await page.getByRole("link", { name: "開始「早餐性格測驗」" }).click();
  await page.getByRole("button", { name: "開始測驗" }).click();
  await page.getByRole("radio", { name: "蘿蔔糕" }).click();
  await page.getByRole("button", { name: "看結果" }).click();
  await expect(page.getByTestId("result-title")).toHaveText("鹹食派");

  // 管理員查看統計
  await page.goto("/admin");
  await page.getByRole("link", { name: "「早餐性格測驗」的統計" }).click();
  await expect(page.getByTestId("stats-total")).toHaveText("1");
  await expect(page.getByText("1 人・100%")).toBeVisible();
});

test("[AC-5.3] 草稿測驗不會出現在首頁", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "編輯「你是哪一種森林動物？」" }).click();
  await page.getByText("發布（勾選後所有使用者都看得到）").click();
  await page.getByRole("button", { name: "儲存測驗" }).last().click();
  await expect(page.getByText("草稿")).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("目前還沒有測驗")).toBeVisible();
});

test("[AC-5.5] 匯入範例測驗只補上缺少的，重複匯入不會產生重複", async ({ page }) => {
  await login(page);
  const importButton = page.getByRole("button", { name: "匯入範例測驗" });

  // 本機模式預設只有「森林動物」，應補上其餘 3 份
  await importButton.click();
  await expect(page.getByRole("status").filter({ hasText: "已匯入 3 份範例測驗" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^編輯「/ })).toHaveCount(4);

  await importButton.click();
  await expect(page.getByRole("status").filter({ hasText: "範例測驗都已經在清單中了" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^編輯「/ })).toHaveCount(4);

  await page.goto("/");
  await expect(page.getByRole("link", { name: /^開始「/ })).toHaveCount(4);
});
