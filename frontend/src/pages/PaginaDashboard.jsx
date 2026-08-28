import { useState, useEffect } from 'react'
import { buscarComparativoMensal } from '../services/api'
import LancamentoTexto from '../components/LancamentoTexto'
import {
  CardHeroProjetado, CardSaldo, CardNeutro, CardComparativo,
  BarraCategoria, BlocoAnalise, BlocoPerguntas,
  soma, fmtSaldo, labelMes, mesAnteriorISO, COR_CAT, useIsMobile,
} from '../components/Dashboard'
import { fmtNum } from '../utils/fmt'

export default function PaginaDashboard({
  transacoes, usuarioId, mesSelecionado,
  mostrarLancamento, onNovaTransacao, onAtualizou, carregando,
}) {
  const [expandido, setExpandido]     = useState(false)
  const [comparativo, setComparativo] = useState(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!usuarioId) return
    buscarComparativoMensal(usuarioId, mesSelecionado)
      .then(setComparativo)
      .catch(() => setComparativo(null))
  }, [usuarioId, mesSelecionado])

  if (carregando) {
    return (
      <div style={p.placeholder}>
        <p style={p.placeholderTexto}>Carregando lançamentos...</p>
      </div>
    )
  }

  const byTipo = (tipo) => transacoes
    .filter(t => t.tipo === tipo)
    .sort((a, b) => {
      const d = (a.dia_pagamento || 0) - (b.dia_pagamento || 0)
      return d !== 0 ? d : (a.criado_em || '') < (b.criado_em || '') ? -1 : 1
    })

  const pagos   = (arr) => arr.filter(t => t.status === 'pago')
  const pendens = (arr) => arr.filter(t => t.status === 'pendente')

  const cPago = soma(pagos(byTipo('credito')))
  const cPend = soma(pendens(byTipo('credito')))
  const fPago = soma(pagos(byTipo('despesa_fixa')))
  const fPend = soma(pendens(byTipo('despesa_fixa')))
  const vPago = soma(pagos(byTipo('despesa_variavel')))
  const vPend = soma(pendens(byTipo('despesa_variavel')))

  const saldoReal      = cPago - fPago - vPago
  const saldoProjetado = (cPago + cPend) - (fPago + fPend + vPago + vPend)
  const totalAPagar    = fPend + vPend
  const qtdPendente    = transacoes.filter(
    t => (t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel') && t.status === 'pendente'
  ).length
  const saldosIdenticos = Math.abs(saldoReal - saldoProjetado) < 0.005

  const despesas     = transacoes.filter(t => t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel')
  const totalDespesa = soma(despesas)
  const gastosCat    = {}
  despesas.forEach(t => {
    const c = t.categoria || 'outros'
    gastosCat[c] = (gastosCat[c] || 0) + Number(t.valor)
  })
  const catOrdenadas = Object.entries(gastosCat).sort((a, b) => b[1] - a[1])

  const mesAnt   = mesAnteriorISO(mesSelecionado)
  const semDados = transacoes.length === 0

  // Próximos vencimentos — só para o mês real atual
  const hoje       = new Date()
  const diaHoje    = hoje.getDate()
  const mesHojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const proximosVencimentos = transacoes
    .filter(t =>
      t.status === 'pendente' &&
      (t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel') &&
      t.mes_referencia === mesHojeISO
    )
    .sort((a, b) => (a.dia_pagamento || 0) - (b.dia_pagamento || 0))
    .slice(0, 5)

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
      <button onClick={() => setExpandido(true)} style={p.botaoNovo}>
        + Novo lançamento
      </button>
    )
  )

  const mesEmAndamento = mesSelecionado === mesHojeISO

  const cardsSaldo = (
    <div style={p.cardsSaldoWrap}>
      <CardHeroProjetado
        valor={saldoProjetado}
        saldoReal={saldoReal}
        totalAPagar={totalAPagar}
        qtdPendente={qtdPendente}
        tudoEmDia={saldosIdenticos}
      />
      <div style={p.cardRowSecundario}>
        {!saldosIdenticos && (
          <>
            <CardSaldo label="Saldo Real" valor={saldoReal} sub="créditos recebidos − despesas pagas" />
            <CardNeutro
              label="A Pagar"
              valor={totalAPagar}
              sub={`${qtdPendente} conta${qtdPendente !== 1 ? 's' : ''} pendente${qtdPendente !== 1 ? 's' : ''}`}
            />
          </>
        )}
        <CardComparativo
          percentualVariacao={comparativo?.percentualVariacao ?? null}
          despesaMesAtual={comparativo?.despesaMesAtual ?? 0}
          despesaMesAnterior={comparativo?.despesaMesAnterior ?? null}
          mesAtualISO={mesSelecionado}
          mesAnteriorISO={mesAnt}
          parcial={mesEmAndamento}
        />
      </div>
    </div>
  )

  const concentracao = catOrdenadas.length > 0 && (
    <div style={p.secao}>
      <p style={p.secaoTitulo}>Concentração de gastos</p>
      <div style={p.barrasWrap}>
        {catOrdenadas.map(([cat, val]) => (
          <BarraCategoria
            key={cat}
            categoria={cat}
            valor={val}
            total={totalDespesa}
            cor={COR_CAT[cat] || '#94a3b8'}
          />
        ))}
      </div>
    </div>
  )

  const colDir = (
    <div style={p.colDir}>
      <BlocoAnalise usuarioId={usuarioId} mesSelecionado={mesSelecionado} />
      <BlocoPerguntas usuarioId={usuarioId} />
    </div>
  )

  if (isMobile) {
    return (
      <div style={p.root}>
        {lancamento}
        {!semDados && cardsSaldo}
        {mesEmAndamento && proximosVencimentos.length > 0 && (
          <ProximosVencimentos items={proximosVencimentos} diaHoje={diaHoje} />
        )}
        {concentracao}
        {colDir}
      </div>
    )
  }

  return (
    <div style={p.root}>
      {lancamento}
      <div style={p.grid}>
        <div style={p.colEsq}>
          {!semDados && cardsSaldo}
          {mesEmAndamento && proximosVencimentos.length > 0 && (
            <ProximosVencimentos items={proximosVencimentos} diaHoje={diaHoje} />
          )}
          {concentracao}
        </div>
        {colDir}
      </div>
    </div>
  )
}

