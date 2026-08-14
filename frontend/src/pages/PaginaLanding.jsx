import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LogoMarca from '../components/LogoMarca'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 720)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 720)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// Acompanha o progresso de rolagem da página (0 a 1) para alimentar a
// animação de assinatura do sol. Fica parado em 1 (sol pleno, sem
// transição) para quem pediu menos movimento no sistema.
function useScrollIntensity() {
  const [intensidade, setIntensidade] = useState(0.18)
  const reduzMovimento = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduzMovimento.current = mq.matches
    if (mq.matches) {
      setIntensidade(1)
      return
    }

    let ticking = false
    function calcular() {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const proporcao = max > 0 ? window.scrollY / max : 0
      setIntensidade(0.18 + Math.min(1, Math.max(0, proporcao)) * 0.82)
      ticking = false
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(calcular)
        ticking = true
      }
    }
    calcular()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return intensidade
}

function SolAssinatura({ size = 320, intensidade = 0.5, style = {} }) {
  const cx = size / 2, cy = size / 2
  const r      = size * 0.215
  const rayIn  = size * 0.285
  const rayOut = size * 0.435
  const sw     = size * 0.018
  const rays   = [0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
    const rad = (deg * Math.PI) / 180
    return {
      x1: cx + rayIn  * Math.sin(rad), y1: cy - rayIn  * Math.cos(rad),
      x2: cx + (rayIn + (rayOut - rayIn) * (0.45 + intensidade * 0.55)) * Math.sin(rad),
      y2: cy - (rayIn + (rayOut - rayIn) * (0.45 + intensidade * 0.55)) * Math.cos(rad),
    }
  })
  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg" style={style}
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={r} fill="#E3A008" opacity={0.55 + intensidade * 0.45} />
      <g stroke="#E3A008" strokeWidth={sw} strokeLinecap="round" opacity={0.25 + intensidade * 0.75}>
        {rays.map((ray, i) => (
          <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
        ))}
      </g>
    </svg>
  )
}

