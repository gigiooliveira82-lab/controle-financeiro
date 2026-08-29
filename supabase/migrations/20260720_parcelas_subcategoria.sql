-- Migração: Suporte a subcategorias e parcelamentos
-- Adiciona colunas para subcategoria e gestão de parcelas em transacoes

alter table transacoes
  add column if not exists subcategoria      text,
  add column if not exists parcela_atual     int,
  add column if not exists total_parcelas    int,
  add column if not exists grupo_parcela_id  uuid;
