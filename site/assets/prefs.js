/*
 * Preference runtime for the lab shell and the proposed panel.
 * Native controls only. Storage is optional and failure is non-fatal.
 */
const KEY = 'uswds-lab-prefs';
const DEFAULTS = {theme: 'system', textSize: 'default', contrast: 'default', motion: 'system'};
const VALID = {
  theme: ['system', 'light', 'dark'],
  textSize: ['default', 'large', 'x-large'],
  contrast: ['default', 'more'],
  motion: ['system', 'reduce']
};

export function readPrefs() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    stored = {};
  }
  const prefs = {...DEFAULTS};
  for (const key of Object.keys(DEFAULTS)) {
    if (VALID[key].includes(stored[key])) prefs[key] = stored[key];
  }
  return prefs;
}

export function applyPrefs(prefs) {
  const root = document.documentElement;
  if (prefs.theme === 'light' || prefs.theme === 'dark') root.dataset.theme = prefs.theme;
  else delete root.dataset.theme;
  if (prefs.textSize === 'large' || prefs.textSize === 'x-large') root.dataset.textSize = prefs.textSize;
  else delete root.dataset.textSize;
  if (prefs.contrast === 'more') root.dataset.contrast = 'more';
  else delete root.dataset.contrast;
  if (prefs.motion === 'reduce') root.dataset.motion = 'reduce';
  else delete root.dataset.motion;
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export function clearPrefs() {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

function readForm(form) {
  const theme = form.querySelector('input[name="theme"]:checked')?.value || DEFAULTS.theme;
  return {
    theme: VALID.theme.includes(theme) ? theme : DEFAULTS.theme,
    textSize: form.querySelector('#pref-text-size')?.value || DEFAULTS.textSize,
    contrast: form.querySelector('#pref-contrast')?.value || DEFAULTS.contrast,
    motion: form.querySelector('#pref-motion')?.value || DEFAULTS.motion
  };
}

function hydrate(form, prefs) {
  for (const radio of form.querySelectorAll('input[name="theme"]')) radio.checked = radio.value === prefs.theme;
  const text = form.querySelector('#pref-text-size');
  const contrast = form.querySelector('#pref-contrast');
  const motion = form.querySelector('#pref-motion');
  if (text) text.value = prefs.textSize;
  if (contrast) contrast.value = prefs.contrast;
  if (motion) motion.value = prefs.motion;
}

function reloadPreview() {
  const frame = document.getElementById('prefs-preview-frame');
  if (!frame) return;
  try {
    const url = new URL(frame.src, location.href);
    url.searchParams.set('_prefs', String(Date.now()));
    frame.src = url.href;
  } catch {
    frame.src = frame.src;
  }
}

function init() {
  const prefs = readPrefs();
  applyPrefs(prefs);
  const form = document.getElementById('prefs-form');
  if (!form) return;
  hydrate(form, prefs);
  const status = document.getElementById('prefs-status');
  const apply = (message, prefsToApply, saved) => {
    applyPrefs(prefsToApply);
    status.textContent = `${message}${saved ? '' : ' The page changed, but this browser blocked saving the preference.'}`;
    reloadPreview();
  };
  form.addEventListener('change', () => {
    const next = readForm(form);
    apply('Preference saved.', next, savePrefs(next));
  });
  const reset = document.getElementById('prefs-reset');
  if (reset) reset.addEventListener('click', () => form.reset());
  form.addEventListener('reset', () => {
    const cleared = clearPrefs();
    apply('Reset to system defaults.', DEFAULTS, cleared);
  });
}

init();
