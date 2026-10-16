// App state. Frontend-only for now (persisted in localStorage); each action maps
// 1:1 to a Supabase mutation when the backend is connected in Lovable.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isSameDay, parseISO } from "date-fns";
import type { Activity, Client, Comment, Notification, Project, Section, Status, Tag, Task, TimeEntry, User } from "@/lib/types";
import * as seed from "@/lib/seed";
import { canEditEntry, uid } from "@/lib/utils";

type NewEntry = Pick<TimeEntry, "description" | "projectId" | "taskId" | "tagIds">;

interface State {
  currentUserId: string;
  theme: "dark" | "light";
  logo: string | null; // data URL uploaded by admin; null = built-in Idônea mark
  users: User[];
  clients: Client[];
  projects: Project[];
  sections: Section[];
  statuses: Status[];
  tags: Tag[];
  tasks: Task[];
  entries: TimeEntry[];
  comments: Comment[];
  activity: Activity[];
  notifications: Notification[];
  openTaskId: string | null;

  // ui
  setTheme: (t: "dark" | "light") => void;
  setLogo: (l: string | null) => void;
  setCurrentUser: (id: string) => void;
  openTask: (id: string | null) => void;

  // projects & sections
  addProject: (p: Omit<Project, "id">) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  addClient: (name: string) => string;
  addSection: (projectId: string, name: string) => void;
  renameSection: (id: string, name: string) => void;
  deleteSection: (id: string) => void;
  moveSection: (id: string, dir: -1 | 1) => void;

  // tasks
  addTask: (t: Partial<Task> & Pick<Task, "projectId" | "sectionId" | "name">) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, sectionId: string, beforeId: string | null) => void;
  addComment: (taskId: string, text: string) => void;

  // settings
  upsertStatus: (s: Partial<Status> & { name: string; color: string }) => void;
  deleteStatus: (id: string) => void;
  moveStatus: (id: string, dir: -1 | 1) => void;
  upsertTag: (t: Partial<Tag> & { name: string; color: string }) => void;
  deleteTag: (id: string) => void;
  upsertUser: (u: Partial<User> & { name: string; email: string }) => void;

  // time tracking
  startTimer: (e: NewEntry) => void;
  stopTimer: () => void;
  addEntry: (e: NewEntry & { start: string; end: string }) => void;
  updateEntry: (id: string, patch: Partial<TimeEntry>) => boolean;
  deleteEntry: (id: string) => boolean;

  markNotificationsRead: () => void;
  resetDemo: () => void;
}

const now = () => new Date().toISOString();

