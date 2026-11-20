#!/usr/bin/env node
/**
 * Validate the registry, source lock, generated routes, MCP scenarios, docs, and
 * evidence before a build is published. Fails loudly; never marks a gap as a pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const allowEvidenceFailures = args.has('--allow-evidence-failures');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const exists = file => fs.existsSync(file);
const problems = [];
const warnings = [];
const add = message => problems.push(message);
const warn = message => warnings.push(message);

function requireFile(relative, label) {
  if (!exists(path.join(root, relative))) add(`${label} is missing: ${relative}`);
}
function readRequired(relative, label) {
  if (!exists(path.join(root, relative))) {
    add(`${label} is missing: ${relative}`);
    return null;
  }
  try {
    return readJson(path.join(root, relative));
  } catch (error) {
    add(`${label} is not valid JSON: ${relative} (${error.message})`);
    return null;
  }
}

const registry = readRequired('data/registry.json', 'registry');
const issues = readRequired('data/issues.json', 'issue index');
const lock = readRequired('data/sources.lock.json', 'source lock');
const pkg = readRequired('package.json', 'package.json');
const build = readRequired('dist/data/build.json', 'build metadata (run npm run build:strict)');
const routes = readRequired('dist/data/routes.json', 'route inventory (run npm run build:strict)');
const mcp = readRequired('tests/mcp/scenarios.json', 'MCP scenarios');
const evidence = readRequired('dist/data/evidence.json', 'evidence metadata');
const experimentTypes = new Set(Object.keys(registry?.experimentTypes || {}));
const experimentStatuses = new Set(Object.keys(registry?.experimentStatuses || {}));
const componentSlugs = new Set((registry?.components || []).map(component => component.slug));
const issueNumbers = new Set((issues || []).map(issue => issue.number));
const experimentIds = new Set();

requireFile('.gitignore', 'Gitignore');
requireFile('.mcp.json', 'Project MCP configuration');
requireFile('package-lock.json', 'Committed package lockfile');

if (registry && registry.schemaVersion !== 2) add(`registry schemaVersion must be 2; found ${registry.schemaVersion}`);
if (lock && registry && lock.baseline.version !== registry.baseline.version) add('sources.lock version does not match registry baseline version');
if (pkg && lock && pkg.dependencies?.['@uswds/uswds'] !== lock.baseline.version) add('package.json is not pinned to sources.lock version');
if (lock) {
  if (!/^[0-9a-f]{40}$/.test(lock.baseline.commit || '')) add('sources.lock baseline.commit must be a 40-character commit SHA');
  if (!lock.baseline.release?.startsWith('v')) add('sources.lock baseline.release must be a tag such as v3.14.0');
  if (!lock.baseline.releaseDate) add('sources.lock baseline.releaseDate is missing');
  if (!lock.baseline.packageLock?.sha256) add('sources.lock package-lock hash is missing');
  if (!lock.baseline.assets?.css?.sha256 || !lock.baseline.assets?.js?.sha256) add('sources.lock asset hashes are missing');
}
if (exists(path.join(root, 'node_modules', '@uswds', 'uswds'))) {
  try {
    execFileSync(process.execPath, ['scripts/check-releases.mjs', '--verify'], {cwd: root, stdio: 'pipe'});
  } catch (error) {
    add(`source verification failed: ${String(error.stderr || error.message).trim()}`);
  }
} else {
  warn('node_modules is absent; source hashes could not be verified against installed assets.');
}

for (const component of registry?.components || []) {
  if (!component.slug || !/^[a-z0-9-]+$/.test(component.slug)) add(`invalid component slug: ${component.slug}`);
  for (const field of ['name', 'group', 'summary', 'purpose', 'reference', 'accessibility', 'guide']) {
    if (!component[field]) add(`component ${component.slug} is missing ${field}`);
  }
  for (const field of ['whenToUse', 'whenNotToUse', 'implementation', 'keyboard', 'preferences', 'mistakes', 'testing', 'limitations', 'issues']) {
    if (!Array.isArray(component[field]) || component[field].length === 0) add(`component ${component.slug} needs a non-empty ${field} array`);
  }
  for (const number of component.issues || []) if (!issueNumbers.has(number)) add(`component ${component.slug} links unknown issue #${number}`);
  const guide = String(component.guide || '').split('#')[0];
  requireFile(guide, `component ${component.slug} guide`);
  for (const variant of ['baseline', 'experiment']) {
    requireFile(`dist/fixture/${component.slug}-${variant}.html`, `component ${component.slug} ${variant} fixture`);
  }
  for (const url of [component.reference, component.accessibility]) {
    if (!/^https?:\/\//.test(String(url))) add(`component ${component.slug} has a non-HTTP reference: ${url}`);
  }
}

const issueMap = new Map((issues || []).map(issue => [issue.number, issue]));
for (const issue of issues || []) {
  if (typeof issue.number !== 'number') add('issue record has a non-numeric number');
  if (issue.repository !== 'uswds/uswds') add(`issue #${issue.number} has an unexpected repository`);
  if (!issue.url?.endsWith(`/${issue.number}`)) add(`issue #${issue.number} URL does not end in its number`);
  if (!issue.lastVerified) add(`issue #${issue.number} is missing lastVerified`);
  if (issue.component !== null && !componentSlugs.has(issue.component)) add(`issue #${issue.number} references unknown component ${issue.component}`);
  if (!issue.title || !issue.proposed) add(`issue #${issue.number} is missing title or proposed text`);
}

for (const experiment of registry?.experiments || []) {
  if (!experiment.id || !/^[a-z0-9-]+$/.test(experiment.id)) add(`invalid experiment id: ${experiment.id}`);
  if (experimentIds.has(experiment.id)) add(`duplicate experiment id: ${experiment.id}`);
  experimentIds.add(experiment.id);
  if (!experimentTypes.has(experiment.type)) add(`experiment ${experiment.id} has unknown type ${experiment.type}`);
  if (!experimentStatuses.has(experiment.status)) add(`experiment ${experiment.id} has unknown status ${experiment.status}`);
  for (const field of ['title', 'summary']) if (!experiment[field]) add(`experiment ${experiment.id} is missing ${field}`);
  for (const slug of experiment.components || []) if (!componentSlugs.has(slug)) add(`experiment ${experiment.id} references unknown component ${slug}`);
  for (const relation of experiment.relatedIssues || []) {
    if (relation.repository !== 'uswds/uswds') add(`experiment ${experiment.id} has an unsupported issue repository`);
    if (!issueNumbers.has(relation.number)) add(`experiment ${experiment.id} links unknown issue #${relation.number}`);
    if (!relation.relationship) add(`experiment ${experiment.id} issue #${relation.number} lacks a relationship`);
  }
  for (const [key, file] of Object.entries(experiment.docs || {})) {
    if (file) requireFile(file, `experiment ${experiment.id} ${key} document`);
  }
  if (!experiment.docs?.readme || !experiment.docs?.implementation || !experiment.docs?.testPlan || !experiment.docs?.decision) {
    add(`experiment ${experiment.id} must register readme, implementation, testPlan, and decision documents`);
  }
  if (!experiment.review || !experiment.review.status) add(`experiment ${experiment.id} has no review status`);
  if (experiment.review?.status === 'accepted' && (!experiment.review.reviewer || !experiment.review.decision || !experiment.review.reviewedAt)) {
    add(`experiment ${experiment.id} is marked accepted without a reviewer, decision, and reviewedAt date`);
  }
  if (experiment.demo) {
    const demoRoute = String(experiment.demo).split('?')[0];
    if (!routes?.includes(demoRoute)) add(`experiment ${experiment.id} demo route is not published: ${demoRoute}`);
  }
  if (experiment.status === 'evidence-collected' && !evidence?.generated) add(`experiment ${experiment.id} claims collected evidence but no run exists`);
}

const lockIds = new Set((lock?.experiments || []).map(experiment => experiment.id));
for (const id of experimentIds) if (!lockIds.has(id)) add(`source lock has no entry for experiment ${id}`);
for (const id of lockIds) if (!experimentIds.has(id)) add(`source lock references unknown experiment ${id}`);

for (const scenario of registry?.scenarios || []) {
  if (!componentSlugs.has(scenario.component)) add(`scenario ${scenario.id} references unknown component ${scenario.component}`);
  if (!scenario.intent) add(`scenario ${scenario.id} has no intent`);
}
const scenarioIds = new Set();
for (const scenario of registry?.scenarios || []) {
  if (scenarioIds.has(scenario.id)) add(`duplicate scenario ${scenario.id}`);
  scenarioIds.add(scenario.id);
}

if (routes && mcp) {
  if (new Set(routes).size !== routes.length) add('routes.json contains duplicate routes');
  const mcpRoutes = new Set(mcp.map(entry => entry.route));
  if (mcpRoutes.size !== mcp.length) add('MCP scenarios contain duplicate routes');
  for (const route of routes) {
    if (!exists(path.join(root, 'dist', route))) add(`published route is missing from dist: ${route}`);
    if (!mcpRoutes.has(route)) add(`no MCP scenario for route: ${route}`);
  }
  for (const entry of mcp) {
    if (!routes.includes(entry.route)) add(`MCP scenario is not a published route: ${entry.route}`);
    if (!entry.goal || !Array.isArray(entry.steps) || entry.steps.length === 0) add(`MCP scenario is incomplete: ${entry.route}`);
  }
  const distPages = [];
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) distPages.push(path.relative(path.join(root, 'dist'), full).split(path.sep).join('/'));
    }
  };
  if (exists(path.join(root, 'dist'))) walk(path.join(root, 'dist'));
  for (const page of distPages) {
    if (page.startsWith('docs/') || page.startsWith('evidence/')) continue;
    if (!routes.includes(page)) add(`published HTML page is not in routes.json: ${page}`);
  }
}

if (evidence?.generated) {
  if (!evidence.runId) add('evidence run has no runId');
  if (!['completed', 'failed', 'running'].includes(evidence.status)) add(`evidence run has unexpected status: ${evidence.status}`);
  const pages = evidence.pages || [];
  if (evidence.succeeded + evidence.failed !== pages.length) add('evidence succeeded + failed does not equal page count');
  if (evidence.status === 'running') add('evidence run is still marked running; it was not finalized');
  for (const route of routes || []) {
    if (!pages.some(page => page.name === route)) add(`evidence run does not cover route: ${route}`);
  }
  for (const page of pages) {
    if (page.result === 'collected-not-reviewed' && !page.report) add(`collected evidence page has no report: ${page.name}`);
    if (page.report && !exists(path.join(root, 'dist', 'evidence', 'latest', page.report))) add(`evidence report is missing from dist: ${page.report}`);
  }
  if (evidence.failed > 0) {
    const message = `evidence run ${evidence.runId} reports ${evidence.failed} failed page(s)`;
    if (allowEvidenceFailures) warn(`${message}; allowed by --allow-evidence-failures`);
    else add(message);
  }
} else if (evidence && !evidence.generated) {
  warn('No evidence run is published in this build.');
}

for (const relative of [
  'docs/ARCHITECTURE.md',
  'docs/CONTRIBUTING-EXPERIMENTS.md',
  'docs/TESTING.md',
  'docs/EVIDENCE.md',
  'docs/DESIGN-DECISIONS.md',
  'docs/EXPERIMENT-DECISIONS.md',
  'CONTRIBUTING.md',
  'README.md',
  'ACCESSIBILITY.md',
  'GOVERNANCE.md',
  'AI_DISCLOSURE.md',
  'THIRD-PARTY.md'
]) requireFile(relative, 'required documentation');

if (warnings.length) console.warn(warnings.map(warning => `WARN: ${warning}`).join('\n'));
if (problems.length) {
  console.error(problems.map(problem => `ERROR: ${problem}`).join('\n'));
  console.error(`\n${problems.length} validation problem(s).`);
  process.exit(1);
}
console.log(`Validated ${registry.components.length} components, ${registry.experiments.length} experiments, ${issues.length} issues, ${registry.scenarios.length} scenarios, ${routes.length} routes, and ${mcp.length} MCP scenarios.`);
if (evidence?.generated) console.log(`Evidence run ${evidence.runId}: ${evidence.succeeded} collected, ${evidence.failed} failed.`);
