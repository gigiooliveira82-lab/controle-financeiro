import { useState, useEffect } from 'react'
import { buscarContas, criarConta, atualizarConta, removerConta } from '../services/api'
import { fmtBRL } from '../utils/fmt'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { IconContas } from '../components/Icones'

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
  const maisAntiga = contas.length > 0
    ? contas.reduce((antiga, c) => new Date(c.atualizado_em) < new Date(antiga.atualizado_em) ? c : antiga, contas[0])
    : null

  return (
    <div style={s.root}>
      <CabecalhoPagina icone={<IconContas size={20} />} titulo="Contas Correntes" subtitulo="Saldo atual das suas contas bancárias, atualizado manualmente." />

      {contas.length > 0 && (
        <div style={s.totalBloco}>
          <span style={s.totalLabel}>TOTAL EM CONTAS</span>
          <span style={s.totalValor}>{fmtBRL(total)}</span>
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
          + Nova conta
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

  async function handleExcluir() {
    if (!confirm(`Tem certeza que deseja excluir a conta "${conta.nome}"?`)) return
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
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditando(!editando)} style={s.iconBtn} title="Editar nome/cor">✎</button>
          <button onClick={handleExcluir} disabled={excluindo} style={{ ...s.iconBtn, color: 'var(--text-dim)' }} title="Excluir">✕</button>
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
  const [nome, setNome]         = useState(dadosIniciais.nome || '')
  const [saldoAtual, setSaldoAtual] = useState(dadosIniciais.saldo_atual !== undefined ? String(dadosIniciais.saldo_atual) : '0')
  const [cor, setCor]           = useState(dadosIniciais.cor || '#10B981')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')

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
      const dados = { nome: nome.trim(), cor }
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
          <label style={s.label}>
            Nome da Conta
            <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Nubank, Itaú..." style={s.input} />
          </label>
          {!somenteNomeCor && (
            <label style={s.label}>
              Saldo Atual (R$)
              <input required type="text" value={saldoAtual} onChange={e => setSaldoAtual(e.target.value)} placeholder="0" style={s.input} />
            </label>
          )}
          <label style={s.label}>
            Cor
            <input type="color" value={cor} onChange={e => setCor(e.target.value)} style={s.inputCor} />
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
    gap: 4,
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
  },
  totalSub: {
    fontSize: 12.5,
    color: 'var(--text-muted)',
  },
  botaoNovo: {
    display: 'block', width: '100%', padding: '16px',
    borderRadius: 12, border: '1.5px dashed var(--border)',
    background: 'var(--surface)', color: 'var(--primary)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center', boxSizing: 'border-box',
    fontFamily: 'var(--font-headline)',
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
  },
  contaDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  blocoTitulo: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px 6px',
    fontSize: 14,
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-pure)',
    fontSize: 13,
    outline: 'none',
  },
  inputCor: {
    padding: 2,
    height: 38,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    cursor: 'pointer',
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
    color: '#0A0F0D',
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
