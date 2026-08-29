import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { fmtBRL, fmtNum } from '../utils/fmt'
import { gerarAnaliseMes, perguntarSobreFinancas, buscarContas } from '../services/api'

export const TIPO = {
  despesa_fixa:     { label: 'Despesas Fixas',     cor: '#A78BFA' },
  despesa_variavel: { label: 'Despesas Variáveis', cor: '#FC7C78' },
  credito:          { label: 'Receitas / Entradas', cor: '#10B981' },
  aplicacao:        { label: 'Aplicações',          cor: '#0F766E' },
}

const TIPO_SHORT = {
  despesa_fixa:     'Fixa',
  despesa_variavel: 'Variável',
  credito:          'Receita',
  aplicacao:        'Aplicação',
}

export const COR_CAT = {
  alimentação:   '#10B981',
  moradia:       '#0F766E',
  habitação:     '#0F766E',
  transporte:    '#2DD4BF',
  saúde:         '#F59E0B',
  lazer:         '#8B5CF6',
  educação:      '#06B6D4',
  assinaturas:   '#EC4899',
  investimentos: '#10B981',
  renda:         '#10B981',
  outros:        '#64748B',
}

export const soma     = (arr) => arr.reduce((acc, t) => acc + Number(t.valor), 0)
export const fmt      = fmtNum
export const fmtSaldo = fmtBRL

const MESES_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
export const labelMes = (mesISO) => MESES_SHORT[parseInt(mesISO.split('-')[1]) - 1]

