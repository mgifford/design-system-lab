#!/usr/bin/env node
/**
 * Scaffold a new experiment without inventing evidence.
 *
 *   npm run experiment:new -- --slug my-idea --title "My idea" --type component-improvement
 *
 * Creates experiments/<slug>/, adds a registry entry in the "proposed" state,
 * and writes a source-lock entry. Every generated document says evidence is
 * absent. It does not create test results, screenshots, or a review decision.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

function parseArgs(argv) {
  const out = {components: [], dryRun: false};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
      out[key] = key === 'components' ? value.split(',').map(item => item.trim()).filter(Boolean) : value;
      i += 1;
    }
  }
  return out;
}

function fail(message) {
  console.error(`experiment:new: ${message}`);
  process.exit(1);
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  fail(error.message);
}

if (args.help || !args.slug) {
  console.log('Usage: npm run experiment:new -- --slug <slug> [--title "Title"] [--type <type>] [--components a,b] [--dry-run]');
  console.log('Types: component-improvement, new-component, cross-component-capability, alternative-implementation');
  process.exit(args.help ? 0 : 1);
}

const registryPath = path.join(root, 'data', 'registry.json');
const lockPath = path.join(root, 'data', 'sources.lock.json');
const registry = readJson(registryPath);
const lock = readJson(lockPath);
const slug = String(args.slug);
if (!/^[a-z0-9-]+$/.test(slug)) fail('slug must contain only lowercase letters, digits, and hyphens.');
if (!/^[a-z0-9-]+$/.test(slug) || slug.length > 48) fail('slug is invalid or too long (max 48 characters).');
const type = args.type || 'component-improvement';
if (!Object.hasOwn(registry.experimentTypes, type)) fail(`unknown type "${type}"`);
const title = args.title || slug.replaceAll('-', ' ').replace(/\b\w/g, character => character.toUpperCase());
const componentSlugs = new Set(registry.components.map(component => component.slug));
for (const component of args.components) if (!componentSlugs.has(component)) fail(`unknown component "${component}"`);
if (registry.experiments.some(experiment => experiment.id === slug)) fail(`experiment "${slug}" already exists`);
const directory = path.join(root, 'experiments', slug);
if (fs.existsSync(directory)) fail(`directory already exists: experiments/${slug}`);

const files = {
  'experiment.json': {
    id: slug,
    title,
    type,
    status: 'proposed',
    summary: '',
    components: args.components,
    relatedIssues: [],
    scenarios: [],
    demo: null,
    docs: {
      readme: `experiments/${slug}/README.md`,
      implementation: `experiments/${slug}/IMPLEMENTATION.md`,
      testPlan: `experiments/${slug}/TEST-PLAN.md`,
      decision: `experiments/${slug}/DECISION.md`
    },
    review: {status: 'pending', reviewer: null, decision: null, record: `experiments/${slug}/DECISION.md`},
    aiAssistance: []
  },
  'README.md': `# ${title}\n\n**Status: Draft — no verified evidence.**\n\n**Category:** ${registry.experimentTypes[type]}\n\n## Why this exists\n\nDescribe the user need and link the upstream issue or discussion. Do not treat a closed issue as proof that the need was rejected.\n\n## What is proposed\n\nDescribe the smallest implementation that demonstrates the idea. State what is intentionally out of scope.\n\n## What stable USWDS provides\n\nState whether this improves an existing component, introduces a component with no stable equivalent, or changes a capability across components.\n\n## Evidence status\n\nNo automated evidence has been collected. No human review has occurred. A successful build is not evidence.\n\n## Next steps\n\n1. Add fixtures and a deterministic test.\n2. Run \`npm run build:strict\`, \`npm run test:browser\`, and \`npm run evidence\`.\n3. Replace this section with links to generated reports, failures, and coverage gaps.\n4. Ask a human reviewer to complete \`DECISION.md\`.\n`,
  'IMPLEMENTATION.md': `# Implementation: ${title}\n\n## Authoring\n\nDocument the HTML structure, required classes, scripts, and tokens. Explain any divergence from stable USWDS.\n\n## Accessibility considerations\n\nList keyboard behavior, accessible names, state exposure, preferences, forced-colors behavior, and known gaps.\n\n## Known limitations\n\n- No evidence collected yet.\n- No human review yet.\n`,
  'TEST-PLAN.md': `# Test plan: ${title}\n\n## Deterministic browser checks\n\n- [ ] Route loads with a descriptive title and one visible h1.\n- [ ] Baseline and experiment are identified.\n- [ ] Keyboard path is tested with real key presses.\n- [ ] No JavaScript path is tested where applicable.\n- [ ] Dark, RTL, forced-colors, and reduced-motion behavior is tested where relevant.\n- [ ] Axe or a documented manual check records any violations.\n\n## Evidence to collect\n\n- [ ] Initial Guidepup virtual transcript.\n- [ ] State-specific transcripts.\n- [ ] Screenshots for visual comparison.\n- [ ] Explicit list of what was not tested.\n\n## Human review\n\nA human reviewer must record a decision in \`DECISION.md\`. Automated output alone is not approval.\n`,
  'DECISION.md': `# Experiment decision: ${title}\n\n- Status: **pending human review**\n- Reviewer:\n- Review date:\n- Decision: pending / accept as experiment / revise / reject / propose upstream\n- Rationale:\n- Evidence reviewed:\n- Risks and compatibility:\n- Explicitly unverified:\n- AI assistance disclosure:\n- Authorization to publish or submit upstream: none unless explicitly granted\n`,
  'fixtures/README.md': `# Fixtures\n\nPut experiment-only fixture markup here. Baseline and experiment variants for stable components are generated from \`data/registry.json\`. Do not add a fabricated baseline for a new component.\n`,
  'tests/README.md': `# Tests\n\nDeterministic Playwright tests live in \`tests/browser/site.spec.mjs\` and are driven by the registry and routes. Add a test that proves the intended behavior; do not add placeholder results or claim a test passed before it runs.\n`
};

const registryEntry = files['experiment.json'];
delete files['experiment.json'];

if (args.dryRun) {
  console.log(`Would create experiments/${slug}/ with ${Object.keys(files).join(', ')} and a registry entry.`);
  process.exit(0);
}

fs.mkdirSync(directory, {recursive: true});
for (const [file, content] of Object.entries(files)) {
  const target = path.join(directory, file);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, content);
}
registry.experiments.push(registryEntry);
writeJson(registryPath, registry);
lock.experiments.push({id: slug, path: `experiments/${slug}`, revision: null});
writeJson(lockPath, lock);

console.log(`Created experiments/${slug}/ (${registryEntry.type}, status proposed).`);
console.log('Registry and source lock updated.');
console.log('Next: implement a fixture and test, run npm run check, then collect evidence.');
console.log('The experiment remains "Draft — no verified evidence" until a human reviews DECISION.md.');
