import { test, expect } from "@playwright/test";
test("两家服务默认配置且提供安全的新标签页密钥入口", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "API 设置", exact: true }).click();
  const aliyun = page.getByRole("link", { name: "前往阿里云百炼获取密钥 ↗" });
  await expect(aliyun).toHaveAttribute(
    "href",
    "https://bailian.console.aliyun.com/cn-beijing/model/settings/api-key",
  );
  await expect(aliyun).toHaveAttribute("target", "_blank");
  await expect(aliyun).toHaveAttribute("rel", /noopener/);
  await expect(page.getByLabel("API Base URL", { exact: true })).toBeHidden();
  await page
    .getByText("高级设置 · 模型与接口地址已自动配置", { exact: true })
    .click();
  await expect(page.getByLabel("API Base URL", { exact: true })).toHaveValue(
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
  );
  await expect(page.getByLabel("模型名称", { exact: true })).toHaveValue(
    "qwen-plus",
  );
  await page.getByLabel("API Key", { exact: true }).fill("fake-test-key");
  await page.getByLabel("AI 服务商").selectOption("deepseek");
  await expect(page.getByLabel("API Key", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("API Base URL", { exact: true })).toHaveValue(
    "https://api.deepseek.com",
  );
  await expect(page.getByLabel("模型名称", { exact: true })).toHaveValue(
    "deepseek-flash",
  );
  await expect(
    page.getByRole("link", { name: "前往DeepSeek获取密钥 ↗" }),
  ).toHaveAttribute("href", "https://platform.deepseek.com/api_keys");
  await page
    .getByText("高级设置 · 模型与接口地址已自动配置", { exact: true })
    .click();
  expect(
    await page
      .locator("dialog")
      .evaluate((el) => el.scrollHeight <= el.clientHeight),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/api-settings.png",
    animations: "disabled",
  });
});
