import { Component, output } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PRIORITIES, newId, type Priority, type Task } from '@gmc/shared';

@Component({
  selector: 'app-task-form',
  imports: [FormsModule, NgFor],
  template: `
    <form class="card row" (ngSubmit)="submit()">
      <input type="text" placeholder="Task name" name="name" [(ngModel)]="name" data-testid="new-name" />
      <select name="priority" [(ngModel)]="priority" data-testid="new-priority">
        <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
      </select>
      <button class="primary" type="submit">Add task</button>
    </form>
  `,
})
export class TaskFormComponent {
  add = output<Task>();
  priorities = PRIORITIES;
  name = '';
  priority: Priority = 'medium';

  submit(): void {
    if (!this.name.trim()) return;
    this.add.emit({ id: newId(), name: this.name.trim(), priority: this.priority });
    this.name = '';
  }
}
