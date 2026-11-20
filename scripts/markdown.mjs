import fs from 'node:fs';
import {marked} from 'marked';

/**
 * Render repository-authored Markdown to semantic HTML at build time.
 *
 * Raw HTML in source is escaped before parsing. That deliberately disables
 * inline HTML (including <script>) in experiment docs and evidence reports while
 * preserving Markdown tables, lists, code fences, and links. The content is
 * authored in this repository, but evidence can include page text, so the build
 * treats it as untrusted.
 */
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderMarkdown(markdown, {allowHtml = false} = {}) {
  const source = String(markdown ?? '').replaceAll('\r\n', '\n');
  const safe = allowHtml ? source : source.replaceAll('<', '&lt;');
  const html = marked.parse(safe, {gfm: true, breaks: false});
  // Marked preserves link destinations. Repository content should never need
  // script or data URLs; make that explicit rather than relying on trust.
  return String(html)
    .replace(/href\s*=\s*"(?:javascript|vbscript|data):[^"]*"/gi, 'href="#"')
    .replace(/href="(?!https?:|mailto:|#)([^"]+?)\.md(#[^"]*)?"/gi, 'href="$1.html$2"')
    .replace(/<pre>/g, '<pre tabindex="0">');
}

export function renderMarkdownFile(file) {
  if (!fs.existsSync(file)) throw new Error(`Markdown file not found: ${file}`);
  return renderMarkdown(fs.readFileSync(file, 'utf8'));
}

export function stripFirstHeading(markdown) {
  return String(markdown ?? '').replace(/^#\s+.+\n?/m, '');
}

export function plainText(markdown) {
  return String(markdown ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
