/*
 * Evaluation workspace runtime.
 * Progressive enhancement: static content and direct fixture links remain
 * available without this module. All URL parameters are validated against
 * fixed lists; nothing is interpolated into markup without escaping.
 */
import {
  normalizeEvaluationParams,
  evaluationUrl,
  fixtureUrl,
  experimentsFor,
  statesFor,
  classifyFindings,
  summarizeManualResults,
  diffImageData,
  MANUAL_STATUSES,
  PRESETS
} from './evaluation-core.js';
import {readPrefs, applyPrefs, savePrefs, clearPrefs} from './prefs.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
const MANUAL_KEY = 'uswds-lab-manual-results';
const PRESET_KEY = 'uswds-lab-eval-presets';
const MAX_WIDTH = 1920;
const MIN_WIDTH = 240;

const app = {
  registry: null,
  evidence: null,
  manual: {tests: []},
  build: null,
  config: null,
  ignored: [],
  diff: null,
  diffRequest: 0,
  focus: {on: false, frames: new WeakSet(), scroll: new WeakSet()},
  manualResults: {},
  syncScroll: true,
  performance: undefined,
  performanceRequest: 0
};

async function loadJson(relative) {
  const response = await fetch(relative, {headers: {accept: 'application/json'}});
  if (!response.ok) throw new Error(`${relative}: HTTP ${response.status}`);
  return response.json();
}

function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function status(id, message, warn = false) {
  const node = $(id);
  if (!node) return;
  node.hidden = false;
  node.textContent = message;
  node.classList.toggle('warning-text', warn);
}

function setOptions(select, items, selected) {
  select.replaceChildren(...items.map(item => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    option.selected = item.value === selected;
    return option;
  }));
}

function currentControlConfig() {
  const widthValue = $('width').value;
  const custom = Number($('width-custom').value);
  const width = widthValue === 'custom'
    ? String(Number.isFinite(custom) ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(custom))) : 1280)
    : widthValue;
  return {
    component: $('component').value,
    experiment: $('experiment').value,
    state: $('state').value,
    view: $('view').value,
    theme: $('theme').value,
    direction: $('direction').value,
    language: $('language').value,
    motion: $('motion').value,
    contrast: $('contrast').value,
    textSize: $('textSize').value,
    spacing: $('spacing').value,
    width,
    render: $('render').value,
    capture: $('capture').value
  };
}

function component() {
  return app.registry.components.find(item => item.slug === app.config.component) || app.registry.components[0];
}

function experiment() {
  return app.registry.experiments.find(item => item.id === app.config.experiment) || null;
}

function stateInfo() {
  return statesFor(app.registry, app.config.component).find(item => item.id === app.config.state) || null;
}

function experimentOptionsFor(slug) {
  const items = experimentsFor(app.registry, slug).map(item => ({value: item.id, label: item.title}));
  return items.length ? items : [{value: '', label: 'No experiment registered (baseline only)'}];
}

function rebuildDependentOptions() {
  const componentSlug = $('component').value;
  const experimentSelect = $('experiment');
  const stateSelect = $('state');
  const experiments = experimentOptionsFor(componentSlug);
  setOptions(experimentSelect, experiments, experiments[0].value);
  const states = statesFor(app.registry, componentSlug).map(item => ({value: item.id, label: item.label}));
  setOptions(stateSelect, states, states[0].value);
}

function syncControls() {
  $('component').value = app.config.component;
  const experiments = experimentOptionsFor(app.config.component);
  setOptions($('experiment'), experiments, app.config.experiment);
  if ($('experiment').value !== app.config.experiment) $('experiment').value = experiments[0].value;
  const states = statesFor(app.registry, app.config.component).map(item => ({value: item.id, label: item.label}));
  setOptions($('state'), states, app.config.state);
  if ($('state').value !== app.config.state) $('state').value = states[0].value;
  for (const key of ['view', 'theme', 'direction', 'language', 'motion', 'contrast', 'textSize', 'spacing', 'render', 'capture']) {
    const control = $(key);
    if (control && [...control.options].some(option => option.value === app.config[key])) control.value = app.config[key];
  }
  const presets = ['320', '390', '768', '1280'];
  if (presets.includes(app.config.width)) {
    $('width').value = app.config.width;
    $('width-custom-field').hidden = true;
  } else {
    $('width').value = 'custom';
    $('width-custom-field').hidden = false;
    $('width-custom').value = app.config.width;
  }
  const captureRelevant = app.config.render === 'captured' || app.config.view === 'difference';
  $('capture-field').hidden = !captureRelevant;
  const locked = app.config.render === 'captured' || app.config.view === 'difference';
  for (const key of ['theme', 'motion', 'contrast', 'textSize', 'spacing', 'direction', 'language', 'width']) {
    $(key).disabled = locked;
  }
  $('width-custom').disabled = locked;
}

function updateHeader() {
  const item = component();
  const exp = experiment();
  const state = stateInfo();
  $('eval-eyebrow').textContent = `${item.group} · ${state?.label || 'Initial rendering'} · ${exp ? exp.title : 'baseline only'}`;
  $('eval-title').textContent = item.name;
  $('eval-summary').textContent = item.summary;
  $('eval-context').innerHTML = `<p><strong>Experiment:</strong> ${esc(exp?.title || 'No experiment registered')} — ${esc(exp?.summary || 'The baseline is available without an experimental treatment.')}</p>
<p><strong>Baseline:</strong> USWDS ${esc(app.registry.baseline.version)} (pinned npm distribution). <strong>Experiment:</strong> lab-authored prototype (<code>site/assets/experiment.css</code>), not official USWDS or OGDS.</p>
<p><strong>State:</strong> ${esc(state?.label || 'Initial rendering')} — ${esc(state?.description || '')}</p>
<p><strong>Status:</strong> ${esc(exp?.status || 'baseline only')}. <strong>Known limits:</strong> ${esc((item.limitations || []).join(' ') || 'See the experiment documentation.')}</p>`;
  $('state-description').textContent = state?.description || '';
  $('eval-component-link').href = `component/${encodeURIComponent(item.slug)}.html`;
  $('eval-experiment-link').href = exp ? `experiment/${encodeURIComponent(exp.id)}.html` : 'experiments.html';
  $('eval-reference').href = item.reference;
  $('eval-accessibility').href = item.accessibility;
}

