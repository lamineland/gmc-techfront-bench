// Shared, framework-agnostic helpers so that every app runs exactly the same workload.

export const PRIORITIES = ['low', 'medium', 'high'];

const WORDS = [
  'Write', 'Review', 'Fix', 'Deploy', 'Test', 'Refactor', 'Document', 'Plan',
  'API', 'login page', 'database', 'unit tests', 'CSS grid', 'router', 'cache', 'release notes',
];

let nextId = 1;

/** Returns a new unique task id. */
export function newId() {
  return nextId++;
}

/** Deterministic list of `count` tasks (same names/priorities in every framework). */
export function generateTasks(count) {
  const tasks = new Array(count);
  for (let i = 0; i < count; i++) {
    tasks[i] = {
      id: newId(),
      name: `${WORDS[i % 8]} ${WORDS[8 + ((i * 7) % 8)]} #${i + 1}`,
      priority: PRIORITIES[i % 3],
    };
  }
  return tasks;
}

/** Indexes touched by the "update 50" and "delete 50" scenarios: every n-th row, spread across the list. */
export function pickIndexes(length, count) {
  const step = Math.max(1, Math.floor(length / count));
  const out = [];
  for (let i = 0; i < length && out.length < count; i += step) out.push(i);
  return out;
}

/** The change applied to each task in the "update" scenario. */
export function updatedTask(task) {
  return {
    ...task,
    name: `${task.name} (updated)`,
    priority: PRIORITIES[(PRIORITIES.indexOf(task.priority) + 1) % 3],
  };
}

/** Resolves after the next frame has been painted (rAF runs before paint, the macrotask after it). */
export function afterPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

/**
 * Times one DOM operation.
 *  - `mutate` changes the framework state.
 *  - `flush` forces the framework to apply the change to the DOM (flushSync, nextTick, tick(), ...).
 * Returns { scriptMs, totalMs }: scriptMs = state change + DOM patch, totalMs = until the frame is painted.
 */
export async function measure(mutate, flush) {
  await afterPaint(); // start from an idle, painted page
  const t0 = performance.now();
  mutate();
  await flush();
  const t1 = performance.now();
  await afterPaint();
  const t2 = performance.now();
  return { scriptMs: round(t1 - t0), totalMs: round(t2 - t0) };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Installs the identical `window.__bench` API used by bench/run.mjs (and usable by hand in DevTools).
 * `adapter` provides: framework, getTasks(), setTasks(tasks), flush().
 */
export function installBench(adapter) {
  const api = {
    framework: adapter.framework,
    count: () => document.querySelectorAll('[data-task-row]').length,
    clear: () => measure(() => adapter.setTasks([]), adapter.flush),
    render: (n) => measure(() => adapter.setTasks(generateTasks(n)), adapter.flush),
    update: (k = 50) =>
      measure(() => {
        const tasks = adapter.getTasks().slice();
        for (const i of pickIndexes(tasks.length, k)) tasks[i] = updatedTask(tasks[i]);
        adapter.setTasks(tasks);
      }, adapter.flush),
    remove: (k = 50) =>
      measure(() => {
        const tasks = adapter.getTasks();
        const drop = new Set(pickIndexes(tasks.length, k).map((i) => tasks[i].id));
        adapter.setTasks(tasks.filter((t) => !drop.has(t.id)));
      }, adapter.flush),
    heap: () => (performance.memory ? performance.memory.usedJSHeapSize : null),
  };
  window.__bench = api;
  window.__benchReady = true;
  return api;
}
