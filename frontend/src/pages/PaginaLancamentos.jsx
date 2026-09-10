import { useState, useEffect, useRef } from 'react'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { BlocoTipo, ItemLinha, useIsMobile, soma, fmtSaldo } from '../components/Dashboard'
import LancamentoTexto from '../components/LancamentoTexto'
import CabecalhoPagina from '../components/CabecalhoPagina'
import {
  IconDespesas,
  IconTrocarTipo,
  IconBusca,
  IconColunas,
  IconConsolidado,
  IconPlus,
  IconFechar,
} from '../components/Icones'

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
  const [expandido, setExpandido]             = useState(false)
  const [modoConsolidado, setModoConsolidado] = useState(false)
  const [busca, setBusca]                     = useState('')
  const [toast, setToast]                     = useState(null)
  const toastTimer                            = useRef(null)
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

  const despesasConsolidadas = transacoes
    .filter(t => {
      if (!TIPOS.includes(t.tipo)) return false
      if (!termoBusca) return true
      const descOk = (t.descricao || '').toLowerCase().includes(termoBusca)
      const catOk  = (t.categoria || '').toLowerCase().includes(termoBusca)
      return descOk || catOk
    })
    .sort((a, b) => {
      const d = (a.dia_pagamento || 0) - (b.dia_pagamento || 0)
      return d !== 0 ? d : (a.criado_em || '') < (b.criado_em || '') ? -1 : 1
    })

  const totalConsolidado = soma(despesasConsolidadas)
  const totalFixas = soma(despesasConsolidadas.filter(t => t.tipo === 'despesa_fixa'))
  const totalVariaveis = soma(despesasConsolidadas.filter(t => t.tipo === 'despesa_variavel'))

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

  return (
    <div style={{ ...l.root, gap: isMobile ? 12 : 18 }}>
      <Toast msg={toast} />
      <CabecalhoPagina icone={<IconDespesas size={20} />} titulo="Despesas" subtitulo="Fixas, variáveis e parceladas — tudo num só lugar." />
      
      {isMobile ? (
        lancamento
      ) : (
        expandido && mostrarLancamento && (
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
        )
      )}

      {/* Toolbar Unificada: Busca + Alternador de Visualização (+ CTA no Desktop) */}
      <div style={{ ...l.toolbar, ...(isMobile ? l.toolbarMobile : {}) }}>
        {!semDados && (
          <div style={{ ...l.buscaWrap, ...(isMobile ? { width: '100%', flex: '1 1 auto' } : {}) }}>
            <span style={l.buscaIcone} aria-hidden="true">
              <IconBusca size={15} />
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
              <button onClick={() => setBusca('')} style={l.buscaClear} aria-label="Limpar busca">
                <IconFechar size={12} />
              </button>
            )}
          </div>
        )}

        <div style={{ ...l.toolbarAcoes, ...(isMobile ? l.toolbarAcoesMobile : {}) }}>
          {/* Segmented Control de Visualização */}
          <div style={{ ...l.segmentedGroup, ...(isMobile ? l.segmentedGroupMobile : {}) }} role="group" aria-label="Modo de visualização">
            <button
              type="button"
              onClick={() => setModoConsolidado(false)}
              style={{
                ...l.segmentBtn,
                ...(isMobile ? { flex: 1, justifyContent: 'center' } : {}),
                ...(!modoConsolidado ? l.segmentBtnAtivo : {}),
              }}
              title="Visualizar em duas colunas (Fixas e Variáveis)"
            >
              <IconColunas size={14} />
              <span>Colunas</span>
            </button>
            <button
              type="button"
              onClick={() => setModoConsolidado(true)}
              style={{
                ...l.segmentBtn,
                ...(isMobile ? { flex: 1, justifyContent: 'center' } : {}),
                ...(modoConsolidado ? l.segmentBtnAtivo : {}),
              }}
              title="Visualizar todas as despesas consolidadas em lista única"
            >
              <IconConsolidado size={14} />
              <span>Consolidado</span>
            </button>
          </div>

          {/* Botão Primário CTA (Apenas Desktop quando não expandido) */}
          {!isMobile && !expandido && mostrarLancamento && (
            <button
              type="button"
              onClick={() => setExpandido(true)}
              style={l.botaoNovoCTA}
              title="Adicionar nova despesa"
            >
              <IconPlus size={15} strokeWidth={2.5} />
              <span>Nova Despesa</span>
            </button>
          )}
        </div>
      </div>

      {semDados ? (
        <div style={l.placeholder}>
          <p style={{ ...l.placeholderTexto, fontWeight: 600, color: 'var(--text-pure)' }}>Nenhuma despesa neste mês.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Use o botão "Nova Despesa" acima para adicionar o primeiro lançamento.</p>
        </div>
      ) : semResultados ? (
        <div style={l.placeholder}>
          <p style={{ ...l.placeholderTexto, fontWeight: 600, color: 'var(--text-pure)' }}>Nenhum resultado para "{termoBusca}"</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Tente outro termo ou{' '}
            <button onClick={() => setBusca('')} style={l.linkBtn}>limpar a busca</button>.
          </p>
        </div>
      ) : modoConsolidado ? (
        <div style={l.consolidadoCard}>
          <div style={l.consolidadoHeader}>
            <div>
              <span style={l.consolidadoTitulo}>Todas as Despesas (Consolidado)</span>
              <div style={l.consolidadoSubinfo}>
                <span>Fixas: <strong style={{ color: '#A78BFA' }}>{fmtSaldo(totalFixas)}</strong></span>
                <span style={l.dotSep}>•</span>
                <span>Variáveis: <strong style={{ color: '#FC7C78' }}>{fmtSaldo(totalVariaveis)}</strong></span>
                <span style={l.dotSep}>•</span>
                <span>{despesasConsolidadas.length} {despesasConsolidadas.length === 1 ? 'lançamento' : 'lançamentos'}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={l.consolidadoTotalLabel}>TOTAL CONSOLIDADO</span>
              <span style={l.consolidadoTotalValor}>{fmtSaldo(totalConsolidado)}</span>
            </div>
          </div>

          <div style={l.consolidadoLista}>
            {despesasConsolidadas.length === 0 ? (
              <p style={l.placeholderTexto}>Nenhum registro para este mês.</p>
            ) : (
              despesasConsolidadas.map(t => (
                <ItemLinha
                  key={t.id}
                  transacao={t}
                  cor={t.tipo === 'despesa_fixa' ? '#A78BFA' : '#FC7C78'}
                  mostrarStatus
                  mostrarRecorrente
                  mostrarBadgeTipo
                  removendo={removendo === t.id}
                  onRemover={() => handleRemover(t.id)}
                  onAtualizar={campos => handleAtualizar(t.id, campos)}
                  onDuplicar={() => handleDuplicar(t.id)}
                  onCancelarParcelas={handleCancelarGrupoParcelas}
                  onMoverTipo={showToast}
                  cartoesById={cartoesById}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))', gap: isMobile ? 12 : 20, alignItems: 'start' }}>
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
  root: { display: 'flex', flexDirection: 'column', gap: 18 },
  botaoNovo: {
    display: 'block',
    width: '100%',
    padding: '16px',
    borderRadius: 12,
    border: '1.5px dashed var(--border)',
    background: 'var(--surface)',
    color: 'var(--primary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-headline)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  toolbarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  toolbarAcoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  toolbarAcoesMobile: {
    width: '100%',
    justifyContent: 'stretch',
  },
  segmentedGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentedGroupMobile: {
    width: '100%',
    display: 'flex',
    boxSizing: 'border-box',
  },
  segmentBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 7,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'var(--font-body)',
  },
  segmentBtnAtivo: {
    background: 'var(--surface-raised)',
    color: 'var(--primary)',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  botaoNovoCTA: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'var(--font-headline)',
    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)',
  },
  buscaWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 260px',
    minWidth: 200,
  },
  buscaIcone: {
    position: 'absolute',
    left: 13,
    color: 'var(--text-muted)',
    pointerEvents: 'none',
    display: 'flex',
  },
  buscaInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 34px 9px 38px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    fontSize: 13.5,
    color: 'var(--text-pure)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s ease',
  },
  buscaClear: {
    position: 'absolute',
    right: 10,
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 12,
    cursor: 'pointer',
    padding: '4px 6px',
  },
  placeholder: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '48px 24px',
    textAlign: 'center',
  },
  placeholderTexto: { margin: 0, color: 'var(--text-muted)' },
  consolidadoCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    boxShadow: 'var(--card-shadow)',
  },
  consolidadoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  consolidadoTitulo: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--primary)',
  },
  consolidadoSubinfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    fontSize: 12,
    color: 'var(--text-muted)',
    flexWrap: 'wrap',
  },
  dotSep: {
    color: 'var(--text-dim)',
  },
  consolidadoTotalLabel: {
    display: 'block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
  },
  consolidadoTotalValor: {
    fontSize: 18,
    fontWeight: 800,
    color: 'var(--text-pure)',
  },
  consolidadoLista: {
    display: 'flex',
    flexDirection: 'column',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
}