function updateUrl() {
  history.replaceState(null, '', evaluationUrl(app.config, location.pathname));
}

function applyConfig(next, {message = ''} = {}) {
  const params = new URLSearchParams(Object.entries(next).filter(([, value]) => value !== undefined));
  params.set('v', '1');
  const normalized = normalizeEvaluationParams(params, app.registry);
  app.config = normalized.config;
  app.ignored = normalized.ignored;
  syncControls();
  updateUrl();
  updateHeader();
  updatePreview();
  renderEvidence();
  renderPerformance();
  renderManualTests();
  renderSavedPresets();
  if (app.ignored.length) status('param-status', `Ignored invalid value(s): ${app.ignored.join(', ')}. Safe defaults were used.`, true);
  else if (!message) $('param-status').hidden = true;
  if (message) status('param-status', message);
  if (app.config.render === 'captured') setPresetPressed();
}

function setPresetPressed() {
  for (const button of document.querySelectorAll('[data-preset]')) button.setAttribute('aria-pressed', 'false');
}

function widthPx() {
  return Number(app.config.width);
}

function findPair() {
  const pairs = app.evidence?.comparison?.pairs || [];
  return pairs.find(pair => pair.component === app.config.component && pair.state === app.config.state && pair.condition === app.config.capture) || null;
}

function pairUrl(pair, side) {
  if (!pair) return null;
  const file = side === 'baseline' ? pair.baseline : pair.experiment;
  return file ? `evidence/latest/${file}` : null;
}

function applyReveal(value) {
  $('stage').style.setProperty('--reveal-position', `${value}%`);
  $('reveal-output').value = `${value}%`;
}

function applyOnion(value) {
  $('stage').style.setProperty('--onion-opacity', String(value / 100));
  $('opacity-output').value = `${value}%`;
}

function updatePreview() {
  const config = app.config;
  const live = config.render === 'live' && config.view !== 'difference';
  $('stage').dataset.view = config.view;
  $('stage').dataset.render = live ? 'live' : 'captured';
  $('live-stage').hidden = !live;
  $('captured-stage').hidden = live;
  $('difference-panel').hidden = config.view !== 'difference';
  $('reveal-control').hidden = !['reveal', 'onion'].includes(config.view);
  $('onion-control').hidden = config.view !== 'onion';
  $('reveal-note').hidden = config.view !== 'reveal';
  $('onion-note').hidden = config.view !== 'onion';
  $('capture-note').hidden = config.render !== 'captured';

  const conditions = [
    `state: ${stateInfo()?.label || config.state}`,
    `appearance: ${config.theme}`,
    `direction: ${config.direction}`,
    `language: ${config.language}`,
    `text: ${config.textSize}`,
    `spacing: ${config.spacing}`,
    `motion: ${config.motion}`,
    `contrast: ${config.contrast}`,
    `width: ${config.width} CSS px`
  ].join(' · ');
  $('preview-conditions').textContent = live
    ? `Live fixtures · ${conditions}.`
    : `Captured screenshots at ${config.capture} · fixed 900 × 900 viewport, default text, LTR, default motion. ${conditions} do not apply to the captures.`;
  $('pane-size-note').textContent = live && config.view === 'split'
    ? `Each pane is ${config.width} CSS px wide. Side-by-side needs ${Number(config.width) * 2 + 16} px plus this page's layout; the comparison area scrolls horizontally when it does not fit. Use reveal or onion mode for an aligned overlay, or the independent links for full-window testing.`
    : '';

  if (live) {
    const before = fixtureUrl(config, 'baseline');
    const after = fixtureUrl(config, 'experiment');
    $('before').src = before;
    $('after').src = after;
    $('open-before').href = before;
    $('open-after').href = after;
    for (const [id, width] of [['before', widthPx()], ['after', widthPx()]]) {
      $(id).style.width = '100%';
      const pane = $(id).closest('.eval-pane');
      if (pane) pane.style.width = `${width}px`;
      $(id).title = `${id === 'before' ? 'USWDS baseline' : 'Experimental'} component, ${width} CSS pixels wide`;
    }
    const frames = $('frames');
    frames.style.width = config.view === 'split' ? `${widthPx() * 2 + 16}px` : `${widthPx()}px`;
    frames.style.gridTemplateColumns = config.view === 'split' ? `repeat(2, ${widthPx()}px)` : 'none';
    const visualOnly = ['onion', 'reveal'].includes(config.view);
    for (const id of ['before', 'after']) {
      if (visualOnly) {
        $(id).setAttribute('inert', '');
        $(id).setAttribute('aria-hidden', 'true');
      } else {
        $(id).removeAttribute('inert');
        $(id).removeAttribute('aria-hidden');
      }
    }
    $('capture-note').hidden = true;
    bindFrameInspection();
  } else {
    $('capture-note').hidden = config.render !== 'captured';
    if (config.render === 'captured') {
      $('capture-note').textContent = 'Captured screenshots use matched Playwright browser conditions. They are not live emulation; fixture controls are locked because the capture matrix is fixed (900 × 900, default text, LTR, default motion).';
    }
    const pair = findPair();
    const baselineUrl = pairUrl(pair, 'baseline');
    const experimentUrl = pairUrl(pair, 'experiment');
    const missing = !pair;
    $('capture-missing').hidden = !missing;
    $('capture-missing').textContent = missing
      ? `No captured ${config.capture} pair exists for ${component().name} / ${config.state} in this build. Live comparison is still available. Run npm run evidence to regenerate matched captures; do not treat this gap as a pass.`
      : '';
    for (const [id, url, side] of [['capture-before', baselineUrl, 'baseline'], ['capture-after', experimentUrl, 'experiment']]) {
      $(id).hidden = !url;
      if (url) {
        $(id).src = url;
        $(id).alt = `${component().name}, ${stateInfo()?.label || config.state} state, ${side} (${config.capture} browser condition), matched Playwright capture`;
        $(id).closest('figure').hidden = false;
      } else {
        $(id).closest('figure').hidden = true;
      }
    }
    $('capture-meta').textContent = missing
      ? ''
      : `Matched captures: ${pair.width} × ${pair.height} CSS px, browser ${pair.browser || 'recorded in the run'}, condition ${pair.condition}. Captures are generated by Playwright; they are not live browser emulation.`;
    if (config.view === 'difference') renderDifference();
  }
  if (config.view === 'difference') {
    $('capture-note').hidden = false;
    $('capture-note').textContent = 'Difference mode compares matched Playwright captures at the selected screenshot condition. It does not inspect a live browser and cannot enable real forced-colours rendering.';
  }
  if (config.view === 'reveal') applyReveal(Number($('reveal').value));
  if (config.view === 'onion') applyOnion(Number($('opacity').value));
}

