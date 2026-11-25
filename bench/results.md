# Benchmark results

- Date: 2026-11-25T10:55:25.019Z
- Chrome: Chrome/156.0.8078.47 (headless, no CPU throttling)
- Node: v24.22.1
- OS: Linux 6.12.113+ (x64)
- CPU: Intel(R) Xeon(R) Processor (8 cores)
- Runs: 5 measured (+1 warm-up) per scenario, fresh page each run, **median** shown
- Versions: React 19.3.1, Angular 22.3.0, Vue 3.5.46, Svelte 5.59.1

## Time until paint (ms, median, lower is better)

| Operation | React | Angular | Vue | Svelte |
|---|---:|---:|---:|---:|
| Render 100 | 23.6 | 22.8 | 23.2 | 23.1 |
| Render 500 | 34.4 | 48.4 | 37.1 | 44.6 |
| Render 1000 | 57.1 | 80 | 63.3 | 81.8 |
| Update 50 (of 1000) | 11 | 14.1 | 9.3 | 17.1 |
| Delete 50 (of 1000) | 14.6 | 11.5 | 11.9 | 20 |

## Script time only: state change + DOM patch, before paint (ms, median)

| Operation | React | Angular | Vue | Svelte |
|---|---:|---:|---:|---:|
| Render 100 | 4.4 | 10.7 | 5.4 | 7.5 |
| Render 500 | 16.4 | 27.1 | 19.7 | 23.1 |
| Render 1000 | 22.2 | 42.8 | 25.8 | 37.2 |
| Update 50 (of 1000) | 3.4 | 1.7 | 3.8 | 4.9 |
| Delete 50 (of 1000) | 3.3 | 2.6 | 3.6 | 3.7 |

## Memory and bundle size

| Metric | React | Angular | Vue | Svelte |
|---|---:|---:|---:|---:|
| JS heap, empty list (MB) | 1.22 | 1.83 | 1.02 | 0.95 |
| JS heap, 1000 tasks (MB) | 3.15 | 5.61 | 4.92 | 4.93 |
| Heap added by 1000 tasks (MB) | 1.93 | 3.78 | 3.9 | 3.98 |
| JS+CSS bundle, gzip (KB) | 68.28 | 61.11 | 27.87 | 21.21 |
