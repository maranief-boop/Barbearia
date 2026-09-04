-- ============================================================================
-- BARBEIRARIA — Migração 003: correções de disponibilidade
--
-- 1) Remove o overload antigo (6 args) de book_appointment que deixava a
--    chamada RPC ambígua ("Could not choose the best candidate function").
-- 2) Backfill: agendamentos "sem preferência" antigos (professional_id NULL)
--    recebem um barbeiro ativo — sem isso eles nunca bloqueavam horário.
-- 3) get_available_slots v2: corte de horários passados no fuso de
--    São Paulo (antes usava UTC e liberava horários que já passaram).
-- 4) book_appointment v3: quando o cliente não escolhe barbeiro, a RPC
--    ATRIBUI automaticamente um barbeiro livre para o slot — o agendamento
--    passa a ocupar um lugar real na agenda e o horário some da lista.
--
-- Como usar: Supabase Dashboard > SQL Editor > New query > cole e "Run".
-- Idempotente. Execute antes/depois do deploy do front (não há mudança de API).
-- ============================================================================

-- 1. Remove o overload antigo (6 argumentos)
drop function if exists public.book_appointment(text, text, uuid, uuid, date, time);

-- 2. Backfill: agenda órfãs (professional_id NULL) para o primeiro barbeiro ativo
update public.appointments a
set professional_id = (
  select pr.id
  from public.professionals pr
  where pr.active
  order by pr.name
  limit 1
)
where a.professional_id is null
  and exists (select 1 from public.professionals pr where pr.active);

-- 3. get_available_slots v2
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
  v_open_min    integer;
  v_close_min   integer;
  v_step_min    integer := 15;
  v_active_pros integer;
  v_now_min     integer;
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

  -- "Agora" no fuso da barbearia (evita liberar horários já passados)
  v_now_min := extract(hour from now() at time zone 'america/sao_paulo') * 60
             + extract(minute from now() at time zone 'america/sao_paulo')::int;

  return query
  with candidate as (
    select s as slot_start_min
    from generate_series(v_open_min, v_close_min - p_duration_min, v_step_min) as s
    where
      (p_date > (now() at time zone 'america/sao_paulo')::date
        or (p_date = (now() at time zone 'america/sao_paulo')::date
            and s > v_now_min))
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
      -- sem preferência: livre se há mais barbeiros ativos que agendamentos
      -- sobrepostos (todo agendamento tem barbeiro atribuído)
      and (select count(*) from booked b
           where c.slot_start_min < b.b_end
             and c.slot_start_min + p_duration_min > b.b_start) < v_active_pros)
    or
    (p_professional_id is not null
      -- barbeiro escolhido: livre se ele não tem agendamento sobreposto
      and not exists (
        select 1 from booked b
        where b.professional_id = p_professional_id
          and c.slot_start_min < b.b_end
          and c.slot_start_min + p_duration_min > b.b_start
      ));
end;
$$;

-- 4. book_appointment v3 (7 args — única; atribui barbeiro quando "sem preferência")
create or replace function public.book_appointment(
  p_customer_name      text,
  p_customer_phone     text,
  p_service_id         uuid,
  p_professional_id    uuid,      -- null = sem preferência (a RPC escolhe um livre)
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
  v_service     public.services;
  v_customer    public.customers;
  v_appt        public.appointments;
  v_end_time    time;
  v_pro_id      uuid;
  v_start_min   integer;
  v_duration    integer;
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

  v_end_time  := p_start_time + make_interval(mins => v_service.duration_min);
  v_start_min := extract(hour from p_start_time) * 60 + extract(minute from p_start_time)::int;
  v_duration  := v_service.duration_min;

  -- "Sem preferência": atribui o primeiro barbeiro ativo livre no slot.
  -- Assim todo agendamento ocupa um lugar real na agenda e o horário
  -- deixa de aparecer como disponível.
  if p_professional_id is null then
    select pr.id into v_pro_id
    from public.professionals pr
    where pr.active
      and not exists (
        select 1
        from public.appointments a
        where a.professional_id = pr.id
          and a.appointment_date = p_appointment_date
          and a.status in ('agendado', 'em_atendimento')
          and (extract(hour from a.start_time) * 60 + extract(minute from a.start_time)::int) < (v_start_min + v_duration)
          and (extract(hour from a.end_time)   * 60 + extract(minute from a.end_time)::int)   > v_start_min
      )
    order by pr.name
    limit 1;
    if v_pro_id is null then
      raise exception 'Horário indisponível. Escolha outro horário.';
    end if;
  else
    v_pro_id := p_professional_id;
  end if;

  -- Valida que o slot está realmente disponível (evita sobreposição/race)
  if not exists (
    select 1
    from public.get_available_slots(p_professional_id, p_appointment_date, v_duration) s
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
    p_service_id, v_pro_id,
    p_appointment_date, p_start_time, v_end_time,
    v_service.price, p_payment_preference
  )
  returning * into v_appt;

  return v_appt;
end;
$$;

grant execute on function public.book_appointment(text, text, uuid, uuid, date, time, text) to anon, authenticated;

-- ============================================================================
-- FIM — Horários ocupados não aparecem mais como disponíveis e a chamada
-- RPC deixa de ser ambígua.
-- ============================================================================
