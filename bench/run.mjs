// Automated benchmark: serves each production build, drives headless Chrome with Puppeteer,
// runs every scenario N times on a fresh page and keeps the median.
//
// Usage: node bench/run.mjs [--runs 5] [--no-build] [--only react,vue]
// Chrome: set CHROME_PATH if Chrome is not found automatically.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { FRAMEWORKS, ROOT } from './frameworks.mjs';
import { serveDir } from './static-server.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const RUNS = Number(opt('runs', 5));
const WARMUP = Number(opt('warmup', 1));
const only = opt('only', null)?.split(',');
const frameworks = FRAMEWORKS.filter((f) => !only || only.includes(f.name));

const SCENARIOS = [
  { id: 'render100', label: 'Render 100', setup: null, op: (b) => b.render(100), expect: 100 },
  { id: 'render500', label: 'Render 500', setup: null, op: (b) => b.render(500), expect: 500 },
  { id: 'render1000', label: 'Render 1000', setup: null, op: (b) => b.render(1000), expect: 1000 },
  { id: 'update50', label: 'Update 50 (of 1000)', setup: (b) => b.render(1000), op: (b) => b.update(50), expect: 1000 },
  { id: 'delete50', label: 'Delete 50 (of 1000)', setup: (b) => b.render(1000), op: (b) => b.remove(50), expect: 950 },
];

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH=/path/to/chrome');
  return found;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r2 = (n) => Math.round(n * 100) / 100;

function bundleSize(dir) {
  let raw = 0, gzip = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|css)$/.test(e.name)) {
        const buf = fs.readFileSync(p);
        raw += buf.length;
        gzip += zlib.gzipSync(buf, { level: 9 }).length;
      }
    }
  };
  walk(dir);
  return { rawKB: r2(raw / 1024), gzipKB: r2(gzip / 1024) };
}

async function openApp(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__benchReady === true, { timeout: 15000 });
  return page;
}

async function heapAfterGC(page) {
  await page.evaluate(() => window.gc && window.gc());
  const cdp = await page.createCDPSession();
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('Performance.enable');
  const { metrics } = await cdp.send('Performance.getMetrics');
  await cdp.detach();
  const cdpHeap = metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? null;
  const perfMemory = await page.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : null));
  return { cdpHeap, perfMemory };
}

async function main() {
  if (!args.includes('--no-build')) {
    console.log('Building all apps (npm run build)...');
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  }

  const chromePath = findChrome();
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--js-flags=--expose-gc',
      '--enable-precise-memory-info', // unrounded performance.memory values
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
    ],
  });
  const chromeVersion = await browser.version();

  const servers = [];
  const results = {
    date: new Date().toISOString(),
    environment: {
      chrome: chromeVersion,
      node: process.version,
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      cpu: os.cpus()[0]?.model ?? 'unknown',
      cpus: os.cpus().length,
      runs: RUNS,
      warmup: WARMUP,
      headless: true,
      cpuThrottling: 'none',
    },
    versions: {},
    frameworks: {},
  };

  try {
    for (const f of frameworks) {
      if (!fs.existsSync(f.dir)) throw new Error(`Missing build: ${f.dist}`);
      servers.push(await serveDir(f.dir, f.port));
      const url = `http://127.0.0.1:${f.port}/`;
      console.log(`\n== ${f.label} (${url})`);

      const pkgName = { react: 'react', angular: '@angular/core', vue: 'vue', svelte: 'svelte' }[f.name];
      results.versions[f.name] = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', pkgName, 'package.json'), 'utf8')).version;

      const fr = { bundle: bundleSize(f.dir), scenarios: {}, memory: {} };

      for (const s of SCENARIOS) {
        const script = [], total = [];
        for (let run = 0; run < WARMUP + RUNS; run++) {
          const page = await openApp(browser, url); // fresh page for each run
          const t = await page.evaluate(
            async (setup, op) => {
              const b = window.__bench;
              if (setup) await new Function('b', `return (${setup})(b)`)(b);
              return new Function('b', `return (${op})(b)`)(b);
            },
            s.setup ? s.setup.toString() : null,
            s.op.toString(),
          );
          const count = await page.evaluate(() => window.__bench.count());
          if (count !== s.expect) throw new Error(`${f.label} ${s.id}: expected ${s.expect} rows, got ${count}`);
          await page.close();
          if (run >= WARMUP) {
            script.push(t.scriptMs);
            total.push(t.totalMs);
          }
        }
        fr.scenarios[s.id] = {
          label: s.label,
          totalMs: { median: r2(median(total)), min: r2(Math.min(...total)), max: r2(Math.max(...total)), runs: total },
          scriptMs: { median: r2(median(script)), runs: script },
        };
        console.log(`  ${s.label.padEnd(20)} median ${r2(median(total))} ms until paint (script ${r2(median(script))} ms)`);
      }

      // Memory: JS heap after GC, empty list vs 1000 tasks rendered (median of RUNS fresh pages).
      const empty = [], full = [], emptyPM = [], fullPM = [];
      for (let run = 0; run < RUNS; run++) {
        const page = await openApp(browser, url);
        const a = await heapAfterGC(page);
        await page.evaluate(() => window.__bench.render(1000));
        const b = await heapAfterGC(page);
        await page.close();
        empty.push(a.cdpHeap); full.push(b.cdpHeap);
        emptyPM.push(a.perfMemory); fullPM.push(b.perfMemory);
      }
      const mb = (x) => r2(x / 1024 / 1024);
      fr.memory = {
        emptyMB: mb(median(empty)),
        with1000MB: mb(median(full)),
        deltaMB: mb(median(full.map((v, i) => v - empty[i]))),
        perfMemoryEmptyMB: emptyPM[0] == null ? null : mb(median(emptyPM)),
        perfMemoryWith1000MB: fullPM[0] == null ? null : mb(median(fullPM)),
      };
      console.log(`  JS heap: ${fr.memory.emptyMB} MB empty, ${fr.memory.with1000MB} MB with 1000 tasks`);
      results.frameworks[f.name] = fr;
    }
  } finally {
    await browser.close();
    servers.forEach((s) => s.close());
  }

  fs.writeFileSync(path.join(ROOT, 'bench/results.json'), JSON.stringify(results, null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, 'bench/results.md'), toMarkdown(results));
  console.log('\nWrote bench/results.json and bench/results.md');
}

