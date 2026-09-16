-- Migração: Suporte a frequência de recorrência (mensal, trimestral, semestral, anual)
-- Adiciona a coluna frequencia_recorrencia na tabela transacoes

alter table transacoes
add column if not exists frequencia_recorrencia text default 'mensal'
check (frequencia_recorrencia in ('mensal', 'trimestral', 'semestral', 'anual'));

-- Atualiza registros existentes que já são recorrentes para 'mensal'
update transacoes
set frequencia_recorrencia = 'mensal'
where recorrente = true and (frequencia_recorrencia is null or frequencia_recorrencia = '');
