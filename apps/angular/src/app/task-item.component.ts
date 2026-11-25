import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PRIORITIES, type Priority, type Task } from '@gmc/shared';

// OnPush: a row is only re-checked when its `task` input reference changes.
@Component({
  selector: 'li[app-task-item]',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (editing) {
      <input type="text" [(ngModel)]="name" />
      <select [(ngModel)]="priority">
        @for (p of priorities; track p) {
          <option [value]="p">{{ p }}</option>
        }
      </select>
      <button class="primary" (click)="saveEdit()">Save</button>
      <button class="ghost" (click)="editing = false">Cancel</button>
    } @else {
      <span class="name">{{ task().name }}</span>
      <span [class]="'badge ' + task().priority">{{ task().priority }}</span>
      <button class="ghost" (click)="startEdit()">Edit</button>
      <button class="danger" (click)="remove.emit(task().id)">Delete</button>
    }
  `,
})
export class TaskItemComponent {
  task = input.required<Task>();
  save = output<Task>();
  remove = output<number>();
  priorities = PRIORITIES;
  editing = false;
  name = '';
  priority: Priority = 'medium';

  startEdit(): void {
    this.name = this.task().name;
    this.priority = this.task().priority;
    this.editing = true;
  }

  saveEdit(): void {
    if (!this.name.trim()) return;
    this.save.emit({ ...this.task(), name: this.name.trim(), priority: this.priority });
    this.editing = false;
  }
}
