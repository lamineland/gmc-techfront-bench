import { Component, signal } from '@angular/core';
import type { BenchApi, Timing } from '@gmc/shared';

declare global {
  interface Window { __bench: BenchApi }
}

@Component({
  selector: 'app-bench-panel',
  template: `
    <div class="card bench">
      <div class="row">
        <strong>Benchmark</strong>
        <button (click)="run('Render 100', bench.render, 100)">Render 100</button>
        <button (click)="run('Render 500', bench.render, 500)">Render 500</button>
        <button (click)="run('Render 1000', bench.render, 1000)">Render 1000</button>
        <button (click)="run('Update 50', bench.update, 50)">Update 50</button>
        <button (click)="run('Delete 50', bench.remove, 50)">Delete 50</button>
        <button class="ghost" (click)="run('Clear', bench.clear)">Clear</button>
      </div>
      <div class="result" data-testid="bench-result">{{ result() }}</div>
    </div>
  `,
})
export class BenchPanelComponent {
  result = signal('');
  bench = {
    render: (n?: number) => window.__bench.render(n ?? 100),
    update: (n?: number) => window.__bench.update(n),
    remove: (n?: number) => window.__bench.remove(n),
    clear: () => window.__bench.clear(),
  };

  async run(label: string, fn: (n?: number) => Promise<Timing>, n?: number): Promise<void> {
    const r = await fn(n);
    this.result.set(`${label}: ${r.scriptMs} ms script, ${r.totalMs} ms until paint`);
  }
}
