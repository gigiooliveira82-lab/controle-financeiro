import { useState, useRef, useEffect } from 'react'
import { lancarTexto, atualizarTransacao } from '../services/api'
import { fmtBRL } from '../utils/fmt'

function hojeISO() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

function formatarMesNome(mesISO) {
  if (!mesISO) return ''
  const [ano, mes] = mesISO.split('-')
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${nomes[parseInt(mes, 10) - 1]} ${ano}`
}

export default function LancamentoTexto({
  usuarioId,
  onNovaTransacao,
  onAtualizouTransacao,
  cartoes = [],
  transacoes = [],
  cartaoFixo = null,
  semCard = false,
  titulo = null,
  onFechar = null,
  mesSelecionado = null,
}) {
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [transacaoCriada, setTransacaoCriada] = useState(null)
  const [perguntaRecorrente, setPerguntaRecorrente] = useState(false)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const [cartaoId, setCartaoId] = useState(cartaoFixo?.id || '')
  const [dataCompra, setDataCompra] = useState(hojeISO)
  const [avisoFatura, setAvisoFatura] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch (_) {}
      }
    }
  }, [])

  function alternarGravacaoVoz() {
    setErro('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErro('O reconhecimento de voz nativo não é suportado por este navegador. Use o Google Chrome, Edge ou Safari.')
      return
    }

    if (ouvindo) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (_) {}
      }
      setOuvindo(false)
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.lang = 'pt-BR'
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onstart = () => {
        setOuvindo(true)
        setErro('')
      }

      rec.onresult = (event) => {
        let textoTotal = ''
        for (let i = 0; i < event.results.length; i++) {
          textoTotal += event.results[i][0].transcript
        }
        if (textoTotal) {
          setTexto(textoTotal)
        }
      }

      rec.onerror = (e) => {
        setOuvindo(false)
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          setErro('Acesso ao microfone negado. Clique no ícone de permissões ao lado da URL e permita o microfone.')
        } else if (e.error === 'no-speech') {
          // Não silencia ou não considera erro fatal se ainda estiver gravando
        } else if (e.error === 'network') {
          setErro('Erro de conexão com o serviço de voz do navegador.')
        } else if (e.error !== 'aborted') {
          setErro(`Erro no microfone: ${e.error}`)
        }
      }

      rec.onend = () => {
        setOuvindo(false)
      }

      recognitionRef.current = rec
      rec.start()
    } catch (err) {
      setOuvindo(false)
      setErro('Não foi possível iniciar o microfone: ' + err.message)
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!texto.trim()) return

    if (ouvindo && recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (_) {}
      setOuvindo(false)
    }

    setCarregando(true)
    setErro('')
    setFeedback(null)
    setPerguntaRecorrente(false)
    setTransacaoCriada(null)
    setAvisoFatura(null)

    try {
      const cartaoInfo = cartaoId ? { cartao_id: cartaoId, data_compra: dataCompra } : undefined
      const resultado = await lancarTexto(texto.trim(), usuarioId, cartaoInfo)
      const mesRef = resultado.transacao?.mes_referencia
      const mesDiferente = Boolean(mesRef && mesSelecionado && mesRef !== mesSelecionado)

      setFeedback({
        ...resultado.interpretado,
        parcelado:     resultado.parcelado    || false,
        total_geradas: resultado.total_geradas || null,
        mesDiferente,
        nomeMesFatura: mesDiferente ? formatarMesNome(mesRef) : null,
      })
      setTransacaoCriada(resultado.transacao)
      setTexto('')
      setCartaoId(cartaoFixo?.id || '')
      setDataCompra(hojeISO())
      onNovaTransacao(resultado.transacao)

      // Detecta possível duplicidade: uma despesa vinculada a um cartão cujo
      // valor bate perto do total que a fatura desse cartão/mês já soma —
      // sinal de que a fatura inteira foi lançada como se fosse uma compra
      // avulsa, duplicando o que as compras individuais já cobrem.
      const nova = resultado.transacao
      if (nova?.cartao_id) {
        const totalFaturaAntes = transacoes
          .filter(t => t.cartao_id === nova.cartao_id && t.mes_referencia === nova.mes_referencia && t.id !== nova.id)
          .reduce((acc, t) => acc + Number(t.valor), 0)
        if (totalFaturaAntes > 0) {
          const diferenca = Math.abs(Number(nova.valor) - totalFaturaAntes) / totalFaturaAntes
          if (diferenca <= 0.08) {
            const cartaoNome = cartoes.find(c => c.id === nova.cartao_id)?.nome || 'este cartão'
            setAvisoFatura(
              `Isso parece ser a fatura inteira, não uma compra — o valor lançado (${fmtBRL(Number(nova.valor))}) está muito próximo do que as demais compras de ${cartaoNome} já somam neste mês (${fmtBRL(totalFaturaAntes)}). Nada foi apagado automaticamente: revise os lançamentos deste cartão e ajuste ou exclua o que for duplicado.`
            )
          }
        }
      }

      if (resultado.interpretado.tipo === 'despesa_fixa' && !resultado.interpretado.recorrente && !resultado.parcelado) {
        setPerguntaRecorrente(true)
      }
    } catch (err) {
      setErro(err.message || 'Falha ao salvar lançamento.')
    } finally {
      setCarregando(false)
    }
  }

  async function marcarRecorrente(recorrente) {
    if (!transacaoCriada) return
    try {
      await atualizarTransacao(transacaoCriada.id, { recorrente })
      onAtualizouTransacao?.(transacaoCriada.id, { recorrente })
      setPerguntaRecorrente(false)
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <div style={semCard ? s.cardTransparente : s.card}>
      {(titulo || onFechar) && (
        <div style={s.header}>
          {titulo && <span style={s.titulo}>{titulo}</span>}
          {onFechar && (
            <button
              type="button"
              onClick={onFechar}
              style={s.btnFechar}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-pure)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              aria-label="Fechar formulário de lançamento"
            >
              ✕ Fechar
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={s.inputRow}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={ouvindo ? "🎙️ Ouvindo... fale seu lançamento agora..." : "Ex: Aluguel 1500 dia 10, Mercado 250, Salário 5000..."}
            disabled={carregando}
            style={{
              ...s.input,
              borderColor: ouvindo ? '#FC7C78' : 'var(--border)',
            }}
          />
          
          <button
            type="button"
            onClick={alternarGravacaoVoz}
            className={ouvindo ? 'mic-ativo-pulsando' : ''}
            style={{
              ...s.micBtn,
              background: ouvindo ? 'rgba(252, 124, 120, 0.22)' : 'var(--surface-hover)',
              borderColor: ouvindo ? '#FC7C78' : 'var(--border)',
              color: ouvindo ? '#FC7C78' : 'var(--text-muted)',
            }}
            title={ouvindo ? 'Clique para parar a gravação' : 'Lançar por voz (Microfone)'}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill={ouvindo ? "#FC7C78" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>

          <button
            type="submit"
            disabled={carregando || !texto.trim()}
            style={{
              ...s.btnEnviar,
              opacity: (carregando || !texto.trim()) ? 0.6 : 1,
            }}
          >
            {carregando ? 'Salvando...' : 'Lançar'}
          </button>
        </div>

        {ouvindo && (
          <div style={s.ouvindoStatus}>
            <span style={s.pulsoVermelho} />
            <span style={s.ouvindoTexto}>
              Microfone gravando em tempo real — Fale agora e clique em <strong>Lançar</strong> quando terminar.
            </span>
          </div>
        )}

        {cartaoFixo ? (
          <div style={s.cartaoRow}>
            <span style={s.cartaoFixoLabel}>💳 Lançando na fatura de <strong>{cartaoFixo.nome}</strong></span>
          </div>
        ) : cartoes.length > 0 && (
          <div style={s.cartaoRow}>
            <label style={s.cartaoLabel}>Foi no cartão?</label>
            <select
              value={cartaoId}
              onChange={e => setCartaoId(e.target.value)}
              style={s.cartaoSelect}
            >
              <option value="">Não (Dinheiro / Pix / Débito)</option>
              {cartoes.map(c => (
                <option key={c.id} value={c.id}>💳 {c.nome}</option>
              ))}
            </select>
          </div>
        )}
      </form>

      {erro && (
        <div style={s.erroBox}>
          <span>⚠ {erro}</span>
        </div>
      )}

      {feedback && (
        <div style={s.feedback}>
          <span style={s.check}>✓</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span>
              <strong>{feedback.descricao}</strong> — {fmtBRL(feedback.valor)} ({feedback.tipo.replace('_', ' ')})
            </span>
            {feedback.mesDiferente && (
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                💳 Lançado na fatura de {feedback.nomeMesFatura}
              </span>
            )}
          </div>
        </div>
      )}

      {avisoFatura && (
        <div style={s.avisoFaturaBox}>
          <span>⚠ {avisoFatura}</span>
        </div>
      )}

      {perguntaRecorrente && (
        <div style={s.recorrenteBox}>
          <p style={s.recorrenteTexto}>Essa despesa é recorrente todo mês?</p>
          <div style={s.recorrenteBotoes}>
            <button onClick={() => marcarRecorrente(true)} style={s.btnRecSim}>Sim</button>
            <button onClick={() => marcarRecorrente(false)} style={s.btnRecNao}>Não</button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '16px',
    boxShadow: 'var(--card-shadow)',
    boxSizing: 'border-box',
    width: '100%',
  },
  cardTransparente: {
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    padding: 0,
    boxShadow: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-pure)',
    fontFamily: 'var(--font-headline)',
  },
  btnFechar: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
    transition: 'color 0.15s ease',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
  input: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    background: 'var(--surface-raised)',
    color: 'var(--text-pure)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  micBtn: {
    padding: '11px 12px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  btnEnviar: {
    padding: '12px 18px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s ease',
  },
  ouvindoStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: '8px 14px',
    borderRadius: 8,
    background: 'rgba(252, 124, 120, 0.1)',
    border: '1px solid rgba(252, 124, 120, 0.3)',
  },
  pulsoVermelho: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#FC7C78',
    boxShadow: '0 0 8px #FC7C78',
    flexShrink: 0,
  },
  ouvindoTexto: {
    fontSize: 12.5,
    color: '#FC7C78',
    fontWeight: 500,
  },
  cartaoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid var(--border-subtle)',
  },
  cartaoLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  cartaoFixoLabel: {
    fontSize: 12.5,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  cartaoSelect: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface-raised)',
    color: 'var(--text)',
    fontSize: 12,
    outline: 'none',
  },
  erroBox: {
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(252, 124, 120, 0.12)',
    border: '1px solid rgba(252, 124, 120, 0.3)',
    color: 'var(--tertiary)',
    fontSize: 13,
    lineHeight: 1.5,
  },
  feedback: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: '8px 12px',
    borderRadius: 8,
    background: 'var(--status-pago-bg)',
    color: 'var(--primary)',
    fontSize: 13,
  },
  check: {
    fontWeight: 800,
  },
  avisoFaturaBox: {
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 8,
    background: 'var(--status-pendente-bg)',
    border: '1px solid var(--status-pendente-fg)',
    color: 'var(--status-pendente-fg)',
    fontSize: 13,
    lineHeight: 1.5,
  },
  recorrenteBox: {
    marginTop: 12,
    padding: '10px 14px',
    background: 'var(--surface-hover)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recorrenteTexto: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text)',
  },
  recorrenteBotoes: {
    display: 'flex',
    gap: 8,
  },
  btnRecSim: {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  btnRecNao: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 12,
    cursor: 'pointer',
  },
}
