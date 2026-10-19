import { describe, expect, it, vi } from "vitest";
import {
  generateQuest,
  testConnection,
  validateConfig,
  validateQuest,
} from "../src/lib/ai";
import { questFixture, eventFixture } from "./fixtures";
import type { ApiConfig } from "../src/lib/types";
const config: ApiConfig = {
  provider: "aliyun",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: "test-secret-never-show",
  model: "qwen-plus",
};
const reply = (value: unknown) => ({
  choices: [
    { message: { content: JSON.stringify(value) }, finish_reason: "stop" },
  ],
});
const ok = (value: unknown) =>
  new Response(JSON.stringify(value), { status: 200 });
describe("quest output boundary", () => {
  it('repairs invalid reward output with the specific error and current date context', async () => {
    const invalid = {...questFixture(),rewards:[{attribute:'生命体验',amount:1}]};
    const fetcher = vi.fn().mockResolvedValueOnce(ok(reply(invalid))).mockResolvedValueOnce(ok(reply(questFixture())));
    await generateQuest(config, '三分钟', undefined, {fetcher});
    const retry = JSON.parse(fetcher.mock.calls[1][1].body).messages[1].content;
    expect(retry).toContain('具体校验错误：AI 返回的属性奖励不符合要求');
    expect(retry).toContain('当前北京时间日期');
    expect(retry).toContain('生命体验不能用作奖励');
  });
  it("validates the current task reward payload", () => {
    expect(validateQuest(questFixture()).rewards).toEqual([{attribute:"感知",amount:2}]);
  });
  it.each([
    { estimatedMinutes: 99 },
    { rewards: [{ attribute: "探索", amount: 100 }] },
    { steps: [] },
    { category: "违法" },
    { title: "a".repeat(41) },
    { safeAlternative: "" },
  ])("rejects invalid schema %j", (bad) => {
    expect(() => validateQuest({ ...questFixture(), ...bad })).toThrow();
  });
  it("retries invalid output once and rejects without pretending it is AI success", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok(reply({})));
    await expect(
      generateQuest(config, "", undefined, { fetcher }),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("parses actual chat response shape and never trusts model isDemo", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok(reply({...questFixture(), isDemo:true})));
    expect(
      (await generateQuest(config, "", undefined, { fetcher })).isDemo,
    ).toBe(false);
    const init = fetcher.mock.calls[0][1];
    expect(init.redirect).toBe("error");
    expect(init.credentials).toBe("omit");
    expect(JSON.parse(init.body).response_format.type).toBe("json_object");
  });
});
describe("credentials and requests", () => {
  it.each([
    "https://evil.test",
    "http://dashscope.aliyuncs.com",
    "https://dashscope.aliyuncs.com.evil.test",
    "https://key@dashscope.aliyuncs.com",
    "https://dashscope.aliyuncs.com?key=secret",
  ])("refuses key transfer to %s", (baseUrl) => {
    expect(() => validateConfig({ ...config, baseUrl })).toThrow();
  });
  it("allows configured official workspace domain", () =>
    expect(
      validateConfig({
        ...config,
        baseUrl:
          "https://workspace123.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
      }).hostname,
    ).toContain("workspace123"));
  it("never displays provider response or key on HTTP errors", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(`{"error":"${config.apiKey}"}`, { status: 401 }),
      );
    await expect(testConnection(config, { fetcher })).rejects.toThrow(
      "API Key 无效",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("sanitizes low level network error", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error(config.apiKey));
    try {
      await testConnection(config, { fetcher });
    } catch (e) {
      expect(String(e)).not.toContain(config.apiKey);
      expect(String(e)).toContain("跨域");
    }
  });
  it("supports timeout", async () => {
    const fetcher = vi.fn(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal.addEventListener("abort", () =>
            reject(new Error("AbortError")),
          ),
        ),
    );
    await expect(
      testConnection(config, { fetcher, timeoutMs: 5 }),
    ).rejects.toThrow("超时");
  });
  it("does not fetch an already cancelled request", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher = vi.fn();
    await expect(
      testConnection(config, { fetcher, signal: controller.signal }),
    ).rejects.toThrow("取消");
    expect(fetcher).not.toHaveBeenCalled();
  });
 });

describe("event task safety", () => {
  it("does not request a task for an unsuitable event", async () => {
    const fetcher = vi.fn();
    await expect(generateQuest(config, "", {...eventFixture(), suggestedQuest:null}, {fetcher})).rejects.toThrow("不适合");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
