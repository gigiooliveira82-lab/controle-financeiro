import { useState, useEffect, useRef } from 'react'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { BlocoTipo, useIsMobile } from '../components/Dashboard'
import LancamentoTexto from '../components/LancamentoTexto'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { IconDespesas } from '../components/Icones'

const TIPOS = ['despesa_fixa', 'despesa_variavel']

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 'calc(75px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--surface-raised)', color: 'var(--primary)',
      border: '1px solid var(--primary)',
      padding: '10px 22px', borderRadius: 10,
      fontSize: 14, fontWeight: 600,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap',
    }}>
      ✓ {msg}
    </div>
  )
}

export default function PaginaLancamentos({
  transacoes, usuarioId, mesSelecionado, cartoes = [],
  mostrarLancamento, onNovaTransacao, onRemoveu, onAtualizou, carregando,
}) {
  const [expandido, setExpandido] = useState(false)
  const [busca, setBusca]         = useState('')
  const [toast, setToast]         = useState(null)
  const toastTimer                = useRef(null)
  const isMobile = useIsMobile()

  const { removendo, handleRemover, handleAtualizar, handleDuplicar, handleCancelarGrupoParcelas } =
    useTransacaoHandlers({ usuarioId, mesSelecionado, transacoes, onRemoveu, onAtualizou, onNova: onNovaTransacao })

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function showToast(msg) {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  if (carregando) {
    return (
      <div style={l.placeholder}>
        <p style={l.placeholderTexto}>Carregando despesas...</p>
      </div>
    )
  }

  const termoBusca = busca.trim().toLowerCase()

  const byTipo = (tipo) => transacoes
    .filter(t => {
      if (t.tipo !== tipo) return false
      if (!termoBusca) return true
      const descOk = (t.descricao || '').toLowerCase().includes(termoBusca)
      const catOk  = (t.categoria || '').toLowerCase().includes(termoBusca)
      return descOk || catOk
    })
    .sort((a, b) => {
      const d = (a.dia_pagamento || 0) - (b.dia_pagamento || 0)
      return d !== 0 ? d : (a.criado_em || '') < (b.criado_em || '') ? -1 : 1
    })

  function handleNovaComColapso(nova) {
    onNovaTransacao(nova)
    setExpandido(false)
  }

  const semDados      = transacoes.filter(t => TIPOS.includes(t.tipo)).length === 0
  const semResultados = !semDados && !!termoBusca && TIPOS.every(tipo => byTipo(tipo).length === 0)

  const cartoesById = {}
  cartoes.forEach(cartao => { cartoesById[cartao.id] = cartao })

  const lancamento = mostrarLancamento && (
    expandido ? (
      <LancamentoTexto
        usuarioId={usuarioId}
        titulo="Nova Despesa"
        onFechar={() => setExpandido(false)}
        onNovaTransacao={handleNovaComColapso}
        onAtualizouTransacao={onAtualizou}
        cartoes={cartoes}
        transacoes={transacoes}
        mesSelecionado={mesSelecionado}
      />
    ) : (
      <button onClick={() => setExpandido(true)} style={l.botaoNovo}>
        + Novo lançamento de despesa
      </button>
    )
  )

  const campoBusca = (
    <div style={l.buscaWrap}>
      <span style={l.buscaIcone} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        aria-label="Buscar por nome ou categoria"
        type="text"
        placeholder="Buscar por nome ou categoria..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={l.buscaInput}
      />
      {busca && (
        <button onClick={() => setBusca('')} style={l.buscaClear} aria-label="Limpar busca">✕</button>
      )}
    </div>
  )

  return (
    <div style={l.root}>
      <Toast msg={toast} />
      <CabecalhoPagina icone={<IconDespesas size={20} />} titulo="Despesas" subtitulo="Fixas, variáveis e parceladas — tudo num só lugar." />
      {lancamento}
      {!semDados && campoBusca}
      {semDados ? (
        <div style={l.placeholder}>
          <p style={{ ...l.placeholderTexto, fontWeight: 600, color: 'var(--text-pure)' }}>Nenhuma despesa neste mês.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Use o campo acima para adicionar o primeiro lançamento.</p>
        </div>
      ) : semResultados ? (
        <div style={l.placeholder}>
          <p style={{ ...l.placeholderTexto, fontWeight: 600, color: 'var(--text-pure)' }}>Nenhum resultado para "{termoBusca}"</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Tente outro termo ou{' '}
            <button onClick={() => setBusca('')} style={l.linkBtn}>limpar a busca</button>.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))', gap: 20, alignItems: 'start' }}>
          {TIPOS.map(tipo => (
            <BlocoTipo
              key={tipo}
              tipo={tipo}
              transacoes={byTipo(tipo)}
              acumulados={null}
              removendo={removendo}
              onRemover={handleRemover}
              onAtualizar={handleAtualizar}
              onDuplicar={handleDuplicar}
              onCancelarParcelas={handleCancelarGrupoParcelas}
              onMoverTipo={showToast}
              cartoesById={cartoesById}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const l = {
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
  buscaWrap: {
    position: 'relative',
    display: 'flex', alignItems: 'center',
  },
  buscaIcone: {
    position: 'absolute', left: 14,
    color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex',
  },
  buscaInput: {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 36px 11px 40px',
    borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--surface)', fontSize: 14, color: 'var(--text-pure)',
    outline: 'none', fontFamily: 'var(--font-body)',
  },
  buscaClear: {
    position: 'absolute', right: 12,
    background: 'none', border: 'none',
    color: 'var(--text-muted)', fontSize: 13,
    cursor: 'pointer', padding: '4px 6px',
  },
  linkBtn: {
    background: 'none', border: 'none',
    color: 'var(--primary)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', padding: 0,
  },
}
