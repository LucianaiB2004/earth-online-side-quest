import { test, expect } from "@playwright/test";
import { getDemoQuest } from "../src/lib/demo";
test("任务接受后才能完成，奖励仅一次且刷新不保留", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshots/desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "生成今日支线", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "完成支线", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "接受支线", exact: true }).click();
  await page.getByRole("button", { name: "完成支线", exact: true }).click();
  await expect(
    page.getByText("恭喜玩家，成功触发一次人生支线！"),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/rewards.png",
    fullPage: true,
    animations: "disabled",
  });
  await expect(
    page.getByRole("button", { name: "完成支线", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "生成今日支线", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => [
      localStorage.length,
      sessionStorage.length,
      document.cookie,
    ]),
  ).toEqual([0, 0, ""]);
});
test("受控 AI 响应完成生成，跳过后不能领奖", async ({ page }) => {
  await page.route("https://api.deepseek.com/**", (route) =>
    route.fulfill({
      json: {
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify(getDemoQuest(1)) },
          },
        ],
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "API 设置", exact: true }).click();
  await page.getByLabel("AI 服务商").selectOption("deepseek");
  await page.getByLabel("API Key", { exact: true }).fill("fake-test-key");
  await page.getByRole("button", { name: /回到游戏/ }).click();
  await page.getByRole("button", { name: "生成今日支线", exact: true }).click();
  await expect(page.getByText("AI 生成", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "给天空留一个空位" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "跳过支线" }).click();
  await expect(page.getByRole("button", { name: "完成支线" })).toHaveCount(0);
  await expect(
    page.getByText("跳过也是一种选择。下一条支线，或许更适合你。"),
  ).toBeVisible();
});
test("API 失败明确回退演示，不暴露服务端密钥文本", async ({ page }) => {
  await page.route("https://api.deepseek.com/**", (route) =>
    route.fulfill({ status: 401, json: { error: "fake-test-key" } }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "API 设置", exact: true }).click();
  await page.getByLabel("AI 服务商").selectOption("deepseek");
  await page.getByLabel("API Key", { exact: true }).fill("fake-test-key");
  await page.getByRole("button", { name: "测试连接" }).click();
  await expect(page.locator(".connection-result")).toContainText(
    "API Key 无效或已过期",
  );
  expect(
    await page
      .locator("dialog")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: /回到游戏/ }).click();
  await page.getByRole("button", { name: "生成今日支线", exact: true }).click();
  await expect(page.getByText("演示任务", { exact: true })).toBeVisible();
  await expect(page.locator(".notice")).toContainText("已切换");
  await expect(page.locator("body")).not.toContainText("fake-test-key");
});
test("演示世界事件能转为支线，移动端不溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /世界事件/ }).click();
  await page.getByRole("button", { name: "体验演示事件", exact: true }).click();
  await page.screenshot({
    path: "docs/screenshots/world-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "转化为人生支线", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "接受支线", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        "挑一件常用工具，想一想它解决了什么问题，再想一个可以改善的小细节。",
      )
      .first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("设置密钥清除与刷新重置", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "API 设置", exact: true }).click();
  await page
    .getByLabel("API Key", { exact: true })
    .fill("test-secret-not-real");
  await page.getByRole("button", { name: "清除当前密钥" }).click();
  await expect(page.getByLabel("API Key", { exact: true })).toHaveValue("");
  await page
    .getByLabel("API Key", { exact: true })
    .fill("test-secret-not-real");
  await page.reload();
  await page.getByRole("button", { name: "API 设置", exact: true }).click();
  await expect(page.getByLabel("API Key", { exact: true })).toHaveValue("");
});
