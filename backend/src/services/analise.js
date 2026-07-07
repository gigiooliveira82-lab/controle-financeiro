import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function gerarAnalise(dados, mesFormatado) {
  const prompt = `Você é um consultor financeiro pessoal, direto e empático.
Analise os dados financeiros abaixo e gere uma análise em português.

DADOS DO MÊS (${mesFormatado}):
${JSON.stringify(dados, null, 2)}

Retorne um JSON com as chaves abaixo. Inclua SOMENTE as que se aplicam — exceto "resumo", que é sempre obrigatório.

{
  "resumo": "Uma frase direta sobre o estado financeiro do mês. Tom: consultor falando ao cliente, não robótico.",
  "alerta": "SOMENTE se saldo_real ou saldo_projetado for negativo, ou risco sério. Explique o motivo brevemente.",
  "saldo": "SOMENTE se saldo_real ≠ saldo_projetado. Explique a diferença e o que a causa.",
  "dependencia_creditos": "SOMENTE se dependencia_pct > 20%. Mencione o percentual e o impacto prático.",
  "pendencias_vencidas": "SOMENTE se houver itens em contas_vencidas. Liste por nome e valor.",
  "creditos_pendentes": "SOMENTE se houver créditos com status pendente. Mencione o que aguarda e os valores.",
  "concentracao": "SOMENTE se uma categoria representar mais de 35% das despesas. Mencione categoria e percentual.",
  "top_gastos": "SOMENTE se houver despesas. Liste os 3 maiores por nome e valor."
}

Regras de tom e formato:
- Direto e prático, como uma conversa — sem jargão excessivo
- Nunca alarmista, mesmo para situações negativas
- Valores em R$ X.XXX,XX (ex: R$ 1.500,00)
- Percentuais com uma casa decimal (ex: 42,3%)
- Máximo 2 frases por chave (top_gastos pode listar os 3 itens separados por ponto)
- Retorne APENAS o JSON puro, sem markdown, sem texto adicional`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const conteudo = message.content[0].text.trim()

  try {
    return JSON.parse(conteudo)
  } catch {
    const match = conteudo.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('IA não retornou JSON válido na análise')
    return JSON.parse(match[0])
  }
}
