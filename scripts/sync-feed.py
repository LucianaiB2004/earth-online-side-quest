"""Fetch the user-selected public AIHOT daily RSS, without AI rewriting."""
import json
import re
import html
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from html.parser import HTMLParser

URL = 'https://aihot.news/feed/daily.xml'

class Directory(HTMLParser):
    def __init__(self):
        super().__init__()
        self.entries = []
        self.current = None
    def handle_starttag(self, tag, attrs):
        href = dict(attrs).get('href', '')
        if tag == 'a' and href.startswith('https://aihot.news/items/'):
            self.current = {'title': '', 'url': href}
    def handle_data(self, data):
        if self.current is not None:
            self.current['title'] += data
    def handle_endtag(self, tag):
        if tag == 'a' and self.current is not None:
            self.entries.append(self.current)
            self.current = None

def plain(value):
    return html.unescape(re.sub(r'<[^>]+>', ' ', value or '')).strip()

def sync():
    request = urllib.request.Request(URL, headers={'User-Agent': 'EarthOnline/1.0 RSS reader'})
    with urllib.request.urlopen(request, timeout=30) as response:
        root = ET.fromstring(response.read(2_000_000))
    items = []
    for item in root.findall('./channel/item')[:30]:
        url = item.findtext('link', '')
        if not url.startswith('https://aihot.news/'):
            continue
        description = item.findtext('description', '')
        # The first paragraph is the publisher's summary, not a generated rewrite.
        first = re.search(r'<p>(.*?)</p>', description, re.S)
        directory = Directory()
        directory.feed(description)
        items.append(dict(title=plain(item.findtext('title')), url=url,
                          entries=directory.entries,
                          summary=plain(first.group(1) if first else description),
                          publishedAt=item.findtext('pubDate', '')))
    if not items:
        raise ValueError('AIHOT RSS returned no valid items; refusing an empty deployment')
    target = Path(__file__).resolve().parents[1] / 'public' / 'daily-news.json'
    target.write_text(json.dumps(dict(source=URL, fetchedAt=datetime.now(timezone.utc).isoformat(), items=items), ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Synced {len(items)} AIHOT daily issues')

if __name__ == '__main__':
    sync()
