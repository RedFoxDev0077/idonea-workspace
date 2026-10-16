// Starter data used until the Asana / Clockify migration fills the real database.
// Dates are relative to "today" so the demo always shows overdue / today / upcoming work.
import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns";
import type { Activity, Client, Comment, Notification, Project, Section, Status, Tag, Task, TimeEntry, User } from "./types";

const day = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");
const at = (offset: number, h: number, m = 0) =>
  setMinutes(setHours(startOfDay(addDays(new Date(), offset)), h), m).toISOString();

export const seedUsers: User[] = [
  { id: "u-marcelo", name: "Marcelo Santos", email: "marcelo@idonea.com.br", role: "admin", color: "#1E5EEB" },
  { id: "u-bruno", name: "Bruno Jordão", email: "bruno@idonea.com.br", role: "admin", color: "#0B4294" },
  { id: "u-marcelly", name: "Marcelly Gandra", email: "marcelly@idonea.com.br", role: "membro", color: "#0E8FBF" },
  { id: "u-alessandra", name: "Alessandra Borges", email: "alessandra@idonea.com.br", role: "membro", color: "#7A4FD6" },
];

export const seedClients: Client[] = [
  { id: "c-dc4all", name: "Data Center 4 All" },
  { id: "c-idonea", name: "Idônea (interno)" },
  { id: "c-vitta", name: "Vitta Saúde" },
];

export const seedStatuses: Status[] = [
  { id: "st-pendente", name: "Pendente", color: "#F06A6A", order: 0, done: false },
  { id: "st-faltam", name: "Faltam informações", color: "#F1A33C", order: 1, done: false },
  { id: "st-alteracao", name: "Alteração", color: "#E8618C", order: 2, done: false },
  { id: "st-andamento", name: "Em andamento", color: "#3B7BFF", order: 3, done: false },
  { id: "st-revisao", name: "Revisão", color: "#9B6BF2", order: 4, done: false },
  { id: "st-aprovacao", name: "Enviar para aprovação", color: "#00AEEF", order: 5, done: false },
  { id: "st-publicar", name: "Publicar", color: "#2BB5A0", order: 6, done: false },
  { id: "st-publicado", name: "Publicado/Finalizado", color: "#34C77B", order: 7, done: true },
  { id: "st-cobrar", name: "Cobrar", color: "#C9A227", order: 8, done: false },
];

export const seedTags: Tag[] = [
  { id: "tg-atendimento", name: "Atendimento", color: "#00AEEF" },
  { id: "tg-reuniao", name: "Reunião", color: "#9B6BF2" },
  { id: "tg-design", name: "Design", color: "#E8618C" },
  { id: "tg-redacao", name: "Redação", color: "#F1A33C" },
];

export const seedProjects: Project[] = [
  { id: "p-dc4all", name: "Data Center 4 All", clientId: "c-dc4all", color: "#F06A6A", memberIds: ["u-marcelo", "u-bruno", "u-marcelly", "u-alessandra"] },
  { id: "p-site", name: "Site institucional", clientId: "c-vitta", color: "#00AEEF", memberIds: ["u-bruno", "u-marcelly"] },
  { id: "p-interno", name: "Marketing Idônea", clientId: "c-idonea", color: "#3B7BFF", memberIds: ["u-marcelo", "u-alessandra"] },
];

export const seedSections: Section[] = [
  { id: "s-identidade", projectId: "p-dc4all", name: "Identidade Visual", order: 0 },
  { id: "s-posts", projectId: "p-dc4all", name: "Posts - 8 / mês", order: 1 },
  { id: "s-curso", projectId: "p-dc4all", name: "Curso Data Center Fundamentos", order: 2 },
  { id: "s-site-ux", projectId: "p-site", name: "UX & Wireframes", order: 0 },
  { id: "s-site-dev", projectId: "p-site", name: "Desenvolvimento", order: 1 },
  { id: "s-int-social", projectId: "p-interno", name: "Redes sociais", order: 0 },
];

let n = 0;
const t = (p: Partial<Task> & Pick<Task, "projectId" | "sectionId" | "name">): Task => ({
  id: `t-${++n}`,
  tema: "",
  assigneeId: null,
  workDate: null,
  dueDate: null,
  statusId: "st-pendente",
  estimateHours: 0,
  urgent: false,
  description: "",
  subtasks: [],
  dependsOn: [],
  order: n,
  createdAt: at(-10, 9),
  ...p,
});

