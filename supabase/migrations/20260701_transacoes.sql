-- Migração inicial: Tabela base de transações
-- Criação da tabela transacoes e suas políticas de segurança (RLS)

create table if not exists transacoes (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references auth.users(id) on delete cascade,
  descricao         text not null,
  tipo              text not null check (tipo in ('despesa_fixa', 'despesa_variavel', 'credito', 'aplicacao')),
  categoria         text default 'outros',
  subcategoria      text,
  valor             numeric(10,2) not null,
  dia_pagamento     int not null check (dia_pagamento between 1 and 31),
  mes_referencia    date not null,
  status            text not null default 'pendente' check (status in ('pago', 'pendente')),
  recorrente        boolean not null default false,
  parcela_atual     int,
  total_parcelas    int,
  grupo_parcela_id  uuid,
  texto_original    text,
  cartao_id         uuid,
  data_compra       date,
  criado_em         timestamptz not null default now()
);

alter table transacoes enable row level security;

create policy "transacoes_select_own" on transacoes
  for select using (auth.uid() = usuario_id);

create policy "transacoes_insert_own" on transacoes
  for insert with check (auth.uid() = usuario_id);

create policy "transacoes_update_own" on transacoes
  for update using (auth.uid() = usuario_id);

create policy "transacoes_delete_own" on transacoes
  for delete using (auth.uid() = usuario_id);
