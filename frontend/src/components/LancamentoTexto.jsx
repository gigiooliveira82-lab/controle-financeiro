import { useState, useRef, useEffect } from 'react'
import { lancarTexto, atualizarTransacao } from '../services/api'
import { fmtBRL } from '../utils/fmt'

function hojeISO() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

export default function LancamentoTexto({ usuarioId, onNovaTransacao, onAtualizouTransacao, cartoes = [] }) {
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [transacaoCriada, setTransacaoCriada] = useState(null)
  const [perguntaRecorrente, setPerguntaRecorrente] = useState(false)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const [cartaoId, setCartaoId] = useState('')
  const [dataCompra, setDataCompra] = useState(hojeISO)
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

    try {
      const cartaoInfo = cartaoId ? { cartao_id: cartaoId, data_compra: dataCompra } : undefined
      const resultado = await lancarTexto(texto.trim(), usuarioId, cartaoInfo)
      setFeedback({
        ...resultado.interpretado,
        parcelado:    resultado.parcelado    || false,
        total_geradas: resultado.total_geradas || null,
      })
      setTransacaoCriada(resultado.transacao)
      setTexto('')
      setCartaoId('')
      setDataCompra(hojeISO())
      onNovaTransacao(resultado.transacao)

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
    <div style={s.card}>
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

        {cartoes.length > 0 && (
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
          <span>
            <strong>{feedback.descricao}</strong> — {fmtBRL(feedback.valor)} ({feedback.tipo.replace('_', ' ')})
          </span>
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
    borderRadius: 14,
    padding: '16px 20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
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
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  btnEnviar: {
    padding: '12px 22px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--primary)',
    color: '#0A0F0D',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
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
    color: '#0A0F0D',
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
