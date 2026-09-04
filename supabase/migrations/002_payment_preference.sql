-- ============================================================================
-- BARBEIRARIA — Migração 002: preferência de forma de pagamento
--
-- Adiciona a coluna payment_preference aos agendamentos e atualiza a RPC
-- book_appointment para recebê-la.
--
-- Como usar: Supabase Dashboard > SQL Editor > New query > cole e "Run".
-- Idempotente (pode ser rodado 2x). Execute ANTES de publicar o novo front.
-- ============================================================================

-- 1. Nova coluna (pagar_no_local é o padrão para agendamentos antigos)
alter table public.appointments
  add column if not exists payment_preference text
  not null default 'pagar_no_local';

do $$ begin
  alter table public.appointments
    add constraint appointment_payment_preference_check
    check (payment_preference in ('pix', 'cartao', 'pagar_no_local'));
exception when duplicate_object then null; end $$;

-- 2. RPC book_appointment atualizada (novo parâmetro com default:
--    chamadas antigas sem o parâmetro continuam funcionando)
create or replace function public.book_appointment(
  p_customer_name      text,
  p_customer_phone     text,
  p_service_id         uuid,
  p_professional_id    uuid,      -- null = sem preferência
  p_appointment_date   date,
  p_start_time         time,
  p_payment_preference text default 'pagar_no_local'
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
  if p_payment_preference not in ('pix', 'cartao', 'pagar_no_local') then
    raise exception 'Forma de pagamento inválida';
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
    price, payment_preference
  ) values (
    v_customer.id, trim(p_customer_name), regexp_replace(p_customer_phone, '\D', '', 'g'),
    p_service_id, p_professional_id,
    p_appointment_date, p_start_time, v_end_time,
    v_service.price, p_payment_preference
  )
  returning * into v_appt;

  return v_appt;
end;
$$;

grant execute on function public.book_appointment(text, text, uuid, uuid, date, time, text) to anon, authenticated;

-- ============================================================================
-- FIM — Coluna payment_preference disponível (visível no Kanban/CRM também).
-- ============================================================================
