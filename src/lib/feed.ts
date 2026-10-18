import type { WorldEvent } from './types';
export function readBulletin(data: unknown): { events: WorldEvent[]; fetchedAt: string } {
  const value = data as { fetchedAt?: string; items?: {title: string; summary: string; url: string; publishedAt: string; entries?: {title:string;url:string}[]}[] };
  if (!value || !Array.isArray(value.items) || !value.items.length || !value.fetchedAt || !Number.isFinite(Date.parse(value.fetchedAt))) throw new Error('日报数据格式无效，请稍后刷新。');
  const events = value.items.slice(0,30).map(item => {
    const url = new URL(item.url);
    if (url.origin !== 'https://aihot.news' || url.username || url.password || !item.title || typeof item.summary !== 'string') throw new Error('日报来源无效。');
    const date = new Date(item.publishedAt);
    const publishedAt = Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN', {timeZone:'Asia/Shanghai', hour12:false}) + ' 北京时间' : '来源未提供日期';
    const original = {title:item.title,text:item.summary,url:url.href,name:'AIHOT 日报',publishedAt};
    const entries = (item.entries ?? []).filter(entry => typeof entry.title === 'string' && /^https:\/\/aihot\.news\/items\/[a-z0-9]+$/.test(entry.url));
    return {entries,title:item.title, summary:item.summary,category:'AI 与科技',reason:'来自 AIHOT 日报 RSS，内容由来源方提供，本站未改写。', gameNarrative:'',suggestedQuest:/伤亡|自杀|色情|凶杀|死亡|灾难/.test(item.title + item.summary) ? null : '以这份日报为灵感，生成一个免费、安全、简单的小任务；不扩写新闻事实。',sourceTitle:item.title,sourceUrl:url.href,sourceName:'AIHOT 日报',publishedAt,original,isDemo:false,provenance:'rss' as const};
  });
  return {events,fetchedAt:value.fetchedAt};
}
export async function loadBulletin(signal?: AbortSignal) {
  const response = await fetch(`${import.meta.env.BASE_URL}daily-news.json`, {signal: signal ?? AbortSignal.timeout(15000),cache:'no-store',credentials:'omit'});
  if (!response.ok) throw new Error('日报暂时无法获取，请稍后刷新或直接访问 AIHOT。');
  return readBulletin(await response.json());
}

