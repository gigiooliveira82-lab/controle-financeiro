import rateLimit from 'express-rate-limit'

/**
 * Cria manipulador customizado de resposta para quando o limite de taxa for atingido.
 * Retorna status 429 com mensagem amigável e código de erro estruturado.
 */
function criarHandlerLimite(tempoMinutos, tipoServico) {
  return (req, res) => {
    return res.status(429).json({
      erro: `Limite de requisições de ${tipoServico} atingido. Por favor, aguarde alguns minutos antes de tentar novamente.`,
      detalhe: `Janela de proteção de ${tempoMinutos} minuto(s) atingida.`,
      codigo: 'RATE_LIMIT_EXCEEDED',
    })
  }
}

/**
 * 1. Limite para interpretação de lançamentos via IA (Texto/Voz)
 * Rota: POST /transacoes/lancar
 * Limite: 30 requisições a cada 10 minutos por usuário autenticado
 */
export const rateLimitLancamentosIA = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 30,
  keyGenerator: (req) => req.usuarioId || req.ip,
  handler: criarHandlerLimite(10, 'lançamentos com IA'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
})

/**
 * 2. Limite para perguntas ao Assistente Financeiro IA
 * Rota: POST /transacoes/pergunta/:usuario_id
 * Limite: 15 perguntas a cada 10 minutos por usuário autenticado
 */
export const rateLimitPerguntasIA = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 15,
  keyGenerator: (req) => req.usuarioId || req.ip,
  handler: criarHandlerLimite(10, 'assistente financeiro IA'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
})

/**
 * 3. Limite para Análise Completa do Mês via IA
 * Rota: POST /transacoes/analise-mes/:usuario_id
 * Limite: 10 análises a cada 1 hora por usuário autenticado
 */
export const rateLimitAnaliseMesIA = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  keyGenerator: (req) => req.usuarioId || req.ip,
  handler: criarHandlerLimite(60, 'análise do mês com IA'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
})
