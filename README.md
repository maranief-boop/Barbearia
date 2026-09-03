# Barbeiraria — Sistema White-Label para Barbearias

Sistema modular que combina em um único projeto:

- **Site Institucional** — página de conversão com serviços, galeria, localização e CTAs de WhatsApp/Agendamento.
- **PWA de Agendamento 24/7** — fluxo mobile-first para o cliente final agendar serviço, barbeiro, data e horário.
- **Painel Administrativo** — Kanban de agendamentos, controle financeiro e CRM com campanhas via WhatsApp.

Stack: **React + Vite + TypeScript + Tailwind CSS** no front-end e **Supabase** (Postgres + Auth + RLS) no back-end.

## Estrutura de pastas

```
├── .env.example                 # Modelo de variáveis de ambiente (marca + Supabase)
├── index.html
├── vite.config.ts
├── supabase/
│   └── migrations/
│       └── 001_init.sql         # Tabelas, RLS, funções de agendamento, view financeira e seeds
└── src/
    ├── config/brand.ts          # ★ Configuração central White-Label (nome, cores, logo, WhatsApp)
    ├── lib/supabase.ts          # Client do Supabase
    ├── App.tsx                  # Rotas: / (site), /agendar (PWA), /admin (painel)
    └── modules/                 # (próximas etapas) site/, booking/, admin/
```

## Configuração do Supabase (do zero)

### 1. Criar o projeto
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto (região `South America (São Paulo)` para menor latência).
2. Guarde a senha do banco — você não precisará dela no app, apenas no painel do Supabase.

### 2. Criar as tabelas
1. No painel do projeto, abra **SQL Editor > New query**.
2. Cole todo o conteúdo de [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) e clique em **Run**.
3. O script cria: tabelas (`services`, `professionals`, `business_hours`, `customers`, `appointments`, `payments`, `profiles`), políticas de segurança (RLS), as funções `get_available_slots` e `book_appointment` (usadas pelo agendamento público), a view `revenue_daily` (financeiro) e dados de exemplo.

### 3. Criar o usuário administrador (dono da barbearia)
1. Vá em **Authentication > Users > Add user**.
2. Informe e-mail e senha (marque "Auto Confirm User").
3. O trigger `on_auth_user_created` cria automaticamente o perfil admin no banco.

### 4. Configurar as variáveis de ambiente
1. Copie `.env.example` para `.env`.
2. Em **Settings > API** no painel do Supabase, copie:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`
3. Ajuste as demais variáveis de marca conforme desejar (seção abaixo).

## Personalização White-Label

Toda a identidade visual é controlada por variáveis de ambiente — **sem tocar no código**:

| Variável | Descrição |
|---|---|
| `VITE_BRAND_NAME` | Nome da barbearia (título, hero, rodapé, PWA) |
| `VITE_BRAND_TAGLINE` | Frase de apresentação |
| `VITE_BRAND_LOGO_URL` | URL do logo (opcional) |
| `VITE_BRAND_PRIMARY` / `SECONDARY` / `DARK` / `LIGHT` | Paleta de cores (hex) |
| `VITE_BRAND_WHATSAPP` | Número WhatsApp (formato internacional, só dígitos) |
| `VITE_BRAND_WHATSAPP_MESSAGE` | Mensagem padrão do botão "Chamar no WhatsApp" |
| `VITE_BRAND_ADDRESS` / `VITE_BRAND_CITY` | Endereço exibido no site |
| `VITE_BRAND_MAPS_EMBED` | URL de embed do Google Maps (opcional) |
| `VITE_BRAND_INSTAGRAM` / `VITE_BRAND_FACEBOOK` / `VITE_BRAND_EMAIL` | Redes sociais e contato |

Serviços, barbeiros e horários de funcionamento ficam no banco (tabelas `services`, `professionals`, `business_hours`) e podem ser editados pelo painel admin ou direto no Supabase.

## Comandos

```bash
npm install     # instalar dependências
npm run dev     # ambiente de desenvolvimento
npm run build   # build de produção (typecheck + vite build)
npm run preview # servir o build localmente
```

## Roadmap de implementação

| Etapa | Módulo | Status |
|---|---|---|
| 1 | Scaffold + Configuração White-Label | ✅ Concluída |
| 2 | Migração SQL do banco | ✅ Concluída |
| 3 | Hooks + tipos + client Supabase | ⬜ Próxima |
| 4 | Site institucional | ⬜ |
| 5 | PWA de agendamento 24/7 | ⬜ |
| 6 | Auth + layout admin | ⬜ |
| 7 | Kanban de agendamentos | ⬜ |
| 8 | Financeiro | ⬜ |
| 9 | CRM + campanhas WhatsApp | ⬜ |
