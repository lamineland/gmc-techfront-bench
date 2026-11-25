import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Production build output of every app and the port used to serve it.
export const FRAMEWORKS = [
  { name: 'react', label: 'React', dist: 'apps/react/dist', port: 4171 },
  { name: 'angular', label: 'Angular', dist: 'apps/angular/dist/browser', port: 4172 },
  { name: 'vue', label: 'Vue', dist: 'apps/vue/dist', port: 4173 },
  { name: 'svelte', label: 'Svelte', dist: 'apps/svelte/dist', port: 4174 },
].map((f) => ({ ...f, dir: path.join(ROOT, f.dist) }));
