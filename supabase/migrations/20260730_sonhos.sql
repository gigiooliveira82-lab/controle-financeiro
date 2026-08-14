-- Migração: Meus Sonhos (planejamento de metas financeiras)
-- Rode este arquivo manualmente no SQL Editor do Supabase (projeto não usa Supabase CLI/migrations versionadas).

-- ── Tabela sonhos ────────────────────────────────────────────────────────────
-- Acompanhamento manual e independente da tabela transacoes/aplicacao.
create table if not exists sonhos (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  nome           text not null,
  valor_total    numeric(10,2) not null check (valor_total > 0),
  valor_guardado numeric(10,2) not null default 0 check (valor_guardado >= 0),
  data_alvo      date not null,
  cor            text,
  criado_em      timestamptz not null default now()
);

alter table sonhos enable row level security;

create policy "sonhos_select_own" on sonhos
  for select using (auth.uid() = usuario_id);

create policy "sonhos_insert_own" on sonhos
  for insert with check (auth.uid() = usuario_id);

create policy "sonhos_update_own" on sonhos
  for update using (auth.uid() = usuario_id);

create policy "sonhos_delete_own" on sonhos
  for delete using (auth.uid() = usuario_id);
