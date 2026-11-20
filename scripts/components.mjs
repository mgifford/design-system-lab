// Original MIT-licensed fixture content. Does not copy USWDS project source files.
// Markup is authored for this lab and uses official USWDS assets; it is not a
// byte-for-byte copy of an upstream example.
const body = {
  accordion: `<h1 class="fixture-heading">Application eligibility</h1>
<p>This example tests the disclosure's accessible name, expanded state and keyboard operation.</p>
<div class="usa-accordion">
  <h2 class="usa-accordion__heading"><button class="usa-accordion__button" type="button" aria-expanded="false" aria-controls="faq-eligibility">Who can apply?</button></h2>
  <div id="faq-eligibility" class="usa-accordion__content usa-prose" hidden><p>People who meet the published eligibility criteria can apply. Review every requirement before continuing.</p><a href="#details">Read the detailed requirements</a></div>
  <h2 class="usa-accordion__heading"><button class="usa-accordion__button" type="button" aria-expanded="true" aria-controls="faq-documents">Which documents do I need?</button></h2>
  <div id="faq-documents" class="usa-accordion__content usa-prose"><p>Provide proof of identity and evidence relevant to the service.</p></div>
</div><h2 id="details">Additional requirements</h2><p>Any prototype should preserve a visible focus indicator and reachable content when JavaScript fails.</p>`,
  alert: `<h1 class="fixture-heading">Application messages</h1>
<p>Compare informational, warning and error messages. Labels and body text must not depend on color alone.</p>
<div class="usa-alert usa-alert--info"><div class="usa-alert__body"><h2 class="usa-alert__heading">Information</h2><p class="usa-alert__text">You can save your application and return later.</p></div></div>
<div class="usa-alert usa-alert--warning"><div class="usa-alert__body"><h2 class="usa-alert__heading">Check your documents</h2><p class="usa-alert__text">Your identity document must be readable before submission.</p></div></div>
<div class="usa-alert usa-alert--error"><div class="usa-alert__body"><h2 class="usa-alert__heading">Some information is missing</h2><p class="usa-alert__text">Enter a required response before continuing.</p></div></div>`,
  banner: `<h1 class="fixture-heading">Service identity banner</h1>
<p>This is a neutral demonstration, not a claim that the lab is a government agency.</p>
<section class="usa-banner" aria-label="Service identity information">
 <div class="usa-accordion"><header class="usa-banner__header"><div class="usa-banner__inner"><div class="grid-col-fill tablet:grid-col-auto"><p class="usa-banner__header-text">Demonstration service identity</p><p class="usa-banner__header-action" aria-hidden="true">About this banner</p></div><button type="button" class="usa-accordion__button usa-banner__button" aria-expanded="false" aria-controls="banner-info"><span class="usa-banner__button-text">How this banner works</span></button></div></header>
 <div class="usa-banner__content usa-accordion__content" id="banner-info" hidden><div class="grid-row grid-gap-lg"><div class="tablet:grid-col-6"><h2 class="usa-banner__heading">Example only</h2><p>In a production government service, banner content must accurately explain who operates the site.</p></div><div class="tablet:grid-col-6"><h2 class="usa-banner__heading">Verify the service</h2><p>A trustworthy site explains its official identity without using misleading branding.</p></div></div></div></div>
</section>
<p>Test logical spacing and expansion in both left-to-right and right-to-left layouts.</p>
<p class="fixture-note" lang="ar" dir="rtl">معلومات الخدمة — نموذج لاختبار الاتجاه من اليمين إلى اليسار. <span lang="en" dir="ltr">(Sample Arabic for direction testing; native-language review pending.)</span></p>`,
  form: `<h1 class="fixture-heading">Request information</h1><p>Use this fixture to investigate native validation, focus visibility and radio control positioning.</p>
<form id="application" class="usa-form" data-local-validation data-status-target="form-status">
 <fieldset class="usa-fieldset"><legend class="usa-legend">Request type <span class="fixture-required">(required)</span></legend>
 <div class="usa-radio"><input class="usa-radio__input" id="new" name="request" value="new" type="radio" required><label class="usa-radio__label" for="new">New application</label></div>
 <div class="usa-radio"><input class="usa-radio__input" id="change" name="request" value="change" type="radio" required><label class="usa-radio__label" for="change">Update an existing application</label></div>
 </fieldset><label class="usa-label" for="reference">Reference name <span class="fixture-required">(required)</span></label><input class="usa-input" id="reference" name="reference" type="text" required autocomplete="off"><div class="button-row"><button class="usa-button" type="submit">Review application</button></div>
 </form><p class="fixture-note">This is a no-network form. Submitting valid inputs displays a local success message; invalid inputs use native browser constraint validation.</p>
 <p id="form-status" role="status" aria-live="polite"></p>`,
  'radio-validation': `<h1 class="fixture-heading">Contact preference</h1>
<p>This reproduction checks native validation and focus placement for a required radio group. It does not change upstream radio positioning.</p>
<form id="radio-validation-form" class="usa-form" data-local-validation data-status-target="radio-validation-status">
 <fieldset class="usa-fieldset"><legend class="usa-legend">How should we contact you? <span class="fixture-required">(required)</span></legend>
 <p class="fixture-hint" id="contact-hint">Choose one option. The browser will block an empty submission.</p>
 <div class="usa-radio"><input class="usa-radio__input" id="contact-email" name="contact" value="email" type="radio" required><label class="usa-radio__label" for="contact-email">Email</label></div>
 <div class="usa-radio"><input class="usa-radio__input" id="contact-phone" name="contact" value="phone" type="radio" required><label class="usa-radio__label" for="contact-phone">Phone call</label></div>
 </fieldset>
 <div class="button-row"><button class="usa-button" type="submit">Continue</button><button class="usa-button usa-button--outline" type="reset">Clear response</button></div>
</form><p class="fixture-note">No data is sent. A valid submission shows a local confirmation only.</p>
<p id="radio-validation-status" role="status" aria-live="polite"></p>`
};

