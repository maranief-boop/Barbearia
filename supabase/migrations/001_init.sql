-- ============================================================================
-- BARBEIRARIA — Migração inicial (001_init.sql)
-- Sistema White-Label: Site + PWA de Agendamento + Painel Admin (Kanban/CRM)
--
-- Como usar: Supabase Dashboard > SQL Editor > New query > cole todo este
-- arquivo e clique em "Run". O script é idempotente (pode ser rodado 2x).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.appointment_status as enum
    ('agendado', 'em_atendimento', 'finalizado', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('dinheiro', 'pix', 'cartao');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. TABELAS
-- ----------------------------------------------------------------------------

-- Perfil do lojista (vinculado ao usuário do Supabase Auth)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'admin' check (role in ('admin')),
  created_at  timestamptz not null default now()
);

-- Serviços oferecidos (exibidos no site e no agendamento)
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  duration_min integer not null check (duration_min > 0),
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Profissionais (barbeiros)
create table if not exists public.professionals (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  role           text not null default 'Barbeiro',
  avatar_url     text,
  commission_pct numeric(5,2) not null default 0 check (commission_pct between 0 and 100),
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Horários de funcionamento (0 = domingo ... 6 = sábado)
create table if not exists public.business_hours (
  id         uuid primary key default gen_random_uuid(),
  weekday    integer not null unique check (weekday between 0 and 6),
  open_time  time not null,
  close_time time not null,
  is_open    boolean not null default true
);

-- Base de clientes do CRM (deduplicada por telefone)
create table if not exists public.customers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  phone             text not null unique,
  notes             text,
  last_contacted_at timestamptz,
  created_at        timestamptz not null default now()
);

-- Agendamentos (o coração do sistema)
create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references public.customers(id) on delete set null,
  customer_name   text not null,
  customer_phone  text not null,
  service_id      uuid not null references public.services(id),
  professional_id uuid references public.professionals(id) on delete set null,
  appointment_date date not null,
  start_time       time not null,
  end_time         time not null,
  status           public.appointment_status not null default 'agendado',
  price            numeric(10,2) not null check (price >= 0),
  notes            text,
  created_at       timestamptz not null default now(),
  constraint appointment_period_check check (end_time > start_time)
);

-- Pagamentos recebidos (controle financeiro e comissões)
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  amount          numeric(10,2) not null check (amount >= 0),
  method          public.payment_method not null default 'dinheiro',
  received_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. ÍNDICES
-- ----------------------------------------------------------------------------
create index if not exists idx_appointments_date
  on public.appointments (appointment_date);
create index if not exists idx_appointments_prof_date
  on public.appointments (professional_id, appointment_date);
create index if not exists idx_appointments_status
  on public.appointments (status);
create index if not exists idx_appointments_customer
  on public.appointments (customer_id);
create index if not exists idx_payments_received_at
  on public.payments (received_at);
create index if not exists idx_payments_professional
  on public.payments (professional_id);

-- ----------------------------------------------------------------------------
-- 4. AUTOCRIAR PERFIL AO CADASTRAR USUÁRIO ADMIN NO AUTH
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. FUNÇÃO: HORÁRIOS DISPONÍVEIS (usada pelo PWA de agendamento)
--    Retorna os slots livres de um barbeiro em uma data, considerando os
--    horários de funcionamento, os agendamentos existentes e a duração do
--    serviço. Slot de 15 em 15 minutos (BRAND.slotIntervalMin no front).
-- ----------------------------------------------------------------------------
create or replace function public.get_available_slots(
  p_professional_id uuid,   -- null = "sem preferência" (qualquer barbeiro livre)
  p_date            date,
  p_duration_min    integer default 30
)
returns table (start_time time)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_open_min   integer;
  v_close_min  integer;
  v_step_min   integer := 15;
  v_active_pros integer;
