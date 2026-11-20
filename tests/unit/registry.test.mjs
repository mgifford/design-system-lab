import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {componentMarkup, fixtureHtml} from '../../scripts/components.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(read(relative));
const registry = readJson('data/registry.json');
const issues = readJson('data/issues.json');
const lock = readJson('data/sources.lock.json');
const pkg = readJson('package.json');

test('registry is the canonical schema and baseline is pinned', () => {
  assert.equal(registry.schemaVersion, 2);
  assert.equal(registry.baseline.version, lock.baseline.version);
  assert.equal(pkg.dependencies['@uswds/uswds'], lock.baseline.version);
  assert.match(lock.baseline.commit, /^[0-9a-f]{40}$/);
  assert.ok(lock.baseline.release.startsWith('v'));
  assert.ok(lock.baseline.packageLock.sha256);
  assert.ok(lock.baseline.assets.css.sha256);
  assert.ok(lock.baseline.assets.js.sha256);
});

test('components are complete and have generated fixtures', () => {
  const slugs = new Set();
  for (const component of registry.components) {
    assert.match(component.slug, /^[a-z0-9-]+$/);
    assert.ok(!slugs.has(component.slug), `duplicate ${component.slug}`);
    slugs.add(component.slug);
    for (const field of ['name', 'group', 'summary', 'purpose', 'reference', 'accessibility', 'guide']) {
      assert.ok(component[field], `${component.slug} missing ${field}`);
    }
    for (const field of ['whenToUse', 'whenNotToUse', 'implementation', 'keyboard', 'preferences', 'mistakes', 'testing', 'limitations', 'issues']) {
      assert.ok(Array.isArray(component[field]) && component[field].length, `${component.slug} needs ${field}`);
    }
    assert.ok(fs.existsSync(path.join(root, component.guide.split('#')[0])), `${component.slug} guide missing`);
    const html = componentMarkup(component.slug);
    assert.ok(html.includes('<h1'), `${component.slug} missing h1`);
    for (const match of html.matchAll(/aria-controls="([^"]+)"/g)) {
      assert.ok(html.includes(`id="${match[1]}"`), `${component.slug} unresolved aria-controls ${match[1]}`);
    }
  }
});

test('baseline fixtures never load the experimental stylesheet', () => {
  for (const component of registry.components) {
    const baseline = fixtureHtml({component: component.slug, variant: 'baseline', realAssets: true});
    const experiment = fixtureHtml({component: component.slug, variant: 'experiment', realAssets: true});
    assert.ok(!baseline.includes('experiment.css'), `${component.slug} baseline leaked experiment.css`);
    assert.ok(experiment.includes('experiment.css'), `${component.slug} experiment missing experiment.css`);
    assert.ok(baseline.includes('uswds.min.css'), `${component.slug} baseline missing USWDS CSS`);
    assert.ok(experiment.includes('uswds.min.css'), `${component.slug} experiment missing USWDS CSS`);
  }
});

test('radio validation uses native semantics without redundant ARIA', () => {
  const html = componentMarkup('radio-validation');
  assert.ok(html.includes('type="radio"'));
  assert.ok(html.includes('required'));
  assert.ok(html.includes('<fieldset'));
  assert.ok(html.includes('<legend'));
  assert.ok(!html.includes('aria-required'), 'native required does not need aria-required');
  assert.ok(!html.includes('role="radiogroup"'), 'native fieldset does not need a redundant radiogroup role');
});

test('the preferences panel uses native controls and a status region', () => {
  const html = read('templates/pages/preferences.html');
  assert.ok(html.includes('<fieldset'));
  assert.ok(html.includes('<legend'));
  assert.ok(html.includes('type="radio"'));
  assert.ok(html.includes('<select'));
  assert.ok(html.includes('role="status"'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes('<noscript>'));
});

test('experiments are complete, categorized, and have documents', () => {
  const categories = new Set(Object.keys(registry.experimentTypes));
  const statuses = new Set(Object.keys(registry.experimentStatuses));
  const ids = new Set();
  const componentSlugs = new Set(registry.components.map(component => component.slug));
  const issueNumbers = new Set(issues.map(issue => issue.number));
  for (const experiment of registry.experiments) {
    assert.match(experiment.id, /^[a-z0-9-]+$/);
    assert.ok(!ids.has(experiment.id), `duplicate experiment ${experiment.id}`);
    ids.add(experiment.id);
    assert.ok(categories.has(experiment.type), `unknown type ${experiment.type}`);
    assert.ok(statuses.has(experiment.status), `unknown status ${experiment.status}`);
    for (const slug of experiment.components) assert.ok(componentSlugs.has(slug), `unknown component ${slug}`);
    for (const relation of experiment.relatedIssues) assert.ok(issueNumbers.has(relation.number), `unknown issue ${relation.number}`);
    for (const file of Object.values(experiment.docs)) assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
    assert.ok(experiment.review?.status, 'review status missing');
  }
  assert.deepEqual(new Set(lock.experiments.map(experiment => experiment.id)), ids);
});

test('issue records preserve provenance and allow deferred candidates', () => {
  const numbers = new Set();
  for (const issue of issues) {
    assert.ok(!numbers.has(issue.number), `duplicate issue ${issue.number}`);
    numbers.add(issue.number);
    assert.equal(issue.repository, 'uswds/uswds');
    assert.ok(issue.url.endsWith(`/${issue.number}`));
    assert.ok(issue.lastVerified);
    assert.ok(issue.component === null || registry.components.some(component => component.slug === issue.component));
  }
});

test('offline fixture is clearly labeled and never claims real USWDS', () => {
  const html = fixtureHtml({component: 'accordion', variant: 'baseline', realAssets: false});
  assert.ok(html.includes('OFFLINE ILLUSTRATION'));
  assert.ok(html.includes('class="offline"'));
});
