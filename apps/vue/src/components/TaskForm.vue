<script setup>
import { ref } from 'vue';
import { PRIORITIES, newId } from '@gmc/shared';

const emit = defineEmits(['add']);
const name = ref('');
const priority = ref('medium');

function submit() {
  if (!name.value.trim()) return;
  emit('add', { id: newId(), name: name.value.trim(), priority: priority.value });
  name.value = '';
}
</script>

<template>
  <form class="card row" @submit.prevent="submit">
    <input type="text" placeholder="Task name" v-model="name" data-testid="new-name" />
    <select v-model="priority" data-testid="new-priority">
      <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
    </select>
    <button class="primary" type="submit">Add task</button>
  </form>
</template>
