import { useState, useEffect } from 'react'
import { buscarComparativoMensal } from '../services/api'
import LancamentoTexto from '../components/LancamentoTexto'
import {
  CardBalancoMes,
  CardHistoricoMes,
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

  // Categorias de gastos
  const gastosCat = {}
  despesas.forEach(t => {
    const c = t.categoria || 'outros'
    gastosCat[c] = (gastosCat[c] || 0) + Number(t.valor)
  })
  const catOrdenadas = Object.entries(gastosCat).sort((a, b) => b[1] - a[1])

  function handleNovaComColapso(nova) {
    onNovaTransacao(nova)
    setExpandido(false)
  }

  return (
    <div style={p.root}>
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
        />
      </div>

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
    color: '#0A0F0D',
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
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.22)',
    transition: 'transform 0.15s ease, background 0.15s ease',
  },
  novoLancamentoWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
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
