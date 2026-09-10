import { useState, useEffect } from 'react'
import { buscarContas, criarConta, atualizarConta, removerConta } from '../services/api'
import { fmtBRL } from '../utils/fmt'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { IconContas, IconEditar, IconLixeira, IconCorrente, IconPoupanca, IconPlus } from '../components/Icones'
import { useConfirm } from '../components/ModalConfirmacao'

function formatarData(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function diasDesde(iso) {
  if (!iso) return Infinity
  const agora = new Date()
  const data = new Date(iso)
  return Math.floor((agora - data) / 86400000)
}

export default function PaginaContas({ usuarioId }) {
  const [contas, setContas]         = useState([])
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido]   = useState(false)

  useEffect(() => {
    if (!usuarioId) return
    setCarregando(true)
    buscarContas(usuarioId)
      .then(setContas)
      .catch(err => console.error('Erro ao buscar contas:', err.message))
      .finally(() => setCarregando(false))
  }, [usuarioId])

  function handleNovaConta(nova) {
    setContas(prev => [...prev, nova])
    setExpandido(false)
  }

  function handleAtualizouConta(id, dados) {
    setContas(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c))
  }

  function handleRemoveuConta(id) {
    setContas(prev => prev.filter(c => c.id !== id))
  }

  if (carregando) {
    return (
      <div style={s.placeholder}>
        <p style={s.placeholderTexto}>Carregando contas...</p>
      </div>
    )
  }

  const total = contas.reduce((acc, c) => acc + Number(c.saldo_atual), 0)
  const totalCorrente = contas.filter(c => c.tipo !== 'poupanca').reduce((acc, c) => acc + Number(c.saldo_atual), 0)
  const totalPoupanca = contas.filter(c => c.tipo === 'poupanca').reduce((acc, c) => acc + Number(c.saldo_atual), 0)
  const maisAntiga = contas.length > 0
    ? contas.reduce((antiga, c) => new Date(c.atualizado_em) < new Date(antiga.atualizado_em) ? c : antiga, contas[0])
    : null

  return (
    <div style={s.root}>
      <CabecalhoPagina icone={<IconContas size={20} />} titulo="Contas" subtitulo="Saldo atual das suas contas bancárias (Corrente e Poupança), atualizado manualmente." />

      {contas.length > 0 && (
        <div style={s.totalBloco}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={s.totalLabel}>TOTAL EM CONTAS</span>
              <span style={s.totalValor}>{fmtBRL(total)}</span>
            </div>
            <div style={s.subtotaisWrap}>
              <span style={s.subtotalBadgeCorrente}>
                <IconCorrente size={13} color="var(--primary)" />
                Corrente: <strong>{fmtBRL(totalCorrente)}</strong>
              </span>
              <span style={s.subtotalBadgePoupanca}>
                <IconPoupanca size={13} color="var(--primary)" />
                Poupança: <strong>{fmtBRL(totalPoupanca)}</strong>
              </span>
            </div>
          </div>
          <span style={s.totalSub}>
            Atualização mais antiga: {formatarData(maisAntiga?.atualizado_em)}
          </span>
        </div>
      )}

      {expandido ? (
        <FormConta
          titulo="Nova conta"
          textoSalvar="Salvar conta"
          onSalvar={async (dados) => {
            const nova = await criarConta({ ...dados, usuario_id: usuarioId })
            handleNovaConta(nova)
          }}
          onCancelar={() => setExpandido(false)}
        />
      ) : (
        <button onClick={() => setExpandido(true)} style={s.botaoNovo}>
          <IconPlus size={16} />
          <span>Nova conta</span>
        </button>
      )}


      {contas.length === 0 ? (
        <div style={s.placeholder}>
          <p style={{ ...s.placeholderTexto, fontWeight: 600, color: 'var(--text-pure)' }}>Nenhuma conta cadastrada.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Use o botão acima para cadastrar sua primeira conta.</p>
        </div>
      ) : (
        <div style={s.gridContas}>
          {contas.map(conta => (
            <CardConta
              key={conta.id}
              conta={conta}
              onAtualizou={handleAtualizouConta}
              onRemoveu={handleRemoveuConta}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CardConta({ conta, onAtualizou, onRemoveu }) {
  const [editando, setEditando]         = useState(false)
  const [excluindo, setExcluindo]       = useState(false)
  const [editandoSaldo, setEditandoSaldo] = useState(false)
  const [novoSaldo, setNovoSaldo]       = useState(String(conta.saldo_atual))
  const [salvandoSaldo, setSalvandoSaldo] = useState(false)

  const corConta = conta.cor || 'var(--primary)'
  const defasada = diasDesde(conta.atualizado_em) > 7
  const isPoupanca = conta.tipo === 'poupanca'
  const confirmar = useConfirm()

  async function handleExcluir() {
    const ok = await confirmar({
      titulo: 'Excluir Conta',
      mensagem: `Tem certeza que deseja excluir a conta "${conta.nome}"? Esta ação não pode ser desfeita.`,
      textoConfirmar: 'Excluir Conta',
      variante: 'danger',
    })
    if (!ok) return

    setExcluindo(true)
    try {
      await removerConta(conta.id)
      onRemoveu(conta.id)
    } catch (err) {
      alert('Erro ao excluir conta: ' + err.message)
      setExcluindo(false)
    }
  }

  async function salvarSaldo() {
    const valor = Number(novoSaldo.replace(',', '.'))
    if (!Number.isFinite(valor)) {
      setNovoSaldo(String(conta.saldo_atual))
      setEditandoSaldo(false)
      return
    }
    setSalvandoSaldo(true)
    try {
      const atualizada = await atualizarConta(conta.id, { saldo_atual: valor })
      onAtualizou(conta.id, atualizada)
    } catch (err) {
      alert('Erro ao atualizar saldo: ' + err.message)
    } finally {
      setSalvandoSaldo(false)
      setEditandoSaldo(false)
    }
  }

  return (
    <div style={s.bloco}>
      <div style={s.blocoTopo}>
        <div style={s.blocoNomeRow}>
          <div style={{ ...s.contaDot, background: corConta }} />
          <span style={s.blocoTitulo}>{conta.nome}</span>
          <span style={{
            ...s.badgeTipo,
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--primary)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
          }}>
            {isPoupanca ? <IconPoupanca size={12} /> : <IconCorrente size={12} />}
            <span>{isPoupanca ? 'Poupança' : 'Corrente'}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setEditando(!editando)}
            style={s.iconBtn}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-pure)'; e.currentTarget.style.background = 'var(--surface-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            title="Editar nome, tipo ou cor"
          >
            <IconEditar size={15} />
          </button>
          <button
            onClick={handleExcluir}
            disabled={excluindo}
            style={{ ...s.iconBtn, color: 'var(--text-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FC7C78'; e.currentTarget.style.background = 'rgba(252, 124, 120, 0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}
            title="Excluir conta"
          >
            <IconLixeira size={15} />
          </button>
        </div>
      </div>

      {editando ? (
        <FormConta
          titulo={`Editar ${conta.nome}`}
          dadosIniciais={conta}
          textoSalvar="Salvar"
          somenteNomeCor
          onSalvar={async (dados) => {
            const atualizada = await atualizarConta(conta.id, dados)
            onAtualizou(conta.id, atualizada)
            setEditando(false)
          }}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <>
          {editandoSaldo ? (
            <input
              autoFocus
              aria-label="Saldo atual da conta"
              value={novoSaldo}
              onChange={e => setNovoSaldo(e.target.value)}
              onBlur={salvarSaldo}
              onKeyDown={e => {
                if (e.key === 'Enter') salvarSaldo()
                if (e.key === 'Escape') { setNovoSaldo(String(conta.saldo_atual)); setEditandoSaldo(false) }
              }}
              disabled={salvandoSaldo}
              style={s.inputSaldo}
            />
          ) : (
            <span
              role="button"
              tabIndex={0}
              onClick={() => { setNovoSaldo(String(conta.saldo_atual)); setEditandoSaldo(true) }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setNovoSaldo(String(conta.saldo_atual)); setEditandoSaldo(true) } }}
              style={s.saldoValor}
              title="Clique para atualizar o saldo"
            >
              {fmtBRL(Number(conta.saldo_atual))}
            </span>
          )}

          <p style={{ ...s.atualizadoEm, ...(defasada ? s.atualizadoEmAlerta : {}) }}>
            Atualizado em {formatarData(conta.atualizado_em)}
            {defasada ? ' · Pode estar desatualizado' : ''}
          </p>
        </>
      )}
    </div>
  )
}

function FormConta({ titulo, dadosIniciais = {}, textoSalvar, onSalvar, onCancelar, somenteNomeCor = false }) {
  const [nome, setNome]             = useState(dadosIniciais.nome || '')
  const [tipo, setTipo]             = useState(dadosIniciais.tipo || 'corrente')
  const [saldoAtual, setSaldoAtual] = useState(dadosIniciais.saldo_atual !== undefined ? String(dadosIniciais.saldo_atual) : '0')
  const [cor, setCor]               = useState(dadosIniciais.cor || '#10B981')
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) {
      setErro('Informe o nome da conta')
      return
    }
    const saldo = somenteNomeCor ? undefined : parseFloat(saldoAtual.replace(',', '.'))
    if (!somenteNomeCor && isNaN(saldo)) {
      setErro('Saldo inválido')
      return
    }
    setSalvando(true)
    try {
      const dados = { nome: nome.trim(), tipo, cor }
      if (!somenteNomeCor) dados.saldo_atual = saldo
      await onSalvar(dados)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={s.formWrap}>
      <h4 style={s.formTitulo}>{titulo}</h4>
      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.formRow}>
          <label style={{ ...s.label, flex: '2 1 180px' }}>
            Nome da Conta
            <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Nubank, Itaú, Caixa..." style={s.input} />
          </label>

          <label style={{ ...s.label, flex: '0 0 auto' }}>
            Tipo de Conta
            <div style={s.tipoContaGroup}>
              <button
                type="button"
                onClick={() => setTipo('corrente')}
                style={{
                  ...s.tipoContaBtn,
                  ...(tipo === 'corrente' ? s.tipoContaBtnAtivoCorrente : {}),
                }}
              >
                <IconCorrente size={14} />
                <span>Conta Corrente</span>
              </button>
              <button
                type="button"
                onClick={() => setTipo('poupanca')}
                style={{
                  ...s.tipoContaBtn,
                  ...(tipo === 'poupanca' ? s.tipoContaBtnAtivoPoupanca : {}),
                }}
              >
                <IconPoupanca size={14} />
                <span>Conta Poupança</span>
              </button>
            </div>
          </label>

          {!somenteNomeCor && (
            <label style={{ ...s.label, flex: '1 1 130px', maxWidth: 160 }}>
              Saldo Atual (R$)
              <input required type="text" value={saldoAtual} onChange={e => setSaldoAtual(e.target.value)} placeholder="0" style={s.input} />
            </label>
          )}

          <label style={{ ...s.label, flex: '0 0 48px', width: 48 }}>
            Cor
            <input type="color" value={cor} onChange={e => setCor(e.target.value)} style={s.inputCor} title="Escolher cor da conta" />
          </label>
        </div>

        {erro && <p style={{ color: 'var(--tertiary)', fontSize: 13, margin: 0 }}>{erro}</p>}

        <div style={s.formBotoes}>
          <button type="submit" disabled={salvando} style={s.botaoSalvar}>
            {salvando ? 'Salvando...' : textoSalvar}
          </button>
          <button type="button" onClick={onCancelar} style={s.botaoCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', gap: 20 },
  gridContas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
  },
  placeholder: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '48px 24px',
    textAlign: 'center',
  },
  placeholderTexto: { margin: 0, color: 'var(--text-muted)' },
  totalBloco: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '18px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.07em',
  },
  totalValor: {
    fontFamily: 'var(--font-headline)',
    fontSize: 32,
    fontWeight: 800,
    color: 'var(--text-pure)',
    letterSpacing: '-0.01em',
    display: 'block',
  },
  subtotaisWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  subtotalBadgeCorrente: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'var(--text-muted)',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    padding: '5px 12px',
    borderRadius: 8,
  },
  subtotalBadgePoupanca: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'var(--text-muted)',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    padding: '5px 12px',
    borderRadius: 8,
  },
  totalSub: {
    fontSize: 12.5,
    color: 'var(--text-muted)',
  },
  botaoNovo: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    transition: 'all 0.15s ease',
  },
  bloco: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  blocoTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blocoNomeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  contaDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  blocoTitulo: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  badgeTipo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '2px 8px',
    borderRadius: 6,
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: 6,
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  saldoValor: {
    fontFamily: 'var(--font-headline)',
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--text-pure)',
    cursor: 'pointer',
  },
  inputSaldo: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1.5px solid var(--primary)',
    background: 'var(--surface-raised)',
    color: 'var(--text-pure)',
    fontSize: 22,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  atualizadoEm: {
    margin: 0,
    fontSize: 12.5,
    color: 'var(--text-muted)',
  },
  atualizadoEmAlerta: {
    color: 'var(--status-pendente-fg)',
    fontWeight: 600,
  },
  formWrap: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '20px',
  },
  formTitulo: {
    margin: '0 0 14px',
    fontSize: 15,
    color: 'var(--text-pure)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  formRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  tipoContaGroup: {
    display: 'flex',
    gap: 6,
  },
  tipoContaBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-muted)',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    height: 38,
  },
  tipoContaBtnAtivoCorrente: {
    background: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
  },
  tipoContaBtnAtivoPoupanca: {
    background: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
  },

  input: {
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    fontSize: 13,
    color: 'var(--text-pure)',
    outline: 'none',
    boxSizing: 'border-box',
    height: 38,
    width: '100%',
  },
  inputCor: {
    padding: 2,
    height: 38,
    width: 48,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  formBotoes: {
    display: 'flex',
    gap: 10,
    marginTop: 6,
  },
  botaoSalvar: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  botaoCancelar: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    cursor: 'pointer',
  },
}

