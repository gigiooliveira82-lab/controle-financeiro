import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function responderPergunta(contexto, pergunta) {
  const prompt = `Você é um assistente financeiro pessoal, direto e empático.
Responda à pergunta abaixo com base EXCLUSIVAMENTE nos dados financeiros reais do usuário fornecidos.

Os números abaixo foram calculados pelo sistema a partir dos lançamentos reais — não são estimativas:

${JSON.stringify(contexto, null, 2)}

Pergunta: "${pergunta}"

Instruções:
- Use apenas os dados acima. Se o dado pedido não estiver aqui, diga claramente "não tenho esse dado registrado" — nunca invente ou estime valores que não foram fornecidos.
- Responda em português, de forma direta e prática (máximo 3 parágrafos curtos).
- Para previsões de longo prazo: comente o que os dados permitem inferir e seja claro sobre o que não é possível saber.
- Não recomende investimentos específicos (ações, fundos, cripto, produtos financeiros). Permitido: mostrar capacidade de poupança com base nos dados, citar referências gerais (ex: reserva de emergência = 6 meses de despesas). Sempre deixe claro que decisões de investimento requerem um profissional certificado.
- Esta é uma consulta pontual — responda a pergunta específica, sem repetir um relatório geral do mês.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  return message.content[0].text.trim()
}
