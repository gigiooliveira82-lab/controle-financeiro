import { useState } from 'react'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { BlocoTipo } from '../components/Dashboard'
import LancamentoTexto from '../components/LancamentoTexto'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { IconReceitas } from '../components/Icones'

export default function PaginaReceitas({
  transacoes, usuarioId, mesSelecionado,
  mostrarLancamento, onNovaTransacao, onRemoveu, onAtualizou, carregando,
}) {
  const [expandido, setExpandido] = useState(false)

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
        titulo="Nova Receita"
        onFechar={() => setExpandido(false)}
        onNovaTransacao={handleNovaComColapso}
        onAtualizouTransacao={onAtualizou}
      />
    ) : (
      <button onClick={() => setExpandido(true)} style={r.botaoNovo}>
        + Novo lançamento de receita
      </button>
    )
  )

  return (
    <div style={r.root}>
      <CabecalhoPagina icone={<IconReceitas size={20} />} titulo="Receitas" subtitulo="Salários, créditos e outras entradas do mês." />
      {lancamento}
      {semDados ? (
        <div style={r.placeholder}>
          <p style={{ ...r.placeholderTexto, fontWeight: 600, color: 'var(--text-pure)' }}>Nenhuma receita neste mês.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Use o campo acima para registrar salários, rendimentos, etc.</p>
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
  placeholder: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '48px 24px',
    textAlign: 'center',
  },
  placeholderTexto: { margin: 0, color: 'var(--text-muted)' },
  botaoNovo: {
    display: 'block', width: '100%', padding: '16px',
    borderRadius: 12, border: '1.5px dashed var(--border)',
    background: 'var(--surface)', color: 'var(--primary)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center', boxSizing: 'border-box',
    fontFamily: 'var(--font-headline)',
  },
}
