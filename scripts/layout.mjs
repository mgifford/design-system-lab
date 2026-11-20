import {escapeHtml} from './markdown.mjs';

export const NAV = [
  {key: 'overview', href: 'index.html', label: 'Overview'},
  {key: 'components', href: 'components.html', label: 'Components'},
  {key: 'experiments', href: 'experiments.html', label: 'Experiments'},
  {key: 'demo', href: 'demo.html', label: 'Landing demo'},
  {key: 'ideas', href: 'ideas.html', label: 'Community ideas'},
  {key: 'evidence', href: 'evidence.html', label: 'Evidence'},
  {key: 'methodology', href: 'guide.html', label: 'Methodology'}
];

const PREF_BOOTSTRAP = `try{var p=JSON.parse(localStorage.getItem('uswds-lab-prefs')||'{}');var d=document.documentElement;if(p.theme==='light'||p.theme==='dark')d.dataset.theme=p.theme;if(p.textSize==='large'||p.textSize==='x-large')d.dataset.textSize=p.textSize;if(p.contrast==='more')d.dataset.contrast='more';if(p.motion==='reduce')d.dataset.motion='reduce';}catch(e){}`;

/**
 * Render a full lab page with the shared skip link, header, navigation, main
 * landmark and footer. Generated component/experiment pages use the same
 * function as the hand-authored pages so navigation cannot drift.
 */
export function renderPage({
  route,
  title,
  description = '',
  current = '',
  content,
  base = '',
  scripts = [],
  bodyClass = ''
}) {
  const nav = NAV.map(item => {
    const active = item.key === current ? ' aria-current="page"' : '';
    return `<a href="${base}${item.href}"${active}>${escapeHtml(item.label)}</a>`;
  }).join('');
  const scriptTags = scripts
    .map(script => `<script${script.type ? ` type="${script.type}"` : ''} src="${base}${script.src}"${script.defer ? ' defer' : ''}></script>`)
    .join('');
  const descriptionTag = description
    ? `<meta name="description" content="${escapeHtml(description)}">`
    : '';
  const documentTitle = title === 'USWDS Futures Lab' ? title : `${title} | USWDS Futures Lab`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
${descriptionTag}
<title>${escapeHtml(documentTitle)}</title>
<script>${PREF_BOOTSTRAP}</script>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="${base}assets/base.css">
<script type="module" src="${base}assets/prefs.js"></script>
${scriptTags}
</head>
<body${bodyClass ? ` class="${escapeHtml(bodyClass)}"` : ''} data-route="${escapeHtml(route)}">
<a class="skip" href="#main">Skip to main content</a>
<header class="site-head">
  <div class="head-inner">
    <a class="brand" href="${base}index.html">USWDS Futures Lab<span>Independent research and comparison pilot</span></a>
    <nav aria-label="Primary">${nav}</nav>
  </div>
</header>
<main id="main" tabindex="-1">
${content}
</main>
<footer>
  <div class="inner">
    <p>MIT-licensed comparison code. USWDS and third-party assets keep their own licensing terms. This lab is independent of GSA, USWDS, OGDS, and CivicActions.</p>
    <p><a href="${base}guide.html">Methodology, provenance and governance</a> · <a href="${base}evidence.html">Evidence</a> · <a href="${base}data/sources.lock.json">Source lock</a></p>
  </div>
</footer>
</body>
</html>
`;
}
