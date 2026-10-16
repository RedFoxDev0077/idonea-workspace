import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, Bell, CheckSquare, ChevronDown, Clock3, FolderKanban, LayoutDashboard, Menu, Moon, Plus, Search, Settings, Sun, X,
} from "lucide-react";
import { useMe, useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Avatar, BrandLogo, Popover } from "./ui";
import { TimerChip } from "./TimerBar";
import { TaskDrawer } from "./TaskDrawer";
import { NewProjectModal } from "./NewProjectModal";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/minhas-tarefas", label: "Minhas tarefas", icon: CheckSquare },
  { to: "/horas", label: "Controle de horas", icon: Clock3 },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/projetos", label: "Projetos", icon: FolderKanban, end: true },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const projects = useStore((s) => s.projects.filter((p) => !p.archived));
  const clients = useStore((s) => s.clients);
  const me = useMe();
  const [newOpen, setNewOpen] = useState(false);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group flex items-center gap-3 rounded-lg px-3 h-9 text-[13.5px] font-medium transition-colors",
      isActive ? "bg-brand-strong text-white shadow-glow" : "text-ink-2 hover:bg-hover hover:text-ink",
    );

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4"><BrandLogo /></div>

      <nav className="px-3 space-y-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkCls} onClick={onNavigate}>
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 px-5 flex items-center justify-between">
        <span className="label">Projetos</span>
        {me.role === "admin" && (
          <button className="icon-btn h-6 w-6" onClick={() => setNewOpen(true)} aria-label="Novo projeto"><Plus className="h-3.5 w-3.5" /></button>
        )}
      </div>
      <div className="mt-2 flex-1 overflow-y-auto px-3 pb-3 space-y-3">
        {clients.map((c) => {
          const list = projects.filter((p) => p.clientId === c.id);
          if (!list.length) return null;
          return (
            <div key={c.id}>
              <div className="px-3 pb-1 text-[11px] text-ink-3 truncate">{c.name}</div>
              {list.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/projetos/${p.id}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn("flex items-center gap-2.5 rounded-lg px-3 h-8 text-[13px] transition-colors", isActive ? "bg-hover text-ink font-medium" : "text-ink-2 hover:bg-hover hover:text-ink")
                  }
                >
                  <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: p.color }} />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      <div className="border-t border-line p-3 space-y-0.5">
        {me.role === "admin" && (
          <NavLink to="/configuracoes" className={linkCls} onClick={onNavigate}>
            <Settings className="h-[18px] w-[18px]" />
            Configurações
          </NavLink>
        )}
        <ThemeToggle />
      </div>
      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const dark = theme === "dark";
  return (
    <button onClick={() => setTheme(dark ? "light" : "dark")} className="flex w-full items-center gap-3 rounded-lg px-3 h-9 text-[13.5px] font-medium text-ink-2 hover:bg-hover hover:text-ink">
      {dark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      <span className="flex-1 text-left">Modo escuro</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", dark ? "bg-brand-strong" : "bg-line")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", dark ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

function Notifications() {
  const me = useMe();
  const all = useStore((s) => s.notifications);
  const openTask = useStore((s) => s.openTask);
  const markRead = useStore((s) => s.markNotificationsRead);
  const mine = all.filter((n) => n.userId === me.id);
  const unread = mine.filter((n) => !n.read).length;
  return (
    <Popover
      align="right"
      trigger={
        <button className="icon-btn relative" aria-label="Notificações">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 h-4 px-1 rounded-full bg-danger text-[10px] font-bold text-white grid place-items-center">{unread}</span>}
        </button>
      }
    >
      {(close) => (
        <div className="w-80">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="font-semibold text-[14px]">Notificações</span>
            <button className="text-[12px] text-brand hover:underline" onClick={markRead}>Marcar como lidas</button>
          </div>
          <div className="max-h-80 overflow-y-auto p-1">
            {mine.length === 0 && <p className="p-4 text-ink-3 text-[13px]">Nada por aqui.</p>}
            {mine.map((n) => (
              <button
                key={n.id}
                onClick={() => { if (n.taskId) openTask(n.taskId); close(); }}
                className="flex w-full gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-hover"
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand")} />
                <span>
                  <span className="block text-[13px] leading-snug">{n.text}</span>
                  <span className="text-[11.5px] text-ink-3">{formatDistanceToNow(parseISO(n.createdAt), { locale: ptBR, addSuffix: true })}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}

/** Demo user switcher — lets the client test "administrador" vs "membro" before auth is wired. */
function UserMenu() {
  const me = useMe();
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const navigate = useNavigate();
  return (
    <Popover
      align="right"
      trigger={
        <button className="flex items-center gap-2 rounded-lg pl-1 pr-2 h-9 hover:bg-hover">
          <Avatar user={me} size={28} />
          <span className="hidden lg:block text-left leading-tight">
            <span className="block text-[13px] font-medium">{me.name}</span>
            <span className="block text-[11px] text-ink-3 capitalize">{me.role === "admin" ? "Administrador" : "Membro"}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-3" />
        </button>
      }
    >
      {(close) => (
        <div className="w-60 p-1">
          <div className="px-3 pt-2 pb-1 label">Entrar como (demo)</div>
          {users.map((u) => (
            <button key={u.id} onClick={() => { setCurrentUser(u.id); close(); navigate("/"); }} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-hover", u.id === me.id && "bg-hover")}>
              <Avatar user={u} size={24} />
              <span className="flex-1 text-left text-[13px]">{u.name}</span>
              <span className="text-[11px] text-ink-3">{u.role === "admin" ? "Admin" : "Membro"}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

function SearchBox() {
  const [q, setQ] = useState("");
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const openTask = useStore((s) => s.openTask);
  const navigate = useNavigate();
  const term = q.trim().toLowerCase();
  const hitsT = term ? tasks.filter((t) => `${t.name} ${t.tema}`.toLowerCase().includes(term)).slice(0, 6) : [];
  const hitsP = term ? projects.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 3) : [];
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tarefas, temas, projetos…" className="input pl-9 bg-surface" />
      {term && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-line bg-raised p-1 shadow-pop">
          {hitsP.map((p) => (
            <button key={p.id} onClick={() => { navigate(`/projetos/${p.id}`); setQ(""); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-hover text-[13px]">
              <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: p.color }} />{p.name}<span className="ml-auto text-[11px] text-ink-3">Projeto</span>
            </button>
          ))}
          {hitsT.map((t) => (
            <button key={t.id} onClick={() => { openTask(t.id); setQ(""); }} className="flex w-full flex-col items-start rounded-lg px-3 py-2 hover:bg-hover">
              <span className="text-[13px]">{t.name}</span>
              <span className="text-[11.5px] text-ink-3 truncate max-w-full">{t.tema}</span>
            </button>
          ))}
          {!hitsP.length && !hitsT.length && <p className="px-3 py-2 text-[13px] text-ink-3">Nenhum resultado.</p>}
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const [mobileNav, setMobileNav] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => useStore.getState().openTask(null), [pathname]);
  return (
    <div className="flex h-full">
      <aside className="hidden md:block w-[248px] shrink-0 border-r border-line bg-rail">
        <Sidebar />
      </aside>
      {mobileNav && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNav(false)} />
          <aside className="absolute inset-y-0 left-0 w-[264px] bg-rail border-r border-line animate-slide-in">
            <button className="icon-btn absolute right-2 top-4" onClick={() => setMobileNav(false)} aria-label="Fechar menu"><X className="h-4 w-4" /></button>
            <Sidebar onNavigate={() => setMobileNav(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-bg/80 backdrop-blur px-4 md:px-6">
          <button className="icon-btn md:hidden" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden sm:block flex-1"><SearchBox /></div>
          <div className="flex-1 sm:hidden" />
          {pathname !== "/horas" && <TimerChip />}
          <Notifications />
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <TaskDrawer />
    </div>
  );
}
