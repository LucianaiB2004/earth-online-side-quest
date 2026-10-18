import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
let server: Server, origin: string;
test.beforeAll(async () => {
  const root = resolve("dist");
  server = createServer(async (req, res) => {
    const path = decodeURIComponent(
      new URL(req.url!, "http://localhost").pathname,
    );
    if (!path.startsWith("/earth-online/")) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(
      root,
      path.slice("/earth-online/".length) || "index.html",
    );
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      res.setHeader(
        "Content-Type",
        (
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".webp": "image/webp",
          } as Record<string, string>
        )[extname(file)] || "application/octet-stream",
      );
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
test.afterAll(() => new Promise<void>((r) => server.close(() => r())));
test("生产构建在项目子路径运行且素材完整加载", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/earth-online/");
  await expect(
    page.getByRole("button", { name: "生成今日支线", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "生成今日支线", exact: true }).click();
  await expect(page.getByRole("button", { name: "接受支线" })).toBeVisible();
  expect(errors).toEqual([]);
});
