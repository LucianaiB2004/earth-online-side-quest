import { describe, expect, it, vi } from "vitest";
import {
  fetchWorldEvents,
  gameifyNews,
  generateQuest,
  safeUrl,
  testConnection,
  validateConfig,
  validateQuest,
} from "../src/lib/ai";
import { DEMO_EVENTS, getDemoEventQuest, getDemoQuest } from "../src/lib/demo";
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
    const invalid = {...getDemoQuest(),rewards:[{attribute:'生命体验',amount:1}]};
    const fetcher = vi.fn().mockResolvedValueOnce(ok(reply(invalid))).mockResolvedValueOnce(ok(reply(getDemoQuest())));
    await generateQuest(config, '三分钟', undefined, {fetcher});
    const retry = JSON.parse(fetcher.mock.calls[1][1].body).messages[1].content;
    expect(retry).toContain('具体校验错误：AI 返回的属性奖励不符合要求');
    expect(retry).toContain('当前北京时间日期');
    expect(retry).toContain('生命体验不能用作奖励');
  });
  it("validates every demonstration and copies rewards", () => {
    for (let i = 0; i < 6; i++)
      expect(validateQuest(getDemoQuest(i)).isDemo).toBe(false);
    const q = getDemoQuest(0);
    q.rewards[0].amount = 999;
    expect(getDemoQuest(0).rewards[0].amount).toBe(2);
  });
  it.each([
    { estimatedMinutes: 99 },
    { rewards: [{ attribute: "探索", amount: 100 }] },
    { steps: [] },
    { category: "违法" },
    { title: "a".repeat(41) },
    { safeAlternative: "" },
  ])("rejects invalid schema %j", (bad) => {
    expect(() => validateQuest({ ...getDemoQuest(), ...bad })).toThrow();
  });
  it("retries invalid output once and rejects without pretending it is AI success", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok(reply({})));
    await expect(
      generateQuest(config, "", undefined, { fetcher }),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("parses actual chat response shape and never trusts model isDemo", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok(reply(getDemoQuest())));
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
  it("rejects dangerous news URLs", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("https://a.test")).toBe("https://a.test/");
  });
});
describe("news provenance", () => {
  const event = { ...DEMO_EVENTS[0], sourceUrl: "https://example.org/news" };
  it("rejects model-only news even if model supplies plausible sources", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(ok({ output: reply({ events: [event] }) }));
    await expect(fetchWorldEvents(config, "", { fetcher })).rejects.toThrow(
      "搜索来源",
    );
  });
  it("only accepts source URLs actually present in provider search metadata", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        ok({
          output: {
            ...reply({
              events: [event, { ...event, sourceUrl: "https://fake.test" }],
            }),
            search_info: {
              search_results: [
                { title: "Official source title", url: event.sourceUrl },
              ],
            },
          },
        }),
      );
    const results = await fetchWorldEvents(config, "", { fetcher });
    expect(results).toHaveLength(1);
    expect(results[0].sourceTitle).toBe("Official source title");
    expect(results[0].provenance).toBe("search");
    expect(results[0].publishedAt).toContain("未提供");
    expect(fetcher.mock.calls[0][0]).toContain(
      "/api/v1/services/aigc/text-generation/generation",
    );
    expect(
      JSON.parse(fetcher.mock.calls[0][1].body).parameters.search_options
        .enable_source,
    ).toBe(true);
  });
  it("keeps user supplied original separate from AI rewrite", async () => {
    const text = "用户提供的一条科技新闻原始内容，尚未经过独立核实。";
    const fetcher = vi.fn().mockResolvedValue(ok(reply(event)));
    const result = await gameifyNews(config, text, { fetcher });
    expect(result.original.text).toBe(text);
    expect(result.provenance).toBe("user");
    expect(result.sourceUrl).toBe("");
    expect(result.publishedAt).toBe("未核实");
  });
  it("does not force a quest for unsuitable events", async () => {
    const fetcher = vi.fn();
    await expect(
      generateQuest(
        config,
        "",
        { ...event, suggestedQuest: null },
        { fetcher },
      ),
    ).rejects.toThrow("不适合");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("extracts first valid source URL while preserving exact pasted material", async () => {
    const text =
      "  科技新闻标题\n正文 https://user:secret@invalid.test 不可用。来源：https://example.org/article?id=1。另一个 https://second.test/article \n";
    const fetcher = vi.fn().mockResolvedValue(ok(reply(event)));
    const result = await gameifyNews(config, text, { fetcher });
    expect(result.original.text).toBe(text);
    expect(result.sourceUrl).toBe("https://example.org/article?id=1");
    expect(result.original.url).toBe(result.sourceUrl);
  });
  it("describes excessive pasted input as user input error before any request", async () => {
    const fetcher = vi.fn();
    await expect(
      gameifyNews(config, "a".repeat(8001), { fetcher }),
    ).rejects.toThrow("请粘贴 10 至 8000 字");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("binds local event quests to the chosen event with safe steps and demo marker", () => {
    for (const event of DEMO_EVENTS) {
      const quest = getDemoEventQuest(event);
      expect(quest.description).toBe(event.suggestedQuest);
      expect(quest.title).toContain(event.title);
      expect(quest.category).toBe("世界事件");
      expect(quest.isDemo).toBe(true);
      expect(() => validateQuest(quest)).not.toThrow();
    }
    expect(getDemoEventQuest(DEMO_EVENTS[0]).rewards).not.toEqual(
      getDemoEventQuest(DEMO_EVENTS[2]).rewards,
    );
    expect(() => getDemoEventQuest({ ...event, suggestedQuest: null })).toThrow(
      "不适合",
    );
  });
});
