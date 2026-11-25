# gmc-front-bench

GoMyCode exercise: benchmark **React, Angular, Vue and Svelte** on DOM manipulation.
The same to-do app is written in each framework, then a headless Chrome script measures
initial rendering, updates, deletions and JS heap memory on the production builds.

## Structure

```
gmc-front-bench/
├── apps/
│   ├── react/      React 19 + Vite: components, useState, keyed list, memo rows, flushSync
│   ├── angular/    Angular 22 (CLI, standalone, zoneless): @for + track, *ngFor, ngModel, signals, OnPush rows
│   ├── vue/        Vue 3.5 + Vite: ref() reactivity, v-for with :key, v-model
│   └── svelte/     Svelte 5 + Vite: $state runes, keyed {#each}, bind:value
├── packages/
│   └── shared/     Same data generator, same CSS, and the shared window.__bench API
├── bench/
│   ├── run.mjs     Automated benchmark (Puppeteer + headless Chrome)
│   ├── smoke.mjs   UI test: add, edit, delete a task in every app
│   ├── serve.mjs   Serves the 4 production builds for manual testing
│   ├── results.json / results.md   Raw and formatted results of the last run
└── docs/devtools.md  How to reproduce a measurement with Chrome DevTools
```

## Part 1: the to-do app

Every app has the same UI and features:

- **Add** a task (name + priority `low` / `medium` / `high`).
- **View** all tasks with a colored priority badge and a task counter.
- **Edit** a task's name or priority (inline form, Save / Cancel).
- **Delete** a task.
- A **benchmark panel** (Render 100 / 500 / 1000, Update 50, Delete 50, Clear) that shows the measured time.

Large lists stay fast because each framework's own optimizations are used: keys on every row
(`key`, `track`, `:key`, `(task.id)`), immutable updates, and row components that only re-render
when their task changes (`React.memo`, Angular `OnPush`, Vue/Svelte fine-grained reactivity).

## How to run

Requirements: Node 20.19+ and Google Chrome (set `CHROME_PATH` if it is not found automatically).

```bash
npm install            # installs all workspaces
npm run build          # production build of the 4 apps
npm run bench          # builds, then benchmarks (5 runs per scenario) -> bench/results.{json,md}
npm run bench:quick    # 3 runs, faster
npm run test:smoke     # checks add / edit / delete in every app
npm run serve          # React :4171, Angular :4172, Vue :4173, Svelte :4174
npm run dev -w apps/vue   # dev server of one app (also react, angular, svelte)
```

Options: `node bench/run.mjs --runs 10 --warmup 1 --only react,svelte --no-build`.

## Methodology

- **Same workload everywhere**: `packages/shared` generates the same tasks and defines the
  same `window.__bench` API (`render(n)`, `update(50)`, `remove(50)`, `clear()`, `heap()`).
- **Timing**: `performance.now()` before the state change, then the framework is forced to patch the DOM
  (`flushSync` in React, `await nextTick()` in Vue, `ApplicationRef.tick()` in Angular, `flushSync()` in Svelte):
  that is the **script time**. Then we wait for `requestAnimationFrame` + `setTimeout(0)`, which runs after
  the next frame is painted: that is the **time until paint** (script + style + layout + paint).
- **Scenarios**: render 100, 500 and 1000 tasks into an empty list; on a list of 1000 tasks,
  update 50 tasks (name and priority, spread every 20 rows) and delete 50 tasks (every 20 rows).
- **Runs**: each run opens a fresh page (cold state), 1 warm-up run + 5 measured runs, the **median** is kept.
  Every run checks the number of rows in the DOM (e.g. 950 after deleting 50).
- **Memory**: JS heap used (`JSHeapUsedSize` from the Chrome DevTools Protocol, after a forced GC),
  on an empty list and after rendering 1000 tasks, median of 5 fresh pages.
  `performance.memory.usedJSHeapSize` is also saved in `results.json`.
- **Bundle size**: gzip size of the JS + CSS of each production build.

## Results

Measured on 25 Nov 2026: headless Chrome 156, Node 24, Linux x64, 8-core Intel Xeon VM, no CPU throttling.
React 19.3.1, Angular 22.3.0, Vue 3.5.46, Svelte 5.59.1. Raw data: [bench/results.json](bench/results.json).

