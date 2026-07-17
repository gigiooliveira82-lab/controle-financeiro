import { useState } from 'react'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { BlocoTipo, useIsMobile } from '../components/Dashboard'
import LancamentoTexto from '../components/LancamentoTexto'

export default function PaginaReceitas({
  transacoes, usuarioId, mesSelecionado,
  mostrarLancamento, onNovaTransacao, onRemoveu, onAtualizou, carregando,
}) {
  const [expandido, setExpandido] = useState(false)
  const isMobile = useIsMobile()

  const { removendo, handleRemover, handleAtualizar, handleDuplicar, handleCancelarGrupoParcelas } =
    useTransacaoHandlers({ usuarioId, mesSelecionado, transacoes, onRemoveu, onAtualizou, onNova: onNovaTransacao })

  if (carregando) {
    return (
      <div style={r.placeholder}>
        <p style={r.placeholderTexto}>Carregando receitas...</p>
      </div>
    )
  }

  const byTipo = (tipo) => transacoes
    .filter(t => t.tipo === tipo)
    .sort((a, b) => {
      const d = (a.dia_pagamento || 0) - (b.dia_pagamento || 0)
      return d !== 0 ? d : (a.criado_em || '') < (b.criado_em || '') ? -1 : 1
    })

  function handleNovaComColapso(nova) {
    onNovaTransacao(nova)
    setExpandido(false)
  }

  const semDados = transacoes.filter(t => t.tipo === 'credito').length === 0

  const lancamento = mostrarLancamento && (
    expandido ? (
      <LancamentoTexto
        usuarioId={usuarioId}
        onNovaTransacao={handleNovaComColapso}
        onAtualizouTransacao={onAtualizou}
      />
    ) : (
      <button onClick={() => setExpandido(true)} style={r.botaoNovo}>
        + Novo lançamento
      </button>
    )
  )

  return (
    <div style={r.root}>
      {lancamento}
      {semDados ? (
        <div style={r.placeholder}>
          <p style={{ ...r.placeholderTexto, fontWeight: 600, color: '#334155' }}>Nenhuma receita neste mês.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Use o campo acima para registrar salários, rendimentos, etc.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
          <BlocoTipo
            tipo="credito"
            transacoes={byTipo('credito')}
            acumulados={null}
            removendo={removendo}
            onRemover={handleRemover}
            onAtualizar={handleAtualizar}
            onDuplicar={handleDuplicar}
            onCancelarParcelas={handleCancelarGrupoParcelas}
          />
        </div>
      )}
    </div>
  )
}

const r = {
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
