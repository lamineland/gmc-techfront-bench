export type Priority = 'low' | 'medium' | 'high';
export interface Task { id: number; name: string; priority: Priority }
export interface Timing { scriptMs: number; totalMs: number }
export const PRIORITIES: Priority[];
export function newId(): number;
export function generateTasks(count: number): Task[];
export function pickIndexes(length: number, count: number): number[];
export function updatedTask(task: Task): Task;
export function afterPaint(): Promise<void>;
export function measure(mutate: () => void, flush: () => unknown): Promise<Timing>;
export interface BenchAdapter {
  framework: string;
  getTasks(): Task[];
  setTasks(tasks: Task[]): void;
  flush(): unknown;
}
export interface BenchApi {
  framework: string;
  count(): number;
  clear(): Promise<Timing>;
  render(n: number): Promise<Timing>;
  update(k?: number): Promise<Timing>;
  remove(k?: number): Promise<Timing>;
  heap(): number | null;
}
export function installBench(adapter: BenchAdapter): BenchApi;
