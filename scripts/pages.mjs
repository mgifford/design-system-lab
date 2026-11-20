import fs from 'node:fs';
import path from 'node:path';
import {renderPage} from './layout.mjs';
import {escapeHtml, renderMarkdown, renderMarkdownFile, stripFirstHeading} from './markdown.mjs';

const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const template = (root, name) => read(root, `templates/pages/${name}.html`);
const fill = (html, values) => html.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '');
const list = (items, className = 'clean') => `<ul class="${className}">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
const external = (href, label) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;

function statusLabel(registry, status) {
  return registry.experimentStatuses[status] || status;
}
function typeLabel(registry, type) {
  return registry.experimentTypes[type] || type;
}

function issueMap(issues) {
  return new Map(issues.map(issue => [issue.number, issue]));
}

function issueLinks(registry, issues, numbers) {
  const byNumber = issueMap(issues);
  return numbers.map(number => {
    const issue = byNumber.get(number);
    const label = issue ? `#${number} ${issue.title}` : `#${number}`;
    return `<li><a href="https://github.com/uswds/uswds/issues/${number}">${escapeHtml(label)}</a>${issue ? ` <span class="small">(${escapeHtml(issue.status)})</span>` : ''}</li>`;
  }).join('');
}

function docHref(relative, base = '') {
  if (!relative) return '';
  const converted = relative.replace(/\.md(#.*)?$/, (_, hash = '') => `.html${hash}`);
  return `${base}${converted}`;
}

function evidencePagesFor(experiment, manifest) {
  if (!manifest?.generated || !Array.isArray(manifest.pages)) return [];
  const demoRoute = (experiment.demo || '').split('?')[0];
  return manifest.pages.filter(page => {
    if (demoRoute && page.name === demoRoute) return true;
    return (experiment.components || []).some(component => page.name.includes(`fixture/${component}-`));
  });
}

function evidenceLine(experiment, manifest) {
  const pages = evidencePagesFor(experiment, manifest);
  if (!pages.length) return {text: 'No automated evidence in this build.', className: 'muted'};
  const collected = pages.filter(page => page.result === 'collected-not-reviewed').length;
  const failed = pages.length - collected;
  const review = experiment.review?.status === 'pending'
    ? 'Human review pending.'
    : `Human review: ${experiment.review?.status || 'pending'}.`;
  return {
    text: `${collected} of ${pages.length} routes collected${failed ? `, ${failed} failed` : ''}. ${review}`,
    className: failed ? 'warning-text' : ''
  };
}

export function componentCard(component, registry, base = '') {
  const related = registry.experiments.filter(experiment => (experiment.components || []).includes(component.slug));
  return `<article class="card" data-component="${escapeHtml(component.slug)}" data-group="${escapeHtml(component.group)}" data-experiments="${related.length ? 'yes' : 'no'}">
  <p class="meta">${escapeHtml(component.group)}</p>
  <h2><a href="${base}component/${escapeHtml(component.slug)}.html">${escapeHtml(component.name)}</a></h2>
  <p>${escapeHtml(component.summary)}</p>
  <p class="small">${related.length ? `${related.length} experiment${related.length === 1 ? '' : 's'}` : 'Baseline only'}</p>
  <p><a class="button secondary" href="${base}compare.html?component=${encodeURIComponent(component.slug)}">Compare</a></p>
</article>`;
}

export function experimentCard(experiment, registry, manifest, base = '') {
  const status = statusLabel(registry, experiment.status);
  const type = typeLabel(registry, experiment.type);
  const evidence = evidenceLine(experiment, manifest);
  const components = (experiment.components || []).map(slug => {
    const component = registry.components.find(item => item.slug === slug);
    return component ? `<a href="${base}component/${escapeHtml(slug)}.html">${escapeHtml(component.name)}</a>` : escapeHtml(slug);
  }).join(', ');
  return `<article class="card" data-experiment="${escapeHtml(experiment.id)}" data-type="${escapeHtml(experiment.type)}" data-status="${escapeHtml(experiment.status)}">
  <p class="meta"><span class="pill">${escapeHtml(type)}</span> <span class="pill">${escapeHtml(status)}</span></p>
  <h2><a href="${base}experiment/${escapeHtml(experiment.id)}.html">${escapeHtml(experiment.title)}</a></h2>
  <p>${escapeHtml(experiment.summary)}</p>
  <p class="small">${components ? `Components: ${components}. ` : 'No stable equivalent component. '}Review: ${escapeHtml(experiment.review?.status || 'pending')}.</p>
  <p class="small ${evidence.className}">Evidence: ${escapeHtml(evidence.text)}</p>
  <p><a class="button secondary" href="${base}${escapeHtml(experiment.demo || `experiment/${experiment.id}.html`)}">Open demonstration</a></p>
</article>`;
}

function issueCard(issue, registry) {
  const component = issue.component ? registry.components.find(item => item.slug === issue.component) : null;
  const statusText = {
    'closed-not-planned': 'Closed, not planned',
    'discussion-continued': 'Discussion continued',
    open: 'Open',
    'open-pr': 'Open / PR pending',
    completed: 'Completed',
    consolidated: 'Consolidated elsewhere'
  }[issue.status] || issue.status;
  const search = [issue.number, issue.title, issue.proposed].join(' ').toLowerCase();
  const componentLink = component
    ? `<p><a class="button secondary" href="compare.html?component=${encodeURIComponent(component.slug)}">Compare ${escapeHtml(component.name)}</a></p>`
    : '<p class="small">No working lab demonstration yet.</p>';
  return `<article class="card" data-status="${escapeHtml(issue.status)}" data-search="${escapeHtml(search)}">
  <p class="meta">Issue #${issue.number} · ${escapeHtml(statusText)}</p>
  <h2>${escapeHtml(issue.title)}</h2>
  <p>${escapeHtml(issue.proposed)}</p>
  <p class="small">${escapeHtml(issue.notes || 'Proposed experiment only; do not infer a fix from this catalogue.')}</p>
  <p><a href="${escapeHtml(issue.url)}">Read upstream issue</a>${issue.discussion ? ` · <a href="${escapeHtml(issue.discussion)}">Discussion</a>` : ''}${issue.pullRequest ? ` · <a href="${escapeHtml(issue.pullRequest)}">PR</a>` : ''}</p>
  ${componentLink}
</article>`;
}

function metric(value, label, detail) {
  return `<div class="card metric"><p class="meta">${escapeHtml(label)}</p><p class="metric-value">${escapeHtml(value)}</p><p class="small">${escapeHtml(detail)}</p></div>`;
}

function sourceLockBlock(lock) {
  if (!lock) return '<p class="callout warning">Source lock is missing. The build is not reproducible.</p>';
  const baseline = lock.baseline;
  return `<div class="table-wrap" tabindex="0"><table>
  <caption>Pinned source provenance</caption>
  <tbody>
    <tr><th scope="row">Release</th><td>${escapeHtml(baseline.release)} (${escapeHtml(baseline.releaseDate)})</td></tr>
    <tr><th scope="row">Package</th><td><code>${escapeHtml(baseline.package)}@${escapeHtml(baseline.version)}</code></td></tr>
    <tr><th scope="row">Commit</th><td><code>${escapeHtml(baseline.commit || 'not recorded')}</code></td></tr>
    <tr><th scope="row">Verified</th><td>${escapeHtml(lock.verifiedAt)}</td></tr>
    <tr><th scope="row">package-lock SHA-256</th><td><code>${escapeHtml(baseline.packageLock?.sha256 || 'not recorded')}</code></td></tr>
    <tr><th scope="row">USWDS CSS SHA-256</th><td><code>${escapeHtml(baseline.assets?.css?.sha256 || 'not recorded')}</code></td></tr>
    <tr><th scope="row">USWDS JS SHA-256</th><td><code>${escapeHtml(baseline.assets?.js?.sha256 || 'not recorded')}</code></td></tr>
  </tbody></table></div>
  <p class="small"><a href="data/sources.lock.json">Open the machine-readable source lock</a> · <a href="https://github.com/uswds/uswds/releases/tag/${encodeURIComponent(baseline.release)}">Upstream release</a></p>`;
}

function evidenceSummary(manifest, buildInfo) {
  if (!manifest?.generated) {
    const message = buildInfo?.uswdsRealAssets
      ? 'No automated evidence has been generated for this build.'
      : 'This is an offline illustration; evidence is intentionally not published.';
    return `<div class="callout warning"><strong>${escapeHtml(message)}</strong> Run <code>npm run build:strict</code>, <code>npm run test:browser</code>, and <code>npm run evidence</code>, then rebuild. Missing output is a coverage gap, not a pass.</div>`;
  }
  const failed = manifest.pages.filter(page => page.result !== 'collected-not-reviewed');
  const rows = manifest.pages.map(page => {
    const report = page.report ? `<a href="evidence/latest/${escapeHtml(page.report)}">Open evidence</a>` : 'Not generated';
    const axe = Number.isFinite(page.axeViolations) ? String(page.axeViolations) : 'not recorded';
    return `<tr><td>${escapeHtml(page.name)}</td><td>${escapeHtml(page.result)}</td><td>${report}</td><td>${escapeHtml(axe)}</td></tr>`;
  }).join('');
  return `<div class="${failed.length ? 'callout warning' : 'callout'}">
  <strong>Evidence run ${escapeHtml(manifest.runId)}</strong> — ${manifest.succeeded} collected, ${manifest.failed} failed.
  ${failed.length ? 'Failed pages are listed below; do not treat this run as complete.' : 'Every listed route was collected. This is still automated observation, not human review.'}
  </div>
  <p class="small">Source: ${escapeHtml(manifest.source)} · Git revision: <code>${escapeHtml(manifest.gitSha || 'unknown')}</code> · Browser: ${escapeHtml(manifest.browser || 'not recorded')} · Generated: ${escapeHtml(manifest.generatedAt)}</p>
  <p><a href="evidence/latest/SUMMARY.html">Read the summary</a> · <a href="evidence/latest/COVERAGE.html">Coverage matrix</a> · <a href="evidence/latest/SUMMARY.md">Download raw Markdown</a></p>
  <div class="table-wrap" tabindex="0"><table>
    <caption>Routes collected in run ${escapeHtml(manifest.runId)}</caption>
    <thead><tr><th scope="col">Route</th><th scope="col">Collection</th><th scope="col">Transcript</th><th scope="col">Axe violations</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
  <p class="small">Axe counts are recorded for investigation. A zero count is not a conformance claim. See the <a href="evidence/latest/COVERAGE.html">coverage matrix</a> for states that were and were not collected.</p>`;
}

export function buildStaticPages({root, registry, issues, buildInfo, manifest, lock}) {
  const pages = [];
  const issueCards = issues.map(issue => issueCard(issue, registry)).join('');
  const groups = [...new Set(registry.components.map(component => component.group))];
  const typeOptions = Object.entries(registry.experimentTypes).map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
  const statusOptions = Object.entries(registry.experimentStatuses).map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
  const featured = registry.experiments.slice(0, 4).map(experiment => experimentCard(experiment, registry, manifest)).join('');
  const componentCards = registry.components.map(component => componentCard(component, registry)).join('');
  const componentOptions = registry.components.map(component => `<option value="${escapeHtml(component.slug)}">${escapeHtml(component.name)}</option>`).join('');
  const collected = manifest?.pages?.filter(page => page.result === 'collected-not-reviewed').length || 0;
  const reviewed = registry.experiments.filter(experiment => experiment.review?.status && experiment.review.status !== 'pending').length;
  const metrics = [
    metric(String(registry.experiments.length), 'Experiments', 'Working proposals in the registry.'),
    metric(String(registry.experiments.filter(experiment => experiment.demo).length), 'With a demonstration', 'A prototype can be opened in the lab.'),
    metric(String(collected), 'Routes with automated evidence', 'From the current evidence run, if any.'),
    metric(String(reviewed), 'Human-reviewed decisions', 'A clean build never counts as review.')
  ].join('');
  const assetState = buildInfo.uswdsRealAssets
    ? 'The published baseline uses the exact 3.14.0 npm distribution.'
    : 'OFFLINE ILLUSTRATION ONLY: USWDS package assets were not installed at build time. Do not use this build as upstream comparison evidence.';

  const staticContent = {
    'index.html': fill(template(root, 'index'), {
      version: escapeHtml(registry.baseline.version),
      assetState,
      metrics,
      featured,
      componentCards
    }),
    'components.html': fill(template(root, 'components'), {
      groupOptions: groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join(''),
      cards: componentCards,
      count: `${registry.components.length} components`
    }),
    'experiments.html': fill(template(root, 'experiments'), {
      typeOptions,
      statusOptions,
      cards: registry.experiments.map(experiment => experimentCard(experiment, registry, manifest)).join(''),
      count: `${registry.experiments.length} experiments`
    }),
    'ideas.html': fill(template(root, 'ideas'), {
      cards: issueCards,
      count: `${issues.length} of ${issues.length} curated issues`
    }),
    'evidence.html': fill(template(root, 'evidence'), {
      evidenceSummary: evidenceSummary(manifest, buildInfo)
    }),
    'compare.html': fill(template(root, 'compare'), {
      componentOptions,
      assetState
    }),
    'guide.html': fill(template(root, 'guide'), {
      sourceLock: sourceLockBlock(lock)
    }),
    'preferences.html': template(root, 'preferences')
  };

  const current = {
    'index.html': 'overview',
    'components.html': 'components',
    'experiments.html': 'experiments',
    'ideas.html': 'ideas',
    'evidence.html': 'evidence',
    'compare.html': 'components',
    'guide.html': 'methodology',
    'preferences.html': 'experiments'
  };
  const titles = {
    'index.html': 'USWDS Futures Lab',
    'components.html': 'Components under study',
    'experiments.html': 'Experiments',
    'ideas.html': 'Community ideas',
    'evidence.html': 'Evidence and coverage',
    'compare.html': 'Compare components',
    'guide.html': 'Methodology and governance',
    'preferences.html': 'User preferences panel'
  };
  const descriptions = {
    'index.html': 'Independent, evidence-first experiments for USWDS components and community ideas.',
    'components.html': 'Stable USWDS components included in the lab, with experiments and implementation guidance.',
    'experiments.html': 'Working proposals for USWDS improvements, with evidence and review status.',
    'ideas.html': 'A curated, manually verified catalogue of USWDS issue history and community requests.',
    'evidence.html': 'Automated observations, coverage gaps, and links to human-readable evidence.',
    'compare.html': 'Compare a pinned USWDS baseline with a labelled experimental proposal.',
    'guide.html': 'Methodology, provenance, governance, and limitations for the USWDS Futures Lab.',
    'preferences.html': 'A proposed user preferences panel for appearance, text size, contrast, and motion.'
  };
  const scripts = {
    'components.html': [{src: 'assets/filters.js', type: 'module'}],
    'compare.html': [{src: 'assets/compare.js', type: 'module'}],
    'experiments.html': [{src: 'assets/filters.js', type: 'module'}],
    'ideas.html': [{src: 'assets/filters.js', type: 'module'}]
  };

  for (const [route, content] of Object.entries(staticContent)) {
    pages.push({
      route,
      html: renderPage({
        route,
        title: titles[route],
        description: descriptions[route],
        current: current[route],
        content,
        scripts: scripts[route] || []
      })
    });
  }
  return pages;
}

function componentPage(component, registry, issues, manifest, lock) {
  const relatedExperiments = registry.experiments.filter(experiment => (experiment.components || []).includes(component.slug));
  const scenarios = registry.scenarios.filter(scenario => scenario.component === component.slug);
  const evidenceRoutes = manifest?.pages?.filter(page => page.name.includes(`fixture/${component.slug}-`)) || [];
  const collected = evidenceRoutes.filter(page => page.result === 'collected-not-reviewed').length;
  const relatedIssues = issueLinks(registry, issues, component.issues);
  const guideHref = component.guide.startsWith('experiments/')
    ? `../docs/${docHref(component.guide)}`
    : docHref(component.guide, '../');
  return `<p class="eyebrow">${escapeHtml(component.group)}</p>
<h1>${escapeHtml(component.name)}</h1>
<p class="lead">${escapeHtml(component.summary)}</p>
<div class="callout"><strong>Baseline:</strong> USWDS ${escapeHtml(registry.baseline.version)} with authored fixture markup. <a href="${escapeHtml(component.reference)}">Official component guidance</a> · <a href="${escapeHtml(component.accessibility)}">Official accessibility tests</a></div>

<section aria-labelledby="purpose"><h2 class="section-title" id="purpose">Purpose</h2><p>${escapeHtml(component.purpose)}</p></section>
<section aria-labelledby="when"><h2 class="section-title" id="when">When to use it</h2>${list(component.whenToUse)}</section>
<section aria-labelledby="not-when"><h2 class="section-title" id="not-when">When not to use it</h2>${list(component.whenNotToUse)}</section>
<section aria-labelledby="implementation"><h2 class="section-title" id="implementation">Implementation</h2>${list(component.implementation)}<p><a href="${guideHref}">Read the implementation guide</a></p></section>
<section aria-labelledby="keyboard"><h2 class="section-title" id="keyboard">Keyboard behavior</h2>${list(component.keyboard)}</section>
<section aria-labelledby="preferences"><h2 class="section-title" id="preferences">User preferences</h2>${list(component.preferences)}</section>
<section aria-labelledby="mistakes"><h2 class="section-title" id="mistakes">Common implementation mistakes</h2>${list(component.mistakes)}</section>
<section aria-labelledby="testing"><h2 class="section-title" id="testing">How to test it</h2>${list(component.testing)}</section>
<section aria-labelledby="limitations"><h2 class="section-title" id="limitations">Known limitations</h2>${list(component.limitations)}</section>
<section aria-labelledby="experiments"><h2 class="section-title" id="experiments">Experiments involving this component</h2>
${relatedExperiments.length ? `<div class="cards">${relatedExperiments.map(experiment => experimentCard(experiment, registry, manifest, '../')).join('')}</div>` : '<p>No experiment is registered for this component. The baseline remains available for review.</p>'}</section>
<section aria-labelledby="fixtures"><h2 class="section-title" id="fixtures">Fixtures and comparison</h2>
<ul class="clean">
 <li><a href="../compare.html?component=${encodeURIComponent(component.slug)}">Open the comparison viewer</a></li>
 <li><a href="../fixture/${escapeHtml(component.slug)}-baseline.html">Open the baseline fixture independently</a></li>
 <li><a href="../fixture/${escapeHtml(component.slug)}-experiment.html">Open the experimental fixture independently</a></li>
</ul></section>
<section aria-labelledby="scenarios"><h2 class="section-title" id="scenarios">Test scenarios</h2>${scenarios.length ? list(scenarios.map(scenario => `${scenario.id}: ${scenario.intent} (${scenario.interaction})`)) : '<p>No scenario is registered.</p>'}</section>
<section aria-labelledby="evidence"><h2 class="section-title" id="evidence">Evidence</h2>
<p>${evidenceRoutes.length ? `${collected} of ${evidenceRoutes.length} routes collected in the current run.` : 'No evidence has been collected in this build.'} Human review is pending.</p>
<p><a href="../evidence.html">Open the evidence index</a></p></section>
<section aria-labelledby="sources"><h2 class="section-title" id="sources">Sources and history</h2><ul class="clean">${relatedIssues}</ul>
<p class="small">Source lock: <a href="../data/sources.lock.json">${escapeHtml(lock?.baseline?.release || 'not recorded')}</a>. This page describes an independent lab fixture, not an official USWDS example.</p></section>`;
}

export function buildComponentPages({root, registry, issues, manifest, lock}) {
  return registry.components.map(component => ({
    route: `component/${component.slug}.html`,
    html: renderPage({
      route: `component/${component.slug}.html`,
      title: `${component.name} — component guidance`,
      description: component.summary,
      current: 'components',
      content: componentPage(component, registry, issues, manifest, lock),
      base: '../'
    })
  }));
}

function rebaseDocLinks(html, prefix) {
  return html.replace(/href="(?!https?:|mailto:|#|\/|\.\.\/docs\/)([^"]+)"/g, (_, href) => `href="${prefix}${href}"`);
}

function experimentPage(experiment, registry, issues, manifest, root) {
  const docs = experiment.docs || {};
  const docPrefix = `../docs/experiments/${experiment.id}/`;
  const readme = docs.readme && fs.existsSync(path.join(root, docs.readme))
    ? rebaseDocLinks(renderMarkdown(stripFirstHeading(fs.readFileSync(path.join(root, docs.readme), 'utf8'))), docPrefix)
    : '<p>Proposal document is missing.</p>';
  const implementation = docs.implementation && fs.existsSync(path.join(root, docs.implementation))
    ? rebaseDocLinks(renderMarkdown(stripFirstHeading(fs.readFileSync(path.join(root, docs.implementation), 'utf8'))), docPrefix)
    : '<p>Implementation guidance is missing.</p>';
  const evidence = evidenceLine(experiment, manifest);
  const byNumber = issueMap(issues);
  const related = (experiment.relatedIssues || []).map(relation => {
    const issue = byNumber.get(relation.number);
    const title = issue ? issue.title : `Issue #${relation.number}`;
    return `<li><a href="https://github.com/${escapeHtml(relation.repository)}/issues/${relation.number}">#${relation.number} ${escapeHtml(title)}</a> <span class="small">(${escapeHtml(relation.relationship)})</span></li>`;
  }).join('');
  const components = (experiment.components || []).map(slug => {
    const component = registry.components.find(item => item.slug === slug);
    return component ? `<li><a href="../component/${escapeHtml(slug)}.html">${escapeHtml(component.name)}</a> — baseline and experimental fixtures available.</li>` : '';
  }).join('');
  const files = [
    ['README', docs.readme],
    ['Implementation', docs.implementation],
    ['Test plan', docs.testPlan],
    ['Decision record', docs.decision]
  ].filter(([, file]) => file).map(([label, file]) => {
    const href = file.startsWith('experiments/') ? `../docs/${docHref(file)}` : `../${docHref(file)}`;
    return `<li><a href="${href}">${escapeHtml(label)}</a></li>`;
  }).join('');
  const review = experiment.review || {};
  const reviewMeta = review.status === 'pending'
    ? 'No human reviewer has recorded a decision.'
    : `Reviewer: ${escapeHtml(review.reviewer || 'not recorded')}${review.reviewedAt ? ` on ${escapeHtml(review.reviewedAt)}` : ''}. ${review.decision ? escapeHtml(review.decision) : ''}`;
  const noBaseline = experiment.type === 'new-component'
    ? '<div class="callout warning"><strong>No equivalent component is included in stable USWDS 3.14.0.</strong> The proposal is shown on its own; inventing a baseline would misrepresent upstream. This is a capability gap, not an accessibility failure.</div>'
    : '';
  return `<p class="eyebrow">${escapeHtml(typeLabel(registry, experiment.type))} · ${escapeHtml(statusLabel(registry, experiment.status))}</p>
<h1>${escapeHtml(experiment.title)}</h1>
<p class="lead">${escapeHtml(experiment.summary)}</p>
${noBaseline}
<div class="callout">
  <strong>Review status: ${escapeHtml(review.status || 'pending')}.</strong>
  ${reviewMeta}
  <span class="${evidence.className}">Evidence: ${escapeHtml(evidence.text)}</span>
</div>

<section aria-labelledby="demo"><h2 class="section-title" id="demo">Working demonstration</h2>
<p><a class="button" href="../${escapeHtml(experiment.demo || `experiment/${experiment.id}.html`)}">Open the demonstration</a></p>
${components ? `<ul class="clean">${components}</ul>` : '<p>No stable component maps to this proposal. The demonstration page is the proposal.</p>'}
<p class="small">The comparison viewer does not mirror keyboard input. Open either implementation independently for keyboard and assistive-technology testing.</p></section>

<section aria-labelledby="proposal"><h2 class="section-title" id="proposal">Proposal and context</h2><div class="prose">${readme}</div></section>

<section aria-labelledby="implementation"><h2 class="section-title" id="implementation">Implementation guidance</h2><div class="prose">${implementation}</div></section>

<section aria-labelledby="evidence"><h2 class="section-title" id="evidence">Evidence and limitations</h2>
<p>${escapeHtml(evidence.text)}</p>
<p><a href="../evidence.html">Open the evidence index</a> for transcripts, screenshots, axe observations, and coverage gaps.</p>
<p>Automated evidence is not human approval. The decision record remains authoritative.</p></section>

<section aria-labelledby="history"><h2 class="section-title" id="history">Related USWDS history</h2>${related ? `<ul class="clean">${related}</ul>` : '<p>No related issue is recorded.</p>'}</section>

<section aria-labelledby="files"><h2 class="section-title" id="files">Experiment files</h2><ul class="clean">${files}</ul>
<p class="small">AI assistance disclosed by the contributor: ${escapeHtml((experiment.aiAssistance || []).join(', ') || 'none recorded')}. A human reviewer must assess the evidence before any upstream proposal.</p></section>`;
}

export function buildExperimentPages({root, registry, issues, manifest}) {
  return registry.experiments.map(experiment => ({
    route: `experiment/${experiment.id}.html`,
    html: renderPage({
      route: `experiment/${experiment.id}.html`,
      title: `${experiment.title} — experiment`,
      description: experiment.summary,
      current: 'experiments',
      content: experimentPage(experiment, registry, issues, manifest, root),
      base: '../'
    })
  }));
}

const ROOT_DOCS = ['README.md', 'ACCESSIBILITY.md', 'GOVERNANCE.md', 'AI_DISCLOSURE.md', 'THIRD-PARTY.md', 'CONTRIBUTING.md'];

function markdownFiles(root) {
  const files = [];
  const walk = directory => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  };
  walk(path.join(root, 'docs'));
  walk(path.join(root, 'experiments'));
  return files;
}

