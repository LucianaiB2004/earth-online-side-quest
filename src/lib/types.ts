export const ATTRIBUTES = [
  "幸运",
  "探索",
  "勇气",
  "善意",
  "感知",
  "羁绊",
  "尊严",
  "想象力",
  "生命力",
] as const;
export const CATEGORIES = [
  "探索",
  "善意",
  "勇气",
  "羁绊",
  "感知",
  "尊严",
  "想象力",
  "生命体验",
  "世界事件",
] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Provider = "aliyun" | "deepseek";
export interface ApiConfig {
  provider: Provider;
  apiKey: string;
  baseUrl: string;
  model: string;
}
export interface Quest {
  title: string;
  story: string;
  description: string;
  steps: string[];
  category: Category;
  estimatedMinutes: number;
  difficulty: "轻松" | "简单" | "适中";
  completionCriteria: string;
  rewards: { attribute: Attribute; amount: number }[];
  safeAlternative: string;
  isDemo: boolean;
}
export interface NewsSource {
  title: string;
  text: string;
  url: string;
  name: string;
  publishedAt: string;
}
export interface WorldEvent {
  title: string;
  summary: string;
  category: string;
  reason: string;
  gameNarrative: string;
  suggestedQuest: string | null;
  sourceTitle: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt: string;
  isDemo: boolean;
  provenance: "search" | "user" | "demo";
  original: NewsSource;
}
export const PROVIDERS: Record<
  Provider,
  { name: string; baseUrl: string; model: string }
> = {
  aliyun: {
    name: "阿里云 · 通义千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-flash",
  },
};
