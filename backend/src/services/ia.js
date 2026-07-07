import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function interpretarLancamento(texto, usuarioId) {
  const hoje = new Date()
  const diaHoje = hoje.getDate()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const dataFormatada = hoje.toLocaleDateString('pt-BR')

  const prompt = `Você é um assistente de controle financeiro pessoal brasileiro.
Analise o texto do usuário e extraia os dados do lançamento financeiro.

Texto do usuário: "${texto}"

Data atual: ${dataFormatada} (dia ${diaHoje})
Mês de referência padrão: ${mesAtual}

Retorne um JSON com EXATAMENTE estes campos:
{
  "descricao": "para aplicacao: SEMPRE o nome do ativo/conta (ex: Poupança, Reserva de Emergência, CDB Banco X) — nunca o verbo da ação. Para outros tipos: descrição curta (ex: Mercado, Aluguel, Salário)",
  "tipo": "OBRIGATÓRIO — use EXATAMENTE um destes 4 valores: despesa_fixa | despesa_variavel | credito | aplicacao",
  "categoria": "categoria em letra minúscula (ex: alimentação, transporte, moradia, lazer, saúde, educação, assinaturas, investimentos, renda)",
  "subcategoria": "subcategoria opcional em letra minúscula — preencha somente se o texto deixar claro. Se não houver informação suficiente, retorne string vazia \"\". Referências: transporte → combustível, manutenção, transporte público, aplicativo, estacionamento; alimentação → mercado, restaurante, delivery, padaria, lanche; saúde → consulta, exame, farmácia, terapia, plano de saúde; moradia → aluguel, condomínio, contas, manutenção, mobília; educação → mensalidade, material, curso; lazer → streaming, cinema, viagem, hobby. Para outras categorias, infira subcategoria razoável ou retorne string vazia.",
  "valor": número em reais sem símbolo — POSITIVO para aportes/investimentos, NEGATIVO para resgates/saques (ex: 150.00 ou -200.00),
  "dia_pagamento": dia do mês como número inteiro (1 a 31),
  "mes_referencia": "YYYY-MM-01",
  "status": "pago" | "pendente",
  "recorrente": true | false,
  "total_parcelas": número inteiro — SOMENTE se o texto mencionar parcelamento explícito (ex: "12x", "36 vezes", "parcela 3/36", "5ª de 24"). Para lançamentos normais, retorne null,
  "parcela_inicial": número da parcela atual do mês de hoje — SOMENTE se total_parcelas definido. Padrão: 1 se não informado no texto
}

Regras de parcelamento:
- Preencha total_parcelas SOMENTE quando o texto mencionar explicitamente quantas vezes (ex: "12x de 200", "em 36 parcelas", "parcela 3 de 36")
- Para parcelamentos, "valor" é SEMPRE o valor POR PARCELA, não o total
- Se total_parcelas estiver definido, recorrente DEVE ser false
- Exemplos: "comprei TV 12x de 200" → {total_parcelas:12, parcela_inicial:1, valor:200.00}; "recebi consignado 36x de 483" → {total_parcelas:36, parcela_inicial:1, valor:483.00, tipo:"credito"}; "consignado, estou na parcela 3/36, 483 cada" → {total_parcelas:36, parcela_inicial:3, valor:483.00}

Regras de tipo — escolha SEMPRE um dos 4 valores abaixo, nunca outro:
- "despesa_variavel" = gasto pontual ou variável (mercado, restaurante, uber, farmácia) — USE ESTE COMO PADRÃO quando o texto for ambíguo ou não deixar claro se é gasto ou recebimento
- "despesa_fixa" = conta mensal fixa com valor previsível (aluguel, assinatura recorrente, mensalidade)
- "credito" = entrada de dinheiro com verbo explícito de recebimento (recebi, salário, freelance, transferência recebida)
- "aplicacao" = investimento ou resgate com verbo explícito (investi, guardei, saquei, resgatei, poupança, CDB, fundo)

Regra de fallback para textos ambíguos:
- Se o texto menciona apenas um nome e um valor sem verbo de ação claro (ex: "Claude 100", "Netflix 29,90", "João 50"), use "despesa_variavel"
- Só use "credito" se houver verbo claro de recebimento; só use "aplicacao" se houver referência clara a investimento

Regras de descricao para aplicacao:
- Use SOMENTE o nome do ativo ou conta, tanto para aportes quanto para resgates
- "saquei 50 da poupança" → descricao: "Poupança"  (NÃO "Saque da Poupança")
- "resgatei 200 do CDB Banco X" → descricao: "CDB Banco X"  (NÃO "Resgate CDB")
- "guardei 300 na reserva de emergência" → descricao: "Reserva de Emergência"
- Preserve capitalização natural do nome (ex: "Tesouro Direto", "Fundo Multimercado")

Regras de valor para aplicacao:
- NEGATIVO se mencionar: saquei, retirei, resgatei, tirei, retirada, saque, resgate, saiu da reserva, resgato
- POSITIVO se mencionar: investi, guardei, aportei, depositei, coloquei, apliquei, poupei, acumulei
- Para outros tipos (despesas, créditos), valor é sempre positivo

Regras de status:
- "pago" se mencionar: hoje, agora, já paguei, paguei, comprei, gastei, recebi
- "pendente" se mencionar: vai vencer, preciso pagar, vence dia X, ainda não paguei, vou receber
- Padrão: "pago" para despesas sem indicação, "pendente" para créditos futuros

Regras de recorrente:
- true somente se mencionar: todo mês, mensalmente, assinatura, mensalidade, fixo, recorrente

Regras de dia_pagamento:
- Se mencionar "dia X" ou "vence X", use esse dia
- Se mencionar "hoje", use o dia ${diaHoje}
- Se não mencionar, use ${diaHoje}

Retorne APENAS o JSON puro, sem texto adicional, sem markdown.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const conteudo = message.content[0].text.trim()

  let dados
  try {
    dados = JSON.parse(conteudo)
  } catch {
    const match = conteudo.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('IA não retornou JSON válido')
    dados = JSON.parse(match[0])
  }

  dados.usuario_id     = usuarioId
  dados.texto_original = texto
  dados.valor          = Number(dados.valor)
  dados.dia_pagamento  = Number(dados.dia_pagamento)
  dados.subcategoria   = dados.subcategoria?.trim().toLowerCase() || null
  dados.total_parcelas = dados.total_parcelas ? Number(dados.total_parcelas) : null
  dados.parcela_inicial = dados.total_parcelas
    ? (dados.parcela_inicial ? Number(dados.parcela_inicial) : 1)
    : null
  if (dados.total_parcelas) dados.recorrente = false  // parcelamento nunca é recorrente

  return dados
}