function ProximosVencimentos({ items, diaHoje }) {
  return (
    <div style={p.proximoBloco}>
      <p style={p.proximoTitulo}>Próximos vencimentos</p>
      {items.map(t => {
        const vencida = t.dia_pagamento < diaHoje
        return (
          <div key={t.id} style={{ ...p.proximoLinha, ...(vencida ? { background: 'var(--status-vencida-bg)' } : {}) }}>
            <span style={p.proximoDia}>{t.dia_pagamento}</span>
            <span style={p.proximoDesc}>{t.descricao}</span>
            <span style={{
              ...p.proximoStatus,
              background: vencida ? 'var(--status-vencida-bg)' : 'var(--status-pendente-bg)',
              color:      vencida ? 'var(--status-vencida-fg)' : 'var(--status-pendente-fg)',
              ...(vencida ? { border: '1px solid var(--status-vencida-fg)', fontWeight: 700 } : {}),
            }}>
              {vencida ? '⚠ Vencida' : 'Pendente'}
            </span>
            <span style={p.proximoValor}>R$ {fmtNum(Math.abs(t.valor))}</span>
          </div>
        )
      })}
    </div>
  )
}

const p = {
  root: { display: 'flex', flexDirection: 'column', gap: 20 },
  placeholder:      { background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  placeholderTexto: { margin: 0, color: 'var(--text-muted)' },
  botaoNovo: {
    display: 'block', width: '100%', padding: '16px',
    borderRadius: 12, border: '2px dashed var(--border)',
    background: 'var(--surface)', color: 'var(--emerald)',
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center', boxSizing: 'border-box',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
  },
  cardsSaldoWrap:     { display: 'flex', flexDirection: 'column', gap: 12 },
  cardRowSecundario:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },

  // Próximos vencimentos
  proximoBloco:  { background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.24)' },
  proximoTitulo: { margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  proximoLinha: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 6, marginBottom: 4,
  },
  proximoDia: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    background: 'var(--surface)', borderRadius: 4, padding: '2px 6px',
    minWidth: 28, textAlign: 'center', flexShrink: 0,
  },
  proximoDesc: {
    flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  proximoStatus: {
    padding: '2px 8px', borderRadius: 20, border: 'none',
    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
  },
  proximoValor: { fontSize: 13, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', flexShrink: 0 },

  // Grid 2 colunas (desktop)
  grid:   { display: 'grid', gridTemplateColumns: '65fr 35fr', gap: 24, alignItems: 'start' },
  colEsq: { display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 },
  colDir: { display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 },
  secao:       { background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.24)' },
  secaoTitulo: { margin: '0 0 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  barrasWrap:  { display: 'flex', flexDirection: 'column', gap: 10 },
}
