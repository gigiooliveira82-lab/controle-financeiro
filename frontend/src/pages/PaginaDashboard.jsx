import { useState, useEffect } from 'react'
import { buscarComparativoMensal } from '../services/api'
import LancamentoTexto from '../components/LancamentoTexto'
import GuiaPrimeirosPassos from '../components/GuiaPrimeirosPassos'
import {
  CardBalancoMes,
  CardHistoricoMes,
  CardMetricaSecundaria,
  CardSaldoContas,
  BlocoProximosVencimentos,
  BlocoAnaliseIA,
  FloatingAIPromptBar,
  soma,
  useIsMobile,
} from '../components/Dashboard'

export default function PaginaDashboard({
  transacoes,
  cartoes = [],
  usuarioId,
  mesSelecionado,
  mostrarLancamento,
  onNovaTransacao,
  onAtualizou,
  carregando,
  onAbrirTour,
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
        <p style={p.placeholderTexto}>Carregando visão geral financeira...</p>
      </div>
    )
  }

  // Cálculos financeiros
  const creditos = transacoes.filter(t => t.tipo === 'credito')
  const despesas = transacoes.filter(t => t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel')

  const totalReceitas = soma(creditos)
  const totalDespesas = soma(despesas)
  const saldoBalanco  = totalReceitas - totalDespesas

  // Saldo Real / Projetado / A Pagar — mecanismo de alerta antecipado:
  // Real considera só o que já foi pago/recebido; Projetado inclui também
  // o que ainda está pendente no mês.
  const pagos      = (arr) => arr.filter(t => t.status === 'pago')
  const pendentes  = (arr) => arr.filter(t => t.status === 'pendente')
  const cPago      = soma(pagos(creditos))
  const cPend      = soma(pendentes(creditos))
  const dPago      = soma(pagos(despesas))
  const dPend      = soma(pendentes(despesas))
  const saldoReal      = cPago - dPago
  const saldoProjetado = (cPago + cPend) - (dPago + dPend)
  const totalAPagar     = dPend
  const qtdPendente     = pendentes(despesas).length

  // Categorias de gastos
  const gastosCat = {}
  despesas.forEach(t => {
    const c = t.categoria || 'outros'
    gastosCat[c] = (gastosCat[c] || 0) + Number(t.valor)
  })
  const catOrdenadas = Object.entries(gastosCat).sort((a, b) => b[1] - a[1])

  // Próximos vencimentos — só para o mês real atual
  const hoje       = new Date()
  const diaHoje    = hoje.getDate()
  const mesHojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const mesEmAndamento = mesSelecionado === mesHojeISO
  const proximosVencimentos = despesas
    .filter(t => t.status === 'pendente' && t.mes_referencia === mesHojeISO)
    .sort((a, b) => (a.dia_pagamento || 0) - (b.dia_pagamento || 0))
    .slice(0, 5)

  function handleNovaComColapso(nova) {
    onNovaTransacao(nova)
    setExpandido(false)
  }

  return (
    <div style={p.root}>
      {/* Guia de Primeiros Passos para Novos Usuários */}
      <GuiaPrimeirosPassos
        usuarioId={usuarioId}
        transacoes={transacoes}
        cartoes={cartoes}
        onAbrirLancamento={() => setExpandido(true)}
        onAbrirTour={onAbrirTour}
      />

      {/* Botão / Área de Nova Entrada no Dashboard */}
      {mostrarLancamento && (
        <div style={p.novaEntradaSection}>
          {expandido ? (
            <div style={p.novoLancamentoWrap}>
              <div style={p.novoLancamentoHeader}>
                <span style={p.novoLancamentoTitulo}>Nova Entrada Financeira</span>
                <button onClick={() => setExpandido(false)} style={p.fecharBtn}>✕ Fechar</button>
              </div>
              <LancamentoTexto
                usuarioId={usuarioId}
                onNovaTransacao={handleNovaComColapso}
                onAtualizouTransacao={onAtualizou}
                cartoes={cartoes}
                transacoes={transacoes}
              />
            </div>
          ) : (
            <div style={p.barraAcaoDashboard}>
              <button
                onClick={() => setExpandido(true)}
                style={p.botaoNovaEntradaDashboard}
              >
                <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>+</span>
                <span>Nova Entrada</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid Superior: Balanço do Mês + Card Histórico (Image 2) */}
      <div style={p.topGrid}>
        <CardBalancoMes
          saldo={saldoBalanco}
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
        />
        <CardHistoricoMes
          comparativo={comparativo}
          mesSelecionado={mesSelecionado}
          parcial={mesEmAndamento}
        />
      </div>

      {/* Saldo Real / Saldo Projetado / A Pagar — alerta antecipado de contas pendentes */}
      <div style={p.metricasGrid}>
        <CardMetricaSecundaria label="Saldo Real" valor={saldoReal} sub="créditos recebidos − despesas pagas" tom={saldoReal >= 0 ? 'positivo' : 'negativo'} />
        <CardMetricaSecundaria label="Saldo Projetado" valor={saldoProjetado} sub="considerando o que ainda está pendente" tom={saldoProjetado >= 0 ? 'positivo' : 'negativo'} />
        <CardMetricaSecundaria label="A Pagar" valor={totalAPagar} sub={`${qtdPendente} conta${qtdPendente !== 1 ? 's' : ''} pendente${qtdPendente !== 1 ? 's' : ''}`} tom="pendente" />
        {/* Saldo bancário do momento presente — não recorta por mês, por isso busca os próprios dados independente de mesSelecionado */}
        <CardSaldoContas usuarioId={usuarioId} />
      </div>

      {mesEmAndamento && proximosVencimentos.length > 0 && (
        <BlocoProximosVencimentos items={proximosVencimentos} diaHoje={diaHoje} />
      )}

      {/* Card Destaque Central: Análise de IA do Mês (Image 2) */}
      <BlocoAnaliseIA
        usuarioId={usuarioId}
        mesSelecionado={mesSelecionado}
        transacoes={transacoes}
        totalDespesa={totalDespesas}
        catOrdenadas={catOrdenadas}
      />

      {/* Barra de Pergunta / Prompt Flutuante com IA no rodapé (Image 2 & 3) */}
      <FloatingAIPromptBar usuarioId={usuarioId} />
    </div>
  )
}

const p = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    minHeight: '100%',
  },
  novaEntradaSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  barraAcaoDashboard: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  botaoNovaEntradaDashboard: {
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    border: 'none',
    padding: '11px 22px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 0 16px var(--primary-glow)',
    transition: 'transform 0.15s ease, background 0.15s ease',
  },
  novoLancamentoWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: 'var(--card-shadow)',
  },
  novoLancamentoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  novoLancamentoTitulo: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-pure)',
    fontFamily: 'var(--font-headline)',
  },
  fecharBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
  },
  metricasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 14,
  },
  placeholder: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '60px 24px',
    textAlign: 'center',
  },
  placeholderTexto: {
    margin: 0,
    color: 'var(--text-muted)',
    fontSize: 14,
  },
}
