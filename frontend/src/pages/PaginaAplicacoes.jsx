import { useState, useEffect } from 'react'
import { buscarAcumuladosAplicacao } from '../services/api'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { BlocoTipo } from '../components/Dashboard'
import LancamentoTexto from '../components/LancamentoTexto'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { IconAplicacoes } from '../components/Icones'

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

  return (
    <div style={a.root}>
      <CabecalhoPagina icone={<IconAplicacoes size={20} />} titulo="Aplicações & Patrimônio" subtitulo="O que você guardou e investiu ao longo do tempo." />
      {mostrarLancamento && (
        expandido ? (
          <LancamentoTexto
            usuarioId={usuarioId}
            titulo="Novo Aporte ou Aplicação"
            onFechar={() => setExpandido(false)}
            onNovaTransacao={handleNovaComColapso}
            onAtualizouTransacao={onAtualizou}
          />
        ) : (
          <button onClick={() => setExpandido(true)} style={a.botaoNovo}>
            + Novo aporte ou aplicação
          </button>
        )
      )}
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
