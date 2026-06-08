-- ============================================================================
-- Roleta Irmãos Berti — schema do Supabase
-- Rode este arquivo inteiro no Supabase: Dashboard → SQL Editor → New query →
-- cole tudo → Run. (Pode rodar de novo sem problema: é idempotente.)
-- ============================================================================

-- Tabela de participantes -----------------------------------------------------
create table if not exists public.participants (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  tiktok      text not null unique,              -- UNIQUE = 1 participação por @ (à prova de burla)
  diamonds    int  not null,
  prize       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists participants_created_at_idx
  on public.participants (created_at desc);

-- Segurança (RLS) -------------------------------------------------------------
alter table public.participants enable row level security;

-- Leitura pública: a homepage mostra nome | @ | prêmio | quando.
-- (Só dados não sensíveis são armazenados.)
drop policy if exists "public read" on public.participants;
create policy "public read"
  on public.participants for select
  using (true);

-- IMPORTANTE: não criamos policy de INSERT/UPDATE/DELETE para o público.
-- Logo, inserções diretas pela API ficam bloqueadas — o único caminho para
-- gravar é a função spin_roleta() abaixo (SECURITY DEFINER), que decide o
-- prêmio no servidor. Assim ninguém força o 1000 nem insere registros falsos.

-- Função de giro: dedup + sorteio + gravação, tudo atômico no servidor -------
create or replace function public.spin_roleta(p_nome text, p_tiktok text)
returns table (
  status      text,
  prize_index int,
  nome        text,
  tiktok      text,
  diamonds    int,
  prize       text,
  created_at  timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  -- 10 fatias: 100 (4x) · 200 (3x) · 500 (2x) · 1000 (1x).
  v_slots int[] := array[100,200,500,100,1000,100,200,500,100,200];
  v_tt    text;
  v_nome  text;
  v_idx   int;
  v_d     int;
  v_label text;
  v_row   public.participants%rowtype;
begin
  v_nome := trim(coalesce(p_nome, ''));
  -- normaliza o @: tira espaços das pontas -> remove @ inicial -> remove
  -- espaços internos -> minúsculas -> prefixa um único @.
  v_tt := trim(coalesce(p_tiktok, ''));
  v_tt := regexp_replace(v_tt, '^@+', '');
  v_tt := regexp_replace(v_tt, '\s', '', 'g');
  v_tt := '@' || lower(v_tt);

  if char_length(v_nome) < 2 then
    raise exception 'Nome inválido';
  end if;
  if char_length(v_tt) < 3 then
    raise exception '@ do TikTok inválido';
  end if;

  -- já participou?
  select * into v_row from public.participants p where p.tiktok = v_tt;
  if found then
    return query select 'duplicate'::text, null::int, v_row.nome, v_row.tiktok,
                        v_row.diamonds, v_row.prize, v_row.created_at;
    return;
  end if;

  -- sorteio (índice 1..10 -> 0-based para o front)
  v_idx   := floor(random() * 10)::int + 1;
  v_d     := v_slots[v_idx];
  -- "1.000 Diamantes" (força ponto como separador de milhar, independente do locale)
  v_label := replace(to_char(v_d, 'FM9G999'), ',', '.') || ' Diamantes';

  begin
    insert into public.participants (nome, tiktok, diamonds, prize)
    values (v_nome, v_tt, v_d, v_label)
    returning * into v_row;
  exception when unique_violation then
    -- corrida: alguém inseriu o mesmo @ em paralelo -> trata como duplicado
    select * into v_row from public.participants p where p.tiktok = v_tt;
    return query select 'duplicate'::text, null::int, v_row.nome, v_row.tiktok,
                        v_row.diamonds, v_row.prize, v_row.created_at;
    return;
  end;

  return query select 'ok'::text, (v_idx - 1), v_row.nome, v_row.tiktok,
                      v_row.diamonds, v_row.prize, v_row.created_at;
end;
$$;

-- libera a função para o público (chave anon do front)
grant execute on function public.spin_roleta(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Funções de administração (exigem a senha do /admin).
-- A senha abaixo precisa ser a MESMA do painel (VITE_ADMIN_PASSWORD / fallback
-- em src/routes/admin.tsx). Troque nos dois lugares se mudar.
-- ---------------------------------------------------------------------------
create or replace function public.admin_delete(p_password text, p_tiktok text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if p_password is distinct from 'BertiAdmin2026' then
    raise exception 'unauthorized';
  end if;
  delete from public.participants where tiktok = p_tiktok;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
grant execute on function public.admin_delete(text, text) to anon, authenticated;

create or replace function public.admin_clear_all(p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_password is distinct from 'BertiAdmin2026' then
    raise exception 'unauthorized';
  end if;
  -- WHERE sempre verdadeiro: satisfaz a proteção do Supabase contra DELETE sem WHERE.
  delete from public.participants where id is not null;
end;
$$;
grant execute on function public.admin_clear_all(text) to anon, authenticated;
