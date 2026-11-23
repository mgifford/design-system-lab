/*
 * Shared evaluation configuration and pure helpers.
 * Imported by the browser workspace, the build, and Node tests.
 * No DOM access here; everything is deterministic and serializable.
 */

export const EVALUATION_SCHEMA_VERSION = 1;

export const VIEW_MODES = [
  {value: 'split', label: 'Side by side'},
  {value: 'reveal', label: 'Reveal slider'},
  {value: 'onion', label: 'Onion skin'},
  {value: 'difference', label: 'Pixel difference'}
];

export const SIZINGS = [
  {value: 'split', label: 'Split available width (both panes visible, reflowed)'},
  {value: 'fit', label: 'Fit the fixed viewport into each pane (scaled)'},
  {value: 'actual', label: 'Actual fixed viewport (horizontal scroll)'}
];

export const THEMES = [
  {value: 'system', label: 'Follow fixture system preference'},
  {value: 'light', label: 'Explicit light (experiment only)'},
  {value: 'dark', label: 'Explicit dark (experiment only)'}
];

export const DIRECTIONS = [
  {value: 'ltr', label: 'Left to right'},
  {value: 'rtl', label: 'Right to left'}
];

export const LANGUAGES = [
  {value: 'en', label: 'English'},
  {value: 'ar', label: 'Arabic (RTL content sample)'}
];

export const MOTIONS = [
  {value: 'system', label: 'Follow system'},
  {value: 'reduce', label: 'Reduced motion (fixture CSS)'}
];

export const CONTRASTS = [
  {value: 'normal', label: 'Normal contrast'},
  {value: 'more', label: 'Increased contrast (fixture CSS approximation)'}
];

export const TEXT_SIZES = [
  {value: 'default', label: 'Default (100%)'},
  {value: 'large', label: 'Large (112.5%)'},
  {value: 'x-large', label: 'Extra large (125%)'},
  {value: '200', label: '200% text (CSS root scale)'}
];

export const SPACINGS = [
  {value: 'default', label: 'Default spacing'},
  {value: 'wcag', label: 'WCAG 1.4.12 text spacing'}
];

export const WIDTHS = [
  {value: '320', label: '320 CSS px'},
  {value: '390', label: '390 CSS px'},
  {value: '768', label: '768 CSS px'},
  {value: '1280', label: '1280 CSS px'}
];

export const RENDERS = [
  {value: 'live', label: 'Live iframes (fixture CSS)'},
  {value: 'captured', label: 'Captured screenshots (matched browser conditions)'}
];

export const CAPTURE_CONDITIONS = [
  {value: 'light', label: 'Light (browser colour scheme)'},
  {value: 'dark', label: 'Dark (browser colour scheme)'},
  {value: 'forced-colors', label: 'Forced colours (browser emulation)'},
  {value: 'contrast-more', label: 'Increased contrast (browser emulation)'}
];

export const PRESETS = [
  {
    id: 'default',
    label: 'Default',
    description: 'Light/system appearance, default text, 1280 px, LTR, live fixtures.',
    config: {view: 'split', sizing: 'split', split: '50', theme: 'system', motion: 'system', contrast: 'normal', textSize: 'default', spacing: 'default', direction: 'ltr', language: 'en', width: '1280', render: 'live', capture: 'light'}
  },
  {
    id: 'dark',
    label: 'Dark appearance',
    description: 'Explicit dark fixture theme. The baseline stays unchanged.',
    config: {theme: 'dark'}
  },
  {
    id: 'forced-colors',
    label: 'Forced colours',
    description: 'Browser-emulated captured screenshots. Not live and not real Windows High Contrast.',
    config: {render: 'captured', capture: 'forced-colors'}
  },
  {
    id: 'reduced-motion',
    label: 'Reduced motion',
    description: 'Fixture CSS reduced motion; the evaluation shell is unchanged.',
    config: {motion: 'reduce'}
  },
  {
    id: 'large-text',
    label: '200% text',
    description: 'CSS root text scale at 200%, not browser zoom.',
    config: {textSize: '200'}
  },
  {
    id: 'desktop',
    label: 'Fixed 1280 viewport',
    description: 'Actual 1280 CSS px panes with a horizontal-scroll warning when they do not fit.',
    config: {width: '1280', sizing: 'actual'}
  },
  {
    id: 'narrow',
    label: 'Narrow viewport',
    description: '320 CSS pixels, the WCAG reflow width. Uses actual-size panes so the fixed width is applied.',
    config: {width: '320', sizing: 'actual'}
  },
  {
    id: 'rtl',
    label: 'RTL sample',
    description: 'Right-to-left direction with the Arabic content state where available.',
    config: {direction: 'rtl', language: 'ar'}
  },
  {
    id: 'contrast',
    label: 'Increased contrast',
    description: 'Fixture CSS contrast approximation; captured browser emulation is a separate condition.',
    config: {contrast: 'more'}
  }
];

