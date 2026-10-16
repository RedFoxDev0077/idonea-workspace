# Idônea Workspace — frontend

Plataforma de gestão de projetos (estilo Asana) com controle de horas nativo (estilo Clockify) para a Idônea Comunicação.

Stack igual à do Lovable: **React 18 + Vite + TypeScript + Tailwind**, ícones `lucide-react`, estado em `zustand`.
Para levar ao Lovable: suba este diretório para um repositório GitHub e conecte o projeto do Lovable a ele.

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # gera dist/ (estático — serve em qualquer VPS / Nginx)
```

## Telas

| Rota | Tela |
|---|---|
| `/` | Painel — cronômetro, KPIs, horas da semana, tarefas de hoje, projetos, radar de riscos (IA), capacidade da equipe (admin) |
| `/minhas-tarefas` | Minhas tarefas — Atrasadas / Hoje / Próximos 7 dias / Mais tarde, ou calendário |
| `/projetos` | Projetos agrupados por cliente |
| `/projetos/:id` | Projeto — **Lista** (seções editáveis, arrastar e soltar, TOT por seção), **Quadro** (por status ou seção), **Calendário** |
| `/horas` | Controle de horas — barra rápida, registros por dia, visão semanal, lançamento manual |
| `/relatorios` | Relatórios resumido e detalhado com exportação CSV, XLSX e PDF |
| `/configuracoes` | (admin) Logo, status, etiquetas, equipe/permissões, migração Asana/Clockify |

## Regras de negócio já implementadas no front

- **Duas datas**: *data de trabalho* (o "Data de conclusão" do Asana) e *prazo máx.*; a tarefa fica em alerta quando a data de trabalho passa do prazo.
- **Urgente é uma etiqueta**, não um status — a tarefa pode ser urgente e continuar "Em revisão".
- **Status editáveis pelo admin** (nome, cor, ordem, se "finaliza"). Padrão: Pendente, Faltam informações, Alteração, Em andamento, Revisão, Enviar para aprovação, Publicar, Publicado/Finalizado, Cobrar.
- **Um cronômetro por usuário**: iniciar outro fecha o anterior. O tempo é sempre calculado a partir do `start` gravado, então fechar o navegador não perde horas.
- **Edição de horas**: membro edita os próprios registros só no mesmo dia; depois disso só o admin, e cada alteração fica no histórico (quem, quando, antes → depois).
- **Estimado × trabalhado** em cada tarefa, seção e relatório.
- Perfis: **Administrador** e **Membro** (seletor "Entrar como" no avatar, só para testes até o login real).

## Próxima etapa (backend no Lovable + Supabase)

`src/lib/types.ts` já espelha as tabelas: `users, clients, projects, sections, statuses, tags, tasks, time_entries, comments, activity, notifications`.
Cada ação em `src/store/useStore.ts` vira uma mutação Supabase; os dados de exemplo (`src/lib/seed.ts`) saem quando a migração do Asana/Clockify rodar.
Pontos a garantir no servidor: índice único parcial `time_entries(user_id) where end is null` (um timer ativo), RLS para a regra de edição no mesmo dia, Storage para anexos, e Auth do Supabase no lugar do seletor de usuário.
