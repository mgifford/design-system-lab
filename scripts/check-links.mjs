#!/usr/bin/env node
/**
 * Check local links and assets in the built site.
 * External URLs, fragments, data URLs, and mailto/tel links are skipped.
 * A missing local target is a build failure, not a warning.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!fs.existsSync(root)) {
  console.error('links:check: dist is missing. Run npm run build:strict first.');
  process.exit(1);
}

const htmlFiles = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
};
walk(root);

const broken = [];
const checked = new Set();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let target = match[1];
    if (!target || target.startsWith('#') || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(target)) continue;
    target = target.split('#')[0].split('?')[0];
    if (!target) continue;
    const resolved = target.startsWith('/') ? path.join(root, target) : path.resolve(path.dirname(file), target);
    const key = `${path.relative(root, file)} -> ${target}`;
    if (checked.has(key)) continue;
    checked.add(key);
    if (!resolved.startsWith(root)) {
      broken.push(`${key} (outside dist)`);
    } else if (!fs.existsSync(resolved)) {
      broken.push(`${key} (missing)`);
    }
  }
}

if (broken.length) {
  console.error(broken.map(problem => `BROKEN: ${problem}`).join('\n'));
  console.error(`\n${broken.length} broken internal link(s) across ${htmlFiles.length} HTML files.`);
  process.exit(1);
}
console.log(`Checked ${checked.size} internal links across ${htmlFiles.length} HTML files; none broken.`);
