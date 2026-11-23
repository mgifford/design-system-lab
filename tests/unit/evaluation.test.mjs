import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixtureHtml} from '../../scripts/components.mjs';
import {
  normalizeEvaluationParams,
  fixtureParams,
  fixtureUrl,
  evaluationUrl,
  diffImageData,
  classifyFindings,
  summarizeManualResults,
  statesFor,
  experimentsFor,
  EVALUATION_SCHEMA_VERSION
} from '../../site/assets/evaluation-core.js';

const registry = JSON.parse(fs.readFileSync(new URL('../../data/registry.json', import.meta.url), 'utf8'));
const manual = JSON.parse(fs.readFileSync(new URL('../../data/manual-tests.json', import.meta.url), 'utf8'));

test('evaluation params normalize valid values', () => {
  const {config, ignored} = normalizeEvaluationParams('component=alert&state=warning&view=reveal&theme=dark&motion=reduce&direction=rtl&language=ar&width=390&textSize=200&spacing=wcag&contrast=more&render=captured&capture=forced-colors', registry);
  assert.deepEqual(ignored, []);
  assert.equal(config.component, 'alert');
  assert.equal(config.experiment, 'dark-mode');
  assert.equal(config.state, 'warning');
  assert.equal(config.view, 'reveal');
  assert.equal(config.theme, 'dark');
  assert.equal(config.width, '390');
  assert.equal(config.capture, 'forced-colors');
});

test('invalid evaluation params fall back and are reported', () => {
  const {config, ignored} = normalizeEvaluationParams('component=nope&state=nope&view=hack&theme=neon&width=9999&capture=nope', registry);
  assert.equal(config.component, 'accordion');
  assert.equal(config.state, 'default');
  assert.equal(config.view, 'split');
  assert.equal(config.theme, 'system');
  assert.equal(config.width, '1280');
  assert.equal(config.capture, 'light');
  for (const key of ['component', 'state', 'view', 'theme', 'width', 'capture']) {
    assert.ok(ignored.includes(key), `expected ${key} to be reported`);
  }
});

test('state falls back when it belongs to another component', () => {
  const {config, ignored} = normalizeEvaluationParams('component=accordion&state=emergency', registry);
  assert.equal(config.component, 'accordion');
  assert.equal(config.state, 'default');
  assert.ok(ignored.includes('state'));
});

test('fixture params omit defaults and preserve the legacy order', () => {
  const {config} = normalizeEvaluationParams('component=banner&theme=dark&direction=rtl', registry);
  assert.equal(fixtureParams(config).toString(), 'theme=dark&dir=rtl');
  assert.equal(fixtureUrl(config, 'baseline'), 'fixture/banner-baseline.html?theme=dark&dir=rtl');
  const alert = normalizeEvaluationParams('component=alert&state=warning&theme=dark', registry).config;
  assert.equal(fixtureParams(alert).toString(), 'state=warning&theme=dark');
});

test('evaluation links are versioned and round-trip', () => {
  const {config} = normalizeEvaluationParams('component=alert&state=error&view=onion&width=768&capture=dark&render=captured', registry);
  const url = evaluationUrl(config, 'compare.html');
  assert.match(url, new RegExp(`^compare\\.html\\?v=${EVALUATION_SCHEMA_VERSION}&`));
  const parsed = new URL(url, 'https://example.test/');
  const again = normalizeEvaluationParams(parsed.search, registry).config;
  assert.deepEqual(again, config);
});

test('alert states are declared and match both generated fixtures', () => {
  const states = statesFor(registry, 'alert');
  assert.ok(states.length >= 10);
  const ids = new Set(states.map(state => state.id));
  assert.ok(ids.has('dynamic'));
  assert.ok(ids.has('updated'));
  assert.ok(ids.has('multiple'));
  for (const state of states.filter(item => item.id !== 'default')) {
    for (const variant of ['baseline', 'experiment']) {
      const html = fixtureHtml({component: 'alert', variant, realAssets: true});
      assert.match(html, new RegExp(`data-state="${state.id}"`), `missing ${state.id} marker in alert-${variant} source`);
    }
  }
});

test('experiments are filtered by component', () => {
  assert.equal(experimentsFor(registry, 'alert')[0].id, 'dark-mode');
  assert.equal(experimentsFor(registry, 'radio-validation')[0].id, 'radio-validation');
});

test('pixel diff counts changed pixels and bounds', () => {
  const width = 2;
  const height = 2;
  const baseline = new Uint8ClampedArray(width * height * 4).fill(255);
  const experiment = new Uint8ClampedArray(baseline);
  experiment[0] = 0;
  experiment[1] = 0;
  experiment[2] = 0;
  const result = diffImageData(baseline, experiment, width, height, {threshold: 16, intensity: 1});
  assert.equal(result.changed, 1);
  assert.equal(result.total, 4);
  assert.equal(result.percent, 25);
  assert.deepEqual(result.bounds, {x: 0, y: 0, width: 1, height: 1});
  assert.equal(result.diff[0], 255);
});

test('pixel diff tolerates antialiasing below the threshold', () => {
  const width = 1;
  const height = 1;
  const baseline = new Uint8ClampedArray([100, 100, 100, 255]);
  const experiment = new Uint8ClampedArray([105, 105, 105, 255]);
  const result = diffImageData(baseline, experiment, width, height, {threshold: 16});
  assert.equal(result.changed, 0);
  assert.equal(result.bounds, null);
});

test('pixel diff rejects mismatched buffers', () => {
  assert.throws(() => diffImageData(new Uint8ClampedArray(4), new Uint8ClampedArray(8), 1, 1), /same dimensions/);
});

test('findings classify fixed, introduced, and common violations', () => {
  const baseline = [{id: 'a', impact: 'serious'}, {id: 'b', impact: 'moderate'}];
  const experiment = [{id: 'b', impact: 'moderate'}, {id: 'c', impact: 'critical'}];
  const result = classifyFindings(baseline, experiment);
  assert.deepEqual(result.fixed.map(item => item.id), ['a']);
  assert.deepEqual(result.introduced.map(item => item.id), ['c']);
  assert.deepEqual(result.common.map(item => item.id), ['b']);
  assert.equal(result.baselineCount, 2);
  assert.equal(result.experimentCount, 2);
});

test('manual results summarize only recorded statuses', () => {
  const tests = manual.tests.filter(item => item.component === 'alert');
  const results = {[tests[0].id]: {status: 'pass'}, [tests[1].id]: {status: 'not-applicable'}};
  const summary = summarizeManualResults(tests, results);
  assert.equal(summary.total, tests.length);
  assert.equal(summary.completed, 2);
  assert.equal(summary.byStatus.pass, 1);
  assert.equal(summary.byStatus['not-tested'], tests.length - 2);
});

test('manual test definitions are complete and do not claim results', () => {
  assert.ok(manual.tests.length >= 9);
  const ids = new Set();
  for (const test of manual.tests) {
    assert.match(test.id, /^[a-z0-9-]+$/);
    assert.ok(!ids.has(test.id), `duplicate ${test.id}`);
    ids.add(test.id);
    assert.ok(registry.components.some(component => component.slug === test.component));
    assert.ok(test.steps.length >= 2);
    assert.match(test.source, /^https:\/\//);
    assert.ok(!Object.hasOwn(test, 'result'));
  }
});
