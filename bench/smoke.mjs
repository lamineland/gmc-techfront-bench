// Functional smoke test of the UI in each production build: add, edit, delete a task.
// Usage: node bench/smoke.mjs   (after npm run build)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { FRAMEWORKS } from './frameworks.mjs';
import { serveDir } from './static-server.mjs';

const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
let failed = false;
for (const f of FRAMEWORKS) {
  const server = await serveDir(f.dir, f.port);
  const page = await browser.newPage();
  const rows = () => page.$$eval('[data-task-row]', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  try {
    await page.goto(`http://127.0.0.1:${f.port}/`);
    await page.waitForFunction(() => window.__benchReady);
    // Add
    await page.type('[data-testid=new-name]', 'Buy milk');
    await page.select('[data-testid=new-priority]', 'high');
    await page.click('button[type=submit]');
    await page.waitForFunction(() => document.querySelectorAll('[data-task-row]').length === 1);
    const added = (await rows())[0];
    if (!added.includes('Buy milk') || !added.toLowerCase().includes('high')) throw new Error(`add: ${added}`);
    // Edit
    await page.click('[data-task-row] button.ghost');
    await page.waitForSelector('[data-task-row] input');
    await page.$eval('[data-task-row] input', (el) => { el.value = ''; });
    await page.type('[data-task-row] input', 'Buy bread');
    await page.select('[data-task-row] select', 'low');
    await page.click('[data-task-row] button.primary');
    await page.waitForFunction(() => document.querySelector('[data-task-row] .name')?.textContent.includes('Buy bread'));
    const edited = (await rows())[0];
    if (!edited.toLowerCase().includes('low')) throw new Error(`edit: ${edited}`);
    // Delete
    await page.click('[data-task-row] button.danger');
    await page.waitForFunction(() => document.querySelectorAll('[data-task-row]').length === 0);
    console.log(`${f.label.padEnd(8)} OK  (added "${added}", edited "${edited}", deleted)`);
  } catch (e) {
    failed = true;
    console.log(`${f.label.padEnd(8)} FAIL ${e.message}`);
  }
  await page.close();
  server.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
