const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export async function lancarTexto(texto, usuarioId) {
  const res = await fetch(`${BASE_URL}/transacoes/lancar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, usuario_id: usuarioId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao lançar transação')
  return json
}

export async function buscarTransacoes(usuarioId, mes) {
  const params = mes ? `?mes=${mes}` : ''
  const res = await fetch(`${BASE_URL}/transacoes/${usuarioId}${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao buscar transações')
  return json.transacoes
}

export async function gerarAnaliseMes(usuarioId, mesReferencia) {
  const res = await fetch(`${BASE_URL}/transacoes/analise-mes/${usuarioId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mes_referencia: mesReferencia }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao gerar análise')
  return json.analise
}

export async function buscarAcumuladosAplicacao(usuarioId) {
  const res = await fetch(`${BASE_URL}/transacoes/acumulados-aplicacao/${usuarioId}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao buscar acumulados')
  return json.acumulados
}

export async function gerarRecorrentes(usuarioId, mesReferencia) {
  const res = await fetch(`${BASE_URL}/transacoes/gerar-recorrentes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_id: usuarioId, mes_referencia: mesReferencia }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao gerar recorrentes')
  return json.geradas
}

export async function atualizarTransacao(id, usuarioId, campos) {
  const res = await fetch(`${BASE_URL}/transacoes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_id: usuarioId, ...campos }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao atualizar transação')
  return json.transacao
}

export async function duplicarTransacao(transacaoId, usuarioId) {
  const res = await fetch(`${BASE_URL}/transacoes/duplicar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transacao_id: transacaoId, usuario_id: usuarioId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao duplicar')
  return json.transacao
}

export async function perguntarSobreFinancas(usuarioId, pergunta) {
  const res = await fetch(`${BASE_URL}/transacoes/pergunta/${usuarioId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pergunta }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao processar pergunta')
  return json.resposta
}

export async function cancelarParcelasGrupo(grupoParcela_id, usuarioId) {
  const res = await fetch(`${BASE_URL}/transacoes/parcelas/grupo/${grupoParcela_id}/${usuarioId}`, {
    method: 'DELETE',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao cancelar parcelas')
  return json
}

export async function removerTransacao(id, usuarioId) {
  const res = await fetch(`${BASE_URL}/transacoes/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_id: usuarioId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.erro || 'Erro ao remover transação')
  return json
}
