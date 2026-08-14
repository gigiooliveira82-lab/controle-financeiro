import { useState, useEffect } from 'react'
import { buscarSonhos, criarSonho, atualizarSonho, guardarValorSonho, removerSonho } from '../services/api'
import { fmtBRL } from '../utils/fmt'
import CabecalhoPagina from '../components/CabecalhoPagina'

function calcularMesesRestantes(dataAlvoISO) {
  const hoje = new Date()
  const alvo = new Date(`${dataAlvoISO}T00:00:00`)
  let meses = (alvo.getFullYear() - hoje.getFullYear()) * 12 + (alvo.getMonth() - hoje.getMonth())
  if (alvo.getDate() < hoje.getDate()) meses -= 1
  return meses
}

// A data alvo já passou de verdade (comparação por dia, sem hora) — só nesse
// caso a meta está de fato vencida. calcularMesesRestantes pode arredondar
// para 0 mesmo com o prazo ainda em aberto (ex: faltam 6 dias), então não dá
// pra usar "meses <= 0" sozinho para decidir se venceu.
function prazoVencido(dataAlvoISO) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(`${dataAlvoISO}T00:00:00`)
  return alvo < hoje
}

function diasRestantes(dataAlvoISO) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(`${dataAlvoISO}T00:00:00`)
  return Math.round((alvo - hoje) / 86400000)
}

function formatarDataAlvo(dataAlvoISO) {
  const [ano, mes, dia] = dataAlvoISO.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function PaginaSonhos({ usuarioId }) {
  const [sonhos, setSonhos]         = useState([])
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido]   = useState(false)

  useEffect(() => {
    if (!usuarioId) return
    setCarregando(true)
    buscarSonhos(usuarioId)
      .then(setSonhos)
      .catch(err => console.error('Erro ao buscar sonhos:', err.message))
      .finally(() => setCarregando(false))
  }, [usuarioId])

  function handleNovoSonho(novo) {
    setSonhos(prev => [...prev, novo])
    setExpandido(false)
  }

  function handleAtualizouSonho(id, dados) {
    setSonhos(prev => prev.map(s => s.id === id ? { ...s, ...dados } : s))
  }

  function handleRemoveuSonho(id) {
    setSonhos(prev => prev.filter(s => s.id !== id))
  }

  if (carregando) {
    return (
      <div style={s.placeholder}>
        <p style={s.placeholderTexto}>Carregando sonhos...</p>
      </div>
    )
  }

  return (
    <div style={s.root}>
      <CabecalhoPagina icone="★" titulo="Meus Sonhos" subtitulo="Metas com prazo, guardadas aos poucos." />
      {expandido ? (
        <FormSonho
          titulo="Novo sonho"
          textoSalvar="Salvar sonho"
          onSalvar={async (dados) => {
            const novo = await criarSonho({ ...dados, usuario_id: usuarioId })
            handleNovoSonho(novo)
          }}
          onCancelar={() => setExpandido(false)}
        />
      ) : (
        <button onClick={() => setExpandido(true)} style={s.botaoNovo}>
          + Novo sonho
        </button>
      )}

      {sonhos.length === 0 ? (
        <div style={s.placeholder}>
          <p style={{ ...s.placeholderTexto, fontWeight: 600, color: '#334155' }}>Nenhum sonho cadastrado.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Use o botão acima para cadastrar seu primeiro objetivo.</p>
        </div>
      ) : (
        sonhos.map(sonho => (
          <CardSonho
            key={sonho.id}
            sonho={sonho}
            onAtualizou={handleAtualizouSonho}
            onRemoveu={handleRemoveuSonho}
          />
        ))
      )}
    </div>
  )
}