function bindFrameInspection() {
  if (app.config.render !== 'live') return;
  for (const id of ['before', 'after']) {
    const frame = $(id);
    if (app.focus.frames.has(frame)) continue;
    app.focus.frames.add(frame);
    frame.addEventListener('load', () => {
      attachFocus(frame);
      attachScrollSync(frame);
    });
    try {
      attachFocus(frame);
      attachScrollSync(frame);
    } catch {}
  }
}

function describeElement(element) {
  if (!element) return 'No focused element.';
  const tag = element.tagName.toLowerCase();
  const type = element.getAttribute('type');
  const explicitRole = element.getAttribute('role');
  const implicit = {
    a: 'link', button: 'button', select: 'combobox', textarea: 'textbox', summary: 'button', main: 'main',
    h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading', p: 'paragraph'
  }[tag] || (tag === 'input' ? ({text: 'textbox', email: 'textbox', tel: 'textbox', search: 'searchbox', checkbox: 'checkbox', radio: 'radio', submit: 'button', reset: 'button', number: 'spinbutton'}[type] || 'textbox') : tag);
  const role = explicitRole || implicit;
  const label = element.getAttribute('aria-label')
    || (element.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).map(id => element.ownerDocument.getElementById(id)?.textContent || '').join(' ').trim()
    || element.labels?.[0]?.textContent?.trim()
    || element.textContent?.trim()
    || element.getAttribute('title')
    || '';
  const states = [];
  for (const attribute of ['aria-expanded', 'aria-pressed', 'aria-checked', 'aria-invalid', 'aria-current']) {
    if (element.hasAttribute(attribute)) states.push(`${attribute}=${element.getAttribute(attribute)}`);
  }
  if ('required' in element && element.required) states.push('required');
  if ('disabled' in element && element.disabled) states.push('disabled');
  if ('checked' in element && element.checked) states.push('checked');
  const name = label.replace(/\s+/g, ' ').slice(0, 100);
  return `${role}${name ? ` “${name}”` : ''}${states.length ? ` (${states.join(', ')})` : ''}`;
}

function attachFocus(frame) {
  const doc = frame.contentDocument;
  if (!doc || app.focus.frames.has(doc)) return;
  app.focus.frames.add(doc);
  doc.addEventListener('focusin', event => {
    if (!app.focus.on) return;
    const side = frame.id === 'before' ? 'before' : 'after';
    const description = describeElement(event.target);
    $(`focus-${side}`).textContent = description;
    status('focus-status', `${side === 'before' ? 'Baseline' : 'Experiment'}: ${description}`);
  });
}

function attachScrollSync(frame) {
  const doc = frame.contentDocument;
  if (!doc || app.focus.scroll.has(doc)) return;
  app.focus.scroll.add(doc);
  const other = $(frame.id === 'before' ? 'after' : 'before');
  doc.addEventListener('scroll', () => {
    if (!app.syncScroll || app.config.view !== 'split' || app.config.render !== 'live') return;
    try {
      const target = other.contentDocument;
      if (!target) return;
      const source = doc.scrollingElement || doc.documentElement;
      const targetScroller = target.scrollingElement || target.documentElement;
      if (Math.abs(targetScroller.scrollTop - source.scrollTop) > 2) {
        targetScroller.scrollTop = source.scrollTop;
      }
    } catch {}
  }, {passive: true});
}

async function loadImage(url) {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await image.decode();
  return image;
}

async function renderDifference() {
  const request = ++app.diffRequest;
  const pair = findPair();
  const canvas = $('diff-canvas');
  const summary = $('diff-summary');
  const baselineUrl = pairUrl(pair, 'baseline');
  const experimentUrl = pairUrl(pair, 'experiment');
  $('diff-baseline-link').href = baselineUrl || '#';
  $('diff-experiment-link').href = experimentUrl || '#';
  if (!baselineUrl || !experimentUrl) {
    app.diff = null;
    canvas.hidden = true;
    summary.textContent = `No captured ${app.config.capture} pair is available. Pixel difference cannot run without matched screenshots; this is a coverage gap, not a pass.`;
    return;
  }
  canvas.hidden = false;
  try {
    const [baseline, experimentImage] = await Promise.all([loadImage(baselineUrl), loadImage(experimentUrl)]);
    if (request !== app.diffRequest) return;
    if (baseline.naturalWidth !== experimentImage.naturalWidth || baseline.naturalHeight !== experimentImage.naturalHeight) {
      app.diff = null;
      summary.textContent = `Captures have different dimensions (${baseline.naturalWidth}×${baseline.naturalHeight} vs ${experimentImage.naturalWidth}×${experimentImage.naturalHeight}); no diff was computed.`;
      return;
    }
    const width = baseline.naturalWidth;
    const height = baseline.naturalHeight;
    const scratch = document.createElement('canvas');
    scratch.width = width;
    scratch.height = height;
    const context = scratch.getContext('2d', {willReadFrequently: true});
    context.drawImage(baseline, 0, 0);
    const baselineData = context.getImageData(0, 0, width, height).data;
    context.clearRect(0, 0, width, height);
    context.drawImage(experimentImage, 0, 0);
    const experimentData = context.getImageData(0, 0, width, height).data;
    app.diff = {baselineData, experimentData, width, height};
    canvas.width = width;
    canvas.height = height;
    canvas.setAttribute('aria-label', `Pixel difference image for ${component().name}, ${stateInfo()?.label || app.config.state}, ${app.config.capture} condition`);
    drawDifference();
  } catch (error) {
    app.diff = null;
    summary.textContent = `The captures could not be loaded for comparison (${error.message}).`;
  }
}

