import {escapeHtml as e} from '../scripts/markdown.mjs';

const required = field => field.required ? ' <span class="fixture-required">(required)</span>' : '';

function banner(section) {
  return `<section class="usa-banner" aria-label="Service information">
  <div class="usa-accordion">
    <header class="usa-banner__header">
      <div class="usa-banner__inner">
        <div class="grid-col-fill tablet:grid-col-auto">
          <p class="usa-banner__header-text">${e(section.text)}</p>
          <p class="usa-banner__header-action" aria-hidden="true">${e(section.action)}</p>
        </div>
        <button class="usa-accordion__button usa-banner__button" type="button" aria-expanded="false" aria-controls="demo-banner"><span class="usa-banner__button-text">${e(section.action)}</span></button>
      </div>
    </header>
    <div class="usa-banner__content usa-accordion__content" id="demo-banner" hidden>
      <div class="grid-row grid-gap-lg">${(section.panels || []).map(panel => `<div class="tablet:grid-col-6"><h2 class="usa-banner__heading">${e(panel.heading)}</h2><p>${e(panel.body)}</p></div>`).join('')}</div>
    </div>
  </div>
</section>`;
}

function header(section) {
  return `<header class="usa-header usa-header--basic">
  <div class="usa-nav-container">
    <div class="usa-navbar">
      <div class="usa-logo"><a href="#main"><em class="usa-logo__text">${e(section.logo)}</em></a></div>
      <button type="button" class="usa-menu-btn">Menu</button>
    </div>
    <nav aria-label="Primary" class="usa-nav">
      <button type="button" class="usa-nav__close"><img src="../vendor/uswds/img/usa-icons/close.svg" alt="Close"></button>
      <ul class="usa-nav__primary usa-accordion">${(section.nav || []).map(item => `<li class="usa-nav__primary-item"><a href="${e(item.href)}" class="usa-nav__link"><span>${e(item.label)}</span></a></li>`).join('')}</ul>
      <div class="usa-nav__secondary">
        <form class="usa-search usa-search--small" role="search" action="#main">
          <label class="usa-sr-only" for="site-search">${e(section.search?.label || 'Search')}</label>
          <input class="usa-input" id="site-search" type="search" name="search">
          <button class="usa-button" type="submit"><span class="usa-search__submit-text">Search</span></button>
        </form>
      </div>
    </nav>
  </div>
</header>`;
}

function hero(section) {
  return `<section class="usa-hero" aria-label="Introduction">
  <div class="grid-container">
    <div class="usa-hero__callout">
      <h1 class="usa-hero__heading">${e(section.heading)}</h1>
      <p class="usa-hero__body">${e(section.body)}</p>
      <a class="usa-button usa-button--big" href="${e(section.cta.href)}">${e(section.cta.label)}</a>
    </div>
  </div>
</section>`;
}

function alert(section) {
  const variant = ['info', 'warning', 'error', 'success'].includes(section.variant) ? section.variant : 'info';
  return `<div class="grid-container"><div class="usa-alert usa-alert--${variant}">
  <div class="usa-alert__body">
    <h2 class="usa-alert__heading">${e(section.heading)}</h2>
    <p class="usa-alert__text">${e(section.body)}</p>
  </div>
</div></div>`;
}

function cards(section) {
  return `<section class="grid-container usa-section" id="${e(section.id || 'cards')}" aria-labelledby="${e(section.id || 'cards')}-heading">
  <h2 class="usa-section__heading" id="${e(section.id || 'cards')}-heading">${e(section.heading)}</h2>
  <div class="grid-row grid-gap">${(section.items || []).map(item => `<div class="tablet:grid-col-4"><div class="usa-card"><div class="usa-card__container">
    <div class="usa-card__header"><h3 class="usa-card__heading">${e(item.heading)}</h3></div>
    <div class="usa-card__body"><p>${e(item.body)}</p></div>
    <div class="usa-card__footer"><a class="usa-button" href="${e(item.cta.href)}">${e(item.cta.label)}</a></div>
  </div></div></div>`).join('')}</div>
</section>`;
}

function accordion(section, index) {
  const prefix = `accordion-${index}`;
  return `<section class="grid-container usa-section" id="${e(section.id || prefix)}" aria-labelledby="${e(section.id || prefix)}-heading">
  <h2 class="usa-section__heading" id="${e(section.id || prefix)}-heading">${e(section.heading)}</h2>
  <div class="usa-accordion">${(section.items || []).map((item, itemIndex) => {
    const id = `${prefix}-${itemIndex}`;
    return `<h3 class="usa-accordion__heading"><button class="usa-accordion__button" type="button" aria-expanded="${item.open ? 'true' : 'false'}" aria-controls="${id}">${e(item.question)}</button></h3>
    <div class="usa-accordion__content" id="${id}"${item.open ? '' : ' hidden'}><p>${e(item.answer)}</p></div>`;
  }).join('')}</div>
</section>`;
}

