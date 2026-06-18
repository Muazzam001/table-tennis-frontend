/**
 * Keeps frontend/src/shared in sync when a parent ../shared folder exists (optional).
 *
 * Standalone frontend repo: src/shared is committed and used directly.
 * If ../shared is present locally, this script refreshes the vendored copy before dev/build.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceShared = path.resolve(frontendRoot, '../shared');
const targetShared = path.resolve(frontendRoot, 'src/shared');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });

  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function syncShared() {
  try {
    await fs.access(sourceShared);
    await fs.rm(targetShared, { recursive: true, force: true });
    await copyDir(sourceShared, targetShared);
    console.log('Synced ../shared → frontend/src/shared');
    return;
  } catch {
    // Standalone frontend deploy — no parent shared folder.
  }

  try {
    await fs.access(targetShared);
    console.log('Using committed frontend/src/shared');
    return;
  } catch {
    console.error(
      'Missing frontend/src/shared. Run "npm run sync:shared" once where ../shared exists, then commit src/shared.'
    );
    process.exit(1);
  }
}

syncShared();
