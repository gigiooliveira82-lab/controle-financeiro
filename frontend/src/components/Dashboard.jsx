import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { fmtBRL, fmtNum } from '../utils/fmt'
import { gerarAnaliseMes, perguntarSobreFinancas } from '../services/api'

export const TIPO = {
  despesa_fixa:     { label: 'Despesas Fixas',    cor: '#6B3DB8' },
  despesa_variavel: { label: 'Despesas Variáveis', cor: '#dc2626' },
  credito:          { label: 'Créditos',           cor: 'var(--verde-profundo)' },
  aplicacao:        { label: 'Aplicações',         cor: '#1E5FAD' },
}

const TIPO_SHORT = {
  despesa_fixa:     'Fixa',
  despesa_variavel: 'Variável',
  credito:          'Crédito',
  aplicacao:        'Aplicação',
}

export const COR_CAT = {
  moradia: '#f59e0b', alimentação: '#10b981', transporte: '#3b82f6',
  saúde: '#ef4444', lazer: '#8b5cf6', educação: '#06b6d4',
  assinaturas: '#f97316', investimentos: '#14b8a6', renda: '#22c55e',
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

// ── Card-herói (saldo projetado do mês) ────────────────────────────────────────
// Primeira coisa que o usuário vê ao entrar no app — usa a identidade Midnight
// Emerald (superfície escura + acento esmeralda) em vez do cartão branco
// genérico do resto da página.

export function CardHeroProjetado({ valor, saldoReal, totalAPagar, qtdPendente, tudoEmDia }) {
  const positivo = valor >= 0
  const cor = positivo ? 'var(--mint)' : 'var(--status-vencida-fg)'
  return (
    <div style={{
      ...s.cardHero,
      background: positivo ? 'var(--surface-raised)' : '#2A1414',
      border: `1px solid ${positivo ? 'var(--border)' : 'rgba(248,113,113,0.35)'}`,
    }}>
      <div style={s.cardHeroConteudo}>
        <span style={s.cardHeroLabel}>{tudoEmDia ? 'Saldo do mês' : 'Saldo projetado'}</span>
        <span style={{ ...s.cardHeroValor, color: cor }}>{fmtSaldo(valor)}</span>
        <span style={s.cardHeroSub}>
          {tudoEmDia
            ? (positivo ? '✓ Tudo em dia · nenhum valor pendente' : '! Negativo · nenhum valor pendente')
            : `${fmtSaldo(saldoReal)} garantido agora · ${fmtSaldo(totalAPagar)} em ${qtdPendente} conta${qtdPendente !== 1 ? 's' : ''} pendente${qtdPendente !== 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  )
}

// ── Cards normais ─────────────────────────────────────────────────────────────

export function CardSaldo({ label, valor, sub }) {
  const positivo = valor >= 0
  const cor = positivo ? 'var(--emerald)' : 'var(--status-vencida-fg)'
  return (
    <div style={{ ...s.card, borderTop: `3px solid ${cor}` }}>
      <span style={s.cardLabel}>{label}</span>
      <span style={{ ...s.cardValor, color: cor }}>{fmtSaldo(valor)}</span>
      <span style={s.cardSub}><span style={{ color: cor }}>{positivo ? '▲' : '▼'} </span>{sub}</span>
    </div>
  )
}

export function CardNeutro({ label, valor, sub }) {
  return (
    <div style={{ ...s.card, borderTop: '3px solid var(--status-pendente-fg)' }}>
      <span style={s.cardLabel}>{label}</span>
      <span style={{ ...s.cardValor, color: 'var(--status-pendente-fg)' }}>R$ {fmt(valor)}</span>
      <span style={s.cardSub}><span style={{ color: 'var(--status-pendente-fg)' }}>● </span>{sub}</span>
    </div>
  )
}

// ── Card comparativo (vs mês anterior) ───────────────────────────────────────

export function CardComparativo({ percentualVariacao, despesaMesAtual, despesaMesAnterior, mesAtualISO, mesAnteriorISO: mesAntISO, parcial }) {
  const label = `VS MÊS ANTERIOR${parcial ? ' (parcial)' : ''}`
  if (percentualVariacao === null) {
    return (
      <div style={{ ...s.card, borderTop: '3px solid var(--border)' }}>
        <span style={s.cardLabel}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.3 }}>Sem histórico</span>
        <span style={s.cardSub}>Volte no próximo mês para comparar</span>
      </div>
    )
  }
  // Num mês ainda em andamento, a comparação é enganosa (despesas variáveis do
  // mês atual ainda vão crescer) — mostramos neutro em vez de verde/vermelho.
  const subindo = percentualVariacao > 0
  const cor = parcial ? 'var(--text-muted)' : (subindo ? 'var(--status-vencida-fg)' : 'var(--emerald)')
  const seta = subindo ? '▲' : '▼'
  return (
    <div style={{ ...s.card, borderTop: `3px solid ${cor}` }}>
      <span style={s.cardLabel}>{label}</span>
      <span style={{ ...s.cardValor, color: cor }}>{seta} {Math.abs(percentualVariacao).toFixed(1)}%</span>
      <span style={s.cardSub}>
        R$ {fmt(despesaMesAtual)} em {labelMes(mesAtualISO)} vs R$ {fmt(despesaMesAnterior)} em {labelMes(mesAntISO)}
        {parcial ? ' · mês em andamento' : ''}
      </span>
    </div>
  )
}

// ── Barra de categoria ────────────────────────────────────────────────────────

export function BarraCategoria({ categoria, valor, total, cor }) {
  const pct = total > 0 ? (valor / total) * 100 : 0
  return (
    <div style={s.barraItem}>
      <div style={s.barraHeader}>
        <span style={s.barraNome}>{categoria}</span>
        <span style={s.barraInfo}>R$ {fmt(valor)} <span style={s.barraPct}>{pct.toFixed(0)}%</span></span>
      </div>
      <div style={s.barraTrilho}>
        <div style={{ ...s.barraFill, width: `${pct}%`, background: cor }} />
      </div>
    </div>
  )
}

// ── Bloco de tipo ─────────────────────────────────────────────────────────────

export function BlocoTipo({ tipo, transacoes, acumulados, removendo, onRemover, onAtualizar, onDuplicar, onCancelarParcelas, onMoverTipo, cartoesById }) {
  const cfg       = TIPO[tipo]
  const ehDespesa = tipo === 'despesa_fixa' || tipo === 'despesa_variavel'
  const ehCredito = tipo === 'credito'
  const ehAplic   = tipo === 'aplicacao'

  if (ehAplic) {
    return (
      <BlocoAplicacoes
        cfg={cfg}
        transacoes={transacoes}
        acumulados={acumulados || {}}
        removendo={removendo}
        onRemover={onRemover}
        onAtualizar={onAtualizar}
        onDuplicar={onDuplicar}
        onCancelarParcelas={onCancelarParcelas}
      />
    )
  }

  const totalPago     = soma(transacoes.filter(t => t.status === 'pago'))
  const totalPendente = soma(transacoes.filter(t => t.status === 'pendente'))

  return (
    <div style={{ ...s.bloco, borderLeft: `4px solid ${cfg.cor}` }}>
      <div style={s.blocoTopo}>
        <span style={{ ...s.blocoTitulo, color: cfg.cor }}>{cfg.label}</span>
        <span style={s.blocoTotalValor}>{fmtSaldo(totalPago + totalPendente)}</span>
      </div>

      <div style={s.blocoResumo}>
        <Pill text={`Pago  R$ ${fmt(totalPago)}`} cor="#475569" bg="#f1f5f9" />
        {ehDespesa && totalPendente > 0 && (
          <Pill text={`Pendente  R$ ${fmt(totalPendente)}`} cor="#5c2400" bg="#fef9c3" />
        )}
        {ehCredito && totalPendente > 0 && (
          <Pill text={`A receber  R$ ${fmt(totalPendente)}`} cor="#1d4ed8" bg="#dbeafe" />
        )}
      </div>

      <div style={s.separador} />

      {transacoes.length === 0 ? (
        <p style={s.blocoVazio}>Nenhum lançamento neste mês</p>
      ) : (
        <div>
          {transacoes.map(t => (
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
              onMoverTipo={onMoverTipo}
              cartoesById={cartoesById}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Bloco especial: Aplicações ────────────────────────────────────────────────

function BlocoAplicacoes({ cfg, transacoes, acumulados, removendo, onRemover, onAtualizar, onDuplicar, onCancelarParcelas }) {
  const patrimonioEntradas = Object.entries(acumulados)
    .filter(([, { total }]) => total !== 0)
    .sort((a, b) => b[1].total - a[1].total)

  const totalPatrimonio = patrimonioEntradas.reduce((s, [, { total }]) => s + total, 0)

  const aportesMes  = soma(transacoes.filter(t => Number(t.valor) > 0))
  const resgatesMes = Math.abs(soma(transacoes.filter(t => Number(t.valor) < 0)))

  return (
    <div style={{ ...s.bloco, borderLeft: `4px solid ${cfg.cor}` }}>
      <div style={s.blocoTopo}>
        <span style={{ ...s.blocoTitulo, color: cfg.cor }}>{cfg.label}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={s.patrimonioLabel}>Patrimônio total</div>
          <div style={{ ...s.blocoTotalValor, color: totalPatrimonio >= 0 ? '#1e293b' : '#dc2626' }}>
            {fmtSaldo(totalPatrimonio)}
          </div>
        </div>
      </div>

      {(aportesMes > 0 || resgatesMes > 0) && (
        <div style={s.blocoResumo}>
          {aportesMes  > 0 && <Pill text={`Aportes  R$ ${fmt(aportesMes)}`}   cor="#1d4ed8" bg="#dbeafe" />}
          {resgatesMes > 0 && <Pill text={`Resgates  R$ ${fmt(resgatesMes)}`} cor="#92400e" bg="#fef9c3" />}
        </div>
      )}

      <div style={s.aplicSec}>
        <p style={s.aplicSecTitulo}>Lançamentos deste mês</p>
        {transacoes.length === 0 ? (
          <p style={{ ...s.blocoVazio, fontStyle: 'normal', color: '#94a3b8', fontSize: 12, lineHeight: 1.5 }}>
            Nenhum aporte este mês —<br />que tal guardar uma parte do que sobrou?
          </p>
        ) : (
          transacoes.map(t => (
            <ItemLinha
              key={t.id}
              transacao={t}
              cor={cfg.cor}
              mostrarStatus={false}
              mostrarRecorrente={false}
              removendo={removendo === t.id}
              onRemover={() => onRemover(t.id)}
              onAtualizar={campos => onAtualizar(t.id, campos)}
              onDuplicar={() => onDuplicar(t.id)}
              onCancelarParcelas={onCancelarParcelas}
            />
          ))
        )}
      </div>

      {patrimonioEntradas.length > 0 && (
        <>
          <div style={s.separador} />
          <div style={s.aplicSec}>
            <p style={s.aplicSecTitulo}>Patrimônio acumulado</p>
            {patrimonioEntradas.map(([chave, { total, label }]) => (
              <LinhaPatrimonio key={chave} label={label} total={total} cor={cfg.cor} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Linha de patrimônio (somente leitura) ─────────────────────────────────────

function LinhaPatrimonio({ label, total, cor }) {
  const negativo = total < 0
  return (
    <div style={s.linhaPatrimonio}>
      <div style={s.linhaPatrimonioEsq}>
        <span style={{ ...s.diaTag, borderColor: cor, color: cor, visibility: 'hidden' }}>00</span>
        <div style={s.linhaTexto}>
          <span style={s.linhaDesc}>{label}</span>
          {negativo && <span style={s.avisoNegativo}>⚠ verificar — saldo inconsistente</span>}
        </div>
      </div>
      <span style={{ ...s.linhaValor, color: negativo ? '#dc2626' : '#1e293b' }}>
        {fmtSaldo(total)}
      </span>
    </div>
  )
}

function Pill({ text, cor, bg }) {
  return <span style={{ ...s.pill, color: cor, background: bg }}>{text}</span>
}

// ── Linha de transação ────────────────────────────────────────────────────────

// Campo de texto que vira edição inline ao ser ativado — via clique ou teclado
// (Enter/Espaço), já que é o mecanismo central de edição das linhas de lançamento.
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
      aria-label={title}
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
  const [editandoSub, setEditandoSub]     = useState(false)
  const [novaSub, setNovaSub]             = useState(t.subcategoria || '')
  const [editandoDia, setEditandoDia]     = useState(false)
  const [novoDia, setNovoDia]             = useState(String(t.dia_pagamento))
  const [editandoDataCompra, setEditandoDataCompra] = useState(false)
  const [novaDataCompra, setNovaDataCompra]         = useState(t.data_compra || '')
  const [editandoTipo, setEditandoTipo]   = useState(false)
  const [novoTipo, setNovoTipo]           = useState(t.tipo)
  const [salvando, setSalvando]           = useState(false)
  const tipoEsperadoRef                   = useRef(null)

  const isMobile       = useIsMobile()
  const hoje           = new Date()
  const mesAtualISO    = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const vencida        = t.status === 'pendente' && t.mes_referencia === mesAtualISO && t.dia_pagamento < hoje.getDate()
  const iconBtnMobile  = isMobile ? { minWidth: 44, minHeight: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}

  const valorNum       = Number(t.valor)
  const podeEditarTipo = !t.total_parcelas && !t.recorrente

  // Reset salvando only after the parent re-delivers the updated t.tipo prop,
  // preventing a second click in the gap between API resolve and re-render.
  useEffect(() => {
    if (tipoEsperadoRef.current !== null && t.tipo === tipoEsperadoRef.current) {
      tipoEsperadoRef.current = null
      setSalvando(false)
    }
  }, [t.tipo])

  async function toggleStatus() {
    if (salvando) return
    setSalvando(true)
    try { await onAtualizar({ status: t.status === 'pago' ? 'pendente' : 'pago' }) }
    finally { setSalvando(false) }
  }

  async function toggleRecorrente() {
    if (salvando) return
    setSalvando(true)
    try { await onAtualizar({ recorrente: !t.recorrente }) }
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

  async function salvarSub() {
    const v = novaSub.trim().toLowerCase()
    setSalvando(true)
    try { await onAtualizar({ subcategoria: v || null }) }
    finally { setSalvando(false); setEditandoSub(false) }
  }

  async function salvarDia() {
    const v = parseInt(novoDia, 10)
    if (isNaN(v) || v < 1 || v > 31) { setNovoDia(String(t.dia_pagamento)); setEditandoDia(false); return }
    setSalvando(true)
    try { await onAtualizar({ dia_pagamento: v }) }
    finally { setSalvando(false); setEditandoDia(false) }
  }

  async function salvarDataCompra() {
    if (!novaDataCompra || novaDataCompra === t.data_compra) { setEditandoDataCompra(false); return }
    setSalvando(true)
    try { await onAtualizar({ data_compra: novaDataCompra }) }
    finally { setSalvando(false); setEditandoDataCompra(false) }
  }

  async function salvarTipo() {
    setEditandoTipo(false)
    if (novoTipo === t.tipo) return
    setSalvando(true)
    try { await onAtualizar({ tipo: novoTipo }) }
    finally { setSalvando(false) }
  }

  function handleCancelarParcelas() {
    const hoje = new Date()
    const mesAtualISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
    const estaNoFuturo = t.mes_referencia > mesAtualISO
    const primeira = estaNoFuturo ? t.parcela_atual : t.parcela_atual + 1
    if (primeira > t.total_parcelas) { alert('Não há parcelas futuras para cancelar.'); return }
    if (!confirm(`Isso vai cancelar as parcelas ${primeira}/${t.total_parcelas} até ${t.total_parcelas}/${t.total_parcelas} (as futuras). As já pagas e do mês atual serão mantidas. Confirma?`)) return
    onCancelarParcelas(t.grupo_parcela_id)
  }

  async function moverTipo() {
    if (salvando) return
    const destino   = t.tipo === 'despesa_fixa' ? 'despesa_variavel' : 'despesa_fixa'
    const labelDest = destino === 'despesa_fixa' ? 'Despesas Fixas' : 'Despesas Variáveis'
    tipoEsperadoRef.current = destino
    setSalvando(true)
    try {
      const ok = await onAtualizar({ tipo: destino })
      if (ok) {
        onMoverTipo?.(`Movido para ${labelDest}`)
        // salvando stays true until useEffect detects t.tipo === destino
      } else {
        tipoEsperadoRef.current = null
        setSalvando(false)
      }
    } catch {
      tipoEsperadoRef.current = null
      setSalvando(false)
    }
  }

  return (
    <div style={{
      ...s.linha,
      ...(isMobile ? s.linhaMobile : {}),
      opacity: salvando ? 0.45 : 1,
      ...(vencida ? { background: '#fff1f1' } : {}),
    }}>
      <div style={s.linhaEsq}>
        {editandoDia ? (
          <input
            autoFocus
            aria-label="Dia do vencimento"
            type="number"
            min="1"
            max="31"
            value={novoDia}
            onChange={ev => setNovoDia(ev.target.value)}
            onBlur={salvarDia}
            onKeyDown={ev => {
              if (ev.key === 'Enter') salvarDia()
              if (ev.key === 'Escape') { setNovoDia(String(t.dia_pagamento)); setEditandoDia(false) }
            }}
            style={s.inputDia}
          />
        ) : (
          <CampoEditavel
            style={{ ...s.diaTag, borderColor: cor, color: cor, cursor: 'pointer', ...(isMobile ? { minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}) }}
            onAtivar={() => { setNovoDia(String(t.dia_pagamento)); setEditandoDia(true) }}
            title="Editar o dia"
          >
            {t.dia_pagamento}
          </CampoEditavel>
        )}
        <div style={s.linhaTexto}>
          <div style={s.linhaDescRow}>
            {editandoDesc ? (
              <input
                autoFocus
                aria-label="Descrição do lançamento"
                value={novaDesc}
                onChange={ev => setNovaDesc(ev.target.value)}
                onBlur={salvarDesc}
                onKeyDown={ev => {
                  if (ev.key === 'Enter') salvarDesc()
                  if (ev.key === 'Escape') { setNovaDesc(t.descricao); setEditandoDesc(false) }
                }}
                style={s.inputDesc}
              />
            ) : (
              <CampoEditavel
                onAtivar={() => { setNovaDesc(t.descricao); setEditandoDesc(true) }}
                style={s.linhaDesc}
                title={`Editar descrição: ${t.descricao}`}
              >
                {t.descricao}
                {mostrarRecorrente && t.recorrente && (
                  <span style={{ color: cor, marginLeft: 5, fontSize: 11 }} aria-hidden="true">↺</span>
                )}
              </CampoEditavel>
            )}
            {!editandoDesc && t.total_parcelas && (
              <span style={s.parcelaTag}>{t.parcela_atual}/{t.total_parcelas}</span>
            )}
          </div>

          {editandoCat ? (
            <input
              autoFocus
              aria-label="Categoria do lançamento"
              value={novaCat}
              onChange={ev => setNovaCat(ev.target.value)}
              onBlur={salvarCat}
              onKeyDown={ev => {
                if (ev.key === 'Enter') salvarCat()
                if (ev.key === 'Escape') { setNovaCat(t.categoria || ''); setEditandoCat(false) }
              }}
              style={s.inputCat}
            />
          ) : (
            <div style={s.linhaCatRow}>
              <CampoEditavel
                onAtivar={() => { setNovaCat(t.categoria || ''); setEditandoCat(true) }}
                style={s.linhaCat}
                title={`Editar categoria: ${t.categoria}`}
              >
                {t.categoria}
              </CampoEditavel>
              {editandoSub ? (
                <>
                  <span style={s.catSep}>·</span>
                  <input
                    autoFocus
                    aria-label="Subcategoria do lançamento"
                    value={novaSub}
                    onChange={ev => setNovaSub(ev.target.value)}
                    onBlur={salvarSub}
                    onKeyDown={ev => {
                      if (ev.key === 'Enter') salvarSub()
                      if (ev.key === 'Escape') { setNovaSub(t.subcategoria || ''); setEditandoSub(false) }
                    }}
                    style={s.inputSub}
                  />
                </>
              ) : t.subcategoria?.trim() ? (
                <>
                  <span style={s.catSep}>·</span>
                  <CampoEditavel
                    onAtivar={() => { setNovaSub(t.subcategoria.trim()); setEditandoSub(true) }}
                    style={s.linhaSub}
                    title={`Editar subcategoria: ${t.subcategoria.trim()}`}
                  >
                    {t.subcategoria.trim()}
                  </CampoEditavel>
                </>
              ) : (
                <CampoEditavel
                  onAtivar={() => { setNovaSub(''); setEditandoSub(true) }}
                  style={s.addSub}
                  title="Adicionar subcategoria"
                >+</CampoEditavel>
              )}
              {podeEditarTipo && (
                <>
                  <span style={s.catSep}>·</span>
                  {editandoTipo ? (
                    <select
                      autoFocus
                      value={novoTipo}
                      onChange={ev => setNovoTipo(ev.target.value)}
                      onBlur={salvarTipo}
                      onKeyDown={ev => {
                        if (ev.key === 'Enter') salvarTipo()
                        if (ev.key === 'Escape') { setNovoTipo(t.tipo); setEditandoTipo(false) }
                      }}
                      style={s.selectTipo}
                    >
                      <option value="despesa_fixa">Fixa</option>
                      <option value="despesa_variavel">Variável</option>
                      <option value="credito">Crédito</option>
                      <option value="aplicacao">Aplicação</option>
                    </select>
                  ) : (
                    <CampoEditavel
                      onAtivar={() => { setNovoTipo(t.tipo); setEditandoTipo(true) }}
                      style={s.tipoTag}
                      title={`Mudar o tipo: ${TIPO_SHORT[t.tipo]}`}
                    >
                      {TIPO_SHORT[t.tipo]}
                    </CampoEditavel>
                  )}
                </>
              )}
              {t.cartao_id && cartoesById?.[t.cartao_id] && (
                <>
                  <span style={s.catSep}>·</span>
                  <span style={{ ...s.cartaoBadge, color: cartoesById[t.cartao_id].cor || '#64748b' }} title="Compra no cartão">
                    ▤ {cartoesById[t.cartao_id].nome}
                  </span>
                  <span style={s.catSep}>·</span>
                  {editandoDataCompra ? (
                    <input
                      autoFocus
                      aria-label="Data da compra"
                      type="date"
                      value={novaDataCompra}
                      onChange={ev => setNovaDataCompra(ev.target.value)}
                      onBlur={salvarDataCompra}
                      onKeyDown={ev => {
                        if (ev.key === 'Enter') salvarDataCompra()
                        if (ev.key === 'Escape') { setNovaDataCompra(t.data_compra || ''); setEditandoDataCompra(false) }
                      }}
                      style={s.inputDataCompra}
                    />
                  ) : (
                    <CampoEditavel
                      onAtivar={() => { setNovaDataCompra(t.data_compra || ''); setEditandoDataCompra(true) }}
                      style={s.linhaSub}
                      title={`Corrigir a data da compra (recalcula o vencimento): ${formatarDataCompra(t.data_compra)}`}
                    >
                      compra {formatarDataCompra(t.data_compra)}
                    </CampoEditavel>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...s.linhaDir, ...(isMobile ? { gap: 2, justifyContent: 'flex-end', width: '100%' } : {}) }}>
        {editandoValor ? (
          <input
            autoFocus
            aria-label="Valor do lançamento"
            value={novoValor}
            onChange={ev => setNovoValor(ev.target.value)}
            onBlur={salvarValor}
            onKeyDown={ev => {
              if (ev.key === 'Enter') salvarValor()
              if (ev.key === 'Escape') { setNovoValor(String(t.valor)); setEditandoValor(false) }
            }}
            style={s.inputValor}
          />
        ) : (
          <CampoEditavel
            onAtivar={() => { setNovoValor(String(t.valor)); setEditandoValor(true) }}
            style={{ ...s.linhaValor, color: valorNum < 0 ? '#dc2626' : '#1e293b' }}
            title={`Editar valor: ${fmtSaldo(valorNum)}`}
          >
            {fmtSaldo(valorNum)}
          </CampoEditavel>
        )}

        {mostrarStatus && (
          <button
            onClick={toggleStatus}
            disabled={salvando}
            style={{
              ...s.statusBtn,
              background: t.status === 'pago' ? '#dcfce7' : vencida ? '#fee2e2' : '#fef9c3',
              color:      t.status === 'pago' ? '#15803d' : vencida ? '#b91c1c' : '#5c2400',
              ...(vencida ? { border: '1px solid #fca5a5', fontWeight: 700 } : {}),
              ...(isMobile ? { minHeight: 40, padding: '0 12px', display: 'flex', alignItems: 'center' } : {}),
            }}
          >
            {t.status === 'pago' ? 'Pago' : vencida ? '⚠ Vencida' : 'Pendente'}
          </button>
        )}

        {mostrarRecorrente && !t.total_parcelas && (
          <button
            onClick={toggleRecorrente}
            disabled={salvando}
            style={{ ...s.iconBtn, color: t.recorrente ? cor : '#9ca3af', ...iconBtnMobile }}
            title={t.recorrente ? 'Remover recorrência' : 'Tornar recorrente'}
            aria-label={t.recorrente ? 'Remover recorrência' : 'Tornar recorrente'}
          >↺</button>
        )}

        <button
          onClick={onDuplicar}
          disabled={salvando}
          style={{ ...s.iconBtn, color: '#9ca3af', fontSize: 14, ...iconBtnMobile }}
          title="Duplicar lançamento"
          aria-label="Duplicar lançamento"
        >⧉</button>

        {(t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel') && podeEditarTipo && (
          <button
            onClick={moverTipo}
            disabled={salvando}
            style={{ ...s.iconBtn, color: '#9ca3af', fontSize: 15, ...iconBtnMobile }}
            title={t.tipo === 'despesa_fixa' ? 'Mover para Despesas Variáveis' : 'Mover para Despesas Fixas'}
            aria-label={t.tipo === 'despesa_fixa' ? 'Mover para Despesas Variáveis' : 'Mover para Despesas Fixas'}
          >⇄</button>
        )}

        {t.grupo_parcela_id && (
          <button
            onClick={handleCancelarParcelas}
            disabled={salvando}
            style={{ ...s.iconBtn, color: '#f97316', fontSize: 14, ...iconBtnMobile }}
            title="Cancelar parcelas futuras"
            aria-label="Cancelar parcelas futuras"
          >⊗</button>
        )}

        <button
          onClick={onRemover}
          disabled={removendo}
          style={{ ...s.iconBtn, color: '#9ca3af', ...iconBtnMobile }}
          title="Remover"
          aria-label="Remover lançamento"
        >×</button>
      </div>
    </div>
  )
}

// ── Análise inteligente do mês ────────────────────────────────────────────────

const PONTOS_ANALISE = [
  { chave: 'alerta',               icone: '⚠',  titulo: 'Atenção',                cor: '#dc2626' },
  { chave: 'saldo',                icone: '⇄',  titulo: 'Saldo real vs projetado', cor: '#2563eb' },
  { chave: 'pendencias_vencidas',  icone: '●',  titulo: 'Contas vencidas',         cor: '#dc2626' },
  { chave: 'creditos_pendentes',   icone: '◷',  titulo: 'A receber',              cor: '#7c3aed' },
  { chave: 'dependencia_creditos', icone: '⏳',  titulo: 'Dependência de crédito', cor: '#d97706' },
  { chave: 'concentracao',         icone: '▣',  titulo: 'Maior concentração',     cor: '#0891b2' },
  { chave: 'top_gastos',           icone: '★',  titulo: 'Maiores gastos',          cor: '#475569' },
]

export function BlocoAnalise({ usuarioId, mesSelecionado }) {
  const [analise, setAnalise]       = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]             = useState(null)

  useEffect(() => {
    setAnalise(null)
    setErro(null)
  }, [mesSelecionado])

  async function handleGerar() {
    setCarregando(true)
    setErro(null)
    try {
      const resultado = await gerarAnaliseMes(usuarioId, mesSelecionado)
      setAnalise(resultado)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  const pontosVisiveis = PONTOS_ANALISE.filter(p => analise?.[p.chave])

  return (
    <div style={s.analiseBloco}>
      <div style={s.analiseTopo}>
        <span style={s.analiseTitulo}>Análise do mês</span>
        <button onClick={handleGerar} disabled={carregando} style={s.analiseBotao}>
          {carregando ? 'Analisando...' : analise ? 'Atualizar análise' : 'Gerar análise'}
        </button>
      </div>

      {!analise && !carregando && !erro && (
        <p style={s.analiseDica}>
          Clique em <strong>Gerar análise</strong> para obter uma avaliação inteligente dos dados deste mês.
        </p>
      )}

      {carregando && <p style={s.analiseDica}>Consultando IA... isso leva alguns segundos.</p>}

      {erro && <p style={{ ...s.analiseDica, color: 'var(--status-vencida-fg)' }}>{erro}</p>}

      {analise && (
        <div style={s.analiseConteudo}>
          {analise.resumo && (
            <div style={s.analiseResumo}>
              <span style={{ marginRight: 5 }}>✦</span>
              <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span>, strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong> }}>
                {analise.resumo}
              </ReactMarkdown>
            </div>
          )}
          {pontosVisiveis.length > 0 && <div style={s.analiseSeparador} />}
          {pontosVisiveis.map(p => (
            <div key={p.chave} style={s.analisePonto}>
              <div style={s.analisePontoHeader}>
                <span style={{ color: p.cor, fontSize: 13, lineHeight: 1 }}>{p.icone}</span>
                <span style={{ ...s.analisePontoTitulo, color: p.cor }}>{p.titulo}</span>
              </div>
              <div style={s.analisePontoTexto}>
                <ReactMarkdown
                  components={{
                    p:      ({ children }) => <p style={{ margin: '0 0 4px' }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--text)' }}>{children}</strong>,
                    ul:     ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 16 }}>{children}</ul>,
                    li:     ({ children }) => <li style={{ marginBottom: 1 }}>{children}</li>,
                  }}
                >
                  {analise[p.chave]}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Perguntas sobre finanças ──────────────────────────────────────────────────

export function BlocoPerguntas({ usuarioId }) {
  const [pergunta, setPergunta]     = useState('')
  const [carregando, setCarregando] = useState(false)
  const [historico, setHistorico]   = useState([])
  const [erro, setErro]             = useState(null)

  async function handlePerguntar() {
    if (!pergunta.trim() || carregando) return
    const q = pergunta.trim()
    setPergunta('')
    setCarregando(true)
    setErro(null)
    try {
      const resposta = await perguntarSobreFinancas(usuarioId, q)
      setHistorico(prev => [{ pergunta: q, resposta }, ...prev].slice(0, 3))
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={s.perguntaBloco}>
      <div style={s.perguntaTopo}>
        <span style={s.perguntaTituloLabel}>Pergunte sobre suas finanças</span>
        {historico.length > 0 && (
          <button onClick={() => setHistorico([])} style={s.perguntaLimparBtn}>
            Limpar histórico
          </button>
        )}
      </div>

      <div style={s.perguntaForm}>
        <input
          aria-label="Pergunte sobre suas finanças"
          value={pergunta}
          onChange={ev => setPergunta(ev.target.value)}
          onKeyDown={ev => ev.key === 'Enter' && handlePerguntar()}
          placeholder="Ex: quanto gastei com alimentação?"
          style={s.perguntaInput}
          disabled={carregando}
        />
        <button
          onClick={handlePerguntar}
          disabled={carregando || !pergunta.trim()}
          style={s.perguntaBotao}
        >
          {carregando ? 'Pensando...' : 'Perguntar'}
        </button>
      </div>

      {carregando && <p style={s.perguntaDica}>Consultando seus dados...</p>}
      {erro && <p style={{ ...s.perguntaDica, color: 'var(--status-vencida-fg)' }}>{erro}</p>}

      {historico.length > 0 && (
        <div style={s.perguntaHistorico}>
          {historico.map((item, i) => (
            <div
              key={i}
              style={i > 0
                ? { ...s.perguntaItem, borderTop: '1px solid var(--border)', paddingTop: 14 }
                : s.perguntaItem
              }
            >
              <p style={s.perguntaQ}>✦ {item.pergunta}</p>
              <div style={s.perguntaR}>
                <ReactMarkdown
                  components={{
                    p:      ({ children }) => <p style={{ margin: '0 0 6px' }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--text)' }}>{children}</strong>,
                    ul:     ({ children }) => <ul style={{ margin: '4px 0 6px', paddingLeft: 18 }}>{children}</ul>,
                    li:     ({ children }) => <li style={{ marginBottom: 2, fontSize: 13 }}>{children}</li>,
                  }}
                >
                  {item.resposta}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = {
  // Card-herói (saldo projetado)
  cardHero: {
    position: 'relative', overflow: 'hidden', borderRadius: 14,
    padding: '26px 28px', boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
  },
  cardHeroConteudo: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  cardHeroLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  },
  cardHeroValor: {
    fontSize: 42, fontWeight: 700, lineHeight: 1.1,
    fontFamily: 'Georgia, "Times New Roman", serif', fontVariantNumeric: 'tabular-nums',
  },
  cardHeroSub: { fontSize: 13.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 4 },

  // Cards de saldo
  card: {
    background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.24)',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  cardLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  cardValor: { fontSize: 26, fontWeight: 800, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' },
  cardSub:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },

  // Seção de categorias
  barraItem:   { display: 'flex', flexDirection: 'column', gap: 5 },
  barraHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  barraNome:   { fontSize: 13, fontWeight: 500, color: 'var(--text)', textTransform: 'capitalize' },
  barraInfo:   { fontSize: 13, color: 'var(--text-muted)' },
  barraPct:    { color: 'var(--text-muted)', fontSize: 12, marginLeft: 4 },
  barraTrilho: { height: 7, background: 'var(--surface)', borderRadius: 99, overflow: 'hidden' },
  barraFill:   { height: '100%', borderRadius: 99, transition: 'width 0.5s ease' },

  // Blocos de transações
  bloco:           { background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  blocoTopo:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  blocoTitulo:     { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', paddingTop: 2 },
  blocoTotalValor: { fontSize: 20, fontWeight: 800, color: '#1e293b', fontVariantNumeric: 'tabular-nums' },
  patrimonioLabel: { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right', marginBottom: 2 },
  blocoResumo:     { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  pill:            { padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  separador:       { height: 1, background: 'var(--surface-line)', margin: '10px -20px' },
  blocoVazio:      { margin: '2px 0 0', fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' },
  avisoNegativo:   { display: 'block', fontSize: 10, color: '#dc2626', marginTop: 1, fontStyle: 'italic' },
  aplicSec:        { display: 'flex', flexDirection: 'column', gap: 0 },
  aplicSecTitulo:  { margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' },

  // Linhas
  linha:           { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--surface-line)', gap: 8 },
  // No mobile, empilha o bloco esquerdo (dia/nome/categoria) e o direito (valor/status/ícones)
  // em vez de espremer os dois lado a lado — evita sobreposição quando há muitos ícones de ação
  linhaMobile:     { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  linhaPatrimonio: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--surface-line)' },
  linhaPatrimonioEsq: { display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 },
  linhaEsq:        { display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 },
  diaTag: {
    fontSize: 10, fontWeight: 700, border: '1.5px solid',
    borderRadius: 4, padding: '1px 4px', minWidth: 22,
    textAlign: 'center', flexShrink: 0,
  },
  linhaTexto:  { minWidth: 0, flex: 1 },
  linhaDescRow: { display: 'flex', alignItems: 'flex-start', gap: 6 },
  parcelaTag:  { fontSize: 10, fontWeight: 700, color: '#6366f1', background: '#ede9fe', padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 },
  linhaDesc:   { flex: 1, minWidth: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 14, fontWeight: 600, color: '#1e293b', lineHeight: 1.35, cursor: 'pointer' },
  linhaCatRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  linhaCat:    { fontSize: 11, color: '#94a3b8', textTransform: 'capitalize', cursor: 'pointer', overflowWrap: 'anywhere' },
  catSep:      { fontSize: 10, color: '#9ca3af', flexShrink: 0 },
  linhaSub:    { fontSize: 11, color: '#94a3b8', cursor: 'pointer', overflowWrap: 'anywhere' },
  addSub:      { fontSize: 10, color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: '0 1px' },
  tipoTag:     { fontSize: 11, color: '#a78bfa', cursor: 'pointer', fontStyle: 'italic' },
  cartaoBadge: { fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' },
  selectTipo:  { fontSize: 11, border: '1.5px solid #3b82f6', borderRadius: 4, outline: 'none', background: '#f8fafc', cursor: 'pointer', padding: '1px 2px', fontFamily: 'inherit' },
  linhaDir:    { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  linhaValor:  { fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },

  // Inputs de edição
  inputDia: {
    width: 40, padding: '2px 4px', borderRadius: 4, textAlign: 'center',
    border: '1.5px solid #3b82f6', fontSize: 10, fontWeight: 700,
    outline: 'none', flexShrink: 0,
  },
  inputValor: {
    width: 80, padding: '2px 6px', borderRadius: 5,
    border: '1.5px solid #3b82f6', fontSize: 13, fontWeight: 700,
    textAlign: 'right', outline: 'none',
  },
  inputDesc: {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '1px 5px', borderRadius: 4,
    border: '1.5px solid #3b82f6', fontSize: 13, fontWeight: 600,
    outline: 'none', background: '#f8fafc',
  },
  inputCat: {
    display: 'block', width: 120, marginTop: 2,
    padding: '1px 5px', borderRadius: 4,
    border: '1.5px solid #3b82f6', fontSize: 11,
    outline: 'none', background: '#f8fafc',
  },
  inputSub: {
    width: 110, padding: '1px 5px', borderRadius: 4,
    border: '1.5px solid #3b82f6', fontSize: 11,
    outline: 'none', background: '#f8fafc', fontFamily: 'inherit',
  },
  inputDataCompra: {
    width: 128, padding: '1px 5px', borderRadius: 4,
    border: '1.5px solid #3b82f6', fontSize: 11,
    outline: 'none', background: '#f8fafc', fontFamily: 'inherit',
  },

  statusBtn: {
    padding: '2px 8px', borderRadius: 20, border: 'none',
    fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  iconBtn: {
    background: 'none', border: 'none', fontSize: 16,
    cursor: 'pointer', padding: '6px 8px', lineHeight: 1,
  },

  // Bloco de análise
  analiseBloco: {
    background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.24)',
  },
  analiseTopo: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  analiseTitulo: {
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  },
  analiseBotao: {
    padding: '6px 14px', borderRadius: 6, border: 'none',
    background: 'var(--emerald)', color: 'var(--bg-deep)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  analiseDica:       { margin: 0, fontSize: 13, color: 'var(--text-muted)' },
  analiseConteudo:   { display: 'flex', flexDirection: 'column', gap: 12 },
  analiseResumo:     { margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.55 },
  analiseSeparador:  { height: 1, background: 'var(--border)' },
  analisePonto:      { display: 'flex', flexDirection: 'column', gap: 3 },
  analisePontoHeader: { display: 'flex', alignItems: 'center', gap: 6 },
  analisePontoTitulo: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  analisePontoTexto:  { margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, paddingLeft: 19 },

  // Bloco de perguntas
  perguntaBloco: {
    background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.24)',
  },
  perguntaTopo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  perguntaLimparBtn: {
    background: 'none', border: 'none', fontSize: 11, color: 'var(--text-muted)',
    cursor: 'pointer', padding: 0, textDecoration: 'underline',
  },
  perguntaTituloLabel: {
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  },
  perguntaForm:  { display: 'flex', flexDirection: 'column', gap: 8 },
  perguntaInput: {
    padding: '9px 12px', borderRadius: 6, border: '1.5px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)',
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
  },
  perguntaBotao: {
    alignSelf: 'flex-end',
    padding: '7px 16px', borderRadius: 6, border: 'none',
    background: 'var(--emerald)', color: 'var(--bg-deep)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  perguntaDica:     { margin: '10px 0 0', fontSize: 13, color: 'var(--text-muted)' },
  perguntaHistorico: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 0 },
  perguntaItem:     { paddingBottom: 14 },
  perguntaQ:        { margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' },
  perguntaR:        { margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.65 },
}
