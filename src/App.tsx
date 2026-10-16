import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import MyTasks from "@/pages/MyTasks";
import Timesheet from "@/pages/Timesheet";
import Reports from "@/pages/Reports";
import Projects from "@/pages/Projects";
import ProjectPage from "@/pages/ProjectPage";
import Settings from "@/pages/Settings";

// HashRouter: works on a plain Hostinger VPS / static host without server rewrites.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="minhas-tarefas" element={<MyTasks />} />
          <Route path="horas" element={<Timesheet />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="projetos" element={<Projects />} />
          <Route path="projetos/:id" element={<ProjectPage />} />
          <Route path="configuracoes" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