function formatarDataCompra(dataISO) {
  if (!dataISO) return '—'
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}`
}

export function mesAnteriorISO(mesISO) {
  const [ano, mes] = mesISO.split('-').map(Number)
  const d = new Date(ano, mes - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 1024)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 1024)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ── Card de Balanço do Mês (Stitch Design) ──────────────────────────────────
export function CardBalancoMes({ saldo, totalReceitas, totalDespesas }) {
  const positivo = saldo >= 0
  return (
    <div style={s.cardBalanco}>
      <div style={s.cardBalancoTopo}>
        <span style={s.cardLabel}>BALANÇO DO MÊS</span>
        <div style={s.cardIconeBadge}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" stroke="#10B981" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <div style={{ ...s.cardBalancoValor, color: positivo ? 'var(--text-pure)' : 'var(--tertiary)' }}>
        {fmtSaldo(saldo)}
      </div>

      <div style={s.cardBalancoLinhas}>
        <div style={s.balancoSubItem}>
          <span style={s.setaVerde}>↑</span>
          <span style={s.balancoSubLabel}>Receitas</span>
          <span style={s.balancoSubValorVerde}>{fmtSaldo(totalReceitas)}</span>
        </div>
        <div style={s.balancoSubItem}>
          <span style={s.setaVermelha}>↓</span>
          <span style={s.balancoSubLabel}>Despesas</span>
          <span style={s.balancoSubValorVermelho}>{fmtSaldo(totalDespesas)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Card Histórico / Comparativo (Stitch Design) ─────────────────────────────
export function CardHistoricoMes({ comparativo, parcial, mesSelecionado }) {
  const semHistorico = !comparativo || comparativo.percentualVariacao === null

  return (
    <div style={s.cardHistorico}>
      <div style={s.cardHistoricoIcone}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8FA69B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      </div>

      {semHistorico ? (
        <>
          <h3 style={s.cardHistoricoTitulo}>Sem histórico</h3>
          <p style={s.cardHistoricoSub}>
            Não há dados suficientes do mês anterior para comparação.
          </p>
        </>
      ) : (
        <>
          <h3 style={{
            ...s.cardHistoricoTitulo,
            color: comparativo.percentualVariacao > 0 ? 'var(--tertiary)' : 'var(--primary)'
          }}>
            {comparativo.percentualVariacao > 0 ? `+${comparativo.percentualVariacao.toFixed(1)}%` : `${comparativo.percentualVariacao.toFixed(1)}%`}
          </h3>
          <p style={s.cardHistoricoSub}>
            {comparativo.percentualVariacao > 0 ? 'Despesas maiores' : 'Economia em relação'} ao mês anterior.
            {parcial ? ' (mês em andamento — comparação parcial)' : ''}
          </p>
        </>
      )}
    </div>
  )
}

// ── Cards de métrica secundária: Saldo Real, Saldo Projetado, A Pagar ───────
export function CardMetricaSecundaria({ label, valor, sub, tom = 'neutro' }) {
  const cores = {
    positivo: 'var(--primary)',
    negativo: 'var(--tertiary)',
    pendente: 'var(--status-pendente-fg)',
    neutro:   'var(--text-pure)',
  }
  return (
    <div style={s.cardMetrica}>
      <span style={s.cardMetricaLabel}>{label}</span>
      <span style={{ ...s.cardMetricaValor, color: cores[tom] }}>{fmtSaldo(valor)}</span>
      {sub && <span style={s.cardMetricaSub}>{sub}</span>}
    </div>
  )
}

// ── Saldo em Conta (hoje) — independente do mês navegado ────────────────────
// Soma dos saldo_atual de Contas Correntes. Diferente de Saldo Real/Projetado
// e Balanço do Mês (que são recortes do mês selecionado), este card mostra o
// saldo bancário do momento presente e não reage ao seletor de mês — busca
// os dados uma única vez por usuário, não por mês.
export function CardSaldoContas({ usuarioId }) {
  const [contas, setContas]         = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!usuarioId) return
    setCarregando(true)
    buscarContas(usuarioId)
      .then(setContas)
      .catch(() => setContas([]))
      .finally(() => setCarregando(false))
  }, [usuarioId])

  if (carregando) return null

  const lista = contas || []
  const total = lista.reduce((acc, c) => acc + Number(c.saldo_atual), 0)
  const maisAntiga = lista.length > 0
    ? lista.reduce((antiga, c) => new Date(c.atualizado_em) < new Date(antiga.atualizado_em) ? c : antiga, lista[0])
    : null
  const dias = maisAntiga ? Math.floor((new Date() - new Date(maisAntiga.atualizado_em)) / 86400000) : null
  const defasado = dias !== null && dias > 7

  return (
    <div style={s.cardSaldoContas}>
      <span style={s.cardLabel}>SALDO EM CONTA (HOJE)</span>
      <span style={s.cardSaldoContasValor}>{fmtSaldo(total)}</span>
      {lista.length === 0 ? (
        <Link to="/contas" style={s.linkCadastrarContas}>Cadastre suas contas</Link>
      ) : (
        <span style={{ ...s.cardSaldoContasSub, ...(defasado ? s.cardSaldoContasSubAlerta : {}) }}>
          Atualizado em {maisAntiga.atualizado_em ? new Date(maisAntiga.atualizado_em).toLocaleDateString('pt-BR') : '—'}
          {defasado ? ' · Pode estar desatualizado' : ''}
        </span>
      )}
    </div>
  )
}

// ── Bloco de Próximos Vencimentos ────────────────────────────────────────────
export function BlocoProximosVencimentos({ items, diaHoje }) {
  return (
    <div style={s.proximoBloco}>
      <span style={s.cardLabel}>PRÓXIMOS VENCIMENTOS</span>
      <div style={s.proximoLista}>
        {items.map(t => {
          const vencida = t.dia_pagamento < diaHoje
          return (
            <div key={t.id} style={{ ...s.proximoLinha, ...(vencida ? { background: 'var(--status-vencida-bg)' } : {}) }}>
              <span style={s.proximoDia}>{t.dia_pagamento}</span>
              <span style={s.proximoDesc}>{t.descricao}</span>
              <span style={{
                ...s.proximoStatus,
                background: vencida ? 'var(--status-vencida-bg)' : 'var(--status-pendente-bg)',
                color:      vencida ? 'var(--status-vencida-fg)' : 'var(--status-pendente-fg)',
                border: `1px solid ${vencida ? 'var(--status-vencida-fg)' : 'var(--status-pendente-fg)'}`,
              }}>
                {vencida ? '⚠ Vencida' : 'Pendente'}
              </span>
              <span style={s.proximoValor}>{fmtSaldo(Math.abs(t.valor))}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Barra de Categoria (Stitch Design) ───────────────────────────────────────
export function BarraCategoria({ categoria, valor, total, cor }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  const iconesCat = {
    alimentação: '🍽️',
    moradia:     '🏠',
    habitação:   '🏠',
    transporte:  '🚗',
    saúde:       '💊',
    lazer:       '🎉',
    educação:    '📚',
    assinaturas: '📱',
    outros:      '📦',
  }
  const icone = iconesCat[categoria.toLowerCase()] || '🏷️'

  return (
    <div style={s.barraItem}>
      <div style={s.barraHeader}>
        <div style={s.barraNomeWrap}>
          <span style={s.barraIcone}>{icone}</span>
          <span style={s.barraNome}>{categoria}</span>
        </div>
        <div style={s.barraValorWrap}>
          <span style={s.barraInfo}>R$ {fmt(valor)}</span>
          <span style={s.barraBadge}>{pct}%</span>
        </div>
      </div>
      <div style={s.barraTrilho}>
        <div style={{ ...s.barraFill, width: `${pct}%`, background: cor || 'var(--primary)' }} />
      </div>
    </div>
  )
}

// ── Bloco Análise de IA do Mês (Destaque Central) ───────────────────────────
export function BlocoAnaliseIA({ usuarioId, mesSelecionado, transacoes, totalDespesa, catOrdenadas }) {
  const [analise, setAnalise] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  // Reseta a análise ao mudar de mês para economizar tokens
  useEffect(() => {
    setAnalise(null)
    setErro(null)
  }, [mesSelecionado])

  async function handleGerarAnalise() {
    if (!usuarioId || carregando) return
    if (transacoes.length === 0) {
      setErro('Adicione lançamentos neste mês para gerar a análise.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const resultado = await gerarAnaliseMes(usuarioId, mesSelecionado)
      setAnalise(resultado)
    } catch (err) {
      // Fallback local se API key não estiver disponível
      setAnalise({
        resumo: catOrdenadas.length > 0
          ? `A maior concentração dos seus gastos está em **${catOrdenadas[0][0]} (${totalDespesa > 0 ? Math.round((catOrdenadas[0][1] / totalDespesa) * 100) : 0}%)**. Suas finanças estão organizadas neste mês.`
          : 'Adicione despesas para que a IA analise seus padrões de consumo.'
      })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={s.blocoAnaliseDestaque}>
      <div style={s.blocoAnaliseHeader}>
        <div style={s.blocoAnaliseHeaderLeft}>
          <div style={s.botIconeBadge}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="12" x="3" y="8" rx="2" />
              <path d="M12 2v6" />
              <circle cx="8" cy="14" r="1" fill="#10B981" />
              <circle cx="16" cy="14" r="1" fill="#10B981" />
            </svg>
          </div>
          <h2 style={s.blocoAnaliseTitulo}>Análise do Mês</h2>
        </div>

        <button
          onClick={handleGerarAnalise}
          disabled={carregando}
          style={s.btnGerarAnalise}
        >
          <span style={{ fontSize: 13, color: '#10B981' }}>✦</span>
          <span>{carregando ? 'Analisando...' : analise ? 'Atualizar Análise' : 'Gerar Análise'}</span>
        </button>
      </div>

      <div style={s.blocoAnaliseCorpo}>
        {/* Coluna Esquerda: Concentração de Gastos */}
        <div style={s.analiseColEsq}>
          <span style={s.analiseSecTitulo}>CONCENTRAÇÃO DE GASTOS</span>
          <div style={s.barrasLista}>
            {catOrdenadas.slice(0, 4).map(([cat, val], idx) => (
              <BarraCategoria
                key={cat}
                categoria={cat}
                valor={val}
                total={totalDespesa}
                cor={idx === 0 ? 'var(--primary)' : idx === 1 ? 'var(--secondary)' : '#2DD4BF'}
              />
            ))}
            {catOrdenadas.length === 0 && (
              <p style={s.textoVazio}>Nenhum gasto registrado para gerar análise de categorias.</p>
            )}
          </div>
        </div>

        {/* Coluna Direita: Caixa de Texto IA */}
        <div style={s.analiseColDir}>
          <div style={s.analiseCardInsight}>
            {carregando ? (
              <div style={s.insightCarregando}>
                <span style={s.pulsoIcone}>✦</span>
                <span>Analisando padrões financeiros com IA...</span>
              </div>
            ) : erro ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ color: 'var(--tertiary)', margin: 0, fontSize: 13 }}>{erro}</p>
                <button onClick={handleGerarAnalise} style={s.btnTentarNovamente}>Tentar novamente</button>
              </div>
            ) : analise?.resumo ? (
              <div style={s.insightTexto}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{children}</strong>,
                  }}
                >
                  {analise.resumo}
                </ReactMarkdown>
                {analise.concentracao && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {analise.concentracao}
                  </p>
                )}
              </div>
            ) : (
              <div style={s.insightPlaceholder}>
                <p style={s.insightPlaceholderTexto}>
                  Clique em <strong>Gerar Análise</strong> para processar as entradas deste mês e obter insights inteligentes da IA.
                </p>
                <button
                  onClick={handleGerarAnalise}
                  disabled={carregando}
                  style={s.btnGerarAnaliseInline}
                >
                  <span>✦ Gerar Análise</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Barra Flutuante de Prompt AI (Stitch Design) ────────────────────────────
export function FloatingAIPromptBar({ usuarioId }) {
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)

  async function handleEnviar(e) {
    e?.preventDefault()
    if (!pergunta.trim() || carregando) return
    const q = pergunta.trim()
    setCarregando(true)
    setAberto(true)
    try {
      const res = await perguntarSobreFinancas(usuarioId, q)
      setResposta({ pergunta: q, texto: res })
      setPergunta('')
    } catch (err) {
      setResposta({ pergunta: q, texto: 'Desculpe, não consegui responder agora. Verifique a configuração da chave de IA no backend.' })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={s.floatingBarContainer}>
      {aberto && resposta && (
        <div style={s.floatingRespostaCard}>
          <div style={s.floatingRespostaHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--primary)' }}>✦</span>
              <strong style={{ fontSize: 13, color: 'var(--text-pure)' }}>{resposta.pergunta}</strong>
            </div>
            <button onClick={() => setAberto(false)} style={s.fecharBtn}>✕</button>
          </div>
          <div style={s.floatingRespostaTexto}>
            <ReactMarkdown components={{
              p: ({ children }) => <p style={{ margin: '0 0 6px' }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: 'var(--primary)' }}>{children}</strong>,
            }}>
              {resposta.texto}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <form onSubmit={handleEnviar} style={s.floatingBar}>
        <span style={s.floatingAttachIcon} title="Assistente IA">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </span>
        <input
          type="text"
          value={pergunta}
          onChange={e => setPergunta(e.target.value)}
          placeholder="Pergunte sobre seus gastos, peça dicas para economizar..."
          style={s.floatingInput}
          disabled={carregando}
        />
        <button type="submit" disabled={carregando || !pergunta.trim()} style={s.floatingSendBtn}>
          {carregando ? (
            <span style={{ fontSize: 12 }}>...</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-contrast)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="var(--primary-contrast)" />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}

// ── Linha de Transação (Tabelas / Listas Modernas) ───────────────────────────
function CampoEditavel({ onAtivar, style, title, children }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onAtivar}
      onKeyDown={ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onAtivar() }
      }}
      style={style}
      title={title}
    >
      {children}
    </span>
  )
}

export function ItemLinha({ transacao: t, cor, mostrarStatus, mostrarRecorrente, removendo, onRemover, onAtualizar, onDuplicar, onCancelarParcelas, onMoverTipo, cartoesById }) {
  const [editandoValor, setEditandoValor] = useState(false)
  const [novoValor, setNovoValor]         = useState(String(t.valor))
  const [editandoDesc, setEditandoDesc]   = useState(false)
  const [novaDesc, setNovaDesc]           = useState(t.descricao)
  const [editandoCat, setEditandoCat]     = useState(false)
  const [novaCat, setNovaCat]             = useState(t.categoria || '')
  const [salvando, setSalvando]           = useState(false)

  const isMobile    = useIsMobile()
  const hoje        = new Date()
  const mesAtualISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const vencida     = t.status === 'pendente' && t.mes_referencia === mesAtualISO && t.dia_pagamento < hoje.getDate()
  const valorNum    = Number(t.valor)

  async function toggleStatus() {
    if (salvando) return
    setSalvando(true)
    try { await onAtualizar({ status: t.status === 'pago' ? 'pendente' : 'pago' }) }
    finally { setSalvando(false) }
  }

  async function salvarValor() {
    const v = parseFloat(novoValor.replace(',', '.'))
    if (isNaN(v) || v === 0) { setNovoValor(String(t.valor)); setEditandoValor(false); return }
    setSalvando(true)
    try { await onAtualizar({ valor: v }) }
    finally { setSalvando(false); setEditandoValor(false) }
  }

  async function salvarDesc() {
    const v = novaDesc.trim()
    if (!v) { setNovaDesc(t.descricao); setEditandoDesc(false); return }
    setSalvando(true)
    try { await onAtualizar({ descricao: v }) }
    finally { setSalvando(false); setEditandoDesc(false) }
  }

  async function salvarCat() {
    const v = novaCat.trim().toLowerCase()
    setSalvando(true)
    try { await onAtualizar({ categoria: v || t.categoria }) }
    finally { setSalvando(false); setEditandoCat(false) }
  }

  return (
    <div style={{
      ...s.itemLinha,
      ...(isMobile ? s.itemLinhaMobile : {}),
      opacity: salvando ? 0.45 : 1,
      background: vencida ? 'rgba(252, 124, 120, 0.08)' : 'transparent',
    }}>
      <div style={{ ...s.itemLinhaEsq, ...(isMobile ? { width: '100%' } : {}) }}>
        <span style={s.itemDiaTag}>{t.dia_pagamento}</span>
        <div style={s.itemLinhaTextos}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {editandoDesc ? (
              <input
                autoFocus
                value={novaDesc}
                onChange={e => setNovaDesc(e.target.value)}
                onBlur={salvarDesc}
                onKeyDown={e => e.key === 'Enter' && salvarDesc()}
                style={s.inputInline}
              />
            ) : (
              <CampoEditavel
                onAtivar={() => setEditandoDesc(true)}
                style={s.itemDesc}
                title="Clique para editar descrição"
              >
                {t.descricao}
              </CampoEditavel>
            )}
            {t.recorrente && (
              <span
                style={{
                  fontSize: 13,
                  color: '#A78BFA',
                  fontWeight: 800,
                  marginLeft: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                title="Despesa recorrente mensal"
              >
                ↺
              </span>
            )}
            {t.total_parcelas && (
              <span style={s.parcelaBadge}>{t.parcela_atual}/{t.total_parcelas}</span>
            )}
          </div>
          <div style={s.itemCatRow}>
            {editandoCat ? (
              <input
                autoFocus
                value={novaCat}
                onChange={e => setNovaCat(e.target.value)}
                onBlur={salvarCat}
                onKeyDown={e => e.key === 'Enter' && salvarCat()}
                style={s.inputInlineSmall}
              />
            ) : (
              <CampoEditavel
                onAtivar={() => setEditandoCat(true)}
                style={s.itemCat}
                title="Clique para editar categoria"
              >
                {t.categoria || 'Geral'}
              </CampoEditavel>
            )}
            {t.subcategoria?.trim() && (
              <>
                <span style={s.itemSep}>·</span>
                <span style={s.itemSubcategoria}>{t.subcategoria.trim()}</span>
              </>
            )}
            {t.cartao_id && cartoesById?.[t.cartao_id] && (
              <>
                <span style={s.itemSep}>·</span>
                <span style={s.cartaoBadge}>
                  💳 {cartoesById[t.cartao_id].nome}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ ...s.itemLinhaDir, ...(isMobile ? s.itemLinhaDirMobile : {}) }}>
        {editandoValor ? (
          <input
            autoFocus
            value={novoValor}
            onChange={e => setNovoValor(e.target.value)}
            onBlur={salvarValor}
            onKeyDown={e => e.key === 'Enter' && salvarValor()}
            style={s.inputInlineValor}
          />
        ) : (
          <CampoEditavel
            onAtivar={() => setEditandoValor(true)}
            style={{
              ...s.itemValor,
              color: t.tipo === 'credito' ? 'var(--primary)' : 'var(--text-pure)',
            }}
            title="Clique para editar valor"
          >
            {fmtSaldo(valorNum)}
          </CampoEditavel>
        )}

        {mostrarStatus && (
          <button
            onClick={toggleStatus}
            style={{
              ...s.statusPill,
              background: t.tipo === 'aplicacao'
                ? (t.status === 'pago' ? 'rgba(167, 139, 250, 0.16)' : 'var(--status-pendente-bg)')
                : (t.status === 'pago' ? 'var(--status-pago-bg)' : vencida ? 'var(--status-vencida-bg)' : 'var(--status-pendente-bg)'),
              color: t.tipo === 'aplicacao'
                ? (t.status === 'pago' ? '#C4B5FD' : 'var(--status-pendente-fg)')
                : (t.status === 'pago' ? 'var(--status-pago-fg)' : vencida ? 'var(--status-vencida-fg)' : 'var(--status-pendente-fg)'),
              border: `1px solid ${
                t.tipo === 'aplicacao'
                  ? (t.status === 'pago' ? 'rgba(167, 139, 250, 0.4)' : 'rgba(245,158,11,0.3)')
                  : (t.status === 'pago' ? 'rgba(16,185,129,0.3)' : vencida ? 'rgba(252,124,120,0.3)' : 'rgba(245,158,11,0.3)')
              }`,
            }}
          >
            {t.tipo === 'aplicacao'
              ? (t.status === 'pago' ? 'Aplicado' : 'Pendente')
              : (t.status === 'pago' ? 'Pago' : vencida ? 'Vencida' : 'Pendente')}
          </button>
        )}

        {/* Botão de Recorrência — Clique para alternar */}
        {mostrarRecorrente && (
          <button
            onClick={async () => {
              if (salvando) return
              setSalvando(true)
              try {
                await onAtualizar({ recorrente: !t.recorrente })
              } finally {
                setSalvando(false)
              }
            }}
            style={{
              ...s.actionBtn,
              color: t.recorrente ? '#A78BFA' : 'var(--text-dim)',
              fontSize: 14,
              fontWeight: t.recorrente ? 800 : 500,
            }}
            title={t.recorrente ? 'Despesa recorrente ativada (clique para desativar)' : 'Clique para marcar como despesa recorrente mensal'}
          >
            ↺
          </button>
        )}

        {/* Botão Duplicar */}
        {onDuplicar && (
          <button
            onClick={onDuplicar}
            style={s.actionBtn}
            title="Duplicar este lançamento"
          >
            ⧉
          </button>
        )}

        {/* Botão Cancelar Parcelas Futuras */}
        {t.grupo_parcela_id && onCancelarParcelas && (
          <button
            onClick={() => onCancelarParcelas(t.grupo_parcela_id)}
            style={{ ...s.actionBtn, color: 'var(--tertiary)' }}
            title="Cancelar parcelas futuras deste parcelamento"
          >
            ⊘
          </button>
        )}

        {/* Botão Remover */}
        <button onClick={onRemover} disabled={removendo} style={s.actionBtn} title="Remover lançamento">
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Bloco Tipo Genérico (Despesas / Receitas / Aplicações) ───────────────────
export function BlocoTipo({ tipo, transacoes, acumulados, removendo, onRemover, onAtualizar, onDuplicar, onCancelarParcelas, cartoesById }) {
  const cfg = TIPO[tipo]
  const total = soma(transacoes)
  const isAplicacao = tipo === 'aplicacao'

  const itensAcumulados = (isAplicacao && acumulados)
    ? Object.entries(acumulados).map(([chave, val]) => {
        const valorNum = (typeof val === 'object' && val !== null) ? Number(val.total || 0) : Number(val || 0)
        const label = (typeof val === 'object' && val !== null && val.label) ? val.label : chave
        return { chave, label, total: valorNum }
      })
    : []

  const totalAcumulado = itensAcumulados.length > 0
    ? itensAcumulados.reduce((acc, item) => acc + item.total, 0)
    : total

  return (
    <div style={s.blocoCard}>
      <div style={s.blocoCardHeader}>
        <div>
          <span style={{ ...s.blocoCardTitulo, color: cfg.cor }}>{cfg.label}</span>
          
        </div>
        <div style={{ textAlign: 'right' }}>
          {isAplicacao ? (
            <div>
              <span style={s.labelPatrimonioTotal}>PATRIMÔNIO TOTAL</span>
              <span style={{ ...s.blocoCardTotal, color: 'var(--text-pure)', display: 'block' }}>{fmtSaldo(totalAcumulado)}</span>
            </div>
          ) : (
            <span style={s.blocoCardTotal}>{fmtSaldo(total)}</span>
          )}
        </div>
      </div>

      {isAplicacao && (
        <div style={s.secaoSeparador}>
          <span style={s.secaoTituloTag}>LANÇAMENTOS DESTE MÊS</span>
        </div>
      )}

      <div style={s.blocoCardLista}>
        {transacoes.length === 0 ? (
          <p style={s.textoVazio}>Nenhum registro para este mês.</p>
        ) : (
          transacoes.map(t => (
            <ItemLinha
              key={t.id}
              transacao={t}
              cor={cfg.cor}
              mostrarStatus
              mostrarRecorrente
              removendo={removendo === t.id}
              onRemover={() => onRemover(t.id)}
              onAtualizar={campos => onAtualizar(t.id, campos)}
              onDuplicar={() => onDuplicar(t.id)}
              onCancelarParcelas={onCancelarParcelas}
              cartoesById={cartoesById}
            />
          ))
        )}
      </div>

      {/* Seção de Patrimônio Acumulado para Aplicações */}
      {isAplicacao && itensAcumulados.length > 0 && (
        <div style={s.secaoPatrimonioAcumulado}>
          <div style={s.secaoSeparador}>
            <span style={s.secaoTituloTag}>PATRIMÔNIO ACUMULADO</span>
          </div>
          <div style={s.listaPatrimonioAcumulado}>
            {itensAcumulados.map((item) => (
              <div key={item.chave} style={s.itemPatrimonio}>
                <span style={s.itemPatrimonioNome}>{item.label}</span>
                <span style={s.itemPatrimonioValor}>{fmtSaldo(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Estilos Centralizados (Stitch Tokens) ─────────────────────────────────────
const s = {
  // Card Balanço
  cardBalanco: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: 'var(--card-shadow)',
  },
  cardBalancoTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  cardIconeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBalancoValor: {
    fontFamily: 'var(--font-headline)',
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    marginTop: 2,
  },
  cardBalancoLinhas: {
    display: 'flex',
    alignItems: 'center',
    gap: 28,
    marginTop: 14,
    paddingTop: 14,
    borderTop: '1px solid var(--border)',
    flexWrap: 'wrap',
  },
  balancoSubItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  setaVerde: { color: 'var(--primary)', fontWeight: 800, fontSize: 16 },
  setaVermelha: { color: 'var(--tertiary)', fontWeight: 800, fontSize: 16 },
  balancoSubLabel: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },
  balancoSubValorVerde: { fontSize: 14, fontWeight: 700, color: 'var(--primary)' },
  balancoSubValorVermelho: { fontSize: 14, fontWeight: 700, color: 'var(--tertiary)' },

  // Card Histórico
  cardHistorico: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    boxShadow: 'var(--card-shadow)',
  },
  cardHistoricoIcone: {
    marginBottom: 10,
  },
  cardHistoricoTitulo: {
    margin: '0 0 6px',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-pure)',
    fontFamily: 'var(--font-headline)',
  },
  cardHistoricoSub: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text-muted)',
    maxWidth: 260,
    lineHeight: 1.5,
  },

  // Cards de métrica secundária (Saldo Real, Saldo Projetado, A Pagar)
  cardMetrica: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardMetricaLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  },
  cardMetricaValor: {
    fontFamily: 'var(--font-headline)',
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums',
  },
  cardMetricaSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },

  // Saldo em Conta (hoje)
  cardSaldoContas: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardSaldoContasValor: {
    fontFamily: 'var(--font-headline)',
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.01em',
    color: 'var(--text-pure)',
    fontVariantNumeric: 'tabular-nums',
  },
  cardSaldoContasSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  cardSaldoContasSubAlerta: {
    color: 'var(--status-pendente-fg)',
    fontWeight: 600,
  },
  linkCadastrarContas: {
    fontSize: 12,
    color: 'var(--primary)',
    fontWeight: 600,
    textDecoration: 'none',
  },

  // Bloco de Próximos Vencimentos
  proximoBloco: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  proximoLista: { display: 'flex', flexDirection: 'column', gap: 4 },
  proximoLinha: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 8,
  },
  proximoDia: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    background: 'var(--surface-raised)', borderRadius: 4, padding: '2px 6px',
    minWidth: 28, textAlign: 'center', flexShrink: 0,
  },
  proximoDesc: {
    flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-pure)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  proximoStatus: {
    padding: '2px 8px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
  },
  proximoValor: { fontSize: 13, fontWeight: 800, color: 'var(--text-pure)', whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },

  // Bloco Análise IA (Destaque)
  blocoAnaliseDestaque: {
    background: 'var(--surface-overlay)',
    border: '1.5px solid rgba(16, 185, 129, 0.45)',
    borderRadius: 18,
    padding: '24px 28px',
    boxShadow: 'var(--card-shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  blocoAnaliseHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blocoAnaliseHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  botIconeBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'rgba(16, 185, 129, 0.18)',
    border: '1px solid var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blocoAnaliseTitulo: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-pure)',
    fontFamily: 'var(--font-headline)',
  },
  blocoAnaliseCorpo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
    alignItems: 'stretch',
  },
  analiseColEsq: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  analiseSecTitulo: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
  },
  barrasLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  analiseColDir: {
    display: 'flex',
    flexDirection: 'column',
  },
  analiseCardInsight: {
    flex: 1,
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  insightTexto: {
    fontSize: 14,
    color: 'var(--text)',
    lineHeight: 1.6,
  },
  insightCarregando: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--text-muted)',
    fontSize: 13,
  },
  pulsoIcone: {
    color: 'var(--primary)',
    fontSize: 18,
    animation: 'pulso 1.5s infinite',
  },
  btnGerarAnalise: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(16, 185, 129, 0.4)',
    background: 'rgba(16, 185, 129, 0.12)',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnGerarAnaliseInline: {
    marginTop: 12,
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    boxShadow: '0 0 14px var(--primary-glow)',
  },
  insightPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  insightPlaceholderTexto: {
    margin: 0,
    fontSize: 13.5,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  btnTentarNovamente: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
    textDecoration: 'underline',
  },

  // Barras de Progresso
  barraItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  barraHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barraNomeWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  barraIcone: { fontSize: 14 },
  barraNome: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
    textTransform: 'capitalize',
  },
  barraValorWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  barraInfo: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  barraBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--primary)',
    background: 'rgba(16, 185, 129, 0.12)',
    padding: '1px 6px',
    borderRadius: 4,
  },
  barraTrilho: {
    height: 6,
    background: 'var(--surface-active)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  barraFill: {
    height: '100%',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  },

  // Floating AI Prompt Bar
  floatingBarContainer: {
    position: 'sticky',
    bottom: 20,
    zIndex: 90,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 16,
  },
  floatingBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 99,
    padding: '6px 8px 6px 18px',
    boxShadow: 'var(--dropdown-shadow)',
    backdropFilter: 'blur(10px)',
  },
  floatingAttachIcon: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  floatingInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-pure)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
  },
  floatingSendBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--primary)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'transform 0.15s ease',
  },
  floatingRespostaCard: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 20px',
    boxShadow: 'var(--dropdown-shadow)',
  },
  floatingRespostaHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  floatingRespostaTexto: {
    fontSize: 13,
    color: 'var(--text)',
    lineHeight: 1.6,
  },
  fecharBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 14,
  },

  // Linhas e Blocos
  blocoCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  blocoCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blocoCardTitulo: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  blocoCardTotal: {
    fontSize: 18,
    fontWeight: 800,
    color: 'var(--text-pure)',
  },
  blocoCardLista: {
    display: 'flex',
    flexDirection: 'column',
  },
  itemLinha: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-subtle)',
    gap: 12,
  },
  // Em telas estreitas, o bloco de ações (valor + status + ícones) não cabe
  // ao lado da descrição/categoria — empilha em vez de espremer e sobrepor.
  itemLinhaMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  itemLinhaDirMobile: {
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    width: '100%',
  },
  itemLinhaEsq: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  itemDiaTag: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    background: 'var(--surface-hover)',
    padding: '2px 6px',
    borderRadius: 4,
    minWidth: 22,
    textAlign: 'center',
  },
  itemLinhaTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  itemDesc: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-pure)',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemCatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'var(--text-muted)',
    flexWrap: 'wrap',
  },
  itemCat: {
    textTransform: 'capitalize',
    cursor: 'pointer',
  },
  itemSep: {
    color: 'var(--text-dim)',
  },
  itemSubcategoria: {
    color: 'var(--text-muted)',
  },
  cartaoBadge: {
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  parcelaBadge: {
    fontSize: 10,
    fontWeight: 700,
    background: 'rgba(15, 118, 110, 0.3)',
    color: 'var(--primary)',
    padding: '1px 5px',
    borderRadius: 4,
  },
  itemLinhaDir: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  itemValor: {
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums',
  },
  statusPill: {
    padding: '2px 8px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    padding: 4,
    fontSize: 13,
  },
  inputInline: {
    background: 'var(--surface-hover)',
    border: '1px solid var(--primary)',
    borderRadius: 4,
    color: 'var(--text-pure)',
    padding: '2px 6px',
    fontSize: 13,
    outline: 'none',
  },
  inputInlineSmall: {
    background: 'var(--surface-hover)',
    border: '1px solid var(--primary)',
    borderRadius: 4,
    color: 'var(--text-pure)',
    padding: '1px 4px',
    fontSize: 11,
    outline: 'none',
  },
  inputInlineValor: {
    background: 'var(--surface-hover)',
    border: '1px solid var(--primary)',
    borderRadius: 4,
    color: 'var(--text-pure)',
    padding: '2px 6px',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'right',
    width: 80,
    outline: 'none',
  },
  textoVazio: {
    fontSize: 13,
    color: 'var(--text-muted)',
    margin: '12px 0',
    fontStyle: 'italic',
  },
  subPillAportes: {
    display: 'inline-block',
    marginTop: 6,
    padding: '3px 10px',
    borderRadius: 99,
    background: 'rgba(15, 118, 110, 0.25)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--primary)',
    fontSize: 12,
    fontWeight: 500,
  },
  labelPatrimonioTotal: {
    display: 'block',
    fontSize: 10.5,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    marginBottom: 2,
  },
  secaoSeparador: {
    padding: '12px 0 6px',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: 6,
  },
  secaoTituloTag: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  secaoPatrimonioAcumulado: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  listaPatrimonioAcumulado: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingTop: 6,
  },
  itemPatrimonio: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--border-subtle)',
  },
  itemPatrimonioNome: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-pure)',
  },
  itemPatrimonioValor: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-pure)',
    fontVariantNumeric: 'tabular-nums',
  },
}
