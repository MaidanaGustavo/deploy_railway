import { Task } from '../types/task';

function key(userId: string) {
  return `rami_tasks_${userId}`;
}

export function getTasks(userId: string): Task[] {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch (e) {
    console.error('Erro ao carregar tarefas:', e);
    return [];
  }
}

export function saveTasks(userId: string, tasks: Task[]) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(tasks));
  } catch (e) {
    console.error('Erro ao salvar tarefas:', e);
  }
}

export function getTasksByArea(userId: string, areaId: string): Task[] {
  return getTasks(userId).filter((t) => t.areaId === areaId);
}

export function addTask(userId: string, task: Task) {
  const tasks = getTasks(userId);
  tasks.push(task);
  saveTasks(userId, tasks);
}

export function toggleTask(userId: string, id: string) {
  const tasks = getTasks(userId);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], done: !tasks[idx].done };
    saveTasks(userId, tasks);
  }
}

export function deleteTask(userId: string, id: string) {
  const tasks = getTasks(userId).filter((t) => t.id !== id);
  saveTasks(userId, tasks);
}

