import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { installBench } from '@gmc/shared';
import TaskForm from './TaskForm.jsx';
import TaskItem from './TaskItem.jsx';
import BenchPanel from './BenchPanel.jsx';

export default function App() {
  // Single source of truth: React state. Every change goes through setTasks (immutable updates).
  const [tasks, setTasks] = useState([]);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    installBench({
      framework: 'react',
      getTasks: () => tasksRef.current,
      // flushSync makes React commit to the DOM synchronously so the timing includes the patch.
      setTasks: (next) => flushSync(() => setTasks(next)),
      flush: () => {},
    });
  }, []);

  const addTask = useCallback((task) => setTasks((list) => [...list, task]), []);
  const saveTask = useCallback((task) => setTasks((list) => list.map((t) => (t.id === task.id ? task : t))), []);
  const removeTask = useCallback((id) => setTasks((list) => list.filter((t) => t.id !== id)), []);

  return (
    <div className="app">
      <h1>React To-Do</h1>
      <p className="subtitle">Components + useState, keyed list rendering</p>
      <TaskForm onAdd={addTask} />
      <BenchPanel />
      <div className="card">
        <p className="count">{tasks.length} tasks</p>
        <ul className="tasks">
          {tasks.length === 0 && <li className="empty">No tasks yet.</li>}
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onSave={saveTask} onRemove={removeTask} />
          ))}
        </ul>
      </div>
    </div>
  );
}
