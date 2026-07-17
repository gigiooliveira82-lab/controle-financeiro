import { useState, useEffect, useRef } from 'react'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { BlocoTipo, useIsMobile } from '../components/Dashboard'
import LancamentoTexto from '../components/LancamentoTexto'

const TIPOS = ['despesa_fixa', 'despesa_variavel']

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#1F5D45', color: '#F5F0E4',
      padding: '10px 22px', borderRadius: 10,
      fontSize: 14, fontWeight: 600,
      boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
      zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap',
    }}>
      ✓ {msg}
    </div>
  )
}

export default function PaginaLancamentos({
  transacoes, usuarioId, mesSelecionado,
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
        <p style={l.placeholderTexto}>Carregando lançamentos...</p>
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

  const lancamento = mostrarLancamento && (
    expandido ? (
      <LancamentoTexto
        usuarioId={usuarioId}
        onNovaTransacao={handleNovaComColapso}
        onAtualizouTransacao={onAtualizou}
      />
    ) : (
      <button onClick={() => setExpandido(true)} style={l.botaoNovo}>
        + Novo lançamento
      </button>
    )
  )

  const campoBusca = (
    <div style={l.buscaWrap}>
      <span style={l.buscaIcone}>⌕</span>
      <input
        type="text"
        placeholder="Buscar por nome ou categoria"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={l.buscaInput}
      />
      {busca && (
        <button onClick={() => setBusca('')} style={l.buscaClear}>✕</button>
      )}
    </div>
  )

  return (
    <div style={l.root}>
      <Toast msg={toast} />
      {lancamento}
      {!semDados && campoBusca}
      {semDados ? (
        <div style={l.placeholder}>
          <p style={{ ...l.placeholderTexto, fontWeight: 600, color: '#334155' }}>Nenhuma despesa neste mês.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Use o campo acima para adicionar o primeiro lançamento.</p>
        </div>
      ) : semResultados ? (
        <div style={l.placeholder}>
          <p style={{ ...l.placeholderTexto, fontWeight: 600, color: '#334155' }}>Nenhum resultado para "{termoBusca}"</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Tente outro termo ou{' '}
            <button onClick={() => setBusca('')} style={l.linkBtn}>limpar a busca</button>.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16, alignItems: 'start' }}>
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

const l = {
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
  buscaWrap: {
    position: 'relative',
    display: 'flex', alignItems: 'center',
  },
  buscaIcone: {
    position: 'absolute', left: 12, fontSize: 18,
    color: '#94a3b8', pointerEvents: 'none', lineHeight: 1,
  },
  buscaInput: {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 36px 11px 36px',
    borderRadius: 10, border: '1.5px solid #D1C9B8',
    background: '#fff', fontSize: 14, color: '#1e293b',
    outline: 'none',
  },
  buscaClear: {
    position: 'absolute', right: 10,
    background: 'none', border: 'none',
    color: '#94a3b8', fontSize: 13,
    cursor: 'pointer', padding: '4px 6px',
  },
  linkBtn: {
    background: 'none', border: 'none',
    color: 'var(--verde-profundo)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', padding: 0,
  },
}
