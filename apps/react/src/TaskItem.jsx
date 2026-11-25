import { memo, useState } from 'react';
import { PRIORITIES } from '@gmc/shared';

// memo: unchanged rows are skipped when the list re-renders (only changed objects re-render).
function TaskItem({ task, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [priority, setPriority] = useState(task.priority);

  function startEdit() {
    setName(task.name);
    setPriority(task.priority);
    setEditing(true);
  }

  function save() {
    if (!name.trim()) return;
    onSave({ ...task, name: name.trim(), priority });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="task" data-task-row>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="primary" onClick={save}>Save</button>
        <button className="ghost" onClick={() => setEditing(false)}>Cancel</button>
      </li>
    );
  }

  return (
    <li className="task" data-task-row>
      <span className="name">{task.name}</span>
      <span className={`badge ${task.priority}`}>{task.priority}</span>
      <button className="ghost" onClick={startEdit}>Edit</button>
      <button className="danger" onClick={() => onRemove(task.id)}>Delete</button>
    </li>
  );
}

export default memo(TaskItem);