function drawDifference() {
  if (!app.diff) return;
  const threshold = Number($('diff-threshold').value);
  const intensity = Number($('diff-intensity').value) / 100;
  const result = diffImageData(app.diff.baselineData, app.diff.experimentData, app.diff.width, app.diff.height, {threshold, intensity});
  const canvas = $('diff-canvas');
  const context = canvas.getContext('2d');
  context.putImageData(new ImageData(result.diff, app.diff.width, app.diff.height), 0, 0);
  const bounds = result.bounds ? `Changed area: ${result.bounds.width} × ${result.bounds.height} at (${result.bounds.x}, ${result.bounds.y}).` : 'No changed region.';
  $('diff-summary').textContent = `${changedCopy(result, bounds)} Changed pixels are a visual measurement, not an accessibility score.`;
}

function changedCopy(result, bounds) {
  return `Changed pixels: ${result.changed} of ${result.total} (${result.percent.toFixed(2)}%) at threshold ${result.threshold}. ${bounds}`;
}

function pairCountFor(componentSlug) {
  return (app.evidence?.comparison?.pairs || []).filter(pair => pair.component === componentSlug).length;
}

function evidencePage(route) {
  return (app.evidence?.pages || []).find(page => page.name === route) || null;
}

function renderEvidence() {
  const container = $('eval-evidence');
  if (!container) return;
  const item = component();
  const exp = experiment();
  const baseline = evidencePage(`fixture/${item.slug}-baseline.html`);
  const experimentPageEntry = evidencePage(`fixture/${item.slug}-experiment.html`);
  const manualTests = app.manual.tests.filter(test => test.component === item.slug);
  const manualSummary = summarizeManualResults(manualTests, app.manualResults);
  const evidence = app.evidence;
  const parts = [];
  if (!evidence?.generated) {
    parts.push('<div class="callout warning"><strong>No automated evidence is published in this build.</strong> Missing evidence is a gap, not a pass. Run <code>npm run evidence</code> and rebuild.</div>');
  } else {
    parts.push(`<div class="callout"><strong>Evidence run ${esc(evidence.runId)}</strong> — ${esc(evidence.generatedAt || 'date not recorded')}; baseline source ${esc(evidence.source)}; git revision <code>${esc(evidence.gitSha || 'unknown')}</code>; browser ${esc(evidence.browser || 'not recorded')}.</div>`);
  }
  parts.push(`<dl class="focus-results">
    <dt>Baseline route</dt><dd>${baseline ? `${esc(baseline.result)} · axe violations: ${esc(String(baseline.axeViolations ?? 'not recorded'))}` : 'No evidence for this route in the current run.'}</dd>
    <dt>Experiment route</dt><dd>${experimentPageEntry ? `${esc(experimentPageEntry.result)} · axe violations: ${esc(String(experimentPageEntry.axeViolations ?? 'not recorded'))}` : 'No evidence for this route in the current run.'}</dd>
    <dt>Captured states</dt><dd>${pairCountFor(item.slug)} matched screenshot pair(s) in this run.</dd>
    <dt>Manual tests</dt><dd>${manualSummary.completed} of ${manualSummary.total} recorded locally in this browser. Published evidence never treats an unrecorded test as complete.</dd>
  </dl>`);
  const axeStates = buildAxeComparison(item.slug);
  if (axeStates.length) {
    const rows = axeStates.map(entry => `<tr><th scope="row">${esc(entry.state)}</th><td>${entry.baseline}</td><td>${entry.experiment}</td><td>${entry.fixed}</td><td>${entry.introduced}</td><td>${entry.common}</td></tr>`).join('');
    parts.push(`<div class="table-wrap" tabindex="0"><table><caption>State-level axe observations and regression classification</caption><thead><tr><th scope="col">State</th><th scope="col">Baseline violations</th><th scope="col">Experiment violations</th><th scope="col">Only baseline (candidate fix)</th><th scope="col">Only experiment (introduced)</th><th scope="col">Both</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small">“Candidate fix” only means the violation disappeared from this state. Confirm the tested content is equivalent before calling it fixed. Axe counts are not a conformance claim.</p>`);
  }
  const limitations = [...(item.limitations || []), ...(exp?.evaluation?.concerns || [])];
  parts.push(`<h3>Known limitations</h3><ul class="clean">${limitations.map(limit => `<li>${esc(limit)}</li>`).join('') || '<li>None recorded.</li>'}</ul>
    <p><a href="evidence.html">Open the full evidence index</a> · ${exp ? `<a href="experiment/${esc(exp.id)}.html">Experiment evidence</a> · ` : ''}<a href="${esc(item.accessibility)}">Official USWDS accessibility tests</a></p>`);
  container.innerHTML = parts.join('');
}

function buildAxeComparison(componentSlug) {
  const baseline = evidencePage(`fixture/${componentSlug}-baseline.html`);
  const experimentEntry = evidencePage(`fixture/${componentSlug}-experiment.html`);
  if (!baseline?.axeStates || !experimentEntry?.axeStates) return [];
  const experimentStates = new Map(experimentEntry.axeStates.map(entry => [entry.state, entry]));
  return baseline.axeStates.map(entry => {
    const counterpart = experimentStates.get(entry.state);
    const classification = classifyFindings(entry.violations || [], counterpart?.violations || []);
    const label = statesFor(app.registry, componentSlug).find(state => state.id === entry.state)?.label || entry.state;
    return {
      state: label,
      baseline: entry.violationCount ?? (entry.violations || []).length,
      experiment: counterpart?.violationCount ?? (counterpart?.violations || []).length,
      fixed: classification.fixed.length,
      introduced: classification.introduced.length,
      common: classification.common.length
    };
  });
}

async function loadPerformance() {
  if (app.performance !== undefined) return app.performance;
  try {
    const response = await fetch('evidence/latest/performance.json');
    app.performance = response.ok ? await response.json() : null;
  } catch {
    app.performance = null;
  }
  return app.performance;
}