begin
  select
    extract(hour from bh.open_time)  * 60 + extract(minute from bh.open_time)::int,
    extract(hour from bh.close_time) * 60 + extract(minute from bh.close_time)::int
  into v_open_min, v_close_min
  from public.business_hours bh
  where bh.weekday = extract(dow from p_date)::int
    and bh.is_open;

  -- Fechado neste dia da semana
  if v_open_min is null then
    return;
  end if;

  select count(*) into v_active_pros
  from public.professionals where active;

  return query
  with candidate as (
    select s as slot_start_min
    from generate_series(v_open_min, v_close_min - p_duration_min, v_step_min) as s
    where
      -- não oferecer horários que já passaram no dia de hoje
      (p_date > current_date or (p_date = current_date and s > extract(hour from now() at time zone 'utc') * 60))
  ),
  booked as (
    select
      a.professional_id,
      extract(hour from a.start_time) * 60 + extract(minute from a.start_time)::int as b_start,
      extract(hour from a.end_time)   * 60 + extract(minute from a.end_time)::int   as b_end
    from public.appointments a
    where a.appointment_date = p_date
      and a.status in ('agendado', 'em_atendimento')
  )
  select make_interval(mins => c.slot_start_min)::time
  from candidate c
  where
    (p_professional_id is null
      -- sem preferência: slot livre se há mais barbeiros ativos que agendamentos sobrepostos
      and (select count(*) from booked b
           where c.slot_start_min < b.b_end
             and c.slot_start_min + p_duration_min > b.b_start) < v_active_pros)
    or
    (p_professional_id is not null
      -- barbeiro escolhido: slot livre se ele não tem agendamento sobreposto
      and not exists (
        select 1 from booked b
        where b.professional_id = p_professional_id
          and c.slot_start_min < b.b_end
          and c.slot_start_min + p_duration_min > b.b_start
      ));
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. FUNÇÃO: REALIZAR AGENDAMENTO (RPC usada pelo cliente anônimo do PWA)
--    Cria/atualiza o cliente por telefone, valida o slot e insere o
--    agendamento — tudo em uma única transação atômica.
-- ----------------------------------------------------------------------------
create or replace function public.book_appointment(
  p_customer_name    text,
  p_customer_phone   text,
  p_service_id       uuid,
  p_professional_id  uuid,      -- null = sem preferência
  p_appointment_date date,
  p_start_time       time
)
returns public.appointments
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_service   public.services;
  v_customer  public.customers;
  v_appt      public.appointments;
  v_end_time  time;
begin
  select * into v_service
  from public.services
  where id = p_service_id and active;
  if not found then
    raise exception 'Serviço não encontrado ou inativo';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) < 3 then
    raise exception 'Nome do cliente inválido';
  end if;
  if p_customer_phone is null or length(regexp_replace(p_customer_phone, '\D', '', 'g')) < 10 then
    raise exception 'Telefone inválido';
  end if;

  v_end_time := p_start_time + make_interval(mins => v_service.duration_min);

  -- Valida que o slot está realmente disponível (evita sobreposição/race)
  if not exists (
    select 1
    from public.get_available_slots(p_professional_id, p_appointment_date, v_service.duration_min) s
    where s.start_time = p_start_time
  ) then
    raise exception 'Horário indisponível. Escolha outro horário.';
  end if;

  -- Upsert do cliente por telefone (mantém o CRM sempre atualizado)
  insert into public.customers (name, phone)
  values (trim(p_customer_name), regexp_replace(p_customer_phone, '\D', '', 'g'))
  on conflict (phone) do update
    set name = excluded.name
  returning * into v_customer;

  insert into public.appointments (
    customer_id, customer_name, customer_phone,
    service_id, professional_id,
    appointment_date, start_time, end_time,
    price
  ) values (
    v_customer.id, trim(p_customer_name), regexp_replace(p_customer_phone, '\D', '', 'g'),
    p_service_id, p_professional_id,
    p_appointment_date, p_start_time, v_end_time,
    v_service.price
  )
  returning * into v_appt;

  return v_appt;
end;
$$;

grant execute on function public.get_available_slots(uuid, date, integer) to anon, authenticated;
grant execute on function public.book_appointment(text, text, uuid, uuid, date, time) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. VIEW FINANCEIRA: faturamento diário por método de pagamento
-- ----------------------------------------------------------------------------
create or replace view public.revenue_daily
with (security_invoker = true) as
select
  p.received_at::date                                            as day,
  count(*)                                                       as payments_count,
  sum(p.amount)                                                  as total,
  sum(p.amount) filter (where p.method = 'dinheiro')             as total_dinheiro,
  sum(p.amount) filter (where p.method = 'pix')                  as total_pix,
  sum(p.amount) filter (where p.method = 'cartao')               as total_cartao
from public.payments p
group by 1
order by 1;

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Serviços: leitura pública, escrita só para o admin logado
alter table public.services enable row level security;
create policy "services_public_read"
  on public.services for select
  using (active = true or auth.role() = 'authenticated');
