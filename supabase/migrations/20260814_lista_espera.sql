-- Migração: Lista de espera (landing page pública)
-- Rode este arquivo manualmente no SQL Editor do Supabase (projeto não usa Supabase CLI/migrations versionadas).

-- ── Tabela lista_espera ──────────────────────────────────────────────────────
-- Captação de e-mail de visitantes na landing page, sem autenticação.
create table if not exists lista_espera (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  criado_em  timestamptz not null default now()
);

alter table lista_espera enable row level security;

-- Permite que qualquer visitante anônimo se cadastre...
create policy "lista_espera_insert_anon" on lista_espera
  for insert
  to anon
  with check (true);

-- ...mas ninguém (nem autenticado, nem anônimo) pode ler a lista pelo cliente.
-- Consulta feita apenas via painel do Supabase ou service role.
