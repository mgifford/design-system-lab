#!/usr/bin/env node
/**
 * Keep tests/mcp/scenarios.json in step with the built route inventory.
 *
 *   npm run build:strict && npm run mcp:sync
 *   npm run mcp:check
 *
 * Existing route entries are preserved (including their investigation steps).
 * Missing routes get a deterministic, honest starting procedure. Orphans are
 * reported and removed only by the write mode.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routesPath = path.join(root, 'dist', 'data', 'routes.json');
const registryPath = path.join(root, 'data', 'registry.json');
const scenariosPath = path.join(root, 'tests', 'mcp', 'scenarios.json');
const checkOnly = process.argv.includes('--check');

if (!fs.existsSync(routesPath)) {
  console.error('mcp:sync: dist/data/routes.json is missing. Run npm run build:strict first.');
  process.exit(1);
}
const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const existing = fs.existsSync(scenariosPath) ? JSON.parse(fs.readFileSync(scenariosPath, 'utf8')) : [];
const byRoute = new Map(existing.map(entry => [entry.route, entry]));
const components = new Map(registry.components.map(component => [component.slug, component]));
const experiments = new Map(registry.experiments.map(experiment => [experiment.id, experiment]));

function scenarioFor(route) {
  if (byRoute.has(route)) return byRoute.get(route);
  if (route.startsWith('component/')) {
    const slug = route.slice('component/'.length).replace(/\.html$/, '');
    const component = components.get(slug);
    if (!component) throw new Error(`No component registry entry for ${route}`);
    return {
      route,
      goal: `Review the ${component.name} component page, stable guidance, and available experiments`,
      steps: [
        'Capture the accessibility snapshot, headings, and landmark structure',
        'Open the official USWDS guidance and accessibility test links',
        'Follow each experiment link and identify the baseline versus proposed behavior',
        'Confirm the page distinguishes tested behavior from pending human review',
        'Record broken links, missing evidence, or claims that are not supported'
      ]
    };
  }
  if (route.startsWith('experiment/')) {
    const id = route.slice('experiment/'.length).replace(/\.html$/, '');
    const experiment = experiments.get(id);
    if (!experiment) throw new Error(`No experiment registry entry for ${route}`);
    return {
      route,
      goal: `Investigate the ${experiment.title} proposal and its evidence status`,
      steps: [
        'Capture the accessibility snapshot and document outline',
        'Verify the category, status, and baseline release are stated',
        'Open the working demonstration and test the interaction with keyboard input',
        'Open the implementation guidance and test plan',
        'Check the evidence status and confirm no automated result is presented as human approval',
        'Record what is unverified and any disagreement with the stated limitations'
      ]
    };
  }
  if (route.startsWith('fixture/')) {
    const file = route.slice('fixture/'.length).replace(/\.html$/, '');
    const variant = file.endsWith('-experiment') ? 'experiment' : 'baseline';
    const slug = file.slice(0, -(variant.length + 1));
    const component = components.get(slug);
    if (!component) throw new Error(`No component registry entry for ${route}`);
    const steps = [
      'Capture the initial accessibility snapshot and page title',
      'Confirm the variant label matches the page you opened',
      'Identify the component and its accessible name, role, and state'
    ];
    if (['accordion', 'banner'].includes(slug)) {
      steps.push('Focus the disclosure button and press Enter, then Space; record aria-expanded and target visibility');
      steps.push('Check focus remains visible and the panel content is reachable');
    } else if (slug === 'form' || slug === 'radio-validation') {
      steps.push('Submit the empty form and record native validation and focus placement');
      steps.push('Complete the required controls with the keyboard and submit the local success path');
    } else {
      steps.push('Read the variants without relying on color and record how meaning is conveyed');
    }
    if (variant === 'experiment') steps.push('Repeat with theme=dark and dir=rtl; note any unthemed surface or contrast concern');
    steps.push('Record any difference from the baseline without calling it a regression before reproduction');
    return {
      route,
      goal: `Exercise the ${component.name} ${variant} fixture with real browser input`,
      steps
    };
  }
  return {
    route,
    goal: `Review ${route} for scope, evidence status, and navigation integrity`,
    steps: [
      'Capture the accessibility snapshot and heading outline',
      'Use the primary navigation to reach the page and confirm the current-page state',
      'Check that baseline and experiment claims are distinguishable',
      'Record broken links, missing status text, or unsupported claims'
    ]
  };
}

const expected = routes.map(scenarioFor);
const expectedRoutes = new Set(expected.map(entry => entry.route));
const missing = routes.filter(route => !byRoute.has(route));
const orphans = existing.map(entry => entry.route).filter(route => !expectedRoutes.has(route));
const empty = expected.filter(entry => !entry.goal || !Array.isArray(entry.steps) || entry.steps.length === 0);

if (checkOnly) {
  const problems = [
    ...missing.map(route => `missing MCP scenario for ${route}`),
    ...orphans.map(route => `orphan MCP scenario for ${route}`),
    ...empty.map(entry => `incomplete MCP scenario for ${entry.route}`)
  ];
  if (problems.length) {
    console.error(problems.join('\n'));
    console.error('Run npm run mcp:sync to update tests/mcp/scenarios.json.');
    process.exit(1);
  }
  console.log(`MCP scenarios cover all ${routes.length} published routes.`);
  process.exit(0);
}

fs.writeFileSync(scenariosPath, `${JSON.stringify(expected, null, 2)}\n`);
console.log(`Wrote ${expected.length} MCP scenarios (${missing.length} added, ${orphans.length} removed).`);
