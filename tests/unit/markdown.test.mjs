import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml, renderMarkdown} from '../../scripts/markdown.mjs';

test('Markdown renders semantic structure', () => {
  const html = renderMarkdown('# Title\n\n## Section\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n- item');
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<h2>Section<\/h2>/);
  assert.match(html, /<table>/);
  assert.match(html, /<li>item<\/li>/);
});

test('raw HTML and script injection are escaped', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('script and data link schemes are removed', () => {
  const html = renderMarkdown('[bad](javascript:alert(1)) [also](data:text/html,hi)');
  assert.ok(!/href="javascript:/i.test(html));
  assert.ok(!/href="data:/i.test(html));
});

test('HTML escape covers attribute characters', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});
