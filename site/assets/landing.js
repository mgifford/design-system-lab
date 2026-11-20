// Local-only form feedback for the comparison pages.
// Native constraints decide validity; no data is sent. Without JavaScript,
// the browser still performs normal native validation.
for (const form of document.querySelectorAll('form[data-local-validation]')) {
  const status = document.getElementById(form.dataset.statusTarget);
  const summary = document.getElementById(`${form.id}-error-summary`);
  const errorList = summary ? summary.querySelector('[data-error-list]') : null;
  const controls = [...form.querySelectorAll('input, select, textarea')].filter(control => control.type !== 'checkbox');

  form.noValidate = true;

  const labelFor = control => (control.labels?.[0]?.textContent || control.name || 'field').replace(/\s*\(required\)\s*$/i, '').trim();

  const clearError = control => {
    control.removeAttribute('aria-invalid');
    const error = document.getElementById(`${control.id}-error`);
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }
  };

  const setError = (control, message) => {
    control.setAttribute('aria-invalid', 'true');
    const error = document.getElementById(`${control.id}-error`);
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  };

  const hideSummary = () => {
    if (!summary) return;
    summary.hidden = true;
    if (errorList) errorList.replaceChildren();
  };

  errorList?.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const control = document.querySelector(link.getAttribute('href'));
    if (control) {
      event.preventDefault();
      control.focus();
    }
  });

  form.addEventListener('input', event => {
    if (event.target.matches('input, select, textarea')) clearError(event.target);
    if (!form.querySelector('[aria-invalid="true"]')) hideSummary();
  });

  form.addEventListener('reset', () => {
    for (const control of controls) clearError(control);
    hideSummary();
    if (status) status.textContent = '';
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const errors = [];
    for (const control of controls) {
      clearError(control);
      const label = labelFor(control);
      if (control.required && !control.value.trim()) {
        errors.push({control, message: `Enter ${label.toLowerCase()}.`});
      } else if (control.type === 'email' && control.value && !control.validity.valid) {
        errors.push({control, message: 'Enter an email address in the format name@example.com.'});
      }
    }
    if (errors.length) {
      for (const {control, message} of errors) setError(control, message);
      if (summary && errorList) {
        errorList.replaceChildren(...errors.map(({control, message}) => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = `#${control.id}`;
          link.textContent = `${labelFor(control)}: ${message}`;
          item.append(link);
          return item;
        }));
        summary.hidden = false;
        summary.focus();
      }
      if (status) status.textContent = '';
      return;
    }
    hideSummary();
    if (status) status.textContent = 'Example submission validated locally. No data was sent.';
  });
}
