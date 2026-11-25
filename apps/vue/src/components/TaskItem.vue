<script setup>
import { ref } from 'vue';
import { PRIORITIES } from '@gmc/shared';

const props = defineProps({ task: { type: Object, required: true } });
const emit = defineEmits(['save', 'remove']);

const editing = ref(false);
const name = ref('');
const priority = ref('medium');

function startEdit() {
  name.value = props.task.name;
  priority.value = props.task.priority;
  editing.value = true;
}

function save() {
  if (!name.value.trim()) return;
  emit('save', { ...props.task, name: name.value.trim(), priority: priority.value });
  editing.value = false;
}
</script>

<template>
  <li v-if="editing" class="task" data-task-row>
    <input type="text" v-model="name" />
    <select v-model="priority">
      <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
    </select>
    <button class="primary" @click="save">Save</button>
    <button class="ghost" @click="editing = false">Cancel</button>
  </li>
  <li v-else class="task" data-task-row>
    <span class="name">{{ task.name }}</span>
    <span class="badge" :class="task.priority">{{ task.priority }}</span>
    <button class="ghost" @click="startEdit">Edit</button>
    <button class="danger" @click="emit('remove', task.id)">Delete</button>
  </li>
</template>
