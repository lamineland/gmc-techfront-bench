import { useState } from 'react';
import { PRIORITIES, newId } from '@gmc/shared';

export default function TaskForm({ onAdd }) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('medium');

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ id: newId(), name: name.trim(), priority });
    setName('');
  }

  return (
    <form className="card row" onSubmit={submit}>
      <input type="text" placeholder="Task name" value={name} onChange={(e) => setName(e.target.value)} data-testid="new-name" />
      <select value={priority} onChange={(e) => setPriority(e.target.value)} data-testid="new-priority">
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <button className="primary" type="submit">Add task</button>
    </form>
  );
}