function CardSonho({ sonho, onAtualizou, onRemoveu }) {
  const [editando, setEditando]     = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [excluindo, setExcluindo]   = useState(false)
  const [valorGuardar, setValorGuardar] = useState('')
  const [salvandoGuardar, setSalvandoGuardar] = useState(false)
  const [erroGuardar, setErroGuardar] = useState('')

  const total      = Number(sonho.valor_total)
  const guardado   = Number(sonho.valor_guardado)
  const realizado  = guardado >= total
  const progresso  = Math.min(100, (guardado / total) * 100)
  const meses      = calcularMesesRestantes(sonho.data_alvo)
  const vencido    = prazoVencido(sonho.data_alvo)
  const dias       = diasRestantes(sonho.data_alvo)
  const corSonho   = sonho.cor || 'var(--verde-profundo)'

  async function handleExcluir() {
    if (!confirm(`Tem certeza que deseja excluir o sonho "${sonho.nome}"?`)) return
    setExcluindo(true)
    try {
      await removerSonho(sonho.id)
      onRemoveu(sonho.id)
    } catch (err) {
      alert('Erro ao excluir sonho: ' + err.message)
      setExcluindo(false)
    }
  }

  async function handleGuardarSubmit(e) {
    e.preventDefault()
    setErroGuardar('')
    const valor = Number(valorGuardar.replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) {
      setErroGuardar('Informe um valor maior que zero')
      return
    }
    setSalvandoGuardar(true)
    try {
      const atualizado = await guardarValorSonho(sonho.id, valor)
      onAtualizou(sonho.id, atualizado)
      setValorGuardar('')
      setGuardando(false)
    } catch (err) {
      setErroGuardar(err.message)
    } finally {
      setSalvandoGuardar(false)
    }
  }

  if (editando) {
    return (
      <FormSonho
        inicial={sonho}
        titulo={`Editar ${sonho.nome}`}
        textoSalvar="Salvar alterações"
        onSalvar={async (dados) => {
          const atualizado = await atualizarSonho(sonho.id, dados)
          onAtualizou(sonho.id, atualizado)
          setEditando(false)
        }}
        onCancelar={() => setEditando(false)}
      />
    )
  }

  return (
    <div style={{ ...s.bloco, ...(realizado ? s.blocoRealizado : { borderLeft: `4px solid ${corSonho}` }) }}>
      <div style={s.blocoTopo}>
        <div style={s.blocoNomeRow}>
          <span style={{ ...s.blocoTitulo, color: realizado ? '#B8860B' : corSonho }}>{sonho.nome}</span>
          {realizado && <span style={s.seloRealizado}>🎉 Sonho realizado!</span>}
          <button onClick={() => setEditando(true)} style={s.iconBtn} title="Editar sonho" aria-label={`Editar sonho: ${sonho.nome}`}>✎</button>
          <button onClick={handleExcluir} disabled={excluindo} style={s.iconBtn} title="Excluir sonho" aria-label={`Excluir sonho: ${sonho.nome}`}>×</button>
        </div>
      </div>

      <div style={s.progressoTrilha}>
        <div style={{ ...s.progressoBarra, width: `${progresso}%`, background: realizado ? '#D4AF37' : corSonho }} />
      </div>

      <p style={s.valores}>{fmtBRL(guardado)} de {fmtBRL(total)}</p>

      <p style={s.dataAlvo}>
        Meta para {formatarDataAlvo(sonho.data_alvo)}
        {!realizado && !vencido && (
          meses > 0
            ? ` · faltam ${meses} ${meses === 1 ? 'mês' : 'meses'}`
            : ` · faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`
        )}
      </p>

      {!realizado && (
        vencido ? (
          <p style={s.mensalAlerta}>Prazo já passou — hora de revisar a meta</p>
        ) : meses > 0 ? (
          <p style={s.mensal}>Guarde {fmtBRL(Math.ceil((total - guardado) / meses))} por mês para chegar lá</p>
        ) : (
          <p style={s.mensal}>Guarde {fmtBRL(Math.ceil(total - guardado))} até o prazo para chegar lá</p>
        )
      )}

      <div style={s.separador} />

      {guardando ? (
        <form onSubmit={handleGuardarSubmit} style={s.formGuardar}>
          <input
            aria-label="Valor guardado"
            type="number" step="0.01" min="0.01"
            placeholder="Valor guardado (ex: 200)"
            value={valorGuardar}
            onChange={(e) => setValorGuardar(e.target.value)}
            style={s.inputGuardar}
            disabled={salvandoGuardar}
            autoFocus
          />
          {erroGuardar && <div style={s.erroBox}>{erroGuardar}</div>}
          <div style={s.formBotoes}>
            <button type="submit" style={s.botaoSalvar} disabled={salvandoGuardar}>
              {salvandoGuardar ? 'Salvando...' : 'Confirmar'}
            </button>
            <button type="button" style={s.botaoCancelar} onClick={() => { setGuardando(false); setErroGuardar('') }} disabled={salvandoGuardar}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setGuardando(true)} style={s.botaoGuardar}>
          + Guardei dinheiro
        </button>
      )}
    </div>
  )
}

