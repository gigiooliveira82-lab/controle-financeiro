-- Migração: Contas Correntes
-- Rode este arquivo manualmente no SQL Editor do Supabase (projeto não usa Supabase CLI/migrations versionadas).

-- ── Tabela contas_correntes ──────────────────────────────────────────────────
-- Cadastro de contas bancárias com saldo atual, atualizado manualmente pelo
-- usuário. Independente dos lançamentos de transacoes — sem vínculo entre uma
-- transação e uma conta. O saldo é do momento presente, sem recorte mensal.
create table if not exists contas_correntes (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  nome          text not null,
  saldo_atual   numeric(12,2) not null default 0,
  cor           text,
  atualizado_em timestamptz not null default now(),
  criado_em     timestamptz not null default now()
);

alter table contas_correntes enable row level security;

create policy "contas_correntes_select_own" on contas_correntes
  for select using (auth.uid() = usuario_id);

create policy "contas_correntes_insert_own" on contas_correntes
  for insert with check (auth.uid() = usuario_id);

create policy "contas_correntes_update_own" on contas_correntes
  for update using (auth.uid() = usuario_id);

create policy "contas_correntes_delete_own" on contas_correntes
  for delete using (auth.uid() = usuario_id);