**Time until paint (ms, median of 5, lower is better)**

| Operation | React | Angular | Vue | Svelte |
|---|---:|---:|---:|---:|
| Render 100 | 23.6 | 22.8 | 23.2 | 23.1 |
| Render 500 | **34.4** | 48.4 | 37.1 | 44.6 |
| Render 1000 | **57.1** | 80.0 | 63.3 | 81.8 |
| Update 50 (of 1000) | 11.0 | 14.1 | **9.3** | 17.1 |
| Delete 50 (of 1000) | 14.6 | **11.5** | 11.9 | 20.0 |

**Script time only: state change + DOM patch (ms, median of 5)**

| Operation | React | Angular | Vue | Svelte |
|---|---:|---:|---:|---:|
| Render 100 | **4.4** | 10.7 | 5.4 | 7.5 |
| Render 500 | **16.4** | 27.1 | 19.7 | 23.1 |
| Render 1000 | **22.2** | 42.8 | 25.8 | 37.2 |
| Update 50 (of 1000) | 3.4 | **1.7** | 3.8 | 4.9 |
| Delete 50 (of 1000) | 3.3 | **2.6** | 3.6 | 3.7 |

**Memory and bundle size**

| Metric | React | Angular | Vue | Svelte |
|---|---:|---:|---:|---:|
| JS heap, empty list (MB) | 1.22 | 1.83 | 1.02 | **0.95** |
| JS heap, 1000 tasks (MB) | **3.15** | 5.61 | 4.92 | 4.93 |
| Heap added by 1000 tasks (MB) | **1.93** | 3.78 | 3.90 | 3.98 |
| JS + CSS bundle, gzip (KB) | 68.28 | 61.11 | 27.87 | **21.21** |

## Analysis

- **Small lists (100 tasks)**: all four are equal (about 23 ms until paint). The cost is one frame,
  not the framework, so for typical UIs the choice does not matter for speed.
- **Initial rendering of large lists**: React was fastest here (57 ms for 1000 rows), Vue close behind (63 ms).
  Angular and Svelte were about 40% slower. Angular creates a component view per row and runs change detection;
  Svelte 5 wraps every task object in a deep `$state` proxy, which costs time and memory on first render
  (`$state.raw` would avoid it for read-only data).
- **Updates and deletions**: once the list exists, all frameworks patch only the 50 changed rows in a few ms of script.
  Angular has the lowest script time (signals + `OnPush` rows + `track` skip unchanged rows), Vue was the fastest until paint.
  The gaps here (about 2-8 ms) are smaller than one frame (16.7 ms) and partly noise from frame alignment.
- **Memory**: React used the least heap for 1000 tasks (plain objects, no reactive wrappers).
  Vue and Svelte pay for their reactive proxies, Angular for its per-row views.
  Svelte has the smallest empty heap and the smallest bundle (21 KB gzip), Vue the second smallest (28 KB);
  React and Angular ship 2-3x more JavaScript, which matters most for load time on mobile.
- **Conclusion**: no framework wins everything. Svelte and Vue are the lightest to download,
  React rendered big lists fastest in this setup, Angular had the cheapest updates. For a to-do app of this size,
  every framework is far below the 100 ms where a user notices a delay.

## Limits

- One machine (cloud VM), headless Chrome, no CPU throttling: absolute numbers will differ on your laptop or phone.
  Re-run `npm run bench` to get your own numbers.
- 5 runs per scenario on cold pages: results vary by a few ms between runs; differences under ~5 ms are not significant.
- "Until paint" includes waiting for the next frame, so it is rounded to the frame rhythm (about 16.7 ms).
- Each app uses its framework's idiomatic defaults (deep reactivity in Vue/Svelte, `memo` in React, `OnPush` in Angular);
  other optimizations (`shallowRef`, `$state.raw`, virtual scrolling) would change the ranking.
- Heap numbers include the framework runtime and are measured after a forced GC; they do not include DOM node memory.
- This is a small micro-benchmark, not a replacement for [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark).

Manual reproduction with Chrome DevTools: see [docs/devtools.md](docs/devtools.md).
