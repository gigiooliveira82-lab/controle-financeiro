import { useState, useEffect } from 'react'
import { buscarSonhos, criarSonho, atualizarSonho, guardarValorSonho, removerSonho } from '../services/api'
import { fmtBRL } from '../utils/fmt'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { IconSonhos } from '../components/Icones'
import { useConfirm } from '../components/ModalConfirmacao'

function calcularTempoRestante(dataAlvoISO) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(`${dataAlvoISO}T00:00:00`)

  let meses = (alvo.getFullYear() - hoje.getFullYear()) * 12 + (alvo.getMonth() - hoje.getMonth())
  if (alvo.getDate() < hoje.getDate()) meses -= 1

  const marcador = new Date(hoje.getFullYear(), hoje.getMonth() + meses, hoje.getDate())
  const diasExtra  = Math.round((alvo - marcador) / 86400000)
  const diasTotais = Math.round((alvo - hoje) / 86400000)

  return { meses, diasExtra, diasTotais }
}

function prazoVencido(dataAlvoISO) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(`${dataAlvoISO}T00:00:00`)
  return alvo < hoje
}

function formatarDataAlvo(dataAlvoISO) {
  const [ano, mes, dia] = dataAlvoISO.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarTextoTempo(meses, diasExtra, diasTotais) {
  if (diasTotais < 0) return 'prazo encerrado'
  if (diasTotais === 0) return 'vence hoje'
  if (meses <= 0) {
    return `faltam ${diasTotais} ${diasTotais === 1 ? 'dia' : 'dias'}`
  }
  const parteMes = `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const parteDias = diasExtra > 0 ? ` e ${diasExtra} ${diasExtra === 1 ? 'dia' : 'dias'}` : ''
  return `faltam ${parteMes}${parteDias}`
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
      <CabecalhoPagina icone={<IconSonhos size={20} />} titulo="Meus Sonhos" subtitulo="Metas financeiras planejadas com data e objetivo claro." />
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
          + Adicionar novo sonho
        </button>
      )}

      {sonhos.length === 0 ? (
        <div style={s.placeholder}>
          <p style={{ ...s.placeholderTexto, fontWeight: 600, color: 'var(--text-pure)' }}>Nenhum sonho cadastrado.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Use o botão acima para cadastrar seu primeiro objetivo.</p>
        </div>
      ) : (
        <div style={s.gridSonhos}>
          {sonhos.map(sonho => (
            <CardSonho
              key={sonho.id}
              sonho={sonho}
              onAtualizou={handleAtualizouSonho}
              onRemoveu={handleRemoveuSonho}
            />
          ))}
        </div>
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
  const { meses, diasExtra, diasTotais } = calcularTempoRestante(sonho.data_alvo)
  const vencido    = prazoVencido(sonho.data_alvo)
  const corSonho   = sonho.cor || 'var(--primary)'

  // Cálculo da sugestão de economia mensal — usa os dias reais restantes
  // (÷ 30), não os meses de calendário arredondados: um prazo de "5 meses e
  // 6 dias" precisa considerar os 6 dias extras, senão a sugestão fica
  // inflada (ex.: R$ 2.000/mês em vez de ~R$ 1.961/mês).
  const restante = Math.max(0, total - guardado)
  const valorMensal = diasTotais > 0 ? Math.ceil(restante / (diasTotais / 30)) : restante
  const confirmar = useConfirm()

  async function handleExcluir() {
    const ok = await confirmar({
      titulo: 'Excluir Sonho',
      mensagem: `Tem certeza que deseja excluir o sonho "${sonho.nome}"? Esta ação não pode ser desfeita.`,
      textoConfirmar: 'Excluir Sonho',
      variante: 'danger',
    })
    if (!ok) return

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

  return (
    <div style={{
      ...s.bloco,
      ...(realizado ? s.blocoRealizado : {}),
    }}>
      <div style={s.blocoTopo}>
        <div style={s.blocoNomeRow}>
          <div style={{ ...s.sonhoDot, background: corSonho }} />
          <span style={{ ...s.blocoTitulo, color: realizado ? '#F59E0B' : 'var(--text-pure)' }}>{sonho.nome}</span>
          {realizado && <span style={s.seloRealizado}>★ Conquistado!</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditando(!editando)} style={s.iconBtn} title="Editar">✎</button>
          <button onClick={handleExcluir} disabled={excluindo} style={{ ...s.iconBtn, color: 'var(--text-dim)' }} title="Excluir">✕</button>
        </div>
      </div>

      {editando ? (
        <FormSonho
          titulo={`Editar ${sonho.nome}`}
          dadosIniciais={sonho}
          textoSalvar="Salvar"
          onSalvar={async (dados) => {
            const atualizado = await atualizarSonho(sonho.id, dados)
            onAtualizou(sonho.id, atualizado)
            setEditando(false)
          }}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <>
          <div style={s.progressoTrilha}>
            <div style={{
              ...s.progressoBarra,
              width: `${progresso}%`,
              background: realizado ? '#F59E0B' : corSonho,
            }} />
          </div>

          <div style={s.valores}>
            <span style={{ color: 'var(--text-pure)' }}>{fmtBRL(guardado)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>de {fmtBRL(total)}</span>
          </div>

          <div style={s.infoMeta}>
            <p style={s.dataAlvo}>
              Meta para {formatarDataAlvo(sonho.data_alvo)} · {formatarTextoTempo(meses, diasExtra, diasTotais)}
            </p>
            {!realizado && !vencido && (
              <p style={s.aporteSugerido}>
                Guarde <span style={s.aporteDestaque}>{fmtBRL(valorMensal)}</span> por mês para chegar lá
              </p>
            )}
            {realizado && (
              <p style={{ ...s.aporteSugerido, color: '#F59E0B' }}>
                ★ Meta atingida com sucesso!
              </p>
            )}
          </div>

          <div style={s.separador} />

          {guardando ? (
            <form onSubmit={handleGuardarSubmit} style={s.formGuardar}>
              <input
                type="text"
                placeholder="Valor a guardar (R$)"
                value={valorGuardar}
                onChange={e => setValorGuardar(e.target.value)}
                style={s.inputGuardar}
                autoFocus
              />
              {erroGuardar && <p style={{ color: 'var(--tertiary)', fontSize: 12, margin: 0 }}>{erroGuardar}</p>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="submit" disabled={salvandoGuardar} style={s.btnSalvarPequeno}>
                  {salvandoGuardar ? 'Guardando...' : 'Confirmar'}
                </button>
                <button type="button" onClick={() => setGuardando(false)} style={s.btnCancelarPequeno}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setGuardando(true)} style={s.botaoGuardar}>
              + Guardei dinheiro
            </button>
          )}
        </>
      )}
    </div>
  )
}

function FormSonho({ titulo, dadosIniciais = {}, textoSalvar, onSalvar, onCancelar }) {
  const [nome, setNome]               = useState(dadosIniciais.nome || '')
  const [valorTotal, setValorTotal]   = useState(dadosIniciais.valor_total ? String(dadosIniciais.valor_total) : '')
  const [valorGuardado, setValorGuardado] = useState(dadosIniciais.valor_guardado ? String(dadosIniciais.valor_guardado) : '0')
  const [dataAlvo, setDataAlvo]       = useState(dadosIniciais.data_alvo || '')
  const [cor, setCor]                 = useState(dadosIniciais.cor || '#10B981')
  const [salvando, setSalvando]       = useState(false)
  const [erro, setErro]               = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const total = parseFloat(valorTotal.replace(',', '.'))
    const guard = parseFloat(valorGuardado.replace(',', '.'))
    if (!nome.trim() || isNaN(total) || total <= 0 || !dataAlvo) {
      setErro('Preencha os campos obrigatórios')
      return
    }
    setSalvando(true)
    try {
      await onSalvar({
        nome: nome.trim(),
        valor_total: total,
        valor_guardado: isNaN(guard) ? 0 : guard,
        data_alvo: dataAlvo,
        cor,
      })
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
            Nome da Meta
            <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Viagem, Carro..." style={s.input} />
          </label>
        </div>
        <div style={s.formRow}>
          <label style={s.label}>
            Valor Total (R$)
            <input required type="text" value={valorTotal} onChange={e => setValorTotal(e.target.value)} placeholder="5000" style={s.input} />
          </label>
          <label style={s.label}>
            Já Guardado (R$)
            <input type="text" value={valorGuardado} onChange={e => setValorGuardado(e.target.value)} placeholder="0" style={s.input} />
          </label>
          <label style={s.label}>
            Data Alvo
            <input required type="date" value={dataAlvo} onChange={e => setDataAlvo(e.target.value)} style={s.input} />
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
  gridSonhos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
    gap: 12,
  },
  blocoRealizado: {
    border: '1.5px solid #F59E0B',
    background: 'rgba(245, 158, 11, 0.05)',
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
  sonhoDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  blocoTitulo: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
  },
  seloRealizado: {
    fontSize: 11,
    fontWeight: 700,
    color: '#F59E0B',
    background: 'rgba(245, 158, 11, 0.15)',
    padding: '2px 8px',
    borderRadius: 99,
  },
  progressoTrilha: {
    height: 8,
    background: 'var(--surface-hover)',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressoBarra: {
    height: '100%',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  },
  valores: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
  },
  infoMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: -4,
  },
  dataAlvo: {
    margin: 0,
    fontSize: 12.5,
    color: 'var(--text-muted)',
  },
  aporteSugerido: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text)',
    fontWeight: 500,
  },
  aporteDestaque: {
    color: 'var(--primary)',
    fontWeight: 700,
  },
  separador: {
    height: 1,
    background: 'var(--border-subtle)',
    margin: '4px 0',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px 6px',
    fontSize: 14,
  },
  botaoGuardar: {
    width: '100%',
    padding: '10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-hover)',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  formGuardar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  inputGuardar: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-raised)',
    color: 'var(--text-pure)',
    fontSize: 13,
    outline: 'none',
  },
  btnSalvarPequeno: {
    flex: 1,
    padding: '8px',
    borderRadius: 6,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  btnCancelarPequeno: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 12,
    cursor: 'pointer',
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
    colorScheme: 'inherit',
    fontSize: 13,
    outline: 'none',
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