function formatBytes(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'not recorded';
  return number >= 1024 ? `${(number / 1024).toFixed(1)} kB` : `${number} B`;
}

function formatNumber(value, unit = '') {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'not recorded';
  return `${Number.isInteger(number) ? number : number.toFixed(2)}${unit}`;
}

function deltaCell(delta, unit = '') {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${unit === 'bytes' ? formatBytes(delta) : formatNumber(delta, unit)}`;
}

function budgetLabel(entry) {
  if (!entry) return 'No entry';
  const failures = entry.budgets.filter(check => check.status === 'fail');
  const warnings = entry.budgets.filter(check => check.status === 'warn');
  if (failures.length) return `Hard budget failed (${failures.length})`;
  if (warnings.length) return `Within hard budgets; ${warnings.length} timing warning(s)`;
  return 'Within budgets';
}

async function renderPerformance() {
  const container = $('performance-summary');
  if (!container) return;
  const request = ++app.performanceRequest;
  const data = await loadPerformance();
  if (request !== app.performanceRequest) return;
  if (!data?.entries?.length) {
    container.innerHTML = '<div class="callout warning"><strong>No performance evidence is published in this build.</strong> Missing performance data is a coverage gap, not a pass. Run <code>npm run evidence</code> and rebuild.</div>';
    return;
  }
  const baseline = data.entries.find(entry => entry.component === app.config.component && entry.variant === 'baseline');
  const experimentEntry = data.entries.find(entry => entry.component === app.config.component && entry.variant === 'experiment');
  const comparison = data.comparison?.find(entry => entry.component === app.config.component);
  if (!baseline || !experimentEntry || !comparison) {
    container.innerHTML = `<div class="callout warning"><strong>No performance pair for ${esc(component().name)} in this run.</strong> This is a coverage gap, not a pass.</div>`;
    return;
  }
  const rows = [
    ['Total transfer', 'total', 'bytes'],
    ['CSS', 'css', 'bytes'],
    ['JavaScript', 'javascript', 'bytes'],
    ['Fonts', 'font', 'bytes'],
    ['Requests', null, 'requests'],
    ['DOM elements', null, 'dom']
  ].map(([label, group, kind]) => {
    let before;
    let after;
    let delta;
    if (kind === 'bytes') {
      before = baseline.aggregate.transferSize[group].median;
      after = experimentEntry.aggregate.transferSize[group].median;
      delta = comparison.costs.transferSize[group].bytes;
    } else if (kind === 'requests') {
      before = baseline.aggregate.requests.total.median;
      after = experimentEntry.aggregate.requests.total.median;
      delta = comparison.costs.requests.total.requests;
    } else {
      before = baseline.aggregate.domElements.median;
      after = experimentEntry.aggregate.domElements.median;
      delta = comparison.costs.domElements.elements;
    }
    const percent = kind === 'bytes' ? comparison.costs.transferSize[group].percent : null;
    return `<tr><th scope="row">${esc(label)}</th><td>${kind === 'bytes' ? formatBytes(before) : formatNumber(before)}</td><td>${kind === 'bytes' ? formatBytes(after) : formatNumber(after)}</td><td>${deltaCell(delta, kind === 'bytes' ? 'bytes' : '')}${percent === null ? '' : ` (${percent > 0 ? '+' : ''}${percent}%)`}</td></tr>`;
  }).join('');
  const timingRows = ['largestContentfulPaint', 'firstContentfulPaint', 'cumulativeLayoutShift', 'totalBlockingTime', 'load'].map(key => {
    const before = baseline.aggregate.timings[key];
    const after = experimentEntry.aggregate.timings[key];
    const label = {
      largestContentfulPaint: 'Largest Contentful Paint',
      firstContentfulPaint: 'First Contentful Paint',
      cumulativeLayoutShift: 'Cumulative Layout Shift',
      totalBlockingTime: 'Total Blocking Time',
      load: 'Load event'
    }[key];
    const format = value => key === 'cumulativeLayoutShift' ? formatNumber(value) : formatNumber(value, ' ms');
    return `<tr><th scope="row">${esc(label)}</th><td>${format(before.median)} <span class="small">(${format(before.min)}–${format(before.max)})</span></td><td>${format(after.median)} <span class="small">(${format(after.min)}–${format(after.max)})</span></td><td>${format(after.median - before.median)}</td></tr>`;
  }).join('');
  const failures = [...baseline.budgets, ...experimentEntry.budgets].filter(check => check.status === 'fail');
  const warnings = [...baseline.budgets, ...experimentEntry.budgets].filter(check => check.status === 'warn');
  const links = $('performance-links');
  if (links) links.innerHTML = '<a href="evidence/latest/performance.json">Open the raw performance JSON</a> · <a href="evidence.html">Open the evidence index</a> · <a href="data/performance-budgets.json">Review the budgets</a>';
  container.innerHTML = `<p class="small">${esc(data.conditions?.note || '')} ${data.conditions?.runs || 3} runs per route; median shown with min–max.</p>
  <div class="table-wrap" tabindex="0"><table><caption>Resource cost: baseline vs experiment (median)</caption><thead><tr><th scope="col">Metric</th><th scope="col">Baseline</th><th scope="col">Experiment</th><th scope="col">Change</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="small"><strong>Baseline:</strong> ${esc(budgetLabel(baseline))}. <strong>Experiment:</strong> ${esc(budgetLabel(experimentEntry))}.</p>
  ${failures.length ? `<div class="callout warning"><strong>Hard budget failure.</strong><ul class="clean">${failures.map(check => `<li>${esc(check.route)}: ${esc(check.metric)} ${formatNumber(check.actual)} exceeds ${formatNumber(check.limit)}</li>`).join('')}</ul></div>` : '<p class="small">No hard byte, request, or DOM budget failures in this pair.</p>'}
  <div class="table-wrap" tabindex="0"><table><caption>Timing observations: baseline vs experiment (warning only)</caption><thead><tr><th scope="col">Metric</th><th scope="col">Baseline median (range)</th><th scope="col">Experiment median (range)</th><th scope="col">Change</th></tr></thead><tbody>${timingRows}</tbody></table></div>
  ${warnings.length ? `<p class="small">${warnings.length} timing warning(s) recorded. They are not failures: local timing is noisy.</p>` : ''}
  <p class="small">These measurements describe the fixture page under the stated conditions. They are not a Lighthouse score, a field Web Vitals sample, or an accessibility metric.</p>`;
}

function manualStorageKey() {
  return MANUAL_KEY;
}

function readManualResults() {
  const stored = storageGet(manualStorageKey(), {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function saveManualResults() {
  const saved = storageSet(manualStorageKey(), app.manualResults);
  if (!saved) status('manual-status', 'This browser blocked local storage. Results are visible but will not persist.', true);
  return saved;
}

function renderManualTests() {
  const container = $('manual-tests');
  if (!container) return;
  const tests = app.manual.tests.filter(test => test.component === app.config.component);
  const summary = $('manual-summary');
  if (!tests.length) {
    container.innerHTML = '<p>No component-specific manual test definitions are registered for this component yet. Use the official USWDS accessibility tests and the general testing guidance.</p>';
    summary.textContent = 'No manual test definitions registered for this component. This is a coverage gap, not a pass.';
    return;
  }
  const results = app.manualResults;
  container.innerHTML = tests.map(test => {
    const saved = results[test.id] || {};
    const statusValue = MANUAL_STATUSES.some(entry => entry.value === saved.status) ? saved.status : 'not-tested';
    const options = MANUAL_STATUSES.map(entry => `<option value="${entry.value}"${entry.value === statusValue ? ' selected' : ''}>${esc(entry.label)}</option>`).join('');
    return `<article class="manual-test" id="manual-${esc(test.id)}" data-test="${esc(test.id)}" data-status="${esc(statusValue)}">
  <h3>${esc(test.title)}</h3>
  <p class="meta">${esc(test.requirement)}${test.requiresAssistiveTechnology ? ' · Real assistive technology required' : ''}${test.conditional ? ' · Conditional in the implementation' : ''} · <a href="${esc(test.source)}">Source</a></p>
  <p>${esc(test.purpose)}</p>
  <details>
    <summary>Instructions and expected result</summary>
    <p><strong>Preconditions:</strong> ${esc(test.preconditions)}</p>
    <ol>${test.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
    <p><strong>Expected:</strong> ${esc(test.expected)}</p>
    <p class="manual-result-note">${esc(test.notes)}</p>
  </details>
  <div class="manual-fields">
    <div class="field">
      <label for="manual-${esc(test.id)}-status">Result</label>
      <select id="manual-${esc(test.id)}-status" data-manual-field="status">${options}</select>
    </div>
    <div class="field">
      <label for="manual-${esc(test.id)}-reviewer">Reviewer</label>
      <input id="manual-${esc(test.id)}-reviewer" type="text" data-manual-field="reviewer" value="${esc(saved.reviewer || '')}" autocomplete="name">
    </div>
    <div class="field">
      <label for="manual-${esc(test.id)}-date">Date</label>
      <input id="manual-${esc(test.id)}-date" type="text" data-manual-field="date" value="${esc(saved.date || '')}" inputmode="numeric">
    </div>
    <div class="field">
      <label for="manual-${esc(test.id)}-browser">Browser and operating system</label>
      <input id="manual-${esc(test.id)}-browser" type="text" data-manual-field="browser" value="${esc(saved.browser || '')}" placeholder="For example: Chrome 157, Windows 11">
    </div>
    <div class="field">
      <label for="manual-${esc(test.id)}-at">Assistive technology (if used)</label>
      <input id="manual-${esc(test.id)}-at" type="text" data-manual-field="at" value="${esc(saved.at || '')}" placeholder="For example: NVDA 2026.1">
    </div>
    <div class="field">
      <label for="manual-${esc(test.id)}-evidence">Evidence link or note</label>
      <input id="manual-${esc(test.id)}-evidence" type="text" data-manual-field="evidence" value="${esc(saved.evidence || '')}">
    </div>
  </div>
  <div class="manual-fields">
    <div class="field">
      <label for="manual-${esc(test.id)}-baseline">Baseline observation</label>
      <textarea id="manual-${esc(test.id)}-baseline" data-manual-field="baseline">${esc(saved.baseline || '')}</textarea>
    </div>
    <div class="field">
      <label for="manual-${esc(test.id)}-experiment">Experiment observation</label>
      <textarea id="manual-${esc(test.id)}-experiment" data-manual-field="experiment">${esc(saved.experiment || '')}</textarea>
    </div>
  </div>
  <div class="field">
    <label for="manual-${esc(test.id)}-notes">Notes and limitations</label>
    <textarea id="manual-${esc(test.id)}-notes" data-manual-field="notes">${esc(saved.notes || '')}</textarea>
  </div>
</article>`;
  }).join('');
  updateManualSummary();
  for (const test of tests) {
    const article = document.getElementById(`manual-${test.id}`);
    if (!article) continue;
    for (const field of article.querySelectorAll('[data-manual-field]')) {
      if (field.dataset.manualField === 'status') {
        field.addEventListener('change', () => updateManualResult(test, article));
      } else {
        field.addEventListener('input', () => updateManualResult(test, article));
      }
    }
  }
}

function updateManualResult(test, article) {
  const read = name => article.querySelector(`[data-manual-field="${name}"]`)?.value?.trim() || '';
  const statusValue = read('status') || 'not-tested';
  const notes = read('notes');
  if (statusValue === 'not-applicable' && !notes) {
    status('manual-status', 'Not applicable requires a justification in the notes field. The result was not saved.', true);
    article.querySelector('[data-manual-field="status"]').value = app.manualResults[test.id]?.status || 'not-tested';
    article.querySelector('[data-manual-field="notes"]').focus();
    return;
  }
  const previous = app.manualResults[test.id] || {};
  const next = {
    status: statusValue,
    notes,
    reviewer: read('reviewer'),
    browser: read('browser'),
    at: read('at'),
    evidence: read('evidence'),
    baseline: read('baseline'),
    experiment: read('experiment'),
    date: read('date') || (statusValue !== 'not-tested' && !previous.date ? new Date().toISOString().slice(0, 10) : previous.date || '')
  };
  app.manualResults[test.id] = next;
  article.dataset.status = statusValue;
  const dateField = article.querySelector('[data-manual-field="date"]');
  if (dateField && next.date && !dateField.value) dateField.value = next.date;
  saveManualResults();
  updateManualSummary();
  status('manual-status', `Recorded ${test.title}: ${statusValue}. Local to this browser; not published evidence.`);
}

function updateManualSummary() {
  const tests = app.manual.tests.filter(test => test.component === app.config.component);
  const summary = summarizeManualResults(tests, app.manualResults);
  const atTests = tests.filter(test => test.requiresAssistiveTechnology);
  const atCompleted = atTests.filter(test => ['pass', 'fail', 'needs-review'].includes(app.manualResults[test.id]?.status)).length;
  const node = $('manual-summary');
  if (!node) return;
  if (!tests.length) {
    node.textContent = 'No manual test definitions registered for this component. This is a coverage gap, not a pass.';
    return;
  }
  const counts = MANUAL_STATUSES.map(entry => `${entry.label}: ${summary.byStatus[entry.value] || 0}`).join(' · ');
  node.textContent = `${summary.completed} of ${summary.total} manual tests recorded in this browser. Real assistive-technology tests attempted: ${atCompleted} of ${atTests.length}. ${counts}. These local records are not published evidence and do not imply conformance.`;
}

function download(filename, content, type) {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportManual(format) {
  const tests = app.manual.tests.filter(test => test.component === app.config.component);
  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    component: app.config.component,
    experiment: app.config.experiment || null,
    evaluation: {...app.config},
    warning: 'Human-recorded local results. Not published evidence. Guidepup is a simulation, not NVDA, JAWS, or VoiceOver.',
    tests: tests.map(test => ({id: test.id, title: test.title, requirement: test.requirement, source: test.source, result: app.manualResults[test.id] || {status: 'not-tested'}}))
  };
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'json') {
    download(`${app.config.component}-manual-results-${date}.json`, `${JSON.stringify(payload, null, 2)}\n`, 'application/json');
    status('manual-status', 'Exported JSON. Nothing was submitted or committed.');
  } else {
    const lines = [
      `# Manual accessibility results: ${component().name}`,
      '',
      `- Date: ${date}`,
      `- Experiment: ${experiment()?.title || 'none'}`,
      `- Evaluation configuration: ${location.href}`,
      '',
      '> Human-recorded local results. Not published evidence. Guidepup is a simulation, not NVDA, JAWS, or VoiceOver.',
      ''
    ];
    for (const test of payload.tests) {
      const result = test.result;
      lines.push(`## ${test.title}`, '', `- Requirement: ${test.requirement}`, `- Source: ${test.source}`, `- Result: ${result.status || 'not-tested'}`, `- Reviewer: ${result.reviewer || 'not recorded'}`, `- Date: ${result.date || 'not recorded'}`, `- Browser and operating system: ${result.browser || 'not recorded'}`, `- Assistive technology: ${result.at || 'not recorded'}`, `- Evidence: ${result.evidence || 'not recorded'}`, '', `Baseline: ${result.baseline || 'not recorded'}`, '', `Experiment: ${result.experiment || 'not recorded'}`, '', `Notes: ${result.notes || 'not recorded'}`, '');
    }
    download(`${app.config.component}-manual-results-${date}.md`, `${lines.join('\n')}\n`, 'text/markdown');
    status('manual-status', 'Exported Markdown. Nothing was submitted or committed.');
  }
}