function prose(section) {
  return `<section class="grid-container usa-section" id="${e(section.id || 'prose')}" aria-labelledby="${e(section.id || 'prose')}-heading">
  <h2 class="usa-section__heading" id="${e(section.id || 'prose')}-heading">${e(section.heading)}</h2>
  <div class="usa-prose">${(section.paragraphs || []).map(paragraph => `<p>${e(paragraph)}</p>`).join('')}</div>
</section>`;
}

function pageHeading(section) {
  return `<div class="grid-container"><p class="eyebrow">${e(section.eyebrow)}</p><h1>${e(section.heading)}</h1><p class="usa-intro">${e(section.intro)}</p></div>`;
}

function form(section) {
  const fields = (section.fields || []).map(field => {
    const hint = field.hint ? `<span class="usa-hint" id="${e(field.id)}-hint">${e(field.hint)}</span>` : '';
    const error = `<p class="usa-error-message" id="${e(field.id)}-error" hidden></p>`;
    const describedBy = ` aria-describedby="${[field.hint ? `${field.id}-hint` : '', `${field.id}-error`].filter(Boolean).join(' ')}"`;
    const label = `<label class="usa-label" for="${e(field.id)}">${e(field.label)}${required(field)}</label>`;
    if (field.kind === 'checkbox') {
      return `<div class="usa-checkbox"><input class="usa-checkbox__input" id="${e(field.id)}" name="${e(field.id)}" type="checkbox" value="yes"><label class="usa-checkbox__label" for="${e(field.id)}">${e(field.label)}</label></div>`;
    }
    if (field.kind === 'select') {
      return `<div class="usa-fieldset">${label}<select class="usa-select" id="${e(field.id)}" name="${e(field.id)}"${field.required ? ' required' : ''}${describedBy}>${(field.options || []).map(option => `<option value="${e(option.value)}">${e(option.label)}</option>`).join('')}</select>${hint}${error}</div>`;
    }
    if (field.kind === 'textarea') {
      return `<div class="usa-fieldset">${label}<textarea class="usa-textarea" id="${e(field.id)}" name="${e(field.id)}" rows="5"${field.required ? ' required' : ''}${describedBy}></textarea>${hint}${error}</div>`;
    }
    return `<div class="usa-fieldset">${label}<input class="usa-input" id="${e(field.id)}" name="${e(field.id)}" type="${e(field.kind)}"${field.autocomplete ? ` autocomplete="${e(field.autocomplete)}"` : ''}${field.required ? ' required' : ''}${describedBy}>${hint}${error}</div>`;
  }).join('\n');
  return `<section class="grid-container usa-section" aria-labelledby="form-heading">
  <h2 class="usa-section__heading" id="form-heading">${e(section.heading)}</h2>
  <div id="${e(section.id)}-error-summary" class="usa-error-summary" tabindex="-1" hidden>
    <h3 class="usa-error-summary__heading">There is a problem</h3>
    <ul class="usa-list usa-list--unstyled" data-error-list></ul>
  </div>
  <form id="${e(section.id)}" class="usa-form usa-form--large" data-local-validation data-status-target="form-status">
    ${fields}
    <div class="button-row"><button class="usa-button" type="submit">${e(section.submit)}</button><button class="usa-button usa-button--outline" type="reset">${e(section.reset)}</button></div>
  </form>
  <p id="form-status" role="status"></p>
  <p class="fixture-note">${e(section.status)}</p>
</section>`;
}
function footer(section) {
  return `<footer class="usa-footer usa-footer--slim">
  <div class="usa-footer__primary-section"><div class="grid-container"><div class="usa-footer__primary-content">
    <a class="usa-footer__primary-link" href="#main">${e(section.link)}</a>
    <p>${e(section.text)}</p>
  </div></div></div>
</footer>`;
}

const renderers = {banner, header, hero, alert, cards, accordion, prose, 'page-heading': pageHeading, form, footer};

export function renderSection(section, index = 0) {
  const renderer = renderers[section.type];
  if (!renderer) throw new Error(`No USWDS renderer for block type ${section.type}`);
  return renderer(section, index);
}

export function renderPageBody(content, render = renderSection) {
  const sections = content.sections || [];
  const head = sections.filter(section => ['banner', 'header'].includes(section.type)).map((section, index) => render(section, index)).join('\n');
  const footer = sections.filter(section => section.type === 'footer').map((section, index) => render(section, index)).join('\n');
  const middle = sections.filter(section => !['banner', 'header', 'footer'].includes(section.type)).map((section, index) => render(section, index)).join('\n');
  return `<a class="usa-skipnav" href="#main">Skip to main content</a>
${head}
<main id="main">
${middle}
</main>
${footer}`;
}
