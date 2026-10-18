import { test, expect } from "@playwright/test";
test.use({ timezoneId: "America/New_York" });
test("世界时钟每秒刷新并按北京时间跨日", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-18T15:59:57Z") });
  await page.clock.pauseAt(new Date("2026-10-18T15:59:58Z"));
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto("/");
  const clock = page.locator(".world-clock");
  await expect(clock).toContainText("2026年10月18日");
  await expect(clock).toContainText("北京时间 23:59:58");
  await page.clock.runFor(1000);
  await expect(clock).toContainText("北京时间 23:59:59");
  await page.clock.runFor(1000);
  await expect(clock).toContainText("2026年10月19日");
  await expect(clock).toContainText("北京时间 00:00:00");
  await expect(clock).toHaveAttribute("datetime", "2026-10-18T16:00:00.000Z");
  expect(
    await clock.evaluate((el) => {
      const p = el.parentElement!.getBoundingClientRect(),
        r = el.getBoundingClientRect();
      return r.top >= p.top && r.bottom <= p.bottom;
    }),
  ).toBe(true);
});