export function componentMarkup(slug) {
  if (!Object.hasOwn(body, slug)) throw new Error(`Unknown component: ${slug}`);
  return body[slug];
}

export function fixtureHtml({component, variant, realAssets}) {
  if (!['baseline', 'experiment'].includes(variant)) throw Error(`Invalid variant: ${variant}`);
  const payload = componentMarkup(component);
  const title = `${component[0].toUpperCase()}${component.slice(1)} — ${variant}`;
  // Baseline uses only official asset files. The offline CSS is intentionally generic and labeled.
  const vendor = realAssets ? '<link rel="stylesheet" href="../vendor/uswds/css/uswds.min.css">' : '';
  const vendorJs = realAssets ? '<script src="../vendor/uswds/js/uswds.min.js" defer></script>' : '';
  const experiment = variant === 'experiment' ? '<link rel="stylesheet" href="../assets/experiment.css">' : '';
  const offlineClass = realAssets ? '' : 'offline';
  const demoFallback = realAssets
    ? ''
    : '<p role="note" style="background:#fff3d9;padding:.5rem;border:2px solid #ab6100;color:#1b1b1b">OFFLINE ILLUSTRATION. Upstream USWDS package is not installed. No comparison findings are valid.</p>';
  return `<!doctype html><html lang="en" data-mode="system"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | USWDS Futures Lab</title><script>document.documentElement.classList.add('js')</script>${vendor}<link rel="stylesheet" href="../assets/fixture.css">${experiment}<script src="../assets/fixture.js" defer></script>${vendorJs}</head><body class="${offlineClass}" data-variant="${variant}" data-component="${component}"><main id="main" class="fixture-grid" tabindex="-1"><p class="fixture-label">${variant === 'baseline' ? 'Author-created fixture with USWDS 3.14.0 assets' : 'Experimental theme layer over USWDS 3.14.0'}</p>${demoFallback}${payload}<p class="fixture-note">Independent fixture. It does not certify accessibility. Review official USWDS documentation and evidence before adopting the pattern.</p></main></body></html>`;
}