export const seedTasks: Task[] = [
  t({ projectId: "p-dc4all", sectionId: "s-identidade", name: "Certificado", tema: "Curso Data Center Fundamentos", assigneeId: "u-marcelly", workDate: day(0), dueDate: day(14), estimateHours: 1 }),
  t({ projectId: "p-dc4all", sectionId: "s-identidade", name: "Capa do produto", tema: "Data Center - Fundamentos", assigneeId: "u-marcelly", workDate: day(4), estimateHours: 0.75, statusId: "st-andamento",
      subtasks: [{ id: "sb1", title: "Rascunho em 3 versões", done: true }, { id: "sb2", title: "Ajustar tipografia (Sora)", done: false }] }),
  t({ projectId: "p-dc4all", sectionId: "s-identidade", name: "Capa do podcast", tema: "Podcast - Capa", assigneeId: "u-marcelly", workDate: day(3), estimateHours: 1 }),
  t({ projectId: "p-dc4all", sectionId: "s-posts", name: "Post solicitado", tema: "Out - Update - Redata e o custo dos data centers", assigneeId: "u-bruno", workDate: day(0), dueDate: day(0), estimateHours: 0.5, urgent: true, statusId: "st-revisao",
      description: "Post de atualização sobre o custo dos data centers. Cliente pediu para sair ainda hoje." }),
  t({ projectId: "p-dc4all", sectionId: "s-posts", name: "Post", tema: "Dez - Market - Grandes Marcas: Refrigeração", assigneeId: "u-alessandra", workDate: day(49), estimateHours: 0.25 }),
  t({ projectId: "p-dc4all", sectionId: "s-posts", name: "Post", tema: "Nov - Market - Grandes Marcas: UPS", assigneeId: "u-alessandra", workDate: day(19), estimateHours: 0.25, statusId: "st-faltam" }),
  t({ projectId: "p-dc4all", sectionId: "s-posts", name: "Post", tema: "Out - Market - Grandes Marcas: Geradores", assigneeId: "u-alessandra", workDate: day(-3), dueDate: day(-1), estimateHours: 0.25, statusId: "st-aprovacao" }),
  t({ projectId: "p-dc4all", sectionId: "s-posts", name: "Post", tema: "Out - Dica técnica: PUE", assigneeId: "u-bruno", workDate: day(-6), estimateHours: 0.5, statusId: "st-publicado" }),
  t({ projectId: "p-dc4all", sectionId: "s-curso", name: "Roteiro módulo 2", tema: "Curso Data Center Fundamentos", assigneeId: "u-marcelo", workDate: day(1), dueDate: day(6), estimateHours: 3, statusId: "st-andamento" }),
  t({ projectId: "p-dc4all", sectionId: "s-curso", name: "Edição aulas 1–3", tema: "Curso Data Center Fundamentos", assigneeId: "u-bruno", workDate: day(-2), dueDate: day(-1), estimateHours: 4, statusId: "st-alteracao" }),
  t({ projectId: "p-dc4all", sectionId: "s-curso", name: "Cobrar parcela 2", tema: "Financeiro do curso", assigneeId: "u-marcelo", workDate: day(2), estimateHours: 0.25, statusId: "st-cobrar" }),
  t({ projectId: "p-site", sectionId: "s-site-ux", name: "Wireframe da home", tema: "Site Vitta", assigneeId: "u-marcelly", workDate: day(-1), dueDate: day(2), estimateHours: 3, statusId: "st-revisao" }),
  t({ projectId: "p-site", sectionId: "s-site-ux", name: "Mapa do site", tema: "Site Vitta", assigneeId: "u-bruno", workDate: day(-5), estimateHours: 1.5, statusId: "st-publicado" }),
  t({ projectId: "p-site", sectionId: "s-site-dev", name: "Página de especialidades", tema: "Site Vitta", assigneeId: "u-bruno", workDate: day(5), dueDate: day(9), estimateHours: 5, dependsOn: ["t-12"] }),
  t({ projectId: "p-site", sectionId: "s-site-dev", name: "Formulário de agendamento", tema: "Site Vitta", assigneeId: "u-marcelly", workDate: day(7), dueDate: day(10), estimateHours: 4, statusId: "st-faltam" }),
  t({ projectId: "p-interno", sectionId: "s-int-social", name: "Calendário editorial Nov", tema: "Instagram Idônea", assigneeId: "u-alessandra", workDate: day(1), estimateHours: 2, statusId: "st-andamento" }),
  t({ projectId: "p-interno", sectionId: "s-int-social", name: "Case Data Center 4 All", tema: "Portfólio", assigneeId: "u-marcelo", workDate: day(8), estimateHours: 2 }),
];

