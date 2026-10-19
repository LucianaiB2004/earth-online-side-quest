import { it, expect } from 'vitest';
import { readBulletin, bulletinTitle } from '../src/lib/feed';
it('shows date and headline without the feed brand prefix', () => {
  expect(bulletinTitle('AIHOT 日报 · 2026-10-19 — 新模型发布')).toBe('2026-10-19 — 新模型发布');
  expect(bulletinTitle('普通标题')).toBe('普通标题');
});
it('rejects untrusted URLs and preserves source text without AI', () => {
  const data = { fetchedAt: '2026-10-18T00:00:00Z', items: [
    { title: '日报', summary: '<script>bad</script>', url: 'javascript:alert(1)', publishedAt: '2026-10-18' }
  ]};
  expect(() => readBulletin(data)).toThrow();
  data.items[0].url = 'https://aihot.news/daily/2026-10-18';
  expect(readBulletin(data).events[0].provenance).toBe('rss');
  expect(readBulletin(data).events[0].summary).toBe('<script>bad</script>');
});
it('keeps safe issue entries and rejects external entry links', () => {
  const result = readBulletin({fetchedAt:'2026-10-18T00:00:00Z',items:[{title:'日报',summary:'来源摘要',url:'https://aihot.news/daily/2026-10-18',publishedAt:'2026-10-18',entries:[{title:'事件',url:'https://aihot.news/items/abc123'},{title:'危险链接',url:'javascript:alert(1)'}]}]});
  expect(result.events[0].entries).toEqual([{title:'事件',url:'https://aihot.news/items/abc123'}]);
});
