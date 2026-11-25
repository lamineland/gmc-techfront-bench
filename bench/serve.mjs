// Serves the 4 production builds so you can benchmark by hand with Chrome DevTools.
import fs from 'node:fs';
import { FRAMEWORKS } from './frameworks.mjs';
import { serveDir } from './static-server.mjs';

for (const f of FRAMEWORKS) {
  if (!fs.existsSync(f.dir)) {
    console.error(`Missing build for ${f.label} (${f.dist}). Run "npm run build" first.`);
    process.exit(1);
  }
  await serveDir(f.dir, f.port);
  console.log(`${f.label.padEnd(8)} http://127.0.0.1:${f.port}`);
}
console.log('Press Ctrl+C to stop.');
