import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useIsMobile } from './Dashboard'
import LogoIcone from './LogoIcone'
import Wordmark from './Wordmark'
import logomarcaPng from '../assets/logomarca.png'

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
  const isMobile = useIsMobile()

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) setErro('Email ou senha incorretos.')
    else onLogin(data.user)
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
      <img
        src={logomarcaPng}
        alt=""
        aria-hidden="true"
        style={{ ...m.marcaDagua, width: isMobile ? 240 : 420 }}
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
          <LogoIcone size={isMobile ? 40 : 46} />
          <Wordmark tone="onDark" size={isMobile ? 14 : 16} />
        </div>

        {!modoRecuperar ? (
          <>
            <p style={m.formSubtitulo}>
              {isMobile ? 'Faça login para continuar' : 'Bem-vindo de volta'}
            </p>
            <form onSubmit={handleLogin} style={m.form}>
              <div style={m.inputWrap}>
                <label style={m.label} htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={m.input}
                  required
                />
              </div>
              <div style={m.inputWrap}>
                <label style={m.label} htmlFor="login-senha">Senha</label>
                <input
                  id="login-senha"
                  name="password"
                  type="password"
                  autoComplete="current-password"
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
                  <label style={m.label} htmlFor="login-email-recuperar">Seu e-mail</label>
                  <input
                    id="login-email-recuperar"
                    name="email"
                    type="email"
                    autoComplete="email"
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

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh' }}>
      {painelEsq}
      {formulario}
    </div>
  )
}

const m = {
  esqDesktop: {
    width: '45%', minHeight: '100vh',
    background: 'var(--bg-deep)',
    position: 'relative', overflow: 'hidden',
    padding: '0 52px 72px',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    flexShrink: 0,
  },
  esqMobile: {
    background: 'var(--bg-deep)',
    position: 'relative', overflow: 'hidden',
    padding: '36px 28px 40px',
    flexShrink: 0,
  },
  marcaDagua: {
    position: 'absolute', top: '-6%', right: '-8%',
    opacity: 0.92, pointerEvents: 'none',
  },
  headlineDesktop: {
    margin: '0 0 18px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 46, fontWeight: 700, lineHeight: 1.18,
    color: 'var(--text)', letterSpacing: '-0.01em',
  },
  headlineMobile: {
    margin: '0 0 12px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 28, fontWeight: 700, lineHeight: 1.22,
    color: 'var(--text)', letterSpacing: '-0.01em',
  },
  subDesktop: {
    margin: 0, fontSize: 16, lineHeight: 1.65,
    color: 'var(--text-muted)', maxWidth: 320,
  },
  subMobile: {
    margin: 0, fontSize: 14, lineHeight: 1.6,
    color: 'var(--text-muted)',
  },

  formAreaDesktop: {
    flex: 1,
    background: 'var(--surface)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 40px',
  },
  formAreaMobile: {
    flex: 1,
    background: 'var(--surface)',
    padding: '36px 28px 40px',
  },
  formWrapDesktop: { width: '100%', maxWidth: 380 },
  formWrapMobile:  { width: '100%' },

  logoRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    marginBottom: 32,
  },

  formSubtitulo: {
    margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)', fontWeight: 500,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  inputWrap: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  input: {
    padding: '11px 14px',
    borderRadius: 8,
    border: '1.5px solid var(--border)',
    fontSize: 15, background: 'var(--surface-raised)',
    outline: 'none', color: 'var(--text)',
    boxSizing: 'border-box', width: '100%',
  },
  botao: {
    marginTop: 4,
    padding: '13px',
    borderRadius: 8, border: 'none',
    background: 'var(--emerald)', color: 'var(--bg-deep)',
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.01em',
  },
  erro: { color: 'var(--status-vencida-fg)', fontSize: 13, margin: 0 },
  linkBtn: {
    marginTop: 18,
    display: 'block', background: 'none', border: 'none',
    color: 'var(--mint)', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', textAlign: 'center',
    padding: 0, width: '100%',
  },
  sucessoBox: {
    padding: '14px 16px', borderRadius: 8,
    background: 'var(--status-pago-bg)', border: '1px solid var(--status-pago-fg)',
    marginBottom: 4,
  },
  sucessoTexto: { margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--status-pago-fg)' },
}
