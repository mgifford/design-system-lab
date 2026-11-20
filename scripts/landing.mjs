// Shared landing-page content for the comparison demo.
// Original MIT-licensed implementation; copy adapted from the CC0 USWDS Sandbox.
// The OGDS variant uses @ogds/elements beta.2 for the components it covers;
// everything else remains USWDS 3.14.0.
const TEXT = {
  bannerText: 'A demonstration service website',
  bannerAction: 'Here’s how you know',
  bannerDomainHeading: 'Example only',
  bannerDomainText: 'This is an independent comparison demo, not a government service. In production, this banner must accurately explain who operates the site.',
  bannerHttpsHeading: 'Same content, two treatments',
  bannerHttpsText: 'The content and interaction are shared. Only the design-system layer changes between the two panes.',
  heading: 'Get the support you need',
  body: 'Apply for services, check the status of a request, and find clear guidance for the next step.',
  cta: 'Explore services',
  alertHeading: 'New: apply online',
  alertBody: 'You can now start an application online and return to it later. Save your reference number.',
  q1: 'How do I apply?',
  a1: 'Start with the online application. Review the document checklist first, then save your reference number when you submit.',
  q2: 'How long does it take?',
  a2: 'Most requests receive an initial response within ten business days. Complex requests may take longer, and you can check the status at any time.'
};

function banner(variant) {
  if (variant === 'ogds') {
    return `<ogds-banner label="Service information">
  <span slot="banner-text">${TEXT.bannerText}</span>
  <span slot="banner-action">${TEXT.bannerAction}</span>
  <span slot="domain-heading">${TEXT.bannerDomainHeading}</span>
  <span slot="domain-text">${TEXT.bannerDomainText}</span>
  <span slot="https-heading">${TEXT.bannerHttpsHeading}</span>
  <span slot="https-text">${TEXT.bannerHttpsText}</span>
</ogds-banner>`;
  }
  return `<section class="usa-banner" aria-label="Service information">
  <div class="usa-accordion">
    <header class="usa-banner__header">
      <div class="usa-banner__inner">
        <div class="grid-col-fill tablet:grid-col-auto">
          <p class="usa-banner__header-text">${TEXT.bannerText}</p>
          <p class="usa-banner__header-action" aria-hidden="true">${TEXT.bannerAction}</p>
        </div>
        <button class="usa-accordion__button usa-banner__button" type="button" aria-expanded="false" aria-controls="demo-banner"><span class="usa-banner__button-text">${TEXT.bannerAction}</span></button>
      </div>
    </header>
    <div class="usa-banner__content usa-accordion__content" id="demo-banner" hidden>
      <div class="grid-row grid-gap-lg">
        <div class="tablet:grid-col-6"><h2 class="usa-banner__heading">${TEXT.bannerDomainHeading}</h2><p>${TEXT.bannerDomainText}</p></div>
        <div class="tablet:grid-col-6"><h2 class="usa-banner__heading">${TEXT.bannerHttpsHeading}</h2><p>${TEXT.bannerHttpsText}</p></div>
      </div>
    </div>
  </div>
</section>`;
}

function header(variant) {
  if (variant === 'ogds') {
    return `<ogds-header variant="basic" icon>
  <div slot="logo"><a href="#main">Example Service</a></div>
  <ogds-primary-nav slot="nav-primary">
    <ul>
      <li><a href="#services">Services</a></li>
      <li><a href="#questions">Questions</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </ogds-primary-nav>
  <form slot="nav-secondary" class="demo-search" role="search" action="#main">
    <label class="usa-sr-only" for="ogds-search">Search</label>
    <input id="ogds-search" type="search" name="search">
    <button type="submit">Search</button>
  </form>
</ogds-header>`;
  }
  return `<header class="usa-header usa-header--basic">
  <div class="usa-nav-container">
    <div class="usa-navbar">
      <div class="usa-logo"><a href="#main"><em class="usa-logo__text">Example Service</em></a></div>
      <button type="button" class="usa-menu-btn">Menu</button>
    </div>
    <nav aria-label="Primary" class="usa-nav">
      <button type="button" class="usa-nav__close"><img src="../vendor/uswds/img/usa-icons/close.svg" alt="Close"></button>
      <ul class="usa-nav__primary usa-accordion">
        <li class="usa-nav__primary-item"><a href="#services" class="usa-nav__link"><span>Services</span></a></li>
        <li class="usa-nav__primary-item"><a href="#questions" class="usa-nav__link"><span>Questions</span></a></li>
        <li class="usa-nav__primary-item"><a href="#contact" class="usa-nav__link"><span>Contact</span></a></li>
      </ul>
      <div class="usa-nav__secondary">
        <form class="usa-search usa-search--small" role="search" action="#main">
          <label class="usa-sr-only" for="demo-search">Search</label>
          <input class="usa-input" id="demo-search" type="search" name="search">
          <button class="usa-button" type="submit"><span class="usa-search__submit-text">Search</span></button>
        </form>
      </div>
    </nav>
  </div>
</header>`;
}

function alert() {
  // OGDS beta.2 ships alert source but does not export a built ogds-alert
  // module. Keep the USWDS alert on both sides and record the gap in the matrix.
  return `<div class="usa-alert usa-alert--info">
  <div class="usa-alert__body">
    <h2 class="usa-alert__heading">${TEXT.alertHeading}</h2>
    <p class="usa-alert__text">${TEXT.alertBody}</p>
  </div>
</div>`;
}

