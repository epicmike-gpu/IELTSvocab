import * as esbuild from 'esbuild';
import { createRequire } from 'module';
import { cpSync } from 'fs';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const dependencies = pkg.dependencies || {};
const externalList = Object.keys(dependencies).filter(dep => dep !== 'dayjs');
try {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: 'dist',
    external: externalList,
  });
  // Copy data files to dist for Vercel deployment
  cpSync('data', 'dist/data', { recursive: true });
  console.log(' Build complete!');
} catch (e) {
  console.error(e);
  process.exit(1);
}
