// No framework. Markup remains in the HTML and survives when JavaScript is disabled.
const params = new URLSearchParams(location.search);
const validTheme = ['light', 'dark', 'system'];
let prefs = {};
try {
  prefs = JSON.parse(localStorage.getItem('uswds-lab-prefs') || '{}');
} catch {
  prefs = {};
}
const requestedTheme = params.get('theme');
const storedTheme = ['light', 'dark'].includes(prefs.theme) ? prefs.theme : 'system';
const theme = validTheme.includes(requestedTheme) ? requestedTheme : storedTheme;
const direction = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';
const language = params.get('lang');

document.documentElement.dataset.mode = theme;
document.documentElement.dir = direction;
if (language === 'ar') document.documentElement.lang = 'ar';
if (prefs.textSize === 'large' || prefs.textSize === 'x-large') document.documentElement.dataset.textSize = prefs.textSize;
if (prefs.contrast === 'more') document.documentElement.dataset.contrast = 'more';
if (prefs.motion === 'reduce') document.documentElement.dataset.motion = 'reduce';

// Form submission is intentionally local: never send test input to a government endpoint.
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

// An offline simulation is not USWDS and therefore uses an explicit fallback handler.
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
