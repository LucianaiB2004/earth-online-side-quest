import { it, expect } from 'vitest';
import { readBulletin } from '../src/lib/feed';
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
