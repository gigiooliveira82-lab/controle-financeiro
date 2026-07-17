import { useState, useEffect } from 'react'
import { buscarAcumuladosAplicacao } from '../services/api'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { BlocoTipo } from '../components/Dashboard'
import LancamentoTexto from '../components/LancamentoTexto'

export default function PaginaAplicacoes({
  transacoes, usuarioId, mesSelecionado,
  mostrarLancamento, onNovaTransacao, onRemoveu, onAtualizou, carregando,
}) {
  const [expandido, setExpandido]     = useState(false)
  const [acumulados, setAcumulados]   = useState({})

  const { removendo, handleRemover, handleAtualizar, handleDuplicar, handleCancelarGrupoParcelas } =
    useTransacaoHandlers({ usuarioId, mesSelecionado, transacoes, onRemoveu, onAtualizou, onNova: onNovaTransacao })

  const aplicacaoKey = transacoes
    .filter(t => t.tipo === 'aplicacao')
    .map(t => `${t.id}:${t.valor}`)
    .sort()
    .join(',')

  useEffect(() => {
    if (!usuarioId) return
    buscarAcumuladosAplicacao(usuarioId).then(setAcumulados).catch(console.error)
  }, [usuarioId, aplicacaoKey])

  if (carregando) {
    return (
      <div style={a.placeholder}>
        <p style={a.placeholderTexto}>Carregando aplicações...</p>
      </div>
    )
  }

  const aplicacoes = transacoes
    .filter(t => t.tipo === 'aplicacao')
    .sort((a, b) => {
      const d = (a.dia_pagamento || 0) - (b.dia_pagamento || 0)
      return d !== 0 ? d : (a.criado_em || '') < (b.criado_em || '') ? -1 : 1
    })

  function handleNovaComColapso(nova) {
    onNovaTransacao(nova)
    setExpandido(false)
  }

  const lancamento = mostrarLancamento && (
    expandido ? (
      <LancamentoTexto
        usuarioId={usuarioId}
        onNovaTransacao={handleNovaComColapso}
        onAtualizouTransacao={onAtualizou}
      />
    ) : (
      <button onClick={() => setExpandido(true)} style={a.botaoNovo}>
        + Novo lançamento
      </button>
    )
  )

  return (
    <div style={a.root}>
      {lancamento}
      <BlocoTipo
        tipo="aplicacao"
        transacoes={aplicacoes}
        acumulados={acumulados}
        removendo={removendo}
        onRemover={handleRemover}
        onAtualizar={handleAtualizar}
        onDuplicar={handleDuplicar}
        onCancelarParcelas={handleCancelarGrupoParcelas}
      />
    </div>
  )
}

const a = {
  root: { display: 'flex', flexDirection: 'column', gap: 20 },
  placeholder:      { background: '#fff', borderRadius: 12, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  placeholderTexto: { margin: 0, color: '#64748b' },
  botaoNovo: {
    display: 'block', width: '100%', padding: '16px',
    borderRadius: 12, border: '2px dashed #BDD5CC',
    background: '#fff', color: 'var(--verde-profundo)',
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center', boxSizing: 'border-box',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
}
