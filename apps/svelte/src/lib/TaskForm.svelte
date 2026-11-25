<script>
  import { PRIORITIES, newId } from '@gmc/shared';

  let { onadd } = $props();
  let name = $state('');
  let priority = $state('medium');

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onadd({ id: newId(), name: name.trim(), priority });
    name = '';
  }
</script>

<form class="card row" onsubmit={submit}>
  <input type="text" placeholder="Task name" bind:value={name} data-testid="new-name" />
  <select bind:value={priority} data-testid="new-priority">
    {#each PRIORITIES as p (p)}
      <option value={p}>{p}</option>
    {/each}
  </select>
  <button class="primary" type="submit">Add task</button>
</form>