const initialData = () => ({
  users: seed.seedUsers,
  clients: seed.seedClients,
  projects: seed.seedProjects,
  sections: seed.seedSections,
  statuses: seed.seedStatuses,
  tags: seed.seedTags,
  tasks: seed.seedTasks,
  entries: seed.seedTimeEntries,
  comments: seed.seedComments,
  activity: seed.seedActivity,
  notifications: seed.seedNotifications,
});

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const me = () => get().users.find((u) => u.id === get().currentUserId)!;
      const log = (taskId: string | null, text: string) =>
        set((s) => ({ activity: [{ id: uid("a"), taskId, userId: s.currentUserId, text, createdAt: now() }, ...s.activity] }));
      const notify = (userId: string, text: string, taskId: string | null) => {
        if (userId === get().currentUserId) return;
        set((s) => ({ notifications: [{ id: uid("n"), userId, text, taskId, read: false, createdAt: now() }, ...s.notifications] }));
      };

      return {
        currentUserId: "u-marcelo",
        theme: "dark",
        logo: null,
        openTaskId: null,
        ...initialData(),

        setTheme: (theme) => {
          document.documentElement.classList.toggle("dark", theme === "dark");
          try { localStorage.setItem("idonea-theme", theme); } catch { /* private mode */ }
          set({ theme });
        },
        setLogo: (logo) => set({ logo }),
        setCurrentUser: (currentUserId) => set({ currentUserId }),
        openTask: (openTaskId) => set({ openTaskId }),

        addProject: (p) => {
          const id = uid("p");
          set((s) => ({
            projects: [...s.projects, { ...p, id }],
            sections: [...s.sections, { id: uid("s"), projectId: id, name: "Tarefas", order: 0 }],
          }));
          return id;
        },
        updateProject: (id, patch) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
        addClient: (name) => {
          const id = uid("c");
          set((s) => ({ clients: [...s.clients, { id, name }] }));
          return id;
        },
        addSection: (projectId, name) =>
          set((s) => ({
            sections: [...s.sections, { id: uid("s"), projectId, name, order: s.sections.filter((x) => x.projectId === projectId).length }],
          })),
        renameSection: (id, name) => set((s) => ({ sections: s.sections.map((x) => (x.id === id ? { ...x, name } : x)) })),
        deleteSection: (id) =>
          set((s) => {
            const sec = s.sections.find((x) => x.id === id);
            if (!sec) return s;
            const siblings = s.sections.filter((x) => x.projectId === sec.projectId && x.id !== id).sort((a, b) => a.order - b.order);
            if (!siblings.length) return s; // a project always keeps one section
            return {
              sections: s.sections.filter((x) => x.id !== id),
              tasks: s.tasks.map((t) => (t.sectionId === id ? { ...t, sectionId: siblings[0]!.id } : t)),
            };
          }),
        moveSection: (id, dir) =>
          set((s) => {
            const sec = s.sections.find((x) => x.id === id)!;
            const list = s.sections.filter((x) => x.projectId === sec.projectId).sort((a, b) => a.order - b.order);
            const i = list.findIndex((x) => x.id === id), j = i + dir;
            if (j < 0 || j >= list.length) return s;
            [list[i], list[j]] = [list[j]!, list[i]!];
            const order = new Map(list.map((x, k) => [x.id, k]));
            return { sections: s.sections.map((x) => (order.has(x.id) ? { ...x, order: order.get(x.id)! } : x)) };
          }),

        addTask: (t) => {
          const id = uid("t");
          const task: Task = {
            id, tema: "", assigneeId: null, workDate: null, dueDate: null,
            statusId: [...get().statuses].sort((a, b) => a.order - b.order)[0]!.id,
            estimateHours: 0, urgent: false, description: "", subtasks: [], dependsOn: [],
            order: Date.now(), createdAt: now(), ...t,
          };
          set((s) => ({ tasks: [...s.tasks, task] }));
          log(id, "criou a tarefa");
          if (task.assigneeId) notify(task.assigneeId, `Você foi atribuído a ${task.name}`, id);
          return id;
        },
        updateTask: (id, patch) => {
          const before = get().tasks.find((t) => t.id === id);
          if (!before) return;
          set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
          if (patch.statusId && patch.statusId !== before.statusId) {
            log(id, `mudou o status para ${get().statuses.find((x) => x.id === patch.statusId)?.name}`);
          }
          if (patch.urgent !== undefined && patch.urgent !== before.urgent) log(id, patch.urgent ? "marcou como URGENTE" : "removeu URGENTE");
          if (patch.assigneeId && patch.assigneeId !== before.assigneeId) {
            log(id, `atribuiu a ${get().users.find((u) => u.id === patch.assigneeId)?.name}`);
            notify(patch.assigneeId, `Você foi atribuído a ${before.name}`, id);
          }
          if (patch.dueDate !== undefined && patch.dueDate !== before.dueDate) log(id, "alterou o prazo máximo");
        },
        deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id), openTaskId: s.openTaskId === id ? null : s.openTaskId })),
        moveTask: (id, sectionId, beforeId) =>
          set((s) => {
            const task = s.tasks.find((t) => t.id === id)!;
            const col = s.tasks.filter((t) => t.sectionId === sectionId && t.id !== id).sort((a, b) => a.order - b.order);
            const idx = beforeId ? col.findIndex((t) => t.id === beforeId) : col.length;
            col.splice(idx < 0 ? col.length : idx, 0, { ...task, sectionId });
            const order = new Map(col.map((t, k) => [t.id, k]));
            return {
              tasks: s.tasks.map((t) => (t.id === id ? { ...t, sectionId, order: order.get(id)! } : order.has(t.id) ? { ...t, order: order.get(t.id)! } : t)),
            };
          }),
        addComment: (taskId, text) => {
          const task = get().tasks.find((t) => t.id === taskId);
          set((s) => ({ comments: [...s.comments, { id: uid("cm"), taskId, userId: s.currentUserId, text, createdAt: now() }] }));
          // @mentions -> notifications
          get().users.forEach((u) => {
            if (text.includes(`@${u.name}`)) notify(u.id, `${me().name} mencionou você em ${task?.name}`, taskId);
          });
          if (task?.assigneeId) notify(task.assigneeId, `${me().name} comentou em ${task.name}`, taskId);
        },

        upsertStatus: (st) =>
          set((s) =>
            st.id
              ? { statuses: s.statuses.map((x) => (x.id === st.id ? { ...x, ...st } : x)) }
              : { statuses: [...s.statuses, { id: uid("st"), order: s.statuses.length, done: false, ...st }] },
          ),
        deleteStatus: (id) =>
          set((s) => {
            if (s.statuses.length <= 1) return s;
            const fallback = s.statuses.filter((x) => x.id !== id).sort((a, b) => a.order - b.order)[0]!.id;
            return { statuses: s.statuses.filter((x) => x.id !== id), tasks: s.tasks.map((t) => (t.statusId === id ? { ...t, statusId: fallback } : t)) };
          }),
        moveStatus: (id, dir) =>
          set((s) => {
            const list = [...s.statuses].sort((a, b) => a.order - b.order);
            const i = list.findIndex((x) => x.id === id), j = i + dir;
            if (j < 0 || j >= list.length) return s;
            [list[i], list[j]] = [list[j]!, list[i]!];
            return { statuses: list.map((x, k) => ({ ...x, order: k })) };
          }),
        upsertTag: (tg) =>
          set((s) => (tg.id ? { tags: s.tags.map((x) => (x.id === tg.id ? { ...x, ...tg } : x)) } : { tags: [...s.tags, { id: uid("tg"), ...tg }] })),
        deleteTag: (id) => set((s) => ({ tags: s.tags.filter((x) => x.id !== id), entries: s.entries.map((e) => ({ ...e, tagIds: e.tagIds.filter((t) => t !== id) })) })),
        upsertUser: (u) =>
          set((s) =>
            u.id
              ? { users: s.users.map((x) => (x.id === u.id ? { ...x, ...u } : x)) }
              : { users: [...s.users, { id: uid("u"), role: "membro", color: "#1E5EEB", ...u }] },
          ),

        // Only one running timer per user: starting a new one closes the previous one.
        // The running entry is stored with its server start time, so closing the browser
        // never loses time — elapsed time is always recomputed from `start`.
        startTimer: (e) =>
          set((s) => ({
            entries: [
              { id: uid("te"), userId: s.currentUserId, ...e, start: now(), end: null, edits: [] },
              ...s.entries.map((x) => (x.userId === s.currentUserId && !x.end ? { ...x, end: now() } : x)),
            ],
          })),
        stopTimer: () => set((s) => ({ entries: s.entries.map((x) => (x.userId === s.currentUserId && !x.end ? { ...x, end: now() } : x)) })),
        addEntry: (e) => set((s) => ({ entries: [{ id: uid("te"), userId: s.currentUserId, edits: [], ...e }, ...s.entries] })),
        updateEntry: (id, patch) => {
          const entry = get().entries.find((x) => x.id === id);
          if (!entry || !canEditEntry(entry, me())) return false;
          const edits = (Object.keys(patch) as (keyof TimeEntry)[])
            .filter((k) => k !== "edits" && JSON.stringify(entry[k]) !== JSON.stringify(patch[k]))
            .map((k) => ({ at: now(), byId: get().currentUserId, field: k, before: String(entry[k] ?? ""), after: String(patch[k] ?? "") }));
          // same-day self edits are routine; anything else goes to the audit trail
          const audited = !(entry.userId === get().currentUserId && isSameDay(parseISO(entry.start), new Date()));
          set((s) => ({ entries: s.entries.map((x) => (x.id === id ? { ...x, ...patch, edits: audited ? [...x.edits, ...edits] : x.edits } : x)) }));
          return true;
        },
        deleteEntry: (id) => {
          const entry = get().entries.find((x) => x.id === id);
          if (!entry || !canEditEntry(entry, me())) return false;
          set((s) => ({ entries: s.entries.filter((x) => x.id !== id) }));
          return true;
        },

        markNotificationsRead: () =>
          set((s) => ({ notifications: s.notifications.map((n) => (n.userId === s.currentUserId ? { ...n, read: true } : n)) })),
        resetDemo: () => set({ ...initialData(), openTaskId: null }),
      };
    },
    { name: "idonea-workspace", version: 1, partialize: ({ openTaskId: _o, ...rest }) => rest },
  ),
);

/** Selectors */
export const useMe = () => useStore((s) => s.users.find((u) => u.id === s.currentUserId)!);
export const useRunning = () => useStore((s) => s.entries.find((e) => e.userId === s.currentUserId && !e.end) ?? null);
export const isAdmin = (u: User) => u.role === "admin";
