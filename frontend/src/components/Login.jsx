import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

function useIsLoginMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 1024)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 1024)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function LogoMarca({ size = 26, rayColor = 'rgba(255,255,255,0.82)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="16" cy="16" r="5" fill="#F2C84B" />
      <g stroke={rayColor} strokeWidth="2.2" strokeLinecap="round">
        <line x1="16"   y1="3.5"  x2="16"   y2="8.5"  />
        <line x1="16"   y1="23.5" x2="16"   y2="28.5" />
        <line x1="3.5"  y1="16"   x2="8.5"  y2="16"   />
        <line x1="23.5" y1="16"   x2="28.5" y2="16"   />
        <line x1="10.7" y1="10.7" x2="7.2"  y2="7.2"  />
        <line x1="21.3" y1="10.7" x2="24.8" y2="7.2"  />
        <line x1="10.7" y1="21.3" x2="7.2"  y2="24.8" />
        <line x1="21.3" y1="21.3" x2="24.8" y2="24.8" />
      </g>
    </svg>
  )
}

function SolDecorativo({ size = 360, style = {} }) {
  const cx = size / 2, cy = size / 2
  const r      = size * 0.215
  const rayIn  = size * 0.285
  const rayOut = size * 0.435
  const sw     = size * 0.018
  const rays   = [0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
    const rad = (deg * Math.PI) / 180
    return {
      x1: cx + rayIn  * Math.sin(rad), y1: cy - rayIn  * Math.cos(rad),
      x2: cx + rayOut * Math.sin(rad), y2: cy - rayOut * Math.cos(rad),
    }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg" style={style}>
      <circle cx={cx} cy={cy} r={r} fill="#E3A008" />
      <g stroke="#E3A008" strokeWidth={sw} strokeLinecap="round">
        {rays.map((ray, i) => (
          <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
        ))}
      </g>
    </svg>
  )
}

