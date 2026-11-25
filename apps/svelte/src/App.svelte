<script>
  import { onMount, flushSync } from 'svelte';
  import { installBench } from '@gmc/shared';
  import TaskForm from './lib/TaskForm.svelte';
  import TaskItem from './lib/TaskItem.svelte';
  import BenchPanel from './lib/BenchPanel.svelte';

  // $state rune: the compiler generates the exact DOM updates for each change (no virtual DOM).
  let tasks = $state([]);

  const addTask = (task) => tasks.push(task);
  const saveTask = (task) => {
    const i = tasks.findIndex((t) => t.id === task.id);
    if (i !== -1) tasks[i] = task;
  };
  const removeTask = (id) => {
    tasks = tasks.filter((t) => t.id !== id);
  };

  onMount(() => {
    installBench({
      framework: 'svelte',
      getTasks: () => tasks,
      setTasks: (next) => { tasks = next; },
      flush: () => flushSync(), // apply pending DOM updates synchronously
    });
  });
</script>

<div class="app">
  <h1>Svelte To-Do</h1>
  <p class="subtitle">Compile-time reactivity ($state runes), keyed each blocks</p>
  <TaskForm onadd={addTask} />
  <BenchPanel />
  <div class="card">
    <p class="count">{tasks.length} tasks</p>
    <ul class="tasks">
      {#each tasks as task (task.id)}
        <TaskItem {task} onsave={saveTask} onremove={removeTask} />
      {:else}
        <li class="empty">No tasks yet.</li>
      {/each}
    </ul>
  </div>
</div>