function FormSonho({ inicial, titulo, textoSalvar, onSalvar, onCancelar }) {
  const [nome, setNome]           = useState(inicial?.nome || '')
  const [valorTotal, setValorTotal] = useState(inicial ? String(inicial.valor_total) : '')
  const [dataAlvo, setDataAlvo]   = useState(inicial?.data_alvo || '')
  const [cor, setCor]             = useState(inicial?.cor || '#1F5D45')
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    const total = Number(valorTotal.replace(',', '.'))
    if (!nome.trim()) { setErro('Informe o nome do sonho'); return }
    if (!Number.isFinite(total) || total <= 0) { setErro('Valor total deve ser maior que zero'); return }
    if (!dataAlvo) { setErro('Informe a data alvo'); return }

    setSalvando(true)
    try {
      await onSalvar({ nome: nome.trim(), valor_total: total, data_alvo: dataAlvo, cor })
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <h2 style={s.formTitulo}>{titulo}</h2>

      <input
        aria-label="Nome do sonho"
        placeholder="Nome do sonho (ex: Viagem para a praia)"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={s.input}
        disabled={salvando}
      />

      <div style={s.formRow}>
        <label style={s.label}>
          Valor total
          <input
            type="number" step="0.01" min="0.01"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            style={s.inputPequeno}
            disabled={salvando}
          />
        </label>
        <label style={s.label}>
          Data alvo
          <input
            type="date"
            value={dataAlvo}
            onChange={(e) => setDataAlvo(e.target.value)}
            style={s.inputPequeno}
            disabled={salvando}
          />
        </label>
        <label style={s.label}>
          Cor
          <input
            type="color"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            style={s.inputCor}
            disabled={salvando}
          />
        </label>
      </div>

      {erro && <div style={s.erroBox}>{erro}</div>}

      <div style={s.formBotoes}>
        <button type="submit" style={s.botaoSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : textoSalvar}
        </button>
        <button type="button" style={s.botaoCancelar} onClick={onCancelar} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', gap: 20, width: '100%', boxSizing: 'border-box' },
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

  form: {
    background: '#fff', borderRadius: 12, padding: '24px 28px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: 12,
    width: '100%', boxSizing: 'border-box',
  },
  formTitulo: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  formRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  input: {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 8,
    border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 600 },
  inputPequeno: {
    width: 140, maxWidth: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  },
  inputCor: { width: 60, height: 36, padding: 2, borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' },
  erroBox: {
    padding: '10px 14px', borderRadius: 8,
    background: '#fef2f2', color: '#dc2626',
    fontSize: 14, border: '1px solid #fecaca',
  },
  formBotoes: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  botaoSalvar: {
    padding: '10px 18px', borderRadius: 8, border: 'none',
    background: 'var(--verde-profundo)', color: 'var(--creme-header)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  botaoCancelar: {
    padding: '10px 18px', borderRadius: 8, border: '1px solid #ddd',
    background: '#fff', color: '#64748b', fontSize: 14, cursor: 'pointer',
  },

  bloco: {
    background: '#fff', borderRadius: 10, padding: '16px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)', width: '100%', boxSizing: 'border-box',
  },
  blocoRealizado: {
    border: '2px solid #D4AF37',
    background: 'linear-gradient(135deg, #fffdf5 0%, #fff 60%)',
  },
  blocoTopo:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  blocoNomeRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  blocoTitulo:  { fontSize: 16, fontWeight: 700 },
  seloRealizado: {
    fontSize: 12, fontWeight: 700, color: '#B8860B',
    background: '#FEF3C7', borderRadius: 20, padding: '3px 10px',
  },

  progressoTrilha: {
    marginTop: 12, height: 10, borderRadius: 6,
    background: '#EEF2F0', overflow: 'hidden',
  },
  progressoBarra: { height: '100%', borderRadius: 6, transition: 'width 0.3s ease' },

  valores: { margin: '10px 0 0', fontSize: 15, fontWeight: 700, color: '#1e293b' },
  dataAlvo: { margin: '4px 0 0', fontSize: 12, color: '#94a3b8' },
  mensal: { margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--verde-profundo)' },
  mensalAlerta: { margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: '#dc2626' },

  separador: { height: 1, background: 'var(--surface-line)', margin: '14px -20px' },

  iconBtn: {
    background: 'none', border: 'none', fontSize: 14,
    color: '#9ca3af', cursor: 'pointer', padding: '4px 6px', lineHeight: 1,
  },

  botaoGuardar: {
    display: 'block', width: '100%', padding: '10px',
    borderRadius: 8, border: '1px solid #BDD5CC',
    background: '#fff', color: 'var(--verde-profundo)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center', boxSizing: 'border-box',
  },
  formGuardar: { display: 'flex', flexDirection: 'column', gap: 8 },
  inputGuardar: {
    width: '100%', boxSizing: 'border-box',
    padding: '8px 10px', borderRadius: 8,
    border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
}