function firstHeading(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function withoutFirstHeading(markdown) {
  return markdown.replace(/^#\s+.+\n?/m, '');
}

export function buildDocPages({root}) {
  const entries = [];
  for (const name of ROOT_DOCS) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) {
      entries.push({file, relative: name, route: `docs/${name.replace(/\.md$/, '.html')}`, rootDoc: true});
    }
  }
  for (const file of markdownFiles(root)) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const route = relative.startsWith('experiments/') ? `docs/${relative}` : relative;
    entries.push({file, relative, route: route.replace(/\.md$/, '.html'), rootDoc: false});
  }
  return entries.map(entry => {
    const {file, relative, route: htmlRoute, rootDoc} = entry;
    let markdown = fs.readFileSync(file, 'utf8');
    if (rootDoc) markdown = markdown.replaceAll('](docs/', '](');
    if (relative.startsWith('docs/')) markdown = markdown.replaceAll('](../experiments/', '](experiments/');
    const title = firstHeading(markdown) || path.basename(file, '.md');
    const body = renderMarkdown(withoutFirstHeading(markdown));
    const depth = htmlRoute.split('/').length - 1;
    const base = '../'.repeat(depth);
    const current = relative.startsWith('experiments/') ? 'experiments' : 'methodology';
    const back = relative.startsWith('experiments/') ? `${base}experiments.html` : `${base}guide.html`;
    return {
      route: htmlRoute,
      html: renderPage({
        route: htmlRoute,
        title,
        description: `Documentation: ${title}`,
        current,
        base,
        content: `<p class="eyebrow">Documentation</p><h1>${escapeHtml(title)}</h1><article class="prose">${body}</article>
<p class="small"><a href="${back}">Back to ${relative.startsWith('experiments/') ? 'experiments' : 'methodology'}</a> · <a href="${base}data/sources.lock.json">Source lock</a></p>`
      })
    };
  });
}