function accordion(variant) {
  if (variant === 'ogds') {
    return `<ogds-accordion>
  <details><summary>${TEXT.q1}</summary><p>${TEXT.a1}</p></details>
  <details open><summary>${TEXT.q2}</summary><p>${TEXT.a2}</p></details>
</ogds-accordion>`;
  }
  return `<div class="usa-accordion">
    <h3 class="usa-accordion__heading"><button class="usa-accordion__button" type="button" aria-expanded="false" aria-controls="demo-apply">${TEXT.q1}</button></h3>
    <div class="usa-accordion__content" id="demo-apply" hidden><p>${TEXT.a1}</p></div>
    <h3 class="usa-accordion__heading"><button class="usa-accordion__button" type="button" aria-expanded="true" aria-controls="demo-time">${TEXT.q2}</button></h3>
    <div class="usa-accordion__content" id="demo-time"><p>${TEXT.a2}</p></div>
  </div>`;
}

function pageBody(variant) {
  return `<a class="usa-skipnav" href="#main">Skip to main content</a>
${banner(variant)}
${header(variant)}

<main id="main">
  <section class="usa-hero" aria-label="Introduction">
    <div class="grid-container">
      <div class="usa-hero__callout">
        <h1 class="usa-hero__heading">${TEXT.heading}</h1>
        <p class="usa-hero__body">${TEXT.body}</p>
        <a class="usa-button usa-button--big" href="#services">${TEXT.cta}</a>
      </div>
    </div>
  </section>

  <div class="grid-container">
    ${alert()}
  </div>

  <section class="grid-container usa-section" id="services" aria-labelledby="services-heading">
    <h2 class="usa-section__heading" id="services-heading">Services</h2>
    <div class="grid-row grid-gap">
      <div class="tablet:grid-col-4">
        <div class="usa-card"><div class="usa-card__container">
          <div class="usa-card__header"><h3 class="usa-card__heading">Apply for support</h3></div>
          <div class="usa-card__body"><p>Start a new request and find the documents you need before you apply.</p></div>
          <div class="usa-card__footer"><a class="usa-button" href="#questions">Start an application</a></div>
        </div></div>
      </div>
      <div class="tablet:grid-col-4">
        <div class="usa-card"><div class="usa-card__container">
          <div class="usa-card__header"><h3 class="usa-card__heading">Check your status</h3></div>
          <div class="usa-card__body"><p>Use your reference number to see what has been received and what happens next.</p></div>
          <div class="usa-card__footer"><a class="usa-button" href="#contact">Check status</a></div>
        </div></div>
      </div>
      <div class="tablet:grid-col-4">
        <div class="usa-card"><div class="usa-card__container">
          <div class="usa-card__header"><h3 class="usa-card__heading">Find guidance</h3></div>
          <div class="usa-card__body"><p>Read plain-language guidance about eligibility, documents, and timelines.</p></div>
          <div class="usa-card__footer"><a class="usa-button" href="#questions">Read guidance</a></div>
        </div></div>
      </div>
    </div>
  </section>

  <section class="grid-container usa-section" id="questions" aria-labelledby="questions-heading">
    <h2 class="usa-section__heading" id="questions-heading">Common questions</h2>
    ${accordion(variant)}
  </section>

  <section class="grid-container usa-section" id="contact" aria-labelledby="contact-heading">
    <h2 class="usa-section__heading" id="contact-heading">Contact</h2>
    <p>Email <a href="mailto:example@example.gov">example@example.gov</a> or call 555-0100, Monday to Friday, 9 a.m. to 5 p.m.</p>
    <p class="usa-intro">This is sample content for an independent design-system comparison. It is not a government service.</p>
  </section>
</main>

<footer class="usa-footer usa-footer--slim">
  <div class="usa-footer__primary-section">
    <div class="grid-container">
      <div class="usa-footer__primary-content">
        <a class="usa-footer__primary-link" href="#main">Example Service</a>
        <p>Independent comparison demo. No government endorsement is implied.</p>
      </div>
    </div>
  </div>
</footer>`;
}

export function landingHtml({variant, realAssets, ogdsReady}) {
  const ogds = variant === 'ogds';
  const vendor = realAssets ? '<link rel="stylesheet" href="../vendor/uswds/css/uswds.min.css">' : '';
  const vendorJs = realAssets ? '<script src="../vendor/uswds/js/uswds.min.js" defer></script>' : '';
  const ogdsCss = ogds && ogdsReady
    ? '<link rel="stylesheet" href="../vendor/ogds/css/colors.css"><link rel="stylesheet" href="../vendor/ogds/css/spacing.css"><link rel="stylesheet" href="../vendor/ogds/css/breakpoints.css">'
    : '';
  const ogdsJs = ogds && ogdsReady ? '<script type="module" src="../vendor/ogds/ogds-elements.js"></script>' : '';
  const title = ogds ? 'Example Service — USWDS + OGDS hybrid' : 'Example Service — USWDS 3.14.0';
  const offline = realAssets && (!ogds || ogdsReady)
    ? ''
    : '<p class="demo-offline" role="note">OFFLINE ILLUSTRATION. Required USWDS or OGDS assets are not installed; this page is not comparison evidence.</p>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="icon" href="data:,">${vendor}${ogdsCss}<link rel="stylesheet" href="../assets/landing.css">${ogdsJs}${vendorJs}</head><body data-variant="${variant}">${offline}${pageBody(variant)}</body></html>`;
}
