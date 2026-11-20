import {escapeHtml as e} from '../scripts/markdown.mjs';
import {renderPageBody, renderSection as renderUswdsSection} from './uswds.mjs';

function banner(section) {
  const [domain, https] = section.panels || [];
  return `<ogds-banner label="Service information">
  <span slot="banner-text">${e(section.text)}</span>
  <span slot="banner-action">${e(section.action)}</span>
  <span slot="domain-heading">${e(domain?.heading || '')}</span>
  <span slot="domain-text">${e(domain?.body || '')}</span>
  <span slot="https-heading">${e(https?.heading || '')}</span>
  <span slot="https-text">${e(https?.body || '')}</span>
</ogds-banner>`;
}

function header(section) {
  return `<ogds-header variant="basic" icon>
  <div slot="logo"><a href="#main">${e(section.logo)}</a></div>
  <ogds-primary-nav slot="nav-primary">
    <ul>${(section.nav || []).map(item => `<li><a href="${e(item.href)}">${e(item.label)}</a></li>`).join('')}</ul>
  </ogds-primary-nav>
  <form slot="nav-secondary" class="demo-search" role="search" action="#main">
    <label class="usa-sr-only" for="ogds-search">${e(section.search?.label || 'Search')}</label>
    <input id="ogds-search" type="search" name="search">
    <button type="submit">Search</button>
  </form>
</ogds-header>`;
}

function accordion(section, index) {
  return `<section class="grid-container usa-section" id="${e(section.id || `ogds-accordion-${index}`)}" aria-labelledby="${e(section.id || `ogds-accordion-${index}`)}-heading">
  <h2 class="usa-section__heading" id="${e(section.id || `ogds-accordion-${index}`)}-heading">${e(section.heading)}</h2>
  <ogds-accordion>${(section.items || []).map(item => `<details${item.open ? ' open' : ''}><summary>${e(item.question)}</summary><p>${e(item.answer)}</p></details>`).join('')}</ogds-accordion>
</section>`;
}

const ogdsRenderers = {banner, header, accordion};

export function renderOgdsBody(content, coverage) {
  const byBlock = new Map((coverage.components || []).map(component => [component.block, component]));
  const render = (section, index) => {
    const entry = byBlock.get(section.type);
    if (entry?.status === 'alternate' && ogdsRenderers[section.type]) return ogdsRenderers[section.type](section, index);
    return renderUswdsSection(section, index);
  };
  return renderPageBody(content, render);
}
