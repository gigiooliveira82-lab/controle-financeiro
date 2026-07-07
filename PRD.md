# PRD — Controle Financeiro

## 1. Visão geral

**Nome do projeto:** controle-financeiro

**Objetivo:** Substituir uma planilha de controle financeiro pessoal (despesas fixas, variáveis, créditos, aplicações, status pago/pendente, saldo) por um web app, começando pelo uso pessoal e evoluindo para um produto SaaS comercial após validação.

**Fases:**
1. **Fase 1 — Uso pessoal:** replicar e melhorar o controle que hoje é feito em planilha.
2. **Fase 2 — SaaS:** transformar em produto comercial (multiusuário, cobrança, etc.) após testes reais de 1-3 meses.

**Idioma do projeto:** Português (Brasil) — interface, comunicação e dados.

**Público-alvo da Fase 1:** uso individual do criador do projeto.
**Público-alvo da Fase 2:** pessoas físicas que controlam orçamento pessoal/familiar.

---

## 2. Stack técnica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | React | Roda em navegador, funciona em celular e desktop sem precisar de app nativo |
| Backend | Node.js | Integração simples com APIs e Supabase |
| Banco de dados / Auth | Supabase (PostgreSQL) | Gerencia banco, autenticação e segurança (RLS) com baixa complexidade de configuração |
| IA (categorização e análises) | Anthropic API (Claude) | Interpreta texto livre e gera análises em linguagem natural |
| Região do banco | South America (São Paulo) | Latência e residência de dados no Brasil |

---

## 3. Modelo de dados

### Tabela `transacoes` (já criada e validada)

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Identificador único (gerado automaticamente) |
| usuario_id | uuid | Referência ao usuário dono do registro |
| descricao | text | Nome do lançamento (ex: "Mercado") |
| tipo | text | `despesa_fixa` / `despesa_variavel` / `credito` / `aplicacao` |
| categoria | text | Categoria preenchida pela IA (ex: "alimentação") |
| valor | numeric(10,2) | Valor em reais |
| dia_pagamento | int | Dia do mês de vencimento/pagamento |
| mes_referencia | date | Mês a que o lançamento pertence (permite comparações futuras) |
| status | text | `pago` / `pendente` |
| recorrente | boolean | Se o lançamento se repete automaticamente todo mês |
| texto_original | text | Texto digitado pelo usuário (ex: "gastei 50 no mercado hoje") |
| criado_em | timestamp | Data/hora de criação do registro |

**Segurança:** Row Level Security (RLS) ativado, com 4 políticas (select, insert, update, delete) restringindo cada usuário aos próprios dados (`auth.uid() = usuario_id`).

### Tabelas futuras (não criadas ainda)
- `metas` — limites de gasto por categoria/mês (Fase 2)
- `usuarios` — gerenciada nativamente pelo Supabase Auth

---

## 4. Funcionalidades — Fase 1

### 4.1 Lançamento por texto livre
- Usuário digita frases naturais, ex: *"gastei 50 no mercado hoje"*.
- Backend envia o texto para a API da Anthropic.
- IA retorna dados estruturados: valor, categoria, descrição, tipo, data.
- Sistema salva o registro na tabela `transacoes`, incluindo o `texto_original`.

### 4.2 Despesas fixas recorrentes
- Lançamentos marcados como `recorrente = true` são gerados automaticamente todo início de mês, com status `pendente`.
- Edição de valor em um mês específico não altera os meses seguintes.

### 4.3 Dashboard do mês
- Saldo real (créditos pagos − despesas pagas).
- Saldo projetado (incluindo pendentes).
- Total de despesas fixas, variáveis, créditos e aplicações.
- Total pendente por categoria.

### 4.4 Lista de lançamentos (extrato)
- Listagem editável com filtro por status (pago/pendente) e tipo.

### 4.5 Análises inteligentes — Nível 1 (essencial, dados do mês atual)
1. Saldo real x saldo projetado.
2. Alerta de saldo negativo, com explicação textual do motivo.
3. Dependência de créditos pendentes (% do saldo positivo que depende de valores não recebidos).
4. Concentração de gastos por categoria.
5. Top 3 maiores gastos do mês.
6. Peso dos cartões de crédito no total de despesas.
7. Despesas pendentes x vencidas.
8. Créditos não recebidos (quem/o que está pendente de entrada).
9. Resumo do mês em uma frase.

---

## 5. Funcionalidades — Fase 1.5 (após 2-3 meses de histórico)

Análises de **Nível 2** (requerem comparação entre meses):
1. Variação mês a mês por categoria.
2. Tendência de gastos em 3 meses (alerta de crescimento constante).
3. Detecção de gastos atípicos/sazonais.
4. Taxa de pagamento em dia (% de contas pagas até o vencimento).
5. Detector de assinaturas/recorrências esquecidas.

---

## 6. Funcionalidades — Fase 2 (SaaS)

Análises de **Nível 3** (avançadas, diferenciais comerciais):
1. Sugestão inteligente de corte de gastos.
2. Cálculo de capacidade de poupança.
3. Calculadora de reserva de emergência (quantos meses as despesas fixas são cobertas pela reserva).
4. Simulador "e se?" (simulação de cenários, ex: "e se eu cortar 30% do cartão?").

Funcionalidades de plataforma:
- Multiusuário (cada cliente com seus próprios dados, já preparado via RLS).
- Importação de extrato bancário.
- Sistema de metas por categoria.
- Cobrança/assinatura.

---

## 7. Fluxo de dados (arquitetura)

```
Usuário digita lançamento (texto livre)
        ↓
Frontend (React) envia o texto
        ↓
Backend (Node.js) recebe e chama a API da Anthropic
        ↓
IA interpreta e retorna dados estruturados
        ↓
Backend salva na tabela `transacoes` (Supabase)
        ↓
Dashboard e análises são atualizados automaticamente
```

---

## 8. Roadmap de construção

| Etapa | Descrição | Status |
|---|---|---|
| 1 | Banco de dados (tabela `transacoes`, RLS, políticas) | ✅ Concluído |
| 2 | Lançamento por texto livre + IA categorizando | Em andamento |
| 3 | Despesas fixas recorrentes (geração automática mensal) | Pendente |
| 4 | Dashboard do mês | Pendente |
| 5 | Análises Nível 1 (9 essenciais) | Pendente |
| 6 | Testes reais de uso (1-2 meses) | Pendente |
| 7 | Análises Nível 2 + ajustes | Pendente |
| 8 | Preparação para lançamento como SaaS | Pendente |

---

## 9. Estado atual da infraestrutura

- Projeto Supabase criado (região São Paulo).
- Tabela `transacoes` criada, validada com inserção de teste.
- RLS ativado com 4 políticas de acesso (select, insert, update, delete).
- Usuário de teste criado (autenticação via Supabase Auth).
- Node.js (LTS) e Claude Code instalados localmente.
- Pasta do projeto: `Desktop/controle-financeiro`.

---

## 10. Restrições e cuidados

- Dados sensíveis (senhas, CPFs, chaves de API) nunca devem ser compartilhados em texto puro durante o desenvolvimento — usar variáveis de ambiente.
- Todo acesso a dados deve respeitar RLS — nenhum dado de um usuário deve ser visível para outro.
- Desenvolvedor tem conhecimento básico de programação — preferência por explicações claras do "porquê", além do "como", em cada etapa.
