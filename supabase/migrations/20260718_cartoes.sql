-- Migração: Gestão de Cartões integrada às Despesas
-- Rode este arquivo manualmente no SQL Editor do Supabase (projeto não usa Supabase CLI/migrations versionadas).

-- ── Tabela cartoes ────────────────────────────────────────────────────────────
create table if not exists cartoes (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  nome           text not null,
  dia_fechamento int not null check (dia_fechamento between 1 and 31),
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  cor            text,
  criado_em      timestamptz not null default now()
);

alter table cartoes enable row level security;

create policy "cartoes_select_own" on cartoes
  for select using (auth.uid() = usuario_id);

create policy "cartoes_insert_own" on cartoes
  for insert with check (auth.uid() = usuario_id);

create policy "cartoes_update_own" on cartoes
  for update using (auth.uid() = usuario_id);

create policy "cartoes_delete_own" on cartoes
  for delete using (auth.uid() = usuario_id);

-- ── Novas colunas em transacoes ────────────────────────────────────────────────
-- cartao_id: quando preenchido, indica que a despesa é uma compra no cartão
--            (o vencimento em "data"/mes_referencia+dia_pagamento já é calculado
--            pelo backend a partir do fechamento do cartão — ver backend/src/utils/cartao.js)
-- data_compra: data real em que a compra foi feita (informada pelo usuário),
--              distinta do vencimento da fatura usado pelo resto do sistema
alter table transacoes
  add column if not exists cartao_id   uuid references cartoes(id) on delete set null,
  add column if not exists data_compra date;
