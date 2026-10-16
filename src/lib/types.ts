// Domain model. Mirrors the Supabase tables planned for the backend
// (users, clients, projects, sections, tasks, statuses, tags, time_entries, comments, activity).

export type Role = "admin" | "membro";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  color: string; // avatar background
}

export interface Client {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  color: string;
  memberIds: string[];
  archived?: boolean;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  done: boolean; // counts as finished for progress / overdue
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string; // Supabase Storage URL in production; data URL in the demo
  uploadedBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  sectionId: string;
  name: string;
  tema: string;
  assigneeId: string | null;
  workDate: string | null; // "Data de conclusão" in Asana = day the team works on it
  dueDate: string | null; // "Prazo máx."
  statusId: string;
  estimateHours: number;
  urgent: boolean;
  description: string;
  subtasks: Subtask[];
  dependsOn: string[];
  attachments?: Attachment[];
  order: number;
  createdAt: string;
}

export interface TimeEntryEdit {
  at: string;
  byId: string;
  field: string;
  before: string;
  after: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  description: string;
  projectId: string | null;
  taskId: string | null;
  tagIds: string[];
  start: string; // ISO
  end: string | null; // null = running
  edits: TimeEntryEdit[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  taskId: string | null;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  taskId: string | null;
  read: boolean;
  createdAt: string;
}
