#!/usr/bin/env node
// Guidepup setup imports Error.isError, which Node 22 does not provide.
// Keep the project on Node 22 and polyfill it for this CLI only.
if (typeof Error.isError !== 'function') {
  Error.isError = value => value instanceof Error;
}
await import('@guidepup/setup/lib/index.js');