function FormularioListaEspera({ variante = 'hero' }) {
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
      <div style={{ ...s.sucessoBox, ...(variante === 'cta' ? s.sucessoBoxClaro : {}) }}>
        <span>✓</span> Você está na lista! Avisaremos assim que abrirmos o acesso.
      </div>
    )
  }

  const escuro = variante === 'hero'

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
          style={{ ...s.inputEspera, ...(escuro ? {} : s.inputEsperaClaro) }}
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
  const isMobile     = useIsMobile()
  const intensidade = useScrollIntensity()
  const ctaFinalRef  = useRef(null)

  function scrollAteFormulario() {
    ctaFinalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={s.pagina}>
      {/* MENU TOPO */}
      <header style={{ ...s.nav, padding: isMobile ? '14px 18px' : '18px 40px' }}>
        <div style={s.navLogo}>
          <LogoMarca size={isMobile ? 22 : 26} rayColor="rgba(31,93,69,0.75)" />
          <span style={s.navLogoTexto}>Contas Claras</span>
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
      <section style={{ ...s.hero, padding: isMobile ? '48px 20px 56px' : '76px 40px 96px' }}>
        <SolAssinatura
          size={isMobile ? 220 : 420}
          intensidade={intensidade}
          style={{
            position: 'absolute',
            top: isMobile ? -50 : -90,
            right: isMobile ? -50 : -70,
            pointerEvents: 'none',
          }}
        />
        <div style={s.heroConteudo}>
          <h1 style={{ ...s.heroTitulo, fontSize: isMobile ? 34 : 58 }}>
            A Clareza<br />começa aqui.
          </h1>
          <p style={{ ...s.heroSub, fontSize: isMobile ? 16 : 19 }}>
            Chega de descobrir só no fim do mês que gastou mais do que podia.
            Chega de somar na mão a fatura do cartão pra não duplicar no orçamento.
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
      <section style={{ ...s.secao, padding: isMobile ? '40px 20px' : '56px 40px' }}>
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
      <section style={{ ...s.secaoEscura, padding: isMobile ? '48px 20px' : '72px 40px' }}>
        <p style={{ ...s.eyebrow, ...s.eyebrowClaro }}>O que já funciona</p>
        <h2 style={{ ...s.tituloSecao, ...s.tituloClaro, fontSize: isMobile ? 24 : 32 }}>
          Seis módulos, um único lugar
        </h2>
        <div style={{ ...s.featuresGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
          {FUNCIONALIDADES.map(f => (
            <div key={f.titulo} style={s.featureCard}>
              <span style={s.featureIcone}>{f.icone}</span>
              <h3 style={s.featureTitulo}>{f.titulo}</h3>
              <p style={s.featureTexto}>{f.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREÇOS */}
      <section style={{ ...s.secao, padding: isMobile ? '48px 20px' : '72px 40px' }}>
        <p style={s.eyebrow}>Investimento</p>
        <h2 style={{ ...s.tituloSecao, fontSize: isMobile ? 24 : 32 }}>
          Comece de graça, evolua quando quiser
        </h2>
        <div style={{ ...s.precosGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
          <div style={s.planoCard}>
            <h3 style={s.planoNome}>Grátis</h3>
            <p style={s.planoPreco}>R$ 0</p>
            <p style={s.planoDescricao}>Controle manual completo — todas as funcionalidades, exceto IA.</p>
            <ul style={s.planoLista}>
              <li>Despesas, receitas e cartões</li>
              <li>Meus Sonhos e metas</li>
              <li>Dashboard com saldo real x projetado</li>
              <li>Parcelamento e recorrências</li>
            </ul>
          </div>
          <div style={{ ...s.planoCard, ...s.planoCardPro }}>
            <span style={s.planoSelo}>Lançamento em breve</span>
            <h3 style={s.planoNome}>Pro</h3>
            <p style={s.planoPreco}>~R$ 20–25<span style={s.planoPrecoPeriodo}>/mês</span></p>
            <p style={s.planoDescricao}>Tudo do Grátis, mais o que a IA resolve por você.</p>
            <ul style={s.planoLista}>
              <li>Categorização automática por IA</li>
              <li>Análise do mês em linguagem natural</li>
              <li>Perguntas livres sobre suas finanças</li>
            </ul>
            <p style={s.planoAviso}>Cobrança ainda não está disponível. Entre na lista de espera para ser avisado no lançamento.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section ref={ctaFinalRef} style={{ ...s.ctaFinal, padding: isMobile ? '56px 20px' : '88px 40px' }}>
        <SolAssinatura
          size={isMobile ? 180 : 280}
          intensidade={Math.max(intensidade, 0.85)}
          style={{ margin: '0 auto 24px', display: 'block' }}
        />
        <h2 style={{ ...s.ctaTitulo, fontSize: isMobile ? 26 : 38 }}>
          Ainda em construção. Já funcionando de verdade.
        </h2>
        <p style={s.ctaSub}>
          Entre na lista de espera e seja avisado assim que abrirmos novas vagas de acesso antecipado.
        </p>
        <div style={s.ctaFormWrap}>
          <FormularioListaEspera variante="cta" />
        </div>
      </section>

      {/* RODAPÉ */}
      <footer style={{ ...s.rodape, padding: isMobile ? '24px 20px' : '28px 40px' }}>
        <div style={s.navLogo}>
          <LogoMarca size={18} rayColor="rgba(245,240,228,0.75)" />
          <span style={s.rodapeLogoTexto}>Contas Claras</span>
        </div>
        <Link to="/login" style={s.rodapeLink}>Entrar</Link>
        <span style={s.rodapeAno}>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}

const FUNCIONALIDADES = [
  { icone: '💬', titulo: 'Lançamento por texto livre', texto: 'Digite "gastei 50 no mercado hoje" e a IA categoriza sozinha.' },
  { icone: '💳', titulo: 'Gestão de Cartões', texto: 'Compras no crédito sem duplicar no orçamento do mês.' },
  { icone: '★',  titulo: 'Meus Sonhos', texto: 'Metas com prazo — o app calcula quanto guardar por mês.' },
  { icone: '⊡',  titulo: 'Dashboard do mês', texto: 'Saldo real x saldo projetado, sempre atualizado.' },
  { icone: '✦',  titulo: 'Análise por IA', texto: 'Resumo do mês e perguntas em linguagem natural.' },
  { icone: '↻',  titulo: 'Parcelamento e recorrências', texto: 'Despesas fixas e parceladas geradas automaticamente todo mês.' },
]

const s = {
  pagina: {
    minHeight: '100vh', width: '100%', overflowX: 'hidden',
    background: '#F5F0E4', color: '#1a1a2e',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#F5F0E4', position: 'sticky', top: 0, zIndex: 20,
    borderBottom: '1px solid #EDE7DA', boxSizing: 'border-box',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8 },
  navLogoTexto: { fontSize: 16, fontWeight: 800, color: '#1F5D45', letterSpacing: '-0.02em' },
  navAcoes: { display: 'flex', alignItems: 'center', gap: 10 },
  navLinkEntrar: {
    background: 'none', border: 'none', color: '#1F5D45', textDecoration: 'none',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 4px',
  },
  navBotaoDestaque: {
    background: '#1F5D45', color: '#F5F0E4', border: 'none',
    borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },

  hero: {
    position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    background: '#1F5D45', color: '#F5F0E4',
  },
  heroConteudo: { position: 'relative', zIndex: 1, maxWidth: 640 },
  heroTitulo: {
    margin: '0 0 20px', fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.01em', color: '#F5F0E4',
  },
  heroSub: {
    margin: '0 0 32px', lineHeight: 1.65, color: 'rgba(245,240,228,0.82)', maxWidth: 560,
  },
  heroBotoes: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  botaoPrimario: {
    background: '#E3A008', color: '#1a1a2e', border: 'none',
    borderRadius: 8, padding: '14px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  botaoSecundario: {
    background: 'transparent', color: '#F5F0E4', border: '1.5px solid rgba(245,240,228,0.5)',
    borderRadius: 8, padding: '14px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    textDecoration: 'none', display: 'inline-block', boxSizing: 'border-box',
  },

  secao: { maxWidth: 1080, margin: '0 auto', boxSizing: 'border-box', width: '100%' },
  secaoEscura: {
    background: '#1F5D45', color: '#F5F0E4', boxSizing: 'border-box',
  },
  eyebrow: {
    margin: '0 0 8px', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: '#2D7A5C',
  },
  eyebrowClaro: { color: '#E3A008', maxWidth: 1080, marginLeft: 'auto', marginRight: 'auto' },
  tituloSecao: { margin: '0 0 28px', fontWeight: 700, fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' },
  tituloClaro: { color: '#F5F0E4', maxWidth: 1080, marginLeft: 'auto', marginRight: 'auto' },

  statsGrid: { display: 'grid', gap: 16 },
  statCard: {
    background: '#fff', borderRadius: 12, padding: '22px 18px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 4,
  },
  statNumero: { fontSize: 24, fontWeight: 800, color: '#1F5D45', fontFamily: 'Georgia, serif' },
  statLabel: { fontSize: 13, color: '#64748b', lineHeight: 1.4 },
  statsRodape: { margin: '20px 0 0', fontSize: 13, color: '#64748b', maxWidth: 640 },

  featuresGrid: { display: 'grid', gap: 20, maxWidth: 1080, margin: '0 auto' },
  featureCard: {
    background: 'rgba(245,240,228,0.06)', border: '1px solid rgba(245,240,228,0.14)',
    borderRadius: 14, padding: '22px 20px',
  },
  featureIcone: { fontSize: 22, display: 'block', marginBottom: 10 },
  featureTitulo: { margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#F5F0E4' },
  featureTexto: { margin: 0, fontSize: 14, lineHeight: 1.55, color: 'rgba(245,240,228,0.72)' },

  precosGrid: { display: 'grid', gap: 20 },
  planoCard: {
    background: '#fff', borderRadius: 16, padding: '28px 26px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.07)', position: 'relative', boxSizing: 'border-box',
  },
  planoCardPro: { border: '2px solid #E3A008' },
  planoSelo: {
    position: 'absolute', top: -12, right: 20, background: '#E3A008', color: '#1a1a2e',
    fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.02em',
  },
  planoNome: { margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#1F5D45' },
  planoPreco: { margin: '0 0 14px', fontSize: 30, fontWeight: 800, fontFamily: 'Georgia, serif', color: '#1a1a2e' },
  planoPrecoPeriodo: { fontSize: 14, fontWeight: 500, color: '#94a3b8' },
  planoDescricao: { margin: '0 0 16px', fontSize: 14, color: '#64748b', lineHeight: 1.5 },
  planoLista: { margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#334155' },
  planoAviso: { margin: '18px 0 0', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 },

  ctaFinal: {
    background: '#1F5D45', color: '#F5F0E4', textAlign: 'center', boxSizing: 'border-box',
  },
  ctaTitulo: { margin: '0 0 14px', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E4' },
  ctaSub: { margin: '0 auto 32px', maxWidth: 480, fontSize: 16, lineHeight: 1.6, color: 'rgba(245,240,228,0.78)' },
  ctaFormWrap: { maxWidth: 420, margin: '0 auto' },

  formEspera: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%' },
  formEsperaCampo: { display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' },
  inputEspera: {
    flex: '1 1 200px', minWidth: 0, padding: '13px 16px', borderRadius: 8,
    border: '1.5px solid rgba(245,240,228,0.4)', background: 'rgba(255,255,255,0.08)',
    color: '#F5F0E4', fontSize: 15, outline: 'none', boxSizing: 'border-box',
  },
  inputEsperaClaro: { background: 'rgba(255,255,255,0.1)' },
  botaoEspera: {
    flex: '0 0 auto', background: '#E3A008', color: '#1a1a2e', border: 'none',
    borderRadius: 8, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  erroEspera: { margin: 0, fontSize: 13, color: '#FCA5A5', textAlign: 'left' },
  sucessoBox: {
    background: 'rgba(45,122,92,0.18)', border: '1px solid rgba(245,240,228,0.3)',
    borderRadius: 10, padding: '14px 18px', fontSize: 14, fontWeight: 600,
    color: '#F5F0E4', display: 'flex', alignItems: 'center', gap: 8,
  },
  sucessoBoxClaro: {},

  rodape: {
    background: '#164536', display: 'flex', alignItems: 'center', gap: 20,
    flexWrap: 'wrap', boxSizing: 'border-box',
  },
  rodapeLogoTexto: { fontSize: 13, fontWeight: 700, color: 'rgba(245,240,228,0.85)' },
  rodapeLink: {
    background: 'none', border: 'none', color: 'rgba(245,240,228,0.75)', textDecoration: 'none',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
  },
  rodapeAno: { marginLeft: 'auto', fontSize: 12, color: 'rgba(245,240,228,0.5)' },
}
