import type { Quest, WorldEvent } from '../src/lib/types';

/** Test-only API payloads. These are never imported by the application. */
export function questFixture(): Quest {
  return {
    title: '观察窗边的一片叶子', story: '留意熟悉生活中的小细节。',
    description: '在安全的室内观察一片叶子的纹理。',
    steps: ['找一片触手可及的叶子。', '观察它的颜色与纹理。'],
    category: '感知', estimatedMinutes: 2, difficulty: '轻松',
    completionCriteria: '说出一个新发现。', rewards: [{attribute:'感知',amount:2}],
    safeAlternative: '坐在原处观察身边物品的颜色。', isDemo: false,
  };
}
export function eventFixture(): WorldEvent {
  return {
    title:'测试日报',summary:'来源提供的摘要',category:'AI 与科技',reason:'来源摘要',
    gameNarrative:'',suggestedQuest:'观察一项日常技术',sourceTitle:'测试日报',
    sourceName:'AIHOT 日报',sourceUrl:'https://aihot.news/daily/2026-10-19',
    publishedAt:'2026-10-19',isDemo:false,provenance:'rss',
    original:{title:'测试日报',text:'来源提供的摘要',url:'https://aihot.news/daily/2026-10-19',name:'AIHOT 日报',publishedAt:'2026-10-19'},
  };
}
