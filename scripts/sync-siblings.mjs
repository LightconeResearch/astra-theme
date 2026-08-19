#!/usr/bin/env node
/**
 * Refresh the materialized copies of the sibling ASTRA packages inside
 * node_modules. npm materializes `file:` dependencies as copies (not
 * symlinks), so edits in ../astra-ui or ../lightcone-brand are silently
 * invisible to theme builds and tests until re-copied. Run this after any
 * sibling change (or let the build script call it). Once the packages are
 * published to npm and the file: wiring is gone, delete this script.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SYNCS = [
  {
    from: join(root, '../lightcone-brand'),
    to: join(root, 'node_modules/@lightcone-research/lightcone-brand'),
    entries: ['brand.css', 'theme.css', 'fonts', 'package.json', 'README.md'],
  },
  {
    from: join(root, '../astra-ui/packages/react'),
    to: join(root, 'node_modules/@lightcone-research/astra-ui'),
    entries: [
      'components.css',
      'inventory.css',
      'ui.css',
      'views.css',
      'styles.css',
      'dist',
      'package.json',
    ],
  },
];

let failed = false;
for (const { from, to, entries } of SYNCS) {
  if (!existsSync(from)) {
    console.warn(`skip: sibling checkout not found at ${from}`);
    continue;
  }
  if (!existsSync(to)) {
    console.warn(`skip: ${to} not installed (run npm install first)`);
    continue;
  }
  for (const entry of entries) {
    const source = join(from, entry);
    if (!existsSync(source)) {
      console.warn(`  missing in sibling, skipped: ${entry}`);
      continue;
    }
    const target = join(to, entry);
    rmSync(target, { recursive: true, force: true });
    try {
      cpSync(source, target, { recursive: true });
      console.log(`  synced ${entry}`);
    } catch (error) {
      failed = true;
      console.error(`  FAILED ${entry}: ${error.message}`);
    }
  }
}
process.exit(failed ? 1 : 0);
