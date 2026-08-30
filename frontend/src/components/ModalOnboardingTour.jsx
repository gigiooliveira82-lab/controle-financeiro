import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImg from '../assets/logomarca.svg'

export default function ModalOnboardingTour({
  aberto,
  onFechar,
  usuarioId,
  onIniciarLancamento,
}) {
  const [passo, setPasso] = useState(1)
  const navigate = useNavigate()
  const TOTAL_PASSOS = 4

  useEffect(() => {
    if (aberto) setPasso(1)
  }, [aberto])

  useEffect(() => {
    if (!aberto) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') handleConcluir()
      if (e.key === 'ArrowRight' && passo < TOTAL_PASSOS) setPasso(p => p + 1)
      if (e.key === 'ArrowLeft' && passo > 1) setPasso(p => p - 1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [aberto, passo])

  function handleConcluir() {
    if (usuarioId) {
      localStorage.setItem(`contas_claras_onboarding_${usuarioId}`, 'true')
    }
    onFechar()
  }

  function handleAcaoPasso4(acao) {
    handleConcluir()
    if (acao === 'lancamento') {
      if (onIniciarLancamento) onIniciarLancamento()
      navigate('/dashboard')
    } else if (acao === 'contas') {
      navigate('/contas')
    } else if (acao === 'cartoes') {
      navigate('/cartoes')
    } else if (acao === 'sonhos') {
      navigate('/sonhos')
    } else {
      navigate('/dashboard')
    }
  }

  if (!aberto) return null

  return (
    <div style={s.overlay} role="dialog" aria-modal="true">
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {/* Barra de Progresso no Topo */}
        <div style={s.progressBarTrack}>
          <div
            style={{
              ...s.progressBarFill,
              width: `${(passo / TOTAL_PASSOS) * 100}%`,
            }}
          />
        </div>

        {/* Header do Modal */}
        <div style={s.header}>
          <div style={s.badgePasso}>
            Passo {passo} de {TOTAL_PASSOS}
          </div>
          <button
            onClick={handleConcluir}
            style={s.btnFechar}
            aria-label="Fechar tour"
            title="Fechar (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo de Cada Passo */}
        <div style={s.conteudo}>
          {/* PASSO 1: Boas-Vindas */}
          {passo === 1 && (
            <div style={s.stepWrap}>
              <div style={s.avatarGlowBox}>
                <div style={s.logoAvatar}>
                  <img src={logoImg} alt="Contas Claras" style={s.logoImg} />
                </div>
              </div>

              <h2 style={s.titulo}>
                Bem-vindo ao <span style={s.destaqueTexto}>Contas Claras</span>!
              </h2>
              <p style={s.subtitulo}>
                Sua vida financeira sem complicação de planilhas e sem sustos no fim do mês. Vamos te mostrar rapidamente como tudo funciona em menos de 1 minuto!
              </p>

              <div style={s.cardsGrid}>
                <div style={s.miniCard}>
                  <span style={s.miniCardIcone}>⚡</span>
                  <div>
                    <strong style={s.miniCardTitulo}>Lançamentos Instantâneos</strong>
                    <p style={s.miniCardTexto}>Digite ou fale com a IA para registrar gastos sem esforço.</p>
                  </div>
                </div>
                <div style={s.miniCard}>
                  <span style={s.miniCardIcone}>💳</span>
                  <div>
                    <strong style={s.miniCardTitulo}>Sem Gastos Duplicados</strong>
                    <p style={s.miniCardTexto}>Gestão real de faturas de cartão separadas do saldo em conta.</p>
                  </div>
                </div>
                <div style={s.miniCard}>
                  <span style={s.miniCardIcone}>🎯</span>
                  <div>
                    <strong style={s.miniCardTitulo}>Meus Sonhos &amp; Metas</strong>
                    <p style={s.miniCardTexto}>Cálculo automático de quanto poupar a cada mês.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: IA & Lançamento por Voz/Texto */}
          {passo === 2 && (
            <div style={s.stepWrap}>
              <div style={s.iconeTopoBox}>
                <span style={{ fontSize: 32 }}>🎙️💬</span>
              </div>

              <h2 style={s.titulo}>
                Lançamentos com <span style={s.destaqueTexto}>Inteligência Artificial</span>
              </h2>
              <p style={s.subtitulo}>
                Chega de preencher dezenas de campos manuais. Fale ou digite no seu jeito natural!
              </p>

              {/* Demonstração visual animada */}
              <div style={s.demoCard}>
                <div style={s.demoPrompt}>
                  <span style={s.demoPromptIcone}>✦</span>
                  <span style={s.demoPromptTexto}>
                    &quot;Gastei 68 no supermercado hoje no cartão Nubank parcelado em 2x&quot;
                  </span>
                </div>

                <div style={s.demoSeta}>↓ A IA entende e preenche automaticamente:</div>

                <div style={s.demoTags}>
                  <div style={s.demoTag}>
                    <span style={s.demoTagLabel}>Tipo:</span>
                    <span style={s.demoTagValor}>Despesa Variável</span>
                  </div>
                  <div style={s.demoTag}>
                    <span style={s.demoTagLabel}>Categoria:</span>
                    <span style={s.demoTagValor}>Alimentação</span>
                  </div>
                  <div style={s.demoTag}>
                    <span style={s.demoTagLabel}>Valor:</span>
                    <span style={s.demoTagValor}>R$ 68,00 (2x R$ 34,00)</span>
                  </div>
                  <div style={s.demoTag}>
                    <span style={s.demoTagLabel}>Cartão:</span>
                    <span style={s.demoTagValor}>Nubank</span>
                  </div>
                </div>
              </div>

              <p style={s.dicaTexto}>
                💡 <em>Dica:</em> Você também pode ativar o botão do microfone para ditar seus gastos direto pelo celular ou computador.
              </p>
            </div>
          )}

          {/* PASSO 3: Módulos Integrados */}
          {passo === 3 && (
            <div style={s.stepWrap}>
              <div style={s.iconeTopoBox}>
                <span style={{ fontSize: 32 }}>📊🏦</span>
              </div>

              <h2 style={s.titulo}>
                Seus <span style={s.destaqueTexto}>Módulos Integrados</span>
              </h2>
              <p style={s.subtitulo}>
                Tudo o que você precisa fica acessível no menu lateral (ou barra inferior no celular):
              </p>

              <div style={s.modulosLista}>
                <div style={s.moduloItem}>
                  <span style={s.moduloIcone}>⊡</span>
                  <div>
                    <strong style={s.moduloNome}>Dashboard Geral</strong>
                    <span style={s.moduloDesc}>Saldo real, saldo projetado do mês e alertas de contas a vencer.</span>
                  </div>
                </div>

                <div style={s.moduloItem}>
                  <span style={s.moduloIcone}>📉</span>
                  <div>
                    <strong style={s.moduloNome}>Despesas &amp; Receitas</strong>
                    <span style={s.moduloDesc}>Histórico detalhado, despesas fixas, variáveis e parcelamentos.</span>
                  </div>
                </div>

                <div style={s.moduloItem}>
                  <span style={s.moduloIcone}>💳</span>
                  <div>
                    <strong style={s.moduloNome}>Cartões &amp; Contas</strong>
                    <span style={s.moduloDesc}>Controle de limites, faturas abertas e saldos em contas correntes.</span>
                  </div>
                </div>

                <div style={s.moduloItem}>
                  <span style={s.moduloIcone}>★</span>
                  <div>
                    <strong style={s.moduloNome}>Meus Sonhos</strong>
                    <span style={s.moduloDesc}>Planeje sua reserva de emergência, viagens e conquistas com metas claras.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 4: Primeiros Passos / Ação Imediata */}
          {passo === 4 && (
            <div style={s.stepWrap}>
              <div style={s.iconeTopoBox}>
                <span style={{ fontSize: 32 }}>🚀✨</span>
              </div>

              <h2 style={s.titulo}>
                Pronto para <span style={s.destaqueTexto}>começar?</span>
              </h2>
              <p style={s.subtitulo}>
                Para aproveitar ao máximo o Contas Claras, sugerimos dar seu primeiro passo agora:
              </p>

              <div style={s.acoesIniciaisGrid}>
                <button
                  type="button"
                  onClick={() => handleAcaoPasso4('lancamento')}
                  style={s.btnAcaoDestaque}
                >
                  <div style={s.btnAcaoIconeBox}>➕</div>
                  <div style={s.btnAcaoTextos}>
                    <strong style={s.btnAcaoTitulo}>Fazer Primeiro Lançamento</strong>
                    <span style={s.btnAcaoSub}>Registre uma despesa ou receita com IA agora</span>
                  </div>
                  <span style={s.btnAcaoSeta}>→</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAcaoPasso4('contas')}
                  style={s.btnAcaoSecundario}
                >
                  <div style={s.btnAcaoIconeBox}>🏦</div>
                  <div style={s.btnAcaoTextos}>
                    <strong style={s.btnAcaoTitulo}>Cadastrar Contas Bancárias</strong>
                    <span style={s.btnAcaoSub}>Defina seus saldos em conta corrente ou poupança</span>
                  </div>
                  <span style={s.btnAcaoSeta}>→</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAcaoPasso4('cartoes')}
                  style={s.btnAcaoSecundario}
                >
                  <div style={s.btnAcaoIconeBox}>💳</div>
                  <div style={s.btnAcaoTextos}>
                    <strong style={s.btnAcaoTitulo}>Cadastrar Cartões de Crédito</strong>
                    <span style={s.btnAcaoSub}>Adicione limites, fechamento e vencimento</span>
                  </div>
                  <span style={s.btnAcaoSeta}>→</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Navegação */}
        <div style={s.footer}>
          <div style={s.dotsContainer}>
            {Array.from({ length: TOTAL_PASSOS }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPasso(i + 1)}
                style={{
                  ...s.dot,
                  ...(passo === i + 1 ? s.dotAtivo : {}),
                }}
                aria-label={`Ir para passo ${i + 1}`}
              />
            ))}
          </div>

          <div style={s.navBotoes}>
            {passo > 1 ? (
              <button
                type="button"
                onClick={() => setPasso(p => p - 1)}
                style={s.btnAnterior}
              >
                ← Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConcluir}
                style={s.btnPular}
              >
                Pular Tour
              </button>
            )}

            {passo < TOTAL_PASSOS ? (
              <button
                type="button"
                onClick={() => setPasso(p => p + 1)}
                style={s.btnProximo}
              >
                Próximo →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAcaoPasso4('dashboard')}
                style={s.btnConcluir}
              >
                Explorar Dashboard ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 7, 0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px 16px',
    boxSizing: 'border-box',
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
    position: 'relative',
    boxSizing: 'border-box',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    background: 'var(--surface-raised)',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10B981, #2DD4BF)',
    transition: 'width 0.3s ease-in-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px 8px',
  },
  badgePasso: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--primary)',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    padding: '3px 10px',
    borderRadius: 99,
    fontFamily: 'var(--font-headline)',
  },
  btnFechar: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 18,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
    lineHeight: 1,
    transition: 'color 0.15s ease',
  },

  conteudo: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 28px 24px',
    display: 'flex',
    flexDirection: 'column',
  },
  stepWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
  },

  avatarGlowBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoAvatar: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #153E32, #0A1E17)',
    border: '2px solid rgba(16, 185, 129, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
  },
  logoImg: {
    width: 36,
    height: 36,
    objectFit: 'contain',
  },
  iconeTopoBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
  },

  titulo: {
    margin: '0',
    fontSize: 23,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
  },
  destaqueTexto: {
    background: 'linear-gradient(135deg, #10B981, #2DD4BF)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitulo: {
    margin: '0 0 12px',
    fontSize: 14,
    lineHeight: 1.55,
    color: 'var(--text-muted)',
    maxWidth: 460,
  },

  cardsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    textAlign: 'left',
  },
  miniCard: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  miniCardIcone: {
    fontSize: 20,
    lineHeight: 1,
    marginTop: 2,
  },
  miniCardTitulo: {
    display: 'block',
    fontSize: 13.5,
    fontWeight: 700,
    color: 'var(--text-pure)',
    marginBottom: 2,
    fontFamily: 'var(--font-headline)',
  },
  miniCardTexto: {
    margin: 0,
    fontSize: 12.5,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },

  demoCard: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  demoPrompt: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  demoPromptIcone: {
    color: 'var(--primary)',
    fontSize: 14,
  },
  demoPromptTexto: {
    fontSize: 13,
    color: 'var(--text-pure)',
    fontWeight: 500,
    fontStyle: 'italic',
  },
  demoSeta: {
    fontSize: 12,
    color: 'var(--primary)',
    fontWeight: 600,
    textAlign: 'center',
  },
  demoTags: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  demoTag: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  demoTagLabel: {
    fontSize: 10.5,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  demoTagValor: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text-pure)',
  },
  dicaTexto: {
    margin: '4px 0 0',
    fontSize: 12.5,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },

  modulosLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    textAlign: 'left',
  },
  moduloItem: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  moduloIcone: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  moduloNome: {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-pure)',
    marginBottom: 1,
  },
  moduloDesc: {
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.3,
  },

  acoesIniciaisGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  btnAcaoDestaque: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(45, 212, 191, 0.1))',
    border: '1.5px solid var(--primary)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.15)',
    transition: 'all 0.15s ease',
  },
  btnAcaoSecundario: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  btnAcaoIconeBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  btnAcaoTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  btnAcaoTitulo: {
    fontSize: 13.5,
    fontWeight: 700,
    color: 'var(--text-pure)',
    fontFamily: 'var(--font-headline)',
  },
  btnAcaoSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  btnAcaoSeta: {
    fontSize: 16,
    color: 'var(--primary)',
    fontWeight: 700,
  },

  footer: {
    borderTop: '1px solid var(--border)',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--surface-raised)',
  },
  dotsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--border)',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dotAtivo: {
    width: 22,
    borderRadius: 99,
    background: 'var(--primary)',
    boxShadow: '0 0 8px var(--primary)',
  },
  navBotoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  btnPular: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 12px',
  },
  btnAnterior: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnProximo: {
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    borderRadius: 8,
    padding: '8px 18px',
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
  },
  btnConcluir: {
    background: 'linear-gradient(135deg, #10B981, #2DD4BF)',
    color: '#0A0F0D',
    border: 'none',
    borderRadius: 8,
    padding: '8px 18px',
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)',
  },
}