export default function Login({ onLogin }) {
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [erro, setErro]           = useState('')
  const [carregando, setCarregando] = useState(false)
  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [emailRec, setEmailRec]   = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [enviado, setEnviado]     = useState(false)
  const [erroRec, setErroRec]     = useState('')
  const isMobile = useIsLoginMobile()

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('Email ou senha incorretos.')
    else onLogin(data.user)
    setCarregando(false)
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setErroRec('')
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailRec.trim(), {
      redirectTo: window.location.origin,
    })
    if (error) setErroRec('Não foi possível enviar o e-mail. Verifique o endereço digitado.')
    else setEnviado(true)
    setEnviando(false)
  }

  function voltarParaLogin() {
    setModoRecuperar(false)
    setEmailRec('')
    setEnviado(false)
    setErroRec('')
  }

  const painelEsq = (
    <div style={isMobile ? m.esqMobile : m.esqDesktop}>
      <SolDecorativo
        size={isMobile ? 200 : 360}
        style={{
          position: 'absolute',
          top: isMobile ? -60 : -80,
          right: isMobile ? -60 : -90,
          opacity: 0.22,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={isMobile ? m.headlineMobile : m.headlineDesktop}>
          A Clareza<br />começa aqui.
        </h2>
        <p style={isMobile ? m.subMobile : m.subDesktop}>
          Registre, entenda e acompanhe suas finanças em um só lugar.
        </p>
      </div>
    </div>
  )

  const formulario = (
    <div style={isMobile ? m.formAreaMobile : m.formAreaDesktop}>
      <div style={isMobile ? m.formWrapMobile : m.formWrapDesktop}>
        <div style={m.logoRow}>
          <LogoMarca size={isMobile ? 22 : 26} rayColor="rgba(31,93,69,0.7)" />
          <span style={isMobile ? m.logoTextoMobile : m.logoTextoDesktop}>Contas Claras</span>
        </div>

        {!modoRecuperar ? (
          <>
            <p style={m.formSubtitulo}>
              {isMobile ? 'Faça login para continuar' : 'Bem-vindo de volta'}
            </p>
            <form onSubmit={handleLogin} style={m.form}>
              <div style={m.inputWrap}>
                <label style={m.label}>Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={m.input}
                  required
                />
              </div>
              <div style={m.inputWrap}>
                <label style={m.label}>Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={m.input}
                  required
                />
              </div>
              {erro && <p style={m.erro}>{erro}</p>}
              <button type="submit" style={m.botao} disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <button type="button" onClick={() => setModoRecuperar(true)} style={m.linkBtn}>
              Esqueci minha senha
            </button>
          </>
        ) : (
          <>
            <p style={m.formSubtitulo}>Recuperação de senha</p>
            {enviado ? (
              <div style={m.sucessoBox}>
                <p style={m.sucessoTexto}>
                  ✓ Link enviado! Verifique sua caixa de entrada (e a pasta de spam).
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecuperar} style={m.form}>
                <div style={m.inputWrap}>
                  <label style={m.label}>Seu e-mail</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={emailRec}
                    onChange={e => setEmailRec(e.target.value)}
                    style={m.input}
                    required
                    autoFocus
                  />
                </div>
                {erroRec && <p style={m.erro}>{erroRec}</p>}
                <button type="submit" style={m.botao} disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
            )}
            <button type="button" onClick={voltarParaLogin} style={m.linkBtn}>
              ← Voltar para o login
            </button>
          </>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {painelEsq}
        {formulario}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {painelEsq}
      {formulario}
    </div>
  )
}

const m = {
  esqDesktop: {
    width: '45%', minHeight: '100vh',
    background: '#1F5D45',
    position: 'relative', overflow: 'hidden',
    padding: '0 52px 72px',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    flexShrink: 0,
  },
  esqMobile: {
    background: '#1F5D45',
    position: 'relative', overflow: 'hidden',
    padding: '36px 28px 40px',
    flexShrink: 0,
  },
  headlineDesktop: {
    margin: '0 0 18px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 46, fontWeight: 700, lineHeight: 1.18,
    color: '#F5F0E4', letterSpacing: '-0.01em',
  },
  headlineMobile: {
    margin: '0 0 12px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 28, fontWeight: 700, lineHeight: 1.22,
    color: '#F5F0E4', letterSpacing: '-0.01em',
  },
  subDesktop: {
    margin: 0, fontSize: 16, lineHeight: 1.65,
    color: 'rgba(245,240,228,0.68)', maxWidth: 320,
  },
  subMobile: {
    margin: 0, fontSize: 14, lineHeight: 1.6,
    color: 'rgba(245,240,228,0.72)',
  },

  formAreaDesktop: {
    flex: 1,
    background: '#F5F0E4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 40px',
  },
  formAreaMobile: {
    flex: 1,
    background: '#F5F0E4',
    padding: '36px 28px 40px',
  },
  formWrapDesktop: { width: '100%', maxWidth: 380 },
  formWrapMobile:  { width: '100%' },

  logoRow: {
    display: 'flex', alignItems: 'center', gap: 9,
    marginBottom: 32,
  },
  logoTextoDesktop: {
    fontSize: 17, fontWeight: 800, color: '#1F5D45',
    letterSpacing: '-0.02em', lineHeight: 1,
  },
  logoTextoMobile: {
    fontSize: 15, fontWeight: 800, color: '#1F5D45',
    letterSpacing: '-0.02em', lineHeight: 1,
  },

  formSubtitulo: {
    margin: '0 0 24px', fontSize: 14, color: '#64748b', fontWeight: 500,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  inputWrap: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    padding: '11px 14px',
    borderRadius: 8,
    border: '1.5px solid #D1C9B8',
    fontSize: 15, background: '#fff',
    outline: 'none', color: '#1e293b',
    boxSizing: 'border-box', width: '100%',
  },
  botao: {
    marginTop: 4,
    padding: '13px',
    borderRadius: 8, border: 'none',
    background: '#1F5D45', color: '#F5F0E4',
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.01em',
  },
  erro: { color: '#dc2626', fontSize: 13, margin: 0 },
  linkBtn: {
    marginTop: 18,
    display: 'block', background: 'none', border: 'none',
    color: '#2D7A5C', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', textAlign: 'center',
    padding: 0, width: '100%',
  },
  sucessoBox: {
    padding: '14px 16px', borderRadius: 8,
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    marginBottom: 4,
  },
  sucessoTexto: { margin: 0, fontSize: 14, fontWeight: 500, color: '#16a34a' },
}
