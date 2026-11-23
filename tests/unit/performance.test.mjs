import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyResource,
  summarizeRun,
  aggregateRuns,
  evaluateBudgets,
  compareCosts
} from '../../scripts/performance.mjs';

const budgets = {
  default: {
    transferSize: {total: 1000, css: 500, javascript: 300, font: 100, image: 100, other: 100},
    requests: {total: 5, css: 1, javascript: 1},
    domElements: 50,
    timings: {largestContentfulPaint: 2500, cumulativeLayoutShift: 0.1}
  },
  routes: {
    'fixture/alert-baseline.html': {domElements: 80}
  }
};

test('resources are classified by extension, not only initiator type', () => {
  assert.equal(classifyResource({name: 'https://example.test/uswds.css', initiatorType: 'link'}), 'css');
  assert.equal(classifyResource({name: 'https://example.test/app.mjs', initiatorType: 'script'}), 'javascript');
  assert.equal(classifyResource({name: 'https://example.test/font.woff2', initiatorType: 'css'}), 'font');
  assert.equal(classifyResource({name: 'https://example.test/icon.svg', initiatorType: 'css'}), 'image');
  assert.equal(classifyResource({name: 'https://example.test/favicon.ico', initiatorType: 'other'}), 'image');
  assert.equal(classifyResource({name: 'https://example.test/data.json', initiatorType: 'fetch'}), 'other');
});

test('a run summarizes transfer size, requests, DOM, and timings', () => {
  const run = summarizeRun({
    navigation: {transferSize: 100, encodedBodySize: 90, responseStart: 10, domContentLoadedEventEnd: 50, loadEventEnd: 90},
    resources: [
      {name: 'https://example.test/a.css', initiatorType: 'link', transferSize: 400},
      {name: 'https://example.test/a.js', initiatorType: 'script', transferSize: 300},
      {name: 'https://example.test/font.woff2', initiatorType: 'css', transferSize: 100}
    ],
    domElements: 25,
    vitals: {firstContentfulPaint: 120, largestContentfulPaint: 300, cumulativeLayoutShift: 0.05, longTasks: [80, 40]}
  });
  assert.equal(run.transferSize.total, 900);
  assert.equal(run.transferSize.html, 100);
  assert.equal(run.transferSize.css, 400);
  assert.equal(run.transferSize.javascript, 300);
  assert.equal(run.transferSize.font, 100);
  assert.equal(run.requests.total, 4);
  assert.equal(run.domElements, 25);
  assert.equal(run.timings.totalBlockingTime, 30);
  assert.equal(run.timings.longTaskCount, 2);
  assert.equal(run.timings.load, 90);
});

test('aggregate uses medians and preserves spread', () => {
  const make = total => ({
    transferSize: {html: 1, css: total, javascript: 0, font: 0, image: 0, other: 0, total},
    requests: {html: 1, css: 1, javascript: 0, font: 0, image: 0, other: 0, total: 2},
    domElements: total,
    timings: {ttfb: total, firstContentfulPaint: total, largestContentfulPaint: total, cumulativeLayoutShift: 0, totalBlockingTime: 0, longTaskCount: 0, domContentLoaded: total, load: total}
  });
  const aggregate = aggregateRuns([make(10), make(30), make(20)]);
  assert.equal(aggregate.transferSize.total.median, 20);
  assert.equal(aggregate.transferSize.total.min, 10);
  assert.equal(aggregate.transferSize.total.max, 30);
  assert.equal(aggregate.domElements.median, 20);
  assert.equal(aggregate.timings.load.median, 20);
});

test('hard budgets fail on bytes, requests, and DOM; timing budgets warn', () => {
  const metrics = {
    transferSize: {html: 1, css: 600, javascript: 0, font: 0, image: 0, other: 0, total: 1200},
    requests: {html: 1, css: 1, javascript: 1, font: 0, image: 0, other: 0, total: 3},
    domElements: 60,
    timings: {largestContentfulPaint: 3000, cumulativeLayoutShift: 0.2}
  };
  const checks = evaluateBudgets(metrics, budgets, 'fixture/accordion-baseline.html');
  assert.equal(checks.find(check => check.metric === 'transferSize.total').status, 'fail');
  assert.equal(checks.find(check => check.metric === 'transferSize.css').status, 'fail');
  assert.equal(checks.find(check => check.metric === 'domElements').status, 'fail');
  assert.equal(checks.find(check => check.metric === 'timings.largestContentfulPaint').status, 'warn');
  assert.equal(checks.find(check => check.metric === 'timings.cumulativeLayoutShift').status, 'warn');
  assert.equal(checks.find(check => check.metric === 'requests.total').status, 'pass');
});

test('per-route budget overrides replace the default limit', () => {
  const metrics = {
    transferSize: {html: 0, css: 0, javascript: 0, font: 0, image: 0, other: 0, total: 0},
    requests: {html: 1, css: 0, javascript: 0, font: 0, image: 0, other: 0, total: 1},
    domElements: 70,
    timings: {largestContentfulPaint: 0, cumulativeLayoutShift: 0}
  };
  const defaultCheck = evaluateBudgets(metrics, budgets, 'fixture/accordion-baseline.html').find(check => check.metric === 'domElements');
  const overrideCheck = evaluateBudgets(metrics, budgets, 'fixture/alert-baseline.html').find(check => check.metric === 'domElements');
  assert.equal(defaultCheck.status, 'fail');
  assert.equal(overrideCheck.status, 'pass');
});

test('cost comparison reports byte, request, DOM, and timing deltas', () => {
  const baseline = {
    transferSize: {html: 0, css: 100, javascript: 100, font: 0, image: 0, other: 0, total: 200},
    requests: {html: 1, css: 1, javascript: 1, font: 0, image: 0, other: 0, total: 3},
    domElements: 20,
    timings: {largestContentfulPaint: 1000, firstContentfulPaint: 500, cumulativeLayoutShift: 0, totalBlockingTime: 10, longTaskCount: 0, domContentLoaded: 400, load: 600, ttfb: 50}
  };
  const experiment = {
    transferSize: {html: 0, css: 150, javascript: 100, font: 0, image: 0, other: 0, total: 250},
    requests: {html: 1, css: 1, javascript: 1, font: 0, image: 0, other: 0, total: 3},
    domElements: 24,
    timings: {largestContentfulPaint: 1200, firstContentfulPaint: 600, cumulativeLayoutShift: 0.01, totalBlockingTime: 20, longTaskCount: 0, domContentLoaded: 450, load: 700, ttfb: 50}
  };
  const comparison = compareCosts(baseline, experiment);
  assert.equal(comparison.transferSize.total.bytes, 50);
  assert.equal(comparison.transferSize.total.percent, 25);
  assert.equal(comparison.transferSize.css.bytes, 50);
  assert.equal(comparison.transferSize.javascript.bytes, 0);
  assert.equal(comparison.requests.total.requests, 0);
  assert.equal(comparison.domElements.elements, 4);
  assert.equal(comparison.timings.largestContentfulPaint.delta, 200);
});