function readSavedPresets() {
  const stored = storageGet(PRESET_KEY, []);
  return Array.isArray(stored) ? stored.filter(item => item && typeof item.name === 'string' && item.config) : [];
}

function saveSavedPresets(presets) {
  storageSet(PRESET_KEY, presets.slice(0, 20));
}

function renderSavedPresets() {
  const list = $('saved-presets');
  if (!list) return;
  const presets = readSavedPresets();
  if (!presets.length) {
    list.innerHTML = '<li>No saved presets in this browser.</li>';
    return;
  }
  list.innerHTML = presets.map((preset, index) => `<li><button type="button" class="preset" data-saved-preset="${index}">${esc(preset.name)}</button> <button type="button" class="preset" data-delete-preset="${index}" aria-label="Delete preset ${esc(preset.name)}">Delete</button></li>`).join('');
  for (const button of list.querySelectorAll('[data-saved-preset]')) {
    button.addEventListener('click', () => {
      const preset = readSavedPresets()[Number(button.dataset.savedPreset)];
      if (preset) applyConfig(preset.config, {message: `Applied saved preset “${preset.name}”.`});
    });
  }
  for (const button of list.querySelectorAll('[data-delete-preset]')) {
    button.addEventListener('click', () => {
      const presetsNow = readSavedPresets();
      const [removed] = presetsNow.splice(Number(button.dataset.deletePreset), 1);
      saveSavedPresets(presetsNow);
      renderSavedPresets();
      status('preset-status', `Deleted preset “${removed?.name || ''}”.`);
    });
  }
}