function toMarkdown(res) {
  const names = Object.keys(res.frameworks);
  const label = (n) => FRAMEWORKS.find((f) => f.name === n).label;
  const e = res.environment;
  let md = `# Benchmark results\n\n`;
  md += `- Date: ${res.date}\n- Chrome: ${e.chrome} (headless, no CPU throttling)\n- Node: ${e.node}\n- OS: ${e.os}\n- CPU: ${e.cpu} (${e.cpus} cores)\n`;
  md += `- Runs: ${e.runs} measured (+${e.warmup} warm-up) per scenario, fresh page each run, **median** shown\n`;
  md += `- Versions: ${names.map((n) => `${label(n)} ${res.versions[n]}`).join(', ')}\n\n`;
  md += `## Time until paint (ms, median, lower is better)\n\n`;
  md += `| Operation | ${names.map(label).join(' | ')} |\n|---|${names.map(() => '---:').join('|')}|\n`;
  for (const s of SCENARIOS) {
    md += `| ${s.label} | ${names.map((n) => res.frameworks[n].scenarios[s.id].totalMs.median).join(' | ')} |\n`;
  }
  md += `\n## Script time only: state change + DOM patch, before paint (ms, median)\n\n`;
  md += `| Operation | ${names.map(label).join(' | ')} |\n|---|${names.map(() => '---:').join('|')}|\n`;
  for (const s of SCENARIOS) {
    md += `| ${s.label} | ${names.map((n) => res.frameworks[n].scenarios[s.id].scriptMs.median).join(' | ')} |\n`;
  }
  md += `\n## Memory and bundle size\n\n`;
  md += `| Metric | ${names.map(label).join(' | ')} |\n|---|${names.map(() => '---:').join('|')}|\n`;
  md += `| JS heap, empty list (MB) | ${names.map((n) => res.frameworks[n].memory.emptyMB).join(' | ')} |\n`;
  md += `| JS heap, 1000 tasks (MB) | ${names.map((n) => res.frameworks[n].memory.with1000MB).join(' | ')} |\n`;
  md += `| Heap added by 1000 tasks (MB) | ${names.map((n) => res.frameworks[n].memory.deltaMB).join(' | ')} |\n`;
  md += `| JS+CSS bundle, gzip (KB) | ${names.map((n) => res.frameworks[n].bundle.gzipKB).join(' | ')} |\n`;
  return md;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
