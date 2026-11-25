import { ApplicationRef, Component, OnInit, inject, signal } from '@angular/core';
import { installBench, type Task } from '@gmc/shared';
import { TaskFormComponent } from './task-form.component';
import { TaskItemComponent } from './task-item.component';
import { BenchPanelComponent } from './bench-panel.component';

@Component({
  selector: 'app-root',
  imports: [TaskFormComponent, TaskItemComponent, BenchPanelComponent],
  template: `
    <div class="app">
      <h1>Angular To-Do</h1>
      <p class="subtitle">Standalone components, &#64;for with track (trackBy), ngModel two-way binding</p>
      <app-task-form (add)="addTask($event)" />
      <app-bench-panel />
      <div class="card">
        <p class="count">{{ tasks().length }} tasks</p>
        <ul class="tasks">
          @for (task of tasks(); track trackById($index, task)) {
            <li app-task-item class="task" data-task-row [task]="task" (save)="saveTask($event)" (remove)="removeTask($event)"></li>
          } @empty {
            <li class="empty">No tasks yet.</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  private appRef = inject(ApplicationRef);
  // A signal holds the list: writing it marks exactly this view for change detection.
  tasks = signal<Task[]>([]);

  // trackBy: Angular reuses the DOM node of a task with the same id instead of re-creating it.
  trackById(_index: number, task: Task): number {
    return task.id;
  }

  ngOnInit(): void {
    installBench({
      framework: 'angular',
      getTasks: () => this.tasks(),
      setTasks: (next) => this.tasks.set(next),
      flush: () => this.appRef.tick(), // run change detection synchronously and patch the DOM
    });
  }

  addTask(task: Task): void {
    this.tasks.update((list) => [...list, task]);
  }

  saveTask(task: Task): void {
    this.tasks.update((list) => list.map((t) => (t.id === task.id ? task : t)));
  }

  removeTask(id: number): void {
    this.tasks.update((list) => list.filter((t) => t.id !== id));
  }
}
