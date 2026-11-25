<script>
  import { PRIORITIES } from '@gmc/shared';

  let { task, onsave, onremove } = $props();
  let editing = $state(false);
  let name = $state('');
  let priority = $state('medium');

  function startEdit() {
    name = task.name;
    priority = task.priority;
    editing = true;
  }

  function save() {
    if (!name.trim()) return;
    onsave({ ...task, name: name.trim(), priority });
    editing = false;
  }
</script>

{#if editing}
  <li class="task" data-task-row>
    <input type="text" bind:value={name} />
    <select bind:value={priority}>
      {#each PRIORITIES as p (p)}
        <option value={p}>{p}</option>
      {/each}
    </select>
    <button class="primary" onclick={save}>Save</button>
    <button class="ghost" onclick={() => (editing = false)}>Cancel</button>
  </li>
{:else}
  <li class="task" data-task-row>
    <span class="name">{task.name}</span>
    <span class="badge {task.priority}">{task.priority}</span>
    <button class="ghost" onclick={startEdit}>Edit</button>
    <button class="danger" onclick={() => onremove(task.id)}>Delete</button>
  </li>
{/if}
