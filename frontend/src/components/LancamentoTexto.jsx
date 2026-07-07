import { useState } from 'react'
import { lancarTexto, atualizarTransacao } from '../services/api'

export default function LancamentoTexto({ usuarioId, onNovaTransacao, onAtualizouTransacao }) {
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [transacaoCriada, setTransacaoCriada] = useState(null)
  const [perguntaRecorrente, setPerguntaRecorrente] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!texto.trim()) return

    setCarregando(true)
    setErro('')
    setFeedback(null)
    setPerguntaRecorrente(false)
    setTransacaoCriada(null)

    try {
      const resultado = await lancarTexto(texto.trim(), usuarioId)
      setFeedback({
        ...resultado.interpretado,
        parcelado:    resultado.parcelado    || false,
        total_geradas: resultado.total_geradas || null,
      })
      setTransacaoCriada(resultado.transacao)
      setTexto('')
      onNovaTransacao(resultado.transacao)

      if (resultado.interpretado.tipo === 'despesa_fixa' && !resultado.interpretado.recorrente && !resultado.parcelado) {
        setPerguntaRecorrente(true)
      }
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleTornarRecorrente() {
    if (!transacaoCriada) return
    try {
      const atualizada = await atualizarTransacao(transacaoCriada.id, usuarioId, { recorrente: true })
      onAtualizouTransacao(transacaoCriada.id, atualizada)
      setPerguntaRecorrente(false)
      setFeedback((prev) => ({ ...prev, recorrente: true }))
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div style={estilos.container}>
      <h2 style={estilos.titulo}>Novo lançamento</h2>
      <p style={estilos.dica}>
        Digite em linguagem natural. Ex: <em>"gastei 80 no mercado hoje"</em> ou <em>"recebi 3500 de salário"</em>
      </p>

      <form onSubmit={handleSubmit} style={estilos.form}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="O que aconteceu? Ex: paguei 150 de conta de luz, vence dia 10..."
          style={estilos.textarea}
          rows={3}
          disabled={carregando}
        />
        <button type="submit" style={estilos.botao} disabled={carregando || !texto.trim()}>
          {carregando ? '⏳ Analisando com IA...' : '✦ Lançar'}
        </button>
      </form>

      {erro && <div style={estilos.erroBox}>{erro}</div>}

      {feedback && <FeedbackIA dados={feedback} />}

      {perguntaRecorrente && (
        <div style={estilos.perguntaBox}>
          <p style={estilos.perguntaTexto}>
            Esta é uma despesa fixa. Deseja que ela se repita automaticamente todo mês?
          </p>
          <div style={estilos.perguntaBotoes}>
            <button onClick={handleTornarRecorrente} style={estilos.botaoSim}>
              Sim, repetir todo mês
            </button>
            <button onClick={() => setPerguntaRecorrente(false)} style={estilos.botaoNao}>
              Não, apenas este mês
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FeedbackIA({ dados }) {
  const tipoLabel = {
    despesa_fixa: 'Despesa Fixa',
    despesa_variavel: 'Despesa Variável',
    credito: 'Crédito',
    aplicacao: 'Aplicação',
  }

  const tipoColor = {
    despesa_fixa: '#7c3aed',
    despesa_variavel: '#dc2626',
    credito: '#16a34a',
    aplicacao: '#2563eb',
  }

  return (
    <div style={estilos.feedbackBox}>
      <p style={estilos.feedbackTitulo}>✓ Lançado com sucesso</p>
      <div style={estilos.chips}>
        <Chip label={tipoLabel[dados.tipo] || dados.tipo} color={tipoColor[dados.tipo]} />
        <Chip label={dados.categoria} color="#64748b" />
        <Chip label={dados.status === 'pago' ? 'Pago' : 'Pendente'} color={dados.status === 'pago' ? '#16a34a' : '#d97706'} />
        {dados.recorrente && <Chip label="Recorrente" color="#9333ea" />}
        {dados.parcelado && <Chip label={`${dados.total_geradas}x criadas`} color="#6366f1" />}
      </div>
      <div style={estilos.feedbackDetalhes}>
        <span style={estilos.feedbackDesc}>{dados.descricao}</span>
        <span style={estilos.feedbackValor}>R$ {Number(dados.valor).toFixed(2).replace('.', ',')}</span>
      </div>
      <p style={estilos.feedbackDia}>Dia {dados.dia_pagamento} · {formatarMes(dados.mes_referencia)}</p>
    </div>
  )
}

function Chip({ label, color }) {
  return (
    <span style={{ ...estilos.chip, background: color }}>
      {label}
    </span>
  )
}

function formatarMes(mesRef) {
  if (!mesRef) return ''
  const [ano, mes] = mesRef.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[parseInt(mes) - 1]}/${ano}`
}

const estilos = {
  container: {
    background: '#fff',
    borderRadius: 12,
    padding: '24px 28px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
    marginBottom: 24,
  },
  titulo: { margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  dica: { margin: '0 0 16px', color: '#666', fontSize: 13 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  textarea: {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 15,
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
  },
  botao: {
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-end',
    minWidth: 160,
  },
  erroBox: {
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 8,
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: 14,
    border: '1px solid #fecaca',
  },
  feedbackBox: {
    marginTop: 14,
    padding: '14px 16px',
    borderRadius: 8,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
  },
  feedbackTitulo: { margin: '0 0 8px', fontWeight: 600, color: '#16a34a', fontSize: 14 },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  chip: {
    padding: '2px 10px',
    borderRadius: 20,
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
  },
  feedbackDetalhes: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  feedbackDesc: { fontSize: 15, fontWeight: 600, color: '#1a1a2e' },
  feedbackValor: { fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  feedbackDia: { margin: '4px 0 0', fontSize: 13, color: '#666' },
  perguntaBox: {
    marginTop: 10,
    padding: '14px 16px',
    borderRadius: 8,
    background: '#faf5ff',
    border: '1px solid #e9d5ff',
  },
  perguntaTexto: { margin: '0 0 12px', fontSize: 14, color: '#6b21a8', fontWeight: 500 },
  perguntaBotoes: { display: 'flex', gap: 8 },
  botaoSim: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    background: '#7c3aed',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  botaoNao: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #ddd',
    background: '#fff',
    color: '#666',
    fontSize: 13,
    cursor: 'pointer',
  },
}
