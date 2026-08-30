import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GuiaPrimeirosPassos({
  usuarioId,
  transacoes = [],
  cartoes = [],
  onAbrirLancamento,
  onAbrirTour,
}) {
  const navigate = useNavigate()
  const [oculto, setOculto] = useState(() => {
    if (!usuarioId) return false
    return localStorage.getItem(`contas_claras_guia_oculto_${usuarioId}`) === 'true'
  })

  const temTransacoes = transacoes.length > 0
  const temCartoes = cartoes.length > 0

  // Se o usuário tem transações e cartões, ou se ocultou o checklist, não renderiza
  if (oculto) return null

  // Calcular progresso
  const passosCompletos = (temTransacoes ? 1 : 0) + (temCartoes ? 1 : 0)
  const totalPassos = 3

  function handleOcultar() {
    setOculto(true)
    if (usuarioId) {
      localStorage.setItem(`contas_claras_guia_oculto_${usuarioId}`, 'true')
    }
  }

  return (
    <div style={g.card}>
      <div style={g.header}>
        <div style={g.headerLeft}>
          <div style={g.badge}>✦ Primeiros Passos</div>
          <h3 style={g.titulo}>Comece a organizar suas finanças</h3>
          <p style={g.subtitulo}>
            Siga estes 3 passos rápidos para ter controle total do seu mês:
          </p>
        </div>

        <div style={g.headerRight}>
          <button
            type="button"
            onClick={onAbrirTour}
            style={g.btnTour}
            title="Ver tour explicativo do sistema"
          >
            <span>✦</span>
            <span>Ver Tour Guiado</span>
          </button>

          <button
            type="button"
            onClick={handleOcultar}
            style={g.btnFechar}
            aria-label="Ocultar guia"
            title="Dispensar guia de início"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Grid de Passos */}
      <div style={g.passosGrid}>
        {/* Passo 1: Primeiro Lançamento */}
        <div style={{ ...g.passoItem, ...(temTransacoes ? g.passoItemConcluido : {}) }}>
          <div style={g.passoHeader}>
            <span style={{ ...g.passoNumero, ...(temTransacoes ? g.passoNumeroConcluido : {}) }}>
              {temTransacoes ? '✓' : '1'}
            </span>
            <div>
              <strong style={g.passoTitulo}>Primeiro Lançamento</strong>
              <p style={g.passoDesc}>Registre uma despesa ou receita por texto ou voz.</p>
            </div>
          </div>
          {!temTransacoes ? (
            <button
              type="button"
              onClick={onAbrirLancamento}
              style={g.btnAcao}
            >
              + Lançar Agora
            </button>
          ) : (
            <span style={g.badgeConcluido}>Concluído ✓</span>
          )}
        </div>

        {/* Passo 2: Contas e Cartões */}
        <div style={{ ...g.passoItem, ...(temCartoes ? g.passoItemConcluido : {}) }}>
          <div style={g.passoHeader}>
            <span style={{ ...g.passoNumero, ...(temCartoes ? g.passoNumeroConcluido : {}) }}>
              {temCartoes ? '✓' : '2'}
            </span>
            <div>
              <strong style={g.passoTitulo}>Contas &amp; Cartões</strong>
              <p style={g.passoDesc}>Cadastre seus cartões de crédito e saldos bancários.</p>
            </div>
          </div>
          {!temCartoes ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => navigate('/cartoes')}
                style={g.btnAcao}
              >
                Cartões
              </button>
              <button
                type="button"
                onClick={() => navigate('/contas')}
                style={g.btnAcaoSecundario}
              >
                Contas
              </button>
            </div>
          ) : (
            <span style={g.badgeConcluido}>Concluído ✓</span>
          )}
        </div>

        {/* Passo 3: Sonhos e Metas */}
        <div style={g.passoItem}>
          <div style={g.passoHeader}>
            <span style={g.passoNumero}>3</span>
            <div>
              <strong style={g.passoTitulo}>Meus Sonhos</strong>
              <p style={g.passoDesc}>Crie sua primeira meta financeira com cálculo de prazo.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/sonhos')}
            style={g.btnAcao}
          >
            Criar Meta
          </button>
        </div>
      </div>
    </div>
  )
}

const g = {
  card: {
    background: 'radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.1), transparent 70%), var(--surface)',
    border: '1.5px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    padding: '22px 24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 20px rgba(16, 185, 129, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 260,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(16, 185, 129, 0.15)',
    color: 'var(--primary)',
    fontSize: 11.5,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 99,
    fontFamily: 'var(--font-headline)',
    width: 'fit-content',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  titulo: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.01em',
  },
  subtitulo: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  btnTour: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    color: 'var(--primary)',
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s ease',
  },
  btnFechar: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 16,
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: 6,
    lineHeight: 1,
  },

  passosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
  },
  passoItem: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
  },
  passoItemConcluido: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    background: 'rgba(16, 185, 129, 0.05)',
  },
  passoHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  passoNumero: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--primary)',
    fontSize: 12,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    fontFamily: 'var(--font-headline)',
  },
  passoNumeroConcluido: {
    background: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
  },
  passoTitulo: {
    display: 'block',
    fontSize: 13.5,
    fontWeight: 700,
    color: 'var(--text-pure)',
    marginBottom: 2,
    fontFamily: 'var(--font-headline)',
  },
  passoDesc: {
    margin: 0,
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.35,
  },
  btnAcao: {
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
    transition: 'all 0.15s ease',
  },
  btnAcaoSecundario: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    transition: 'all 0.15s ease',
  },
  badgeConcluido: {
    fontSize: 11.5,
    fontWeight: 700,
    color: 'var(--primary)',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '4px 10px',
    borderRadius: 6,
    width: 'fit-content',
  },
}
