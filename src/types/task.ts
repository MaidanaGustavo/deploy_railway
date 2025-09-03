export interface Task {
  id: string;
  userId: string;
  areaId: string;
  title: string;
  done: boolean;
  dueDate?: string | null;
  createdAt: string;
}