export const MANUAL_STATUSES = [
  {value: 'not-tested', label: 'Not tested'},
  {value: 'pass', label: 'Pass'},
  {value: 'fail', label: 'Fail'},
  {value: 'needs-review', label: 'Needs review'},
  {value: 'blocked', label: 'Blocked'},
  {value: 'not-applicable', label: 'Not applicable'}
];

const DEFAULT_CONFIG = {
  component: 'accordion',
  experiment: '',
  state: 'default',
  view: 'split',
  theme: 'system',
  direction: 'ltr',
  language: 'en',
  width: '1280',
  sizing: 'split',
  split: '50',
  motion: 'system',
  contrast: 'normal',
  textSize: 'default',
  spacing: 'default',
  render: 'live',
  capture: 'light'
};

const values = list => new Set(list.map(item => item.value));
const valueSet = {
  view: values(VIEW_MODES),
  theme: values(THEMES),
  direction: values(DIRECTIONS),
  language: values(LANGUAGES),
  motion: values(MOTIONS),
  contrast: values(CONTRASTS),
  textSize: values(TEXT_SIZES),
  spacing: values(SPACINGS),
  render: values(RENDERS),
  capture: values(CAPTURE_CONDITIONS),
  sizing: values(SIZINGS)
};

function readSplit(raw, ignored) {
  if (raw === null || raw === '') return DEFAULT_CONFIG.split;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 20 || number > 80) {
    ignored.push('split');
    return DEFAULT_CONFIG.split;
  }
  return String(number);
}

function readWidth(raw, ignored) {
  if (raw === null || raw === '') return DEFAULT_CONFIG.width;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 240 || number > 1920) {
    ignored.push('width');
    return DEFAULT_CONFIG.width;
  }
  return String(number);
}

export function experimentsFor(registry, componentSlug) {
  return (registry.experiments || []).filter(experiment => (experiment.components || []).includes(componentSlug));
}

export function statesFor(registry, componentSlug) {
  const component = (registry.components || []).find(item => item.slug === componentSlug);
  return component?.states?.length ? component.states : [{id: 'default', label: 'Initial rendering'}];
}

/**
 * Validate and normalize URL parameters. Invalid values fall back to a safe
 * default and are reported; they are never evaluated as code or markup.
 */
export function normalizeEvaluationParams(search, registry) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search || '');
  const ignored = [];
  const componentSlugs = (registry.components || []).map(component => component.slug);
  const pick = (key, allowed, fallback) => {
    const raw = params.get(key);
    if (raw === null || raw === '') return fallback;
    if (!allowed.has(raw)) {
      ignored.push(key);
      return fallback;
    }
    return raw;
  };

  let component = pick('component', new Set(componentSlugs), componentSlugs[0] || DEFAULT_CONFIG.component);
  if (!componentSlugs.includes(component)) component = componentSlugs[0] || DEFAULT_CONFIG.component;

  const availableExperiments = experimentsFor(registry, component);
  const experimentIds = new Set(availableExperiments.map(experiment => experiment.id));
  let experiment = pick('experiment', experimentIds, availableExperiments[0]?.id || '');
  if (experiment && !experimentIds.has(experiment)) experiment = availableExperiments[0]?.id || '';

  const availableStates = statesFor(registry, component);
  const stateIds = new Set(availableStates.map(state => state.id));
  let state = pick('state', stateIds, availableStates[0]?.id || 'default');
  if (!stateIds.has(state)) state = availableStates[0]?.id || 'default';

  const config = {
    component,
    experiment,
    state,
    view: pick('view', valueSet.view, DEFAULT_CONFIG.view),
    theme: pick('theme', valueSet.theme, DEFAULT_CONFIG.theme),
    direction: pick('direction', valueSet.direction, DEFAULT_CONFIG.direction),
    language: pick('language', valueSet.language, DEFAULT_CONFIG.language),
    motion: pick('motion', valueSet.motion, DEFAULT_CONFIG.motion),
    contrast: pick('contrast', valueSet.contrast, DEFAULT_CONFIG.contrast),
    textSize: pick('textSize', valueSet.textSize, DEFAULT_CONFIG.textSize),
    spacing: pick('spacing', valueSet.spacing, DEFAULT_CONFIG.spacing),
    render: pick('render', valueSet.render, DEFAULT_CONFIG.render),
    capture: pick('capture', valueSet.capture, DEFAULT_CONFIG.capture),
    sizing: pick('sizing', valueSet.sizing, DEFAULT_CONFIG.sizing),
    split: readSplit(params.get('split'), ignored),
    width: readWidth(params.get('width'), ignored)
  };
  return {config, ignored};
}

