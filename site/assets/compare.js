import {loadJson, escapeHtml as e} from './dom.js';

const el = id => document.getElementById(id);
const widthMap = {desktop: 1250, tablet: 810, mobile: 390};
const q = new URLSearchParams(location.search);
const allowed = {
  theme: ['system', 'light', 'dark'],
  direction: ['ltr', 'rtl'],
  width: ['desktop', 'tablet', 'mobile'],
  view: ['split', 'onion']
};
const state = {
  component: q.get('component') || 'accordion',
  theme: allowed.theme.includes(q.get('theme')) ? q.get('theme') : 'system',
  direction: allowed.direction.includes(q.get('direction')) ? q.get('direction') : 'ltr',
  width: allowed.width.includes(q.get('width')) ? q.get('width') : 'mobile',
  view: allowed.view.includes(q.get('view')) ? q.get('view') : 'split'
};

function fixtureLink(side) {
  const url = new URL(`fixture/${state.component}-${side}.html`, location.href);
  url.searchParams.set('theme', state.theme);
  url.searchParams.set('dir', state.direction);
  return url.href;
}

function historyState() {
  const params = new URLSearchParams({
    component: state.component,
    theme: state.theme,
    direction: state.direction,
    width: state.width,
    view: state.view
  });
  history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
}

function applyOnion() {
  const onion = state.view === 'onion';
  for (const id of ['before', 'after']) {
    const frame = el(id);
    if (onion) {
      frame.setAttribute('inert', '');
      frame.setAttribute('aria-hidden', 'true');
    } else {
      frame.removeAttribute('inert');
      frame.removeAttribute('aria-hidden');
    }
  }
  el('onion-note').hidden = !onion;
  el('onion-control').hidden = !onion;
}

function updateFrames() {
  const before = fixtureLink('baseline');
  const after = fixtureLink('experiment');
  el('before').src = before;
  el('after').src = after;
  el('open-before').href = before;
  el('open-after').href = after;
  el('stage').dataset.view = state.view;
  const width = widthMap[state.width];
  const frames = el('frames');
  if (state.view === 'split') {
    frames.style.width = `${width * 2 + 16}px`;
    frames.style.gridTemplateColumns = `${width}px ${width}px`;
  } else {
    frames.style.width = `${width}px`;
    frames.style.gridTemplateColumns = 'none';
  }
  el('before').style.width = '100%';
  el('after').style.width = '100%';
  applyOnion();
  historyState();
}

function updateContent(registry) {
  const component = registry.components.find(item => item.slug === state.component);
  if (!component) return;
  const issues = component.issues.map(number => `<a href="https://github.com/uswds/uswds/issues/${number}">#${number}</a>`).join(', ');
  el('component-info').innerHTML = `<h2 id="info-title" class="section-title">${e(component.name)}: guidance and implementation</h2>
    <p>${e(component.summary)}</p>
    <p><strong>Experimental treatment:</strong> ${e(component.experiment)}. The baseline remains unchanged.</p>
    <p><a href="component/${encodeURIComponent(component.slug)}.html">Component guidance</a> · <a href="${e(component.reference)}">Official component guidance</a> · <a href="${e(component.accessibility)}">Official accessibility tests</a> · <a href="evidence.html">Evidence and coverage</a></p>
    <p>Relevant upstream history: ${issues}.</p>
    <p class="small">The experimental CSS is not a candidate patch. Compatibility, contrast, and no-JavaScript behavior require human review. Use the independent links for keyboard testing.</p>`;
  el('difference-note').textContent = `Both panes use the same authored fixture. The experiment adds: ${component.experiment}. Baseline assets are pinned to USWDS 3.14.0.`;
}

async function main() {
  const [registry, build] = await Promise.all([loadJson('registry.json'), loadJson('build.json')]);
  const options = registry.components.map(component => `<option value="${e(component.slug)}">${e(component.name)}</option>`).join('');
  const componentSelect = el('component');
  componentSelect.innerHTML = options;
  if (!registry.components.some(component => component.slug === state.component)) state.component = registry.components[0]?.slug || 'accordion';
  componentSelect.value = state.component;
  for (const key of ['theme', 'direction', 'width', 'view']) {
    const control = el(key);
    if (control) control.value = state[key];
  }
  el('asset-banner').textContent = build.uswdsRealAssets
    ? 'Baseline: pinned USWDS 3.14.0 distribution. Experimental layer: independent prototype. Neither pane runs OGDS.'
    : 'OFFLINE ILLUSTRATION ONLY: USWDS package assets are missing. Do not use rendered results as upstream evidence.';
  for (const key of ['component', 'theme', 'direction', 'width', 'view']) {
    el(key).addEventListener('change', event => {
      state[key] = event.target.value;
      updateFrames();
      if (key === 'component') updateContent(registry);
    });
  }
  el('opacity').addEventListener('input', event => {
    const value = Number(event.target.value);
    el('opacity-output').value = `${value}%`;
    el('stage').style.setProperty('--after-opacity', String(value / 100));
  });
  updateFrames();
  updateContent(registry);
}

main().catch(error => {
  const banner = el('asset-banner');
  if (banner) banner.textContent = `Error preparing comparison: ${error.message}`;
});