let e = 0;
const te = (userId: string, offset: number, h1: number, m1: number, h2: number, m2: number, rest: Partial<TimeEntry>): TimeEntry => ({
  id: `te-${++e}`,
  userId,
  description: "",
  projectId: null,
  taskId: null,
  tagIds: [],
  start: at(offset, h1, m1),
  end: at(offset, h2, m2),
  edits: [],
  ...rest,
});

export const seedTimeEntries: TimeEntry[] = [
  te("u-marcelo", 0, 8, 30, 9, 10, { description: "Atendimento cliente DC4All", projectId: "p-dc4all", tagIds: ["tg-atendimento"] }),
  te("u-marcelo", 0, 9, 15, 10, 45, { description: "Roteiro módulo 2", projectId: "p-dc4all", taskId: "t-9" }),
  te("u-marcelo", -1, 9, 0, 11, 30, { description: "Roteiro módulo 2", projectId: "p-dc4all", taskId: "t-9" }),
  te("u-marcelo", -1, 14, 0, 15, 0, { description: "Reunião de pauta semanal", projectId: "p-interno", tagIds: ["tg-reuniao"] }),
  te("u-marcelo", -2, 10, 0, 12, 15, { description: "Case Data Center 4 All", projectId: "p-interno", taskId: "t-17" }),
  te("u-marcelo", -3, 13, 30, 14, 0, { description: "Cobrar parcela 2", projectId: "p-dc4all", taskId: "t-11", tagIds: ["tg-atendimento"] }),
  te("u-marcelo", -4, 9, 0, 12, 0, { description: "Planejamento do curso", projectId: "p-dc4all", tagIds: ["tg-redacao"] }),
  te("u-bruno", 0, 8, 0, 8, 40, { description: "Post solicitado", projectId: "p-dc4all", taskId: "t-4", tagIds: ["tg-redacao"] }),
  te("u-bruno", -1, 9, 0, 13, 20, { description: "Edição aulas 1–3", projectId: "p-dc4all", taskId: "t-10" }),
  te("u-bruno", -2, 14, 0, 16, 0, { description: "Mapa do site", projectId: "p-site", taskId: "t-13" }),
  te("u-bruno", -3, 9, 0, 11, 0, { description: "Edição aulas 1–3", projectId: "p-dc4all", taskId: "t-10" }),
  te("u-marcelly", 0, 9, 0, 10, 10, { description: "Certificado", projectId: "p-dc4all", taskId: "t-1", tagIds: ["tg-design"] }),
  te("u-marcelly", -1, 9, 0, 12, 40, { description: "Wireframe da home", projectId: "p-site", taskId: "t-12", tagIds: ["tg-design"] }),
  te("u-marcelly", -2, 13, 0, 13, 50, { description: "Capa do produto", projectId: "p-dc4all", taskId: "t-2", tagIds: ["tg-design"] }),
  te("u-alessandra", -1, 10, 0, 11, 0, { description: "Calendário editorial Nov", projectId: "p-interno", taskId: "t-16" }),
  te("u-alessandra", -3, 15, 0, 15, 25, { description: "Post Geradores", projectId: "p-dc4all", taskId: "t-7", tagIds: ["tg-redacao"] }),
];

export const seedComments: Comment[] = [
  { id: "cm-1", taskId: "t-4", userId: "u-marcelo", text: "@Bruno Jordão o cliente confirmou os números, pode seguir.", createdAt: at(0, 8, 5) },
  { id: "cm-2", taskId: "t-4", userId: "u-bruno", text: "Fechado, envio para revisão até 11h.", createdAt: at(0, 8, 12) },
];

export const seedActivity: Activity[] = [
  { id: "a-1", taskId: "t-4", userId: "u-marcelo", text: "marcou como URGENTE", createdAt: at(0, 7, 58) },
  { id: "a-2", taskId: "t-4", userId: "u-bruno", text: "mudou o status para Revisão", createdAt: at(0, 8, 41) },
  { id: "a-3", taskId: "t-12", userId: "u-marcelly", text: "mudou o status para Revisão", createdAt: at(-1, 12, 41) },
];

export const seedNotifications: Notification[] = [
  { id: "n-1", userId: "u-marcelo", text: "Bruno Jordão comentou em Post solicitado", taskId: "t-4", read: false, createdAt: at(0, 8, 12) },
  { id: "n-2", userId: "u-marcelo", text: "Edição aulas 1–3 passou do prazo máximo", taskId: "t-10", read: false, createdAt: at(0, 7, 0) },
  { id: "n-3", userId: "u-marcelo", text: "Você foi atribuído a Cobrar parcela 2", taskId: "t-11", read: true, createdAt: at(-2, 16, 0) },
];