/** Parameters for a fixture iframe. Defaults are omitted so URLs stay legible. */
export function fixtureParams(config) {
  const params = new URLSearchParams();
  if (config.state !== 'default') params.set('state', config.state);
  if (config.theme !== 'system') params.set('theme', config.theme);
  if (config.direction !== 'ltr') params.set('dir', config.direction);
  if (config.language !== 'en') params.set('lang', config.language);
  if (config.motion !== 'system') params.set('motion', config.motion);
  if (config.contrast !== 'normal') params.set('contrast', config.contrast);
  if (config.textSize !== 'default') params.set('textSize', config.textSize);
  if (config.spacing !== 'default') params.set('spacing', config.spacing);
  return params;
}

export function fixtureUrl(config, side) {
  const params = fixtureParams(config);
  const query = params.toString();
  return `fixture/${config.component}-${side}.html${query ? `?${query}` : ''}`;
}

/** Full workspace URL with a versioned schema for sharing and reproduction. */
export function evaluationUrl(config, base = '') {
  const params = new URLSearchParams({v: String(EVALUATION_SCHEMA_VERSION)});
  for (const key of Object.keys(DEFAULT_CONFIG)) params.set(key, config[key]);
  params.set('width', config.width);
  return `${base}?${params.toString()}`;
}

export function captureKey(component, state, condition) {
  return `${component}--${state}--${condition}`;
}

/**
 * Compare two RGBA buffers and build a highlighted difference image.
 * Returns changed-pixel counts and bounds, never an accessibility score.
 */
export function diffImageData(baseline, experiment, width, height, {threshold = 16, intensity = 1} = {}) {
  if (baseline.length !== experiment.length || baseline.length !== width * height * 4) {
    throw new Error('Diff inputs must be RGBA buffers of the same dimensions.');
  }
  const diff = new Uint8ClampedArray(baseline.length);
  let changed = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let index = 0; index < baseline.length; index += 4) {
    const delta = Math.max(
      Math.abs(baseline[index] - experiment[index]),
      Math.abs(baseline[index + 1] - experiment[index + 1]),
      Math.abs(baseline[index + 2] - experiment[index + 2]),
      Math.abs(baseline[index + 3] - experiment[index + 3])
    );
    const pixel = index / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (delta > threshold) {
      changed += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      diff[index] = 255;
      diff[index + 1] = Math.round(40 + (1 - intensity) * 180);
      diff[index + 2] = Math.round(40 + (1 - intensity) * 180);
      diff[index + 3] = 255;
    } else {
      const grey = Math.round((baseline[index] * 0.299 + baseline[index + 1] * 0.587 + baseline[index + 2] * 0.114) * 0.65 + 90);
      diff[index] = grey;
      diff[index + 1] = grey;
      diff[index + 2] = grey;
      diff[index + 3] = 255;
    }
  }
  return {
    diff,
    changed,
    total: width * height,
    percent: width * height ? (changed / (width * height)) * 100 : 0,
    bounds: maxX >= 0 ? {x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1} : null,
    threshold
  };
}

/** Classify axe findings for the same state on baseline and experiment. */
export function classifyFindings(baseline = [], experiment = []) {
  const key = finding => `${finding.id}|${finding.impact}`;
  const baselineMap = new Map(baseline.map(finding => [key(finding), finding]));
  const experimentMap = new Map(experiment.map(finding => [key(finding), finding]));
  const fixed = [];
  const common = [];
  const introduced = [];
  for (const [keyName, finding] of baselineMap) {
    if (experimentMap.has(keyName)) common.push(finding);
    else fixed.push(finding);
  }
  for (const [keyName, finding] of experimentMap) {
    if (!baselineMap.has(keyName)) introduced.push(finding);
  }
  return {
    fixed,
    introduced,
    common,
    baselineCount: baseline.length,
    experimentCount: experiment.length
  };
}

export function summarizeManualResults(tests, results = {}) {
  const summary = {total: tests.length, completed: 0, byStatus: {}};
  for (const status of MANUAL_STATUSES) summary.byStatus[status.value] = 0;
  for (const test of tests) {
    const status = results[test.id]?.status || 'not-tested';
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
    if (status !== 'not-tested') summary.completed += 1;
  }
  return summary;
}
