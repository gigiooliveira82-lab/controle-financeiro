import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logoImg from '../assets/logomarca.svg'
import './PaginaLanding.css'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function PaginaLanding() {
  const isMobile = useIsMobile()
  const [faqAberta, setFaqAberta] = useState(null)
  const [mockupVisivel, setMockupVisivel] = useState(false)
  const [saldoAnimado, setSaldoAnimado] = useState(0)

  // Scroll reveal observer para elementos da página
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
          }
        })
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1,
      }
    )

    const elements = document.querySelectorAll('.landing-reveal')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Início suave da animação do produto no Hero
  useEffect(() => {
    const timer = setTimeout(() => setMockupVisivel(true), 260)
    return () => clearTimeout(timer)
  }, [])

  // Demonstração do Produto: Contador fluido de saldo (0 -> R$ 5.420,80)
  useEffect(() => {
    if (!mockupVisivel) return
    let start = null
    const target = 5420.80
    const duration = 700
    let animId

    function step(timestamp) {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setSaldoAnimado(target * easeOut)
      if (progress < 1) {
        animId = requestAnimationFrame(step)
      }
    }
    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [mockupVisivel])

  function formatarMoeda(val) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function toggleFaq(index) {
    setFaqAberta(prev => prev === index ? null : index)
  }

  return (
    <div style={s.pagina} data-theme="dark" data-theme-locked="dark" className="theme-dark-locked">
      {/* MENU TOPO */}
      <header style={{ ...s.nav, padding: isMobile ? '14px 20px' : '18px 48px' }}>
        <div style={s.navLogo}>
          <div style={s.logoAvatar}>
            <img src={logoImg} alt="Contas Claras" style={s.logoImg} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={s.navLogoTexto}>Contas Claras</span>
            <span style={s.navLogoSub}>Inteligência Financeira</span>
          </div>
        </div>

        <div style={s.navAcoes}>
          <Link to="/login" className="landing-nav-link" style={s.navLinkEntrar}>
            Entrar
          </Link>
          <Link to="/login?modo=cadastro" className="landing-nav-btn" style={s.navBotaoDestaque}>
            Experimente Grátis
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ ...s.hero, padding: isMobile ? '52px 20px 60px' : '84px 48px 96px' }}>
        <div style={s.heroGlow} />
        <div style={s.heroConteudo}>
          <div className="hero-fade-in" style={s.heroBadge}>
            <span style={s.heroBadgeIcone}>✦</span>
            <span>7 Dias Grátis • Sem necessidade de cartão no cadastro</span>
          </div>

          <h1 className="hero-fade-in-delay-1" style={{ ...s.heroTitulo, fontSize: isMobile ? 32 : 54 }}>
            Controle total dos seus cartões e gastos, <br />
            <span style={s.heroTituloDestaque}>guiado por Inteligência Artificial.</span>
          </h1>

          <p className="hero-fade-in-delay-2" style={{ ...s.heroSub, fontSize: isMobile ? 15.5 : 18 }}>
            Lance despesas em segundos por voz ou texto. Tenha conciliação automática 
            de faturas sem duplicar valores e saiba exatamente quanto pode gastar antes de fechar o mês.
          </p>

          {/* CTA ÚNICO FOCAL */}
          <div className="hero-fade-in-delay-3" style={s.heroBotoes}>
            <Link to="/login?modo=cadastro" className="landing-btn-cta" style={s.botaoPrimario}>
              Começar 7 dias grátis
              <span className="btn-seta" style={s.botaoSeta}> →</span>
            </Link>
          </div>

          {/* MICROCOPY DE CONFIANÇA */}
          <div className="hero-fade-in-delay-3" style={s.heroGarantiasRow}>
            <span style={s.garantiaItem}>✓ Cadastro em 30 segundos</span>
            <span style={s.garantiaDivisor}>•</span>
            <span style={s.garantiaItem}>✓ Sem fidelidade</span>
            <span style={s.garantiaDivisor}>•</span>
            <span style={s.garantiaItem}>✓ Cancele quando quiser</span>
          </div>

          {/* SHOWCASE DA INTERFACE (MOCKUP INTERATIVO DO PRODUTO) */}
          <div className="landing-mockup hero-fade-in-delay-3" style={s.mockupWrapper}>
            <div style={s.mockupBarraJanela}>
              <div style={s.mockupBolinhas}>
                <span style={{ ...s.bolinha, background: '#EF4444' }} />
                <span style={{ ...s.bolinha, background: '#F59E0B' }} />
                <span style={{ ...s.bolinha, background: '#10B981' }} />
              </div>
              <div style={s.mockupUrlBox}>
                <span style={{ color: '#10B981', marginRight: 6 }}>🔒</span>
                contasclaras.app/dashboard
              </div>
            </div>

            <div style={s.mockupCorpo}>
              {/* Cards de Métricas do Dashboard Mockup */}
              <div style={{ ...s.mockupGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
                <div style={s.mockupCardKpi}>
                  <span style={s.mockupKpiLabel}>Saldo Disponível em Conta</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={s.mockupKpiValorPos}>{formatarMoeda(saldoAnimado)}</div>
                    {/* Mini gráfico vetorial elegante desenhando a curva financeira */}
                    <svg className="mockup-sparkline" width="68" height="28" viewBox="0 0 76 32" fill="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="landingSparklineGrad" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#10B981" stopOpacity="0.4"/>
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>
                      <path
                        className={`mockup-sparkline-area ${mockupVisivel ? 'is-drawn' : ''}`}
                        d="M 2 26 C 18 24, 28 14, 42 16 C 54 18, 62 6, 74 4 L 74 32 L 2 32 Z"
                        fill="url(#landingSparklineGrad)"
                      />
                      <path
                        className={`mockup-sparkline-line ${mockupVisivel ? 'is-drawn' : ''}`}
                        d="M 2 26 C 18 24, 28 14, 42 16 C 54 18, 62 6, 74 4"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle
                        className={`mockup-sparkline-dot ${mockupVisivel ? 'is-drawn' : ''}`}
                        cx="74"
                        cy="4"
                        r="3.5"
                        fill="#10B981"
                      />
                    </svg>
                  </div>
                  <span style={s.mockupKpiSub}>+ R$ 1.850,00 previstos</span>
                </div>

                <div style={s.mockupCardKpi}>
                  <span style={s.mockupKpiLabel}>Faturas dos Cartões (Abertas)</span>
                  <div style={s.mockupKpiValorAlerta}>R$ 1.638,40</div>
                  <span style={s.mockupKpiSub}>Conciliado automaticamente</span>
                </div>

                <div style={s.mockupCardKpi}>
                  <span style={s.mockupKpiLabel}>Reserva / Metas do Mês</span>
                  <div style={s.mockupKpiValorDestaque}>R$ 1.200,00</div>
                  <span style={s.mockupKpiSub}>Meta "Reserva de Emergência" 68%</span>
                </div>
              </div>

              {/* Mensagem da IA em Tempo Real */}
              <div style={s.mockupIaBox}>
                <div className="ia-badge-pulse" style={s.mockupIaIcone}>✦</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={s.mockupIaTitulo}>Assistente Financeiro Contas Claras</div>
                  <div style={s.mockupIaTexto}>
                    "Você gastou 18% a menos em alimentação nesta semana. Se mantiver esse ritmo, 
                    conseguirá antecipar sua meta de economia em 22 dias!"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NÚMEROS REAIS / CREDIBILIDADE */}
      <section style={{ ...s.secao, padding: isMobile ? '48px 20px' : '72px 48px' }}>
        <div className="landing-reveal">
          <p style={s.eyebrow}>Resultados e Segurança</p>
          <h2 style={{ ...s.tituloSecao, fontSize: isMobile ? 24 : 32 }}>
            Projetado para dar clareza e paz ao seu bolso
          </h2>
        </div>
        <div style={{ ...s.statsGrid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)' }}>
          <div className="landing-reveal stagger-1 landing-stat-card" style={s.statCard}>
            <span style={s.statNumero}>30 seg</span>
            <span style={s.statLabel}>para lançar gastos por voz ou texto</span>
          </div>
          <div className="landing-reveal stagger-2 landing-stat-card" style={s.statCard}>
            <span style={s.statNumero}>R$ 0</span>
            <span style={s.statLabel}>em faturas duplicadas no seu orçamento</span>
          </div>
          <div className="landing-reveal stagger-3 landing-stat-card" style={s.statCard}>
            <span style={s.statNumero}>6 em 1</span>
            <span style={s.statLabel}>módulos essenciais integrados com IA</span>
          </div>
          <div className="landing-reveal stagger-4 landing-stat-card" style={s.statCard}>
            <span style={s.statNumero}>100%</span>
            <span style={s.statLabel}>dos seus dados criptografados e isolados</span>
          </div>
        </div>
        <p className="landing-reveal stagger-4" style={s.statsRodape}>
          Todas as ferramentas liberadas desde o primeiro minuto para você testar gratuitamente por 7 dias.
        </p>
      </section>

      {/* FUNCIONALIDADES */}
      <section style={{ ...s.secaoEscura, padding: isMobile ? '56px 20px' : '80px 48px' }}>
        <div style={s.secaoContainer}>
          <div className="landing-reveal">
            <p style={s.eyebrow}>Ecossistema Completo</p>
            <h2 style={{ ...s.tituloSecao, fontSize: isMobile ? 24 : 34 }}>
              Tudo o que você precisa em uma única tela
            </h2>
          </div>
          <div style={{ ...s.featuresGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
            {FUNCIONALIDADES.map((f, index) => (
              <div
                key={f.titulo}
                className={`landing-reveal stagger-${(index % 3) + 1} landing-feature-card`}
                style={s.featureCard}
              >
                <div className="landing-feature-icon" style={s.featureIconeBox}>
                  {f.iconeSvg}
                </div>
                <h3 style={s.featureTitulo}>{f.titulo}</h3>
                <p style={s.featureTexto}>{f.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇOS / PLANOS */}
      <section style={{ ...s.secao, padding: isMobile ? '56px 20px' : '80px 48px' }}>
        <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' }}>
          <p style={s.eyebrow}>Investimento Transparente</p>
          <h2 style={{ ...s.tituloSecao, fontSize: isMobile ? 24 : 34, margin: '0 0 12px' }}>
            Comece grátis, decida depois
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Sem pegadinhas, sem taxas escondidas e sem necessidade de cartão de crédito no cadastro.
          </p>
        </div>

        {/* Card Único de Ancoragem Focal */}
        <div className="landing-reveal stagger-1" style={s.planoContainerUnificado}>
          <div className="landing-plano-card" style={{ ...s.planoCardUnificado, padding: isMobile ? '36px 20px 28px' : '44px 38px 34px' }}>
            <span style={s.planoSeloDestaque}>★ 7 Dias Grátis Inclusos • Sem Cartão</span>
            
            <div style={s.planoHeader}>
              <h3 style={s.planoNome}>Acesso Completo ao Contas Claras</h3>
              <p style={s.planoDescricao}>
                Acesso total e irrestrito a todas as funcionalidades de inteligência financeira desde o primeiro segundo.
              </p>
            </div>

            <div style={s.planoPrecoBox}>
              <div style={s.precoAncoraLinha}>
                <span style={s.precoTrialDestaque}>R$ 0</span>
                <span style={s.precoTrialSub}>nos primeiros 7 dias</span>
              </div>
              <div style={s.precoPosTrialLinha}>
                Após o período gratuito, apenas <strong style={{ color: 'var(--text-pure)' }}>R$ 24,90/mês</strong> (menos de R$ 0,85 ao dia). Cancele quando quiser diretamente pelo painel.
              </div>
            </div>

            <div style={{ ...s.planoGridRecursos, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={s.recursoItem}>
                <span style={s.checkVerde}>✓</span>
                <span><strong>100% dos recursos liberados</strong> no teste</span>
              </div>
              <div style={s.recursoItem}>
                <span style={s.checkVerde}>✓</span>
                <span>Lançamentos rápidos por <strong>voz e texto</strong> com IA</span>
              </div>
              <div style={s.recursoItem}>
                <span style={s.checkVerde}>✓</span>
                <span>Gestão de cartões sem faturas duplicadas</span>
              </div>
              <div style={s.recursoItem}>
                <span style={s.checkVerde}>✓</span>
                <span>Planejamento de metas no <strong>Meus Sonhos</strong></span>
              </div>
              <div style={s.recursoItem}>
                <span style={s.checkVerde}>✓</span>
                <span>Dashboard dinâmico com saldo projetado</span>
              </div>
              <div style={s.recursoItem}>
                <span style={s.checkVerde}>✓</span>
                <span>Sem fidelidade, cancele com 1 clique</span>
              </div>
            </div>

            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <Link to="/login?modo=cadastro" className="landing-btn-cta" style={s.planoBotaoAcaoUnificado}>
                Começar 7 dias grátis
                <span className="btn-seta" style={s.botaoSeta}> →</span>
              </Link>
              <p style={s.planoAviso}>
                🔒 Cadastro em 30 segundos. Não solicitamos cartão de crédito agora.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE PERGUNTAS FREQUENTES (FAQ) */}
      <section style={{ ...s.secaoEscura, padding: isMobile ? '56px 20px' : '80px 48px' }}>
        <div style={s.secaoContainer}>
          <div className="landing-reveal">
            <p style={s.eyebrow}>Tire suas dúvidas</p>
            <h2 style={{ ...s.tituloSecao, fontSize: isMobile ? 24 : 34 }}>
              Perguntas Frequentes
            </h2>
          </div>
          <div style={s.faqContainer}>
            {FAQ_ITEMS.map((item, index) => {
              const aberta = faqAberta === index
              return (
                <div key={item.pergunta} className={`landing-reveal stagger-${(index % 4) + 1}`} style={s.faqItem}>
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="faq-pergunta-btn"
                    style={s.faqPerguntaBtn}
                    aria-expanded={aberta}
                  >
                    <span style={s.faqPerguntaTexto}>{item.pergunta}</span>
                    <span
                      className="faq-icone-seta"
                      style={{ ...s.faqIconeSeta, transform: aberta ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      ▼
                    </span>
                  </button>
                  {aberta && (
                    <div className="faq-resposta-animada" style={s.faqResposta}>
                      <p style={s.faqRespostaTexto}>{item.resposta}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ ...s.ctaFinal, padding: isMobile ? '64px 20px' : '96px 48px' }}>
        <div className="landing-reveal" style={s.ctaContainer}>
          <div style={s.ctaIconeDestaque}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 style={{ ...s.ctaTitulo, fontSize: isMobile ? 26 : 40 }}>
            Comece agora com 7 dias grátis.<br />Sem burocracia.
          </h2>
          <p style={s.ctaSub}>
            Cadastre-se em segundos, acerte suas contas com a ajuda da IA e tenha clareza absoluta sobre o seu dinheiro.
          </p>
          <div style={s.ctaBotoesWrap}>
            <Link to="/login?modo=cadastro" className="landing-btn-cta" style={s.botaoPrimarioGrande}>
              Criar Minha Conta Grátis
              <span className="btn-seta" style={s.botaoSeta}> →</span>
            </Link>
          </div>
          <p style={s.ctaGarantiaTexto}>
            ✓ 7 dias de avaliação gratuita &bull; Sem necessidade de cartão no cadastro &bull; Cancele quando quiser
          </p>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer style={{ ...s.rodape, padding: isMobile ? '24px 20px' : '28px 48px' }}>
        <div style={s.navLogo}>
          <div style={{ ...s.logoAvatar, width: 28, height: 28 }}>
            <img src={logoImg} alt="Contas Claras" style={{ width: 17, height: 17, objectFit: 'contain', display: 'block' }} />
          </div>
          <span style={s.rodapeLogoTexto}>Contas Claras</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Link to="/termos" style={s.rodapeLink}>Termos & Privacidade</Link>
          <Link to="/login" style={s.rodapeLink}>Acessar Conta</Link>
        </div>
        <span style={s.rodapeAno}>© {new Date().getFullYear()} Contas Claras · Todos os direitos reservados</span>
      </footer>
    </div>
  )
}

const FAQ_ITEMS = [
  {
    pergunta: 'Preciso informar cartão de crédito para iniciar o teste?',
    resposta: 'Não! Para iniciar seus 7 dias gratuitos, basta informar seu e-mail e criar uma senha. Você não precisa cadastrar nenhum meio de pagamento agora.'
  },
  {
    pergunta: 'Como funciona o lançamento por voz ou texto com IA?',
    resposta: 'Você pode simplesmente falar ou digitar expressões do seu dia a dia, como "Gastei 65 reais na padaria no débito". A inteligência artificial detecta automaticamente o valor, categoria, conta de saída e data, preenchendo tudo para você sem esforço.'
  },
  {
    pergunta: 'Como o Contas Claras evita duplicar compras de cartão?',
    resposta: 'Muitos aplicativos somam as compras do cartão no dia em que foram feitas e somam novamente o pagamento da fatura, distorcendo seu saldo. No Contas Claras, os gastos compõem a fatura do cartão e o pagamento dela apenas liquida essa obrigação, garantindo que seu saldo real nunca fique duplicado.'
  },
  {
    pergunta: 'O que acontece após os 7 dias gratuitos?',
    resposta: 'Após os 7 dias, você poderá assinar o Plano Completo por apenas R$ 24,90/mês para continuar utilizando o assistente e os módulos. Se optar por não assinar, sua conta não sofrerá cobrança automática e seus dados continuarão seguros.'
  },
]

const FUNCIONALIDADES = [
  {
    iconeSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
    titulo: 'Lançamento por texto ou voz',
    texto: 'Fale ou digite "gastei 50 no mercado hoje" e a inteligência artificial categoriza tudo automaticamente.',
  },
  {
    iconeSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    titulo: 'Gestão de Cartões sem Duplicidade',
    texto: 'Compras no crédito organizadas com suas faturas sem duplicar valores nem bagunçar o orçamento mensal.',
  },
  {
    iconeSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    titulo: 'Meus Sonhos & Metas',
    texto: 'Defina metas com prazos e o sistema calcula automaticamente quanto guardar todo mês para conquistá-las.',
  },
  {
    iconeSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    titulo: 'Dashboard em Tempo Real',
    texto: 'Acompanhe saldo real, saldo projetado para o fim do mês, despesas por categoria e comparativos claros.',
  },
  {
    iconeSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
      </svg>
    ),
    titulo: 'Assistente e Diagnósticos por IA',
    texto: 'Receba alertas inteligentes antes de entrar no vermelho e faça perguntas financeiras sob demanda.',
  },
  {
    iconeSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="m7 22-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    titulo: 'Parcelamentos e Recorrências',
    texto: 'Suas contas fixas e parcelas futuras são geradas automaticamente, dando previsibilidade absoluta.',
  },
]

const s = {
  pagina: {
    minHeight: '100vh',
    width: '100%',
    overflowX: 'hidden',
    background: 'var(--bg-deep)',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
  },

  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(10, 15, 13, 0.90)',
    backdropFilter: 'blur(16px)',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    borderBottom: '1px solid var(--border)',
    boxSizing: 'border-box',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #153E32, #0A1E17)',
    border: '1.5px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 14px rgba(16, 185, 129, 0.2)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logoImg: {
    width: 22,
    height: 22,
    objectFit: 'contain',
    display: 'block',
  },
  navLogoTexto: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  navLogoSub: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  navAcoes: { display: 'flex', alignItems: 'center', gap: 14 },
  navLinkEntrar: {
    background: 'none',
    border: 'none',
    color: 'var(--text-pure)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 14px',
    transition: 'color 0.15s ease',
  },
  navBotaoDestaque: {
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
  },

  hero: {
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    borderBottom: '1px solid var(--border)',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.14), transparent 70%), #0A0F0D',
  },
  heroGlow: {
    position: 'absolute',
    top: '-20%',
    right: '10%',
    width: 450,
    height: 450,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.10) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroConteudo: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 820,
    margin: '0 auto',
    textAlign: 'center',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 16px',
    borderRadius: 99,
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 22,
  },
  heroBadgeIcone: {
    fontSize: 14,
  },
  heroTitulo: {
    margin: '0 0 20px',
    fontFamily: 'var(--font-headline)',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.025em',
    color: 'var(--text-pure)',
  },
  heroTituloDestaque: {
    background: 'linear-gradient(135deg, #10B981, #34D399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    margin: '0 auto 34px',
    lineHeight: 1.65,
    color: '#D1D5DB',
    maxWidth: 680,
  },
  heroBotoes: {
    display: 'flex',
    gap: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoPrimario: {
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    borderRadius: 12,
    padding: '16px 36px',
    fontSize: 16,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
    textAlign: 'center',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  botaoSeta: {
    fontWeight: 800,
  },
  heroGarantiasRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
  },
  garantiaItem: {
    fontWeight: 500,
  },
  garantiaDivisor: {
    color: '#4B5563',
  },

  /* MOCKUP DO PRODUTO */
  mockupWrapper: {
    marginTop: 48,
    borderRadius: 16,
    border: '1px solid rgba(16, 185, 129, 0.25)',
    background: 'rgba(15, 23, 20, 0.92)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 32px rgba(16, 185, 129, 0.12)',
    backdropFilter: 'blur(16px)',
    overflow: 'hidden',
    textAlign: 'left',
  },
  mockupBarraJanela: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 18px',
    background: 'rgba(10, 15, 13, 0.95)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  mockupBolinhas: {
    display: 'flex',
    gap: 7,
  },
  bolinha: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  mockupUrlBox: {
    fontSize: 11.5,
    color: '#9CA3AF',
    margin: '0 auto',
    padding: '4px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  mockupCorpo: {
    padding: '24px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  mockupGrid: {
    display: 'grid',
    gap: 14,
  },
  mockupCardKpi: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    padding: '16px 18px',
  },
  mockupKpiLabel: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    display: 'block',
    marginBottom: 6,
  },
  mockupKpiValorPos: {
    fontSize: 22,
    fontWeight: 800,
    color: '#10B981',
    fontFamily: 'var(--font-headline)',
  },
  mockupKpiValorAlerta: {
    fontSize: 22,
    fontWeight: 800,
    color: '#F59E0B',
    fontFamily: 'var(--font-headline)',
  },
  mockupKpiValorDestaque: {
    fontSize: 22,
    fontWeight: 800,
    color: '#60A5FA',
    fontFamily: 'var(--font-headline)',
  },
  mockupKpiSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 4,
    display: 'block',
  },
  mockupIaBox: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  mockupIaIcone: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 15,
  },
  mockupIaTitulo: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--primary)',
    fontFamily: 'var(--font-headline)',
    marginBottom: 2,
  },
  mockupIaTexto: {
    fontSize: 12.5,
    color: '#D1D5DB',
    lineHeight: 1.5,
  },

  secao: {
    maxWidth: 1120,
    margin: '0 auto',
    boxSizing: 'border-box',
    width: '100%',
  },
  secaoContainer: {
    maxWidth: 1120,
    margin: '0 auto',
  },
  secaoEscura: {
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    boxSizing: 'border-box',
    width: '100%',
  },
  eyebrow: {
    margin: '0 0 8px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--primary)',
  },
  tituloSecao: {
    margin: '0 0 32px',
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    letterSpacing: '-0.02em',
    color: 'var(--text-pure)',
  },

  statsGrid: { display: 'grid', gap: 16 },
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '24px 20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  statNumero: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--primary)',
    fontFamily: 'var(--font-headline)',
  },
  statLabel: {
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  statsRodape: {
    margin: '20px 0 0',
    fontSize: 13,
    color: '#9CA3AF',
    maxWidth: 640,
  },

  featuresGrid: { display: 'grid', gap: 20 },
  featureCard: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px 22px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  featureIconeBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureTitulo: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  featureTexto: {
    margin: 0,
    fontSize: 13.5,
    lineHeight: 1.6,
    color: 'var(--text-muted)',
  },

  precosGrid: { display: 'grid', gap: 24 },
  planoCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: '32px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    position: 'relative',
    boxSizing: 'border-box',
  },
  planoCardPro: {
    border: '1.5px solid var(--primary)',
    background: 'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.08), transparent 70%), var(--surface)',
    boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)',
  },
  planoSelo: {
    position: 'absolute',
    top: -12,
    right: 24,
    background: 'var(--primary)',
    color: '#0A0F0D',
    fontSize: 11,
    fontWeight: 800,
    padding: '4px 12px',
    borderRadius: 99,
    fontFamily: 'var(--font-headline)',
  },
  /* PLANO UNIFICADO */
  planoContainerUnificado: {
    maxWidth: 720,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  planoCardUnificado: {
    background: 'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.12), transparent 70%), var(--surface)',
    border: '1.5px solid var(--primary)',
    borderRadius: 20,
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45), 0 0 32px rgba(16, 185, 129, 0.16)',
    position: 'relative',
    boxSizing: 'border-box',
  },
  planoSeloDestaque: {
    position: 'absolute',
    top: -14,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--primary)',
    color: '#0A0F0D',
    fontSize: 12,
    fontWeight: 800,
    padding: '6px 18px',
    borderRadius: 99,
    fontFamily: 'var(--font-headline)',
    whiteSpace: 'nowrap',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
  },
  planoHeader: {
    textAlign: 'center',
    marginBottom: 8,
  },
  planoNome: {
    margin: '0 0 8px',
    fontSize: 24,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  planoDescricao: {
    margin: '0 auto',
    maxWidth: 540,
    fontSize: 14.5,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  planoPrecoBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: '20px 24px',
    margin: '24px 0',
    textAlign: 'center',
  },
  precoAncoraLinha: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  precoTrialDestaque: {
    fontSize: 44,
    fontWeight: 900,
    color: 'var(--primary)',
    fontFamily: 'var(--font-headline)',
    lineHeight: 1,
  },
  precoTrialSub: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: 600,
  },
  precoPosTrialLinha: {
    fontSize: 13.5,
    color: '#9CA3AF',
    marginTop: 8,
    lineHeight: 1.4,
  },
  planoGridRecursos: {
    display: 'grid',
    gap: 14,
    margin: '0 0 8px',
  },
  recursoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: '#E5E7EB',
  },
  checkVerde: {
    color: 'var(--primary)',
    fontWeight: 800,
    flexShrink: 0,
  },
  planoBotaoAcaoUnificado: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    padding: '16px 36px',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    textAlign: 'center',
    textDecoration: 'none',
    boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    cursor: 'pointer',
  },
  planoAviso: {
    margin: '18px 0 0',
    fontSize: 12.5,
    color: '#9CA3AF',
    lineHeight: 1.5,
  },

  /* FAQ STYLES */
  faqContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxWidth: 780,
    margin: '0 auto',
  },
  faqItem: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'border-color 0.15s ease',
  },
  faqPerguntaBtn: {
    width: '100%',
    padding: '18px 22px',
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    cursor: 'pointer',
    textAlign: 'left',
  },
  faqPerguntaTexto: {
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  faqIconeSeta: {
    fontSize: 12,
    color: 'var(--primary)',
    transition: 'transform 0.2s ease',
  },
  faqResposta: {
    padding: '0 22px 18px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  faqRespostaTexto: {
    margin: '12px 0 0',
    fontSize: 14,
    lineHeight: 1.65,
    color: '#D1D5DB',
  },

  ctaFinal: {
    background: '#070C0A',
    borderTop: '1px solid var(--border)',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  ctaContainer: {
    maxWidth: 640,
    margin: '0 auto',
  },
  ctaIconeDestaque: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1.5px solid var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
  },
  ctaTitulo: {
    margin: '0 0 14px',
    fontFamily: 'var(--font-headline)',
    fontWeight: 800,
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
  },
  ctaSub: {
    margin: '0 auto 32px',
    maxWidth: 520,
    fontSize: 16,
    lineHeight: 1.6,
    color: '#D1D5DB',
  },
  ctaBotoesWrap: {
    display: 'flex',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  botaoPrimarioGrande: {
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    borderRadius: 12,
    padding: '16px 38px',
    fontSize: 16,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
    textAlign: 'center',
  },
  ctaGarantiaTexto: {
    margin: 0,
    fontSize: 13,
    color: '#9CA3AF',
  },

  rodape: {
    background: '#050807',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
    boxSizing: 'border-box',
  },
  rodapeLogoTexto: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  rodapeLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  rodapeAno: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#6B7280',
  },
}
