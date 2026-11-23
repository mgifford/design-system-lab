/*
 * Fixture runtime.
 *
 * URL parameters are the authoritative fixture conditions. Stored evaluator
 * preferences are applied only when `?prefs=1` is present (used by the
 * preferences-panel preview), so the evaluation workspace can keep the tool's
 * display settings separate from the component under test.
 */
const params = new URLSearchParams(location.search);
const root = document.documentElement;

const read = (key, allowed, fallback) => {
  const value = params.get(key);
  return allowed.includes(value) ? value : fallback;
};

const theme = read('theme', ['system', 'light', 'dark'], 'system');
const direction = read('dir', ['ltr', 'rtl'], 'ltr');
const language = read('lang', ['en', 'ar'], 'en');
const textSize = read('textSize', ['default', 'large', 'x-large', '200'], 'default');
const contrast = read('contrast', ['normal', 'more'], 'normal');
const motion = read('motion', ['system', 'reduce'], 'system');
const spacing = read('spacing', ['default', 'wcag'], 'default');
const requestedState = params.get('state');

root.dataset.mode = theme;
root.dir = direction;
if (language === 'ar') root.lang = 'ar';
if (textSize !== 'default') root.dataset.textSize = textSize;
if (contrast === 'more') root.dataset.contrast = 'more';
if (motion === 'reduce') root.dataset.motion = 'reduce';
if (spacing === 'wcag') root.dataset.spacing = 'wcag';
if (params.get('capture') === '1') root.dataset.capture = 'true';

// Explicit opt-in only: the preferences-panel experiment preview wants the
// saved lab preference; evaluation fixtures must not inherit it.
if (params.get('prefs') === '1') {
  let prefs = {};
  try {
    prefs = JSON.parse(localStorage.getItem('uswds-lab-prefs') || '{}');
  } catch {
    prefs = {};
  }
  if (!params.has('theme') && ['light', 'dark'].includes(prefs.theme)) root.dataset.mode = prefs.theme;
  if (!params.has('textSize') && ['large', 'x-large'].includes(prefs.textSize)) root.dataset.textSize = prefs.textSize;
  if (!params.has('contrast') && prefs.contrast === 'more') root.dataset.contrast = 'more';
  if (!params.has('motion') && prefs.motion === 'reduce') root.dataset.motion = 'reduce';
}

// Component-state model: every declared state is a wrapper with data-state.
// Without JavaScript all states remain visible, which is a readable fallback.
const stateSections = [...document.querySelectorAll('[data-state]')];
if (requestedState && stateSections.length) {
  for (const section of stateSections) section.hidden = section.dataset.state !== requestedState;
}

// Accordion and banner state maps keep their fixture markup in one place.
// Apply after the USWDS deferred script has initialized the component, otherwise
// USWDS can re-apply the authored accordion state. Without JavaScript the
// authored default state remains visible.
const applyStateMaps = () => {
  const accordionStates = document.querySelector('[data-state-open]');
  if (requestedState && accordionStates) {
    try {
      const openPanels = JSON.parse(accordionStates.dataset.stateOpen)[requestedState];
      if (Array.isArray(openPanels)) {
        const buttons = [...accordionStates.querySelectorAll('.usa-accordion__button')];
        buttons.forEach((button, index) => {
          const open = openPanels.includes(index);
          button.setAttribute('aria-expanded', String(open));
          const panel = document.getElementById(button.getAttribute('aria-controls'));
          if (panel) panel.hidden = !open;
        });
      }
    } catch {}
  }

  const bannerStates = document.querySelector('[data-state-expanded]');
  if (requestedState && bannerStates) {
    try {
      const expanded = JSON.parse(bannerStates.dataset.stateExpanded)[requestedState];
      if (typeof expanded === 'boolean') {
        const button = bannerStates.querySelector('.usa-banner__button');
        const panel = document.getElementById('banner-info');
        if (button) button.setAttribute('aria-expanded', String(expanded));
        if (panel) panel.hidden = !expanded;
      }
    } catch {}
  }
};

if (document.readyState === 'complete') applyStateMaps();
else window.addEventListener('load', applyStateMaps, {once: true});

// Local-only form validation. Nothing is sent anywhere.
for (const form of document.querySelectorAll('form[data-local-validation]')) {
  const status = document.getElementById(form.dataset.statusTarget);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (status) status.textContent = 'Example submission validated locally. No data was sent.';
  });
  form.addEventListener('reset', () => {
    if (status) status.textContent = '';
  });
}

// Local-only demonstrations for dynamic alert states. Nothing is sent anywhere.
for (const button of document.querySelectorAll('[data-alert-action]')) {
  button.addEventListener('click', () => {
    const action = button.dataset.alertAction;
    const region = document.getElementById(button.getAttribute('aria-controls'));
    if (!region) return;
    if (action === 'insert') {
      const alert = document.createElement('div');
      alert.className = 'usa-alert usa-alert--success';
      alert.innerHTML = '<div class="usa-alert__body"><h3 class="usa-alert__heading">Application saved</h3><p class="usa-alert__text">Your reference number is <strong>LAB-2026-0147</strong>. Keep it for your records.</p></div>';
      region.replaceChildren(alert);
    } else if (action === 'update') {
      const alert = region.querySelector('.usa-alert');
      if (alert) {
        const text = alert.querySelector('.usa-alert__text');
        if (text) text.textContent = `Review complete. One document is missing as of ${new Date().toLocaleTimeString('en', {hour: '2-digit', minute: '2-digit'})}.`;
        const heading = alert.querySelector('.usa-alert__heading');
        if (heading) heading.textContent = 'Review updated';
      }
    }
  });
}

// The offline simulation is not USWDS, so it needs an explicit fallback handler.
if (document.body.classList.contains('offline')) {
  for (const button of document.querySelectorAll('.usa-accordion__button[aria-controls]')) {
    button.addEventListener('click', () => {
      const pane = document.getElementById(button.getAttribute('aria-controls'));
      if (!pane) return;
      const opened = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!opened));
      pane.hidden = opened;
    });
  }
}