function updateEvaluatorControls() {
  const prefs = readPrefs();
  $('eval-theme').value = prefs.theme;
  $('eval-text-size').value = prefs.textSize;
  $('eval-motion').value = prefs.motion;
  $('eval-contrast').value = prefs.contrast;
}

function applyEvaluatorPrefs() {
  const prefs = {
    theme: $('eval-theme').value,
    textSize: $('eval-text-size').value,
    motion: $('eval-motion').value,
    contrast: $('eval-contrast').value
  };
  const saved = savePrefs(prefs);
  applyPrefs(prefs);
  status('copy-status', saved ? 'Evaluation tool display saved for this browser.' : 'Display changed, but this browser blocked saving.');
}

function bindControls() {
  for (const key of ['component', 'experiment', 'state', 'view', 'theme', 'direction', 'language', 'motion', 'contrast', 'textSize', 'spacing', 'render', 'capture', 'width']) {
    const control = $(key);
    if (!control) continue;
    control.addEventListener('change', () => {
      if (key === 'component') rebuildDependentOptions();
      if (key === 'width' && control.value === 'custom') {
        $('width-custom-field').hidden = false;
        if (!$('width-custom').value) $('width-custom').value = app.config.width;
        $('width-custom').focus();
        return;
      }
      applyConfig(currentControlConfig());
    });
  }
  $('width-custom').addEventListener('change', () => applyConfig(currentControlConfig()));
  $('sync-scroll').addEventListener('change', event => {
    app.syncScroll = event.target.checked;
  });
  $('reveal').addEventListener('input', event => applyReveal(Number(event.target.value)));
  $('opacity').addEventListener('input', event => applyOnion(Number(event.target.value)));
  $('diff-threshold').addEventListener('input', event => {
    $('diff-threshold-output').value = event.target.value;
    drawDifference();
  });
  $('diff-intensity').addEventListener('input', event => {
    $('diff-intensity-output').value = `${event.target.value}%`;
    drawDifference();
  });
  $('focus-toggle').addEventListener('click', () => {
    app.focus.on = !app.focus.on;
    $('focus-toggle').setAttribute('aria-pressed', String(app.focus.on));
    $('focus-toggle').textContent = app.focus.on ? 'Stop focus inspector' : 'Start focus inspector';
    if (app.focus.on) {
      status('focus-status', 'Focus inspector started. Press Tab inside either live pane.');
      bindFrameInspection();
    } else {
      status('focus-status', 'Focus inspector stopped.');
    }
  });
  $('fixture-reset').addEventListener('click', () => {
    applyConfig({
      ...app.config,
      view: 'split',
      theme: 'system',
      motion: 'system',
      contrast: 'normal',
      textSize: 'default',
      spacing: 'default',
      direction: 'ltr',
      language: 'en',
      width: '1280',
      render: 'live',
      capture: 'light'
    }, {message: 'Fixture conditions reset to defaults. The selected component, experiment, and state were kept.'});
  });
  $('copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      status('copy-status', 'Evaluation link copied.');
    } catch {
      const input = document.createElement('input');
      input.value = location.href;
      document.body.append(input);
      input.select();
      const copied = document.execCommand?.('copy');
      input.remove();
      status('copy-status', copied ? 'Evaluation link copied.' : 'Copy failed. The full configuration is in the address bar.', !copied);
    }
  });
  $('eval-controls').addEventListener('submit', event => event.preventDefault());
}

