import {escapeHtml} from './markdown.mjs';
import {
  VIEW_MODES,
  THEMES,
  DIRECTIONS,
  LANGUAGES,
  MOTIONS,
  CONTRASTS,
  TEXT_SIZES,
  SPACINGS,
  WIDTHS,
  SIZINGS,
  RENDERS,
  CAPTURE_CONDITIONS,
  PRESETS,
  evaluationUrl
} from '../site/assets/evaluation-core.js';

export {
  VIEW_MODES,
  THEMES,
  DIRECTIONS,
  LANGUAGES,
  MOTIONS,
  CONTRASTS,
  TEXT_SIZES,
  SPACINGS,
  WIDTHS,
  SIZINGS,
  RENDERS,
  CAPTURE_CONDITIONS,
  PRESETS,
  evaluationUrl
};

export function optionsHtml(items, selected = '') {
  return items
    .map(item => `<option value="${escapeHtml(item.value)}"${item.value === selected ? ' selected' : ''}>${escapeHtml(item.label)}</option>`)
    .join('');
}

export function presetButtons() {
  return PRESETS.map(preset => `<button type="button" class="preset" data-preset="${escapeHtml(preset.id)}" title="${escapeHtml(preset.description)}">${escapeHtml(preset.label)}</button>`).join('');
}

export function componentOptions(registry) {
  return registry.components.map(component => `<option value="${escapeHtml(component.slug)}">${escapeHtml(component.name)}</option>`).join('');
}

export function evaluationHref(componentSlug, experimentId = '') {
  const params = new URLSearchParams({component: componentSlug});
  if (experimentId) params.set('experiment', experimentId);
  return `compare.html?${params.toString()}`;
}

/** Server-rendered fallback header so the page is meaningful before JS runs. */
export function initialEvaluationInfo(registry) {
  const component = registry.components[0];
  const experiment = registry.experiments.find(item => (item.components || []).includes(component.slug));
  const state = component.states?.[0];
  return `<p class="eyebrow" id="eval-eyebrow">Evaluation workspace</p>
<h1 id="eval-title">${escapeHtml(component.name)}</h1>
<p class="lead" id="eval-summary">${escapeHtml(component.summary)}</p>
<div class="callout" id="eval-context">
  <p><strong>Experiment:</strong> ${escapeHtml(experiment?.title || 'No experiment registered')} — ${escapeHtml(experiment?.summary || 'The baseline is available without an experimental treatment.')}</p>
  <p><strong>Baseline:</strong> USWDS ${escapeHtml(registry.baseline.version)} (pinned npm distribution). <strong>Experiment:</strong> lab-authored prototype; not official USWDS or OGDS.</p>
  <p><strong>Current state:</strong> ${escapeHtml(state?.label || 'Initial rendering')}. <strong>Status:</strong> ${escapeHtml(experiment?.status || 'baseline only')}.</p>
  <p class="small">This page is fully interactive with JavaScript. Without it, use the direct fixture links below. Automated checks are observations, not WCAG conformance.</p>
</div>
<div class="button-row">
  <a class="button" id="eval-component-link" href="component/${escapeHtml(component.slug)}.html">Component guidance</a>
  <a class="button secondary" id="eval-experiment-link" href="${experiment ? `experiment/${escapeHtml(experiment.id)}.html` : 'experiments.html'}">Experiment details</a>
  <a class="button secondary" href="${escapeHtml(component.reference)}" id="eval-reference">Official USWDS guidance</a>
  <a class="button secondary" href="${escapeHtml(component.accessibility)}" id="eval-accessibility">Official accessibility tests</a>
</div>`;
}

export const PREFERENCE_LABELS = {
  appearance: 'Dark and light appearance',
  'forced-colors': 'Forced colours',
  contrast: 'Increased contrast',
  motion: 'Reduced motion',
  'text-size': 'Large text',
  spacing: 'Text spacing',
  viewport: 'Narrow viewport and reflow',
  rtl: 'RTL and language',
  'no-javascript': 'No JavaScript',
  storage: 'Preference storage'
};

export const CONCERN_LABELS = {
  'theme-coverage': 'Incomplete theme coverage',
  storage: 'Preference storage unreviewed',
  'native-language': 'Native-language review outstanding',
  'voice-control': 'Voice control untested',
  'screen-reader': 'Real screen-reader testing outstanding'
};
