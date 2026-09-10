-- Migração: Contas Bancárias (Corrente e Poupança)
-- Rode este arquivo manualmente no SQL Editor do Supabase se estiver em produção.

-- ── Tabela contas_correntes ──────────────────────────────────────────────────
create table if not exists contas_correntes (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  nome          text not null,
  tipo          text not null default 'corrente',
  saldo_atual   numeric(12,2) not null default 0,
  cor           text,
  atualizado_em timestamptz not null default now(),
  criado_em     timestamptz not null default now()
);

-- Adiciona coluna tipo caso a tabela já exista
alter table contas_correntes add column if not exists tipo text not null default 'corrente';

alter table contas_correntes enable row level security;

drop policy if exists "contas_correntes_select_own" on contas_correntes;
create policy "contas_correntes_select_own" on contas_correntes
  for select using (auth.uid() = usuario_id);

drop policy if exists "contas_correntes_insert_own" on contas_correntes;
create policy "contas_correntes_insert_own" on contas_correntes
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "contas_correntes_update_own" on contas_correntes;
create policy "contas_correntes_update_own" on contas_correntes
  for update using (auth.uid() = usuario_id);

drop policy if exists "contas_correntes_delete_own" on contas_correntes;
create policy "contas_correntes_delete_own" on contas_correntes
  for delete using (auth.uid() = usuario_id);

