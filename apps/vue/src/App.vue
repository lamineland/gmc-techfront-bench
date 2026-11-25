<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { installBench } from '@gmc/shared';
import TaskForm from './components/TaskForm.vue';
import TaskItem from './components/TaskItem.vue';
import BenchPanel from './components/BenchPanel.vue';

// Reactive state: Vue tracks reads/writes and re-renders only what depends on them.
const tasks = ref([]);

const addTask = (task) => tasks.value.push(task);
const saveTask = (task) => {
  const i = tasks.value.findIndex((t) => t.id === task.id);
  if (i !== -1) tasks.value[i] = task;
};
const removeTask = (id) => {
  tasks.value = tasks.value.filter((t) => t.id !== id);
};

onMounted(() => {
  installBench({
    framework: 'vue',
    getTasks: () => tasks.value,
    setTasks: (next) => { tasks.value = next; },
    flush: () => nextTick(), // wait for Vue's async DOM update queue
  });
});
</script>

<template>
  <div class="app">
    <h1>Vue To-Do</h1>
    <p class="subtitle">Reactivity system + v-for / v-model directives</p>
    <TaskForm @add="addTask" />
    <BenchPanel />
    <div class="card">
      <p class="count">{{ tasks.length }} tasks</p>
      <ul class="tasks">
        <li v-if="tasks.length === 0" class="empty">No tasks yet.</li>
        <TaskItem v-for="task in tasks" :key="task.id" :task="task" @save="saveTask" @remove="removeTask" />
      </ul>
    </div>
  </div>
</template>
