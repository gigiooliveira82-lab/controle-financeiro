import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import logoImg from '../assets/logomarca.svg'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function FormularioListaEspera() {
  const [email, setEmail]         = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [enviado, setEnviado]     = useState(false)
  const [erro, setErro]           = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const valor = email.trim()
    if (!REGEX_EMAIL.test(valor)) {
      setErro('Digite um e-mail válido.')
      return
    }
    setEnviando(true)
    const { error } = await supabase.from('lista_espera').insert({ email: valor })
    setEnviando(false)
    if (error) {
      setErro('Não foi possível enviar agora. Tente novamente em instantes.')
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div style={s.sucessoBox}>
        <span>✓</span> Você está na lista! Avisaremos assim que abrirmos o acesso.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={s.formEspera} noValidate>
      <div style={s.formEsperaCampo}>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={enviando}
          style={s.inputEspera}
          aria-label="Seu e-mail"
        />
        <button type="submit" disabled={enviando} style={s.botaoEspera}>
          {enviando ? 'Enviando...' : 'Quero ser avisado'}
        </button>
      </div>
      {erro && <p style={s.erroEspera}>{erro}</p>}
    </form>
  )
}

export default function PaginaLanding() {
  const isMobile = useIsMobile()
  const ctaFinalRef = useRef(null)

  function scrollAteFormulario() {
    ctaFinalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
          <Link to="/login" style={s.navLinkEntrar}>Entrar</Link>
          {!isMobile && (
            <button onClick={scrollAteFormulario} style={s.navBotaoDestaque}>
              Entrar na lista de espera
            </button>
          )}
        </div>
      </header>

      {/* HERO */}
      <section style={{ ...s.hero, padding: isMobile ? '56px 20px 64px' : '88px 48px 104px' }}>
        <div style={s.heroGlow} />
        <div style={s.heroConteudo}>
          <div style={s.heroBadge}>
            <span style={s.heroBadgeIcone}>✦</span>
            <span>Inteligência Financeira em Tempo Real</span>
          </div>
          <h1 style={{ ...s.heroTitulo, fontSize: isMobile ? 36 : 60 }}>
            A Clareza<br /><span style={s.heroTituloDestaque}>começa aqui.</span>
          </h1>
          <p style={{ ...s.heroSub, fontSize: isMobile ? 16 : 19 }}>
            Chega de descobrir só no fim do mês que gastou mais do que podia.
            Chega de somar na mão a fatura do cartão para não duplicar no orçamento.
            O Contas Claras junta despesas, receitas, cartões e metas num só lugar —
            e te avisa antes do aperto, não depois.
          </p>
          <div style={s.heroBotoes}>
            <button onClick={scrollAteFormulario} style={s.botaoPrimario}>
              Entrar na lista de espera
            </button>
            <Link to="/login" style={s.botaoSecundario}>
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* NÚMEROS REAIS */}
      <section style={{ ...s.secao, padding: isMobile ? '40px 20px' : '64px 48px' }}>
        <p style={s.eyebrow}>Onde estamos hoje</p>
        <div style={{ ...s.statsGrid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)' }}>
          <div style={s.statCard}>
            <span style={s.statNumero}>Jul/2026</span>
            <span style={s.statLabel}>em uso real desde então</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statNumero}>R$ 0</span>
            <span style={s.statLabel}>em gastos duplicados de cartão</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statNumero}>6</span>
            <span style={s.statLabel}>módulos integrados</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statNumero}>100%</span>
            <span style={s.statLabel}>dos dados protegidos por login real</span>
          </div>
        </div>
        <p style={s.statsRodape}>
          São marcos do produto em construção, não estatísticas de clientes — o app já roda de
          verdade, no dia a dia de quem está testando.
        </p>
      </section>

      {/* FUNCIONALIDADES */}
      <section style={{ ...s.secaoEscura, padding: isMobile ? '56px 20px' : '80px 48px' }}>
        <div style={s.secaoContainer}>
          <p style={s.eyebrow}>O que já funciona</p>
          <h2 style={{ ...s.tituloSecao, fontSize: isMobile ? 26 : 36 }}>
            Seis módulos, um único ecossistema
          </h2>
          <div style={{ ...s.featuresGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
            {FUNCIONALIDADES.map(f => (
              <div key={f.titulo} style={s.featureCard}>
                <div style={s.featureIconeBox}>{f.icone}</div>
                <h3 style={s.featureTitulo}>{f.titulo}</h3>
                <p style={s.featureTexto}>{f.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section style={{ ...s.secao, padding: isMobile ? '56px 20px' : '80px 48px' }}>
        <p style={s.eyebrow}>Investimento</p>
        <h2 style={{ ...s.tituloSecao, fontSize: isMobile ? 26 : 36 }}>
          Comece de graça, evolua quando quiser
        </h2>
        <div style={{ ...s.precosGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
          <div style={s.planoCard}>
            <h3 style={s.planoNome}>Grátis</h3>
            <p style={s.planoPreco}>R$ 0</p>
            <p style={s.planoDescricao}>Controle manual completo — todas as funcionalidades, exceto IA.</p>
            <ul style={s.planoLista}>
              <li><span style={s.checkVerde}>✓</span> Despesas, receitas e cartões de crédito</li>
              <li><span style={s.checkVerde}>✓</span> Meus Sonhos e metas financeiras com cálculo de prazos</li>
              <li><span style={s.checkVerde}>✓</span> Dashboard completo com saldo do mês</li>
              <li><span style={s.checkVerde}>✓</span> Gestão de parcelamentos e despesas recorrentes</li>
            </ul>
          </div>

          <div style={{ ...s.planoCard, ...s.planoCardPro }}>
            <span style={s.planoSelo}>Lançamento em breve</span>
            <h3 style={{ ...s.planoNome, color: 'var(--primary)' }}>Pro com IA</h3>
            <p style={s.planoPreco}>~R$ 20–25<span style={s.planoPrecoPeriodo}>/mês</span></p>
            <p style={s.planoDescricao}>Tudo do Grátis, mais o poder da IA resolvendo tudo por você.</p>
            <ul style={s.planoLista}>
              <li><span style={s.checkVerde}>✓</span> Categorização automática e lançamentos por voz</li>
              <li><span style={s.checkVerde}>✓</span> Análise do mês em linguagem natural sob demanda</li>
              <li><span style={s.checkVerde}>✓</span> Assistente financeiro para perguntas sobre seus gastos</li>
              <li><span style={s.checkVerde}>✓</span> Dicas inteligentes personalizadas de economia</li>
            </ul>
            <p style={s.planoAviso}>Cobrança ainda não disponível. Entre na lista de espera para ter condições especiais.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section ref={ctaFinalRef} style={{ ...s.ctaFinal, padding: isMobile ? '64px 20px' : '96px 48px' }}>
        <div style={s.ctaContainer}>
          <div style={s.ctaIconeDestaque}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 style={{ ...s.ctaTitulo, fontSize: isMobile ? 28 : 42 }}>
            Ainda em construção.<br />Já funcionando de verdade.
          </h2>
          <p style={s.ctaSub}>
            Entre na lista de espera e seja avisado assim que abrirmos novas vagas de acesso antecipado.
          </p>
          <div style={s.ctaFormWrap}>
            <FormularioListaEspera />
          </div>
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
        <Link to="/login" style={s.rodapeLink}>Acessar Conta</Link>
        <span style={s.rodapeAno}>© {new Date().getFullYear()} Contas Claras · Todos os direitos reservados</span>
      </footer>
    </div>
  )
}

const FUNCIONALIDADES = [
  { icone: '💬', titulo: 'Lançamento por texto ou voz', texto: 'Digite ou fale "gastei 50 no mercado hoje" e a IA categoriza tudo sozinha.' },
  { icone: '💳', titulo: 'Gestão de Cartões', texto: 'Compras no crédito organizadas com suas faturas sem duplicar no orçamento.' },
  { icone: '★',  titulo: 'Meus Sonhos', texto: 'Metas com prazo e cálculo automático de quanto guardar a cada mês.' },
  { icone: '⊡',  titulo: 'Dashboard do Mês', texto: 'Balanço em tempo real de receitas, despesas e comparativos históricos.' },
  { icone: '✦',  titulo: 'Análise por IA Sob Demanda', texto: 'Insights instantâneos e assistente de perguntas financeiras.' },
  { icone: '↻',  titulo: 'Parcelamentos e Recorrências', texto: 'Despesas fixas e compras parceladas geradas automaticamente.' },
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
    background: 'rgba(10, 15, 13, 0.85)',
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
    color: 'var(--text)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 12px',
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
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
  },

  hero: {
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    borderBottom: '1px solid var(--border)',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.12), transparent 70%), #0A0F0D',
  },
  heroGlow: {
    position: 'absolute',
    top: '-20%',
    right: '10%',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroConteudo: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 720,
    margin: '0 auto',
    textAlign: 'center',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 99,
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--primary)',
    fontSize: 12.5,
    fontWeight: 600,
    marginBottom: 20,
  },
  heroBadgeIcone: {
    fontSize: 13,
  },
  heroTitulo: {
    margin: '0 0 20px',
    fontFamily: 'var(--font-headline)',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    color: 'var(--text-pure)',
  },
  heroTituloDestaque: {
    background: 'linear-gradient(135deg, #10B981, #2DD4BF)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    margin: '0 auto 36px',
    lineHeight: 1.65,
    color: 'var(--text-muted)',
    maxWidth: 620,
    fontSize: 17,
  },
  heroBotoes: {
    display: 'flex',
    gap: 14,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  botaoPrimario: {
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    borderRadius: 10,
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
  },
  botaoSecundario: {
    background: 'var(--surface)',
    color: 'var(--text-pure)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    boxSizing: 'border-box',
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
    color: 'var(--text-dim)',
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
    width: 42,
    height: 42,
    borderRadius: 10,
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
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
  planoNome: {
    margin: '0 0 6px',
    fontSize: 20,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  planoPreco: {
    margin: '0 0 14px',
    fontSize: 34,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  planoPrecoPeriodo: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  planoDescricao: {
    margin: '0 0 20px',
    fontSize: 14,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  planoLista: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    fontSize: 14,
    color: 'var(--text)',
  },
  checkVerde: {
    color: 'var(--primary)',
    fontWeight: 800,
    marginRight: 8,
  },
  planoAviso: {
    margin: '22px 0 0',
    fontSize: 12.5,
    color: 'var(--text-dim)',
    lineHeight: 1.5,
    borderTop: '1px solid var(--border-subtle)',
    paddingTop: 14,
  },

  ctaFinal: {
    background: '#070C0A',
    borderTop: '1px solid var(--border)',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  ctaContainer: {
    maxWidth: 600,
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
    maxWidth: 480,
    fontSize: 16,
    lineHeight: 1.6,
    color: 'var(--text-muted)',
  },
  ctaFormWrap: {
    maxWidth: 420,
    margin: '0 auto',
  },

  formEspera: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%' },
  formEsperaCampo: { display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' },
  inputEspera: {
    flex: '1 1 200px',
    minWidth: 0,
    padding: '13px 16px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    background: 'var(--surface-raised)',
    color: 'var(--text-pure)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
  },
  botaoEspera: {
    flex: '0 0 auto',
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    borderRadius: 10,
    padding: '13px 22px',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
  },
  erroEspera: { margin: 0, fontSize: 13, color: 'var(--tertiary)', textAlign: 'left' },
  sucessoBox: {
    background: 'rgba(16, 185, 129, 0.16)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: 10,
    padding: '14px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
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
    color: 'var(--text-dim)',
  },
}
