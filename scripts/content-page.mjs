import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {renderPageBody} from '../renderers/uswds.mjs';
import {renderOgdsBody} from '../renderers/ogds.mjs';

export function readContent(root, id) {
  const file = path.join(root, 'content', 'pages', `${id}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function contentHash(content) {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

export function contentPageHtml({content, system, realAssets, ogdsReady, coverage}) {
  const ogds = system === 'ogds';
  const body = ogds ? renderOgdsBody(content, coverage) : renderPageBody(content);
  const vendor = realAssets ? '<link rel="stylesheet" href="../vendor/uswds/css/uswds.min.css">' : '';
  const vendorJs = realAssets ? '<script src="../vendor/uswds/js/uswds.min.js" defer></script>' : '';
  const ogdsCss = ogds && ogdsReady
    ? '<link rel="stylesheet" href="../vendor/ogds/css/colors.css"><link rel="stylesheet" href="../vendor/ogds/css/spacing.css"><link rel="stylesheet" href="../vendor/ogds/css/breakpoints.css">'
    : '';
  const ogdsJs = ogds && ogdsReady ? '<script type="module" src="../vendor/ogds/ogds-elements.js"></script>' : '';
  const offline = realAssets && (!ogds || ogdsReady)
    ? ''
    : '<p class="demo-offline" role="note">OFFLINE ILLUSTRATION. Required USWDS or OGDS assets are not installed; this page is not comparison evidence.</p>';
  const suffix = ogds ? 'USWDS + OGDS hybrid' : 'USWDS 3.14.0';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="lab-content-hash" content="${contentHash(content)}"><title>${content.title} — ${suffix}</title><link rel="icon" href="data:,">${vendor}${ogdsCss}<link rel="stylesheet" href="../assets/landing.css">${ogdsJs}<script src="../assets/landing.js" defer></script>${vendorJs}</head><body data-variant="${system}" data-page="${content.id}" data-content-hash="${contentHash(content)}">${offline}${body}</body></html>`;
}