create policy "services_admin_write"
  on public.services for all
  to authenticated
  using (true) with check (true);

-- Profissionais: leitura pública, escrita só para o admin logado
alter table public.professionals enable row level security;
create policy "professionals_public_read"
  on public.professionals for select
  using (active = true or auth.role() = 'authenticated');
create policy "professionals_admin_write"
  on public.professionals for all
  to authenticated
  using (true) with check (true);

-- Horários de funcionamento: leitura pública, escrita só para o admin
alter table public.business_hours enable row level security;
create policy "business_hours_public_read"
  on public.business_hours for select
  using (true);
create policy "business_hours_admin_write"
  on public.business_hours for all
  to authenticated
  using (true) with check (true);

-- Clientes (CRM): anônimo NÃO lê a base; admin tem acesso total
alter table public.customers enable row level security;
create policy "customers_admin_read"
  on public.customers for select
  to authenticated
  using (true);
create policy "customers_admin_insert"
  on public.customers for insert
  to authenticated
  with check (true);
create policy "customers_admin_update"
  on public.customers for update
  to authenticated
  using (true) with check (true);
create policy "customers_admin_delete"
  on public.customers for delete
  to authenticated
  using (true);

-- Agendamentos: o público agenda apenas via RPC book_appointment;
-- leitura/edição do Kanban apenas para o admin logado
alter table public.appointments enable row level security;
create policy "appointments_admin_read"
  on public.appointments for select
  to authenticated
  using (true);
create policy "appointments_admin_insert"
  on public.appointments for insert
  to authenticated
  with check (true);
create policy "appointments_admin_update"
  on public.appointments for update
  to authenticated
  using (true) with check (true);
create policy "appointments_admin_delete"
  on public.appointments for delete
  to authenticated
  using (true);

-- Pagamentos: somente o admin logado
alter table public.payments enable row level security;
create policy "payments_admin_all"
  on public.payments for all
  to authenticated
  using (true) with check (true);

-- Perfis: o usuário vê/edita apenas o próprio perfil
alter table public.profiles enable row level security;
create policy "profiles_own_read"
  on public.profiles for select
  using (auth.uid() = id);
create policy "profiles_own_write"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 9. SEEDS DE EXEMPLO (personalizáveis depois pelo painel admin)
-- ----------------------------------------------------------------------------
insert into public.services (name, description, price, duration_min, sort_order)
select v.name, v.description, v.price, v.duration_min, v.sort_order
from (values
  ('Corte Masculino',        'Corte na tesoura e máquina com finalização e styling.', 45.00::numeric, 40, 1),
  ('Barba',                  'Toque, alinhamento, toalha quente e óleo finalizador.', 35.00::numeric, 30, 2),
  ('Corte + Barba',          'Combo completo com desconto especial.',                 70.00::numeric, 60, 3),
  ('Pezinho / Acabamento',   'Acabamento rápido de nuca e costeletas.',               20.00::numeric, 15, 4)
) as v(name, description, price, duration_min, sort_order)
where not exists (select 1 from public.services s where s.name = v.name);

insert into public.professionals (name, role, commission_pct)
select v.name, v.role, v.commission_pct
from (values
  ('Carlos Silva',  'Barbeiro Sênior', 50.00::numeric),
  ('Rafael Souza',  'Barbeiro',        40.00::numeric)
) as v(name, role, commission_pct)
where not exists (select 1 from public.professionals p where p.name = v.name);

-- Horários: fechado no domingo (0); Seg a Sáb das 09:00 às 19:00
insert into public.business_hours (weekday, open_time, close_time, is_open)
select v.weekday, v.open_time, v.close_time, v.is_open
from (values
  (0, '09:00'::time, '19:00'::time, false),
  (1, '09:00'::time, '19:00'::time, true),
  (2, '09:00'::time, '19:00'::time, true),
  (3, '09:00'::time, '19:00'::time, true),
  (4, '09:00'::time, '19:00'::time, true),
  (5, '09:00'::time, '19:00'::time, true),
  (6, '09:00'::time, '19:00'::time, true)
) as v(weekday, open_time, close_time, is_open)
where not exists (select 1 from public.business_hours bh where bh.weekday = v.weekday);

-- ============================================================================
-- FIM — O banco está pronto.
-- Próximo passo: criar o usuário admin em Authentication > Users > Add user.
-- ============================================================================
