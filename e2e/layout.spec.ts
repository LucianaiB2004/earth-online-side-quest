import { test, expect } from "@playwright/test";

for (const size of [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`桌面一屏展示 ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    const assertScreen = async () => {
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight),
      ).toBeLessThanOrEqual(size.height);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(size.width);
      await expect(page.locator(".world-rail")).toBeInViewport();
      await expect(page.locator(".inspiration-paths")).toBeInViewport();
    };
    await assertScreen();
    await page.screenshot({
      path: `docs/screenshots/desktop-${size.width}.png`,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: "生成今日支线", exact: true })
      .click();
    await assertScreen();
    expect(
      await page
        .locator(".quest-content")
        .evaluate((el) => el.scrollHeight <= el.clientHeight),
    ).toBe(true);
    await page.getByRole("button", { name: "接受支线", exact: true }).click();
    const complete = page.getByRole("button", {
      name: "完成支线",
      exact: true,
    });
    await expect(complete).toBeInViewport();
    await complete.click();
    await assertScreen();
    await expect(
      page.getByText("恭喜玩家，成功触发一次人生支线！"),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "探索下一条支线 →", exact: true }),
    ).toBeInViewport();
    expect(
      await page
        .locator(".quest-content")
        .evaluate((el) => el.scrollHeight <= el.clientHeight),
    ).toBe(true);
    if (size.width === 1440)
      await page.screenshot({
        path: "docs/screenshots/rewards-desktop-new.png",
        animations: "disabled",
      });
  });
}
test("右侧分类切换并触发对应演示任务", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "科学", exact: true }).click();
  await expect(page.locator(".rail-event")).toHaveCount(1);
  await expect(page.locator(".rail-event")).toContainText("夜空观察区域已解锁");
  await page.getByRole("button", { name: "触发关联支线" }).click();
  await expect(page.locator(".quest-content")).toContainText("观察天空一分钟");
});
test("合法长标题事件仍保留可点击的关联任务入口", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route("https://api.deepseek.com/**", (route) =>
    route.fulfill({
      json: {
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                title: "世界科学探索".repeat(10),
                summary: "测试新闻摘要",
                category: "科学探索",
                reason: "了解世界",
                gameNarrative: "新的科学探索带来观察生活的灵感。",
                suggestedQuest: "观察天空一分钟。",
              }),
            },
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
  await page.getByRole("button", { name: /世界事件 WORLD EVENTS/ }).click();
  await page.getByText("从一则新闻开始", { exact: true }).click();
  await page
    .getByLabel("粘贴新闻标题、正文和原文链接（最多 8000 字）")
    .fill("一条用户提供的科学新闻，用于界面回归验证。");
  await page
    .getByRole("button", { name: "转化为世界事件", exact: true })
    .click();
  await expect(page.locator(".rail-event")).toHaveCount(1);
  expect(
    await page.locator(".rail-event").evaluate((el) => {
      const b = el.querySelector("button")!.getBoundingClientRect(),
        c = el.getBoundingClientRect();
      return b.bottom <= c.bottom && b.top >= c.top;
    }),
  ).toBe(true);
  await expect(page.locator(".rail-event button")).toBeInViewport();
});