function bindPresets() {
  for (const button of document.querySelectorAll('[data-preset]')) {
    button.addEventListener('click', () => {
      const preset = app.presets.find(item => item.id === button.dataset.preset);
      if (!preset) return;
      const next = {...app.config, ...preset.config};
      applyConfig(next, {message: `Applied preset “${preset.label}”. ${preset.description}`});
      for (const other of document.querySelectorAll('[data-preset]')) other.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-pressed', 'true');
    });
  }
}

function bindEvaluatorDisplay() {
  for (const id of ['eval-theme', 'eval-text-size', 'eval-motion', 'eval-contrast']) {
    $(id).addEventListener('change', applyEvaluatorPrefs);
  }
  $('eval-display-reset').addEventListener('click', () => {
    const cleared = clearPrefs();
    applyPrefs({theme: 'system', textSize: 'default', contrast: 'default', motion: 'system'});
    updateEvaluatorControls();
    status('copy-status', cleared ? 'Tool display reset to system defaults.' : 'Display reset, but this browser blocked clearing storage.');
  });
}

function bindManualActions() {
  $('manual-export-json').addEventListener('click', () => exportManual('json'));
  $('manual-export-md').addEventListener('click', () => exportManual('markdown'));
  $('manual-reset').addEventListener('click', () => {
    if (!Object.keys(app.manualResults).length) {
      status('manual-status', 'No local manual results to clear.');
      return;
    }
    app.manualResults = {};
    saveManualResults();
    renderManualTests();
    status('manual-status', 'Cleared local manual results for this browser.');
  });
  $('preset-save').addEventListener('click', () => {
    const name = $('preset-name').value.trim().slice(0, 60);
    if (!name) {
      status('preset-status', 'Enter a preset name first.', true);
      $('preset-name').focus();
      return;
    }
    const presets = readSavedPresets().filter(item => item.name !== name);
    presets.unshift({name, config: {...app.config}});
    saveSavedPresets(presets);
    $('preset-name').value = '';
    renderSavedPresets();
    status('preset-status', `Saved “${name}” in this browser.`);
  });
}

function renderInitial() {
  syncControls();
  updateEvaluatorControls();
  updateHeader();
  updatePreview();
  renderEvidence();
  renderPerformance();
  renderManualTests();
  renderSavedPresets();
  if (app.ignored.length) status('param-status', `Ignored invalid value(s): ${app.ignored.join(', ')}. Safe defaults were used.`, true);
  else $('param-status').hidden = true;
  if (app.evidence?.generated && app.evidence.comparison?.pairs?.length) {
    status('copy-status', `${app.evidence.comparison.pairs.length} matched capture pair(s) available for pixel comparison.`);
  }
}

async function main() {
  const noJs = document.getElementById('no-js-note');
  if (noJs) noJs.hidden = true;
  try {
    const [registry, evidence, manualData, build] = await Promise.all([
      loadJson('data/registry.json'),
      loadJson('data/evidence.json').catch(() => ({generated: false})),
      loadJson('data/manual-tests.json').catch(() => ({tests: []})),
      loadJson('data/build.json').catch(() => ({}))
    ]);
    app.registry = registry;
    app.evidence = evidence;
    app.manual = manualData;
    app.build = build;
    app.manualResults = readManualResults();
    app.syncScroll = true;
    const normalized = normalizeEvaluationParams(location.search, registry);
    app.config = normalized.config;
    app.ignored = normalized.ignored;
    // Presets are data from the shared module, passed through the DOM buttons.
    app.presets = PRESETS;
    bindControls();
    bindPresets();
    bindEvaluatorDisplay();
    bindManualActions();
    renderInitial();
    history.replaceState(null, '', evaluationUrl(app.config, location.pathname));
  } catch (error) {
    const banner = $('param-status');
    if (banner) {
      banner.hidden = false;
      banner.textContent = `The evaluation workspace could not load: ${error.message}. Direct fixture links still work.`;
    }
    console.error(error);
  }
}

main();
