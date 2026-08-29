import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useIsMobile } from './Dashboard'

export default function Login({ onLogin }) {
  const [modo, setModo]                 = useState('login') // 'login' | 'cadastro' | 'recuperar'
  const [email, setEmail]               = useState('')
  const [senha, setSenha]               = useState('')
  const [erro, setErro]                 = useState('')
  const [sucesso, setSucesso]           = useState('')
  const [carregando, setCarregando]     = useState(false)
  const isMobile = useIsMobile()

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setCarregando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) setErro('Email ou senha incorretos.')
    else onLogin(data.user)
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setCarregando(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    })
    setCarregando(false)
    if (error) {
      setErro(error.message)
    } else if (data.session) {
      onLogin(data.user)
    } else {
      setSucesso('Conta criada com sucesso! Você já pode entrar.')
      setModo('login')
    }
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setCarregando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setCarregando(false)
    if (error) setErro('Não foi possível enviar o e-mail de recuperação.')
    else setSucesso('Link de recuperação enviado para o seu e-mail!')
  }

  const painelEsq = (
    <div style={isMobile ? m.esqMobile : m.esqDesktop}>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={m.painelBadge}>
          <span>✦ Inteligência Financeira</span>
        </div>
        <h2 style={isMobile ? m.headlineMobile : m.headlineDesktop}>
          A Clareza<br /><span style={m.headlineDestaque}>começa aqui.</span>
        </h2>
        <p style={isMobile ? m.subMobile : m.subDesktop}>
          Registre, entenda e acompanhe suas finanças com inteligência em um só lugar.
        </p>
      </div>
    </div>
  )

  const formulario = (
    <div style={isMobile ? m.formAreaMobile : m.formAreaDesktop}>
      <div style={isMobile ? m.formWrapMobile : m.formWrapDesktop}>
        {/* Nova Logomarca Padronizada */}
        <div style={m.logoRow}>
          <div style={m.logoAvatar}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={m.logoTitulo}>Contas Claras</span>
            <span style={m.logoSub}>Inteligência Financeira</span>
          </div>
        </div>

        {modo === 'login' && (
          <>
            <h3 style={m.formTitulo}>Bem-vindo de volta</h3>
            <p style={m.formSubtitulo}>Acesse sua conta para visualizar seu dashboard.</p>
            <form onSubmit={handleLogin} style={m.form}>
              <div style={m.inputWrap}>
                <label style={m.label} htmlFor="login-email">Email</label>
                <input
                  id="login-email"
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
              {sucesso && <p style={m.sucesso}>{sucesso}</p>}
              <button type="submit" style={m.botao} disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div style={m.linksRow}>
              <button type="button" onClick={() => { setModo('cadastro'); setErro(''); setSucesso('') }} style={m.linkBtn}>
                Criar uma conta
              </button>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <button type="button" onClick={() => { setModo('recuperar'); setErro(''); setSucesso('') }} style={m.linkBtn}>
                Esqueci minha senha
              </button>
            </div>
          </>
        )}

        {modo === 'cadastro' && (
          <>
            <h3 style={m.formTitulo}>Criar nova conta</h3>
            <p style={m.formSubtitulo}>Cadastre-se para começar seu controle inteligente.</p>
            <form onSubmit={handleCadastro} style={m.form}>
              <div style={m.inputWrap}>
                <label style={m.label} htmlFor="cad-email">Email</label>
                <input
                  id="cad-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={m.input}
                  required
                />
              </div>
              <div style={m.inputWrap}>
                <label style={m.label} htmlFor="cad-senha">Senha (mínimo 6 caracteres)</label>
                <input
                  id="cad-senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={m.input}
                  required
                  minLength={6}
                />
              </div>
              {erro && <p style={m.erro}>{erro}</p>}
              <button type="submit" style={m.botao} disabled={carregando}>
                {carregando ? 'Criando conta...' : 'Cadastrar'}
              </button>
            </form>

            <button type="button" onClick={() => { setModo('login'); setErro(''); setSucesso('') }} style={m.linkBtnSolo}>
              ← Já tem uma conta? Entrar
            </button>
          </>
        )}

        {modo === 'recuperar' && (
          <>
            <h3 style={m.formTitulo}>Recuperação de senha</h3>
            <p style={m.formSubtitulo}>Informe seu e-mail para receber as instruções.</p>
            <form onSubmit={handleRecuperar} style={m.form}>
              <div style={m.inputWrap}>
                <label style={m.label} htmlFor="rec-email">Seu e-mail</label>
                <input
                  id="rec-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={m.input}
                  required
                />
              </div>
              {erro && <p style={m.erro}>{erro}</p>}
              {sucesso && <p style={m.sucesso}>{sucesso}</p>}
              <button type="submit" style={m.botao} disabled={carregando}>
                {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>

            <button type="button" onClick={() => { setModo('login'); setErro(''); setSucesso('') }} style={m.linkBtnSolo}>
              ← Voltar para o login
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {painelEsq}
      {formulario}
    </div>
  )
}

const m = {
  esqDesktop: {
    width: '45%', minHeight: '100vh',
    background: '#0A0F0D',
    borderRight: '1px solid var(--border)',
    position: 'relative', overflow: 'hidden',
    padding: '0 52px 72px',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    flexShrink: 0,
  },
  esqMobile: {
    background: '#0A0F0D',
    borderBottom: '1px solid var(--border)',
    position: 'relative', overflow: 'hidden',
    padding: '36px 28px 40px',
    flexShrink: 0,
  },
  marcaDaguaGlow: {
    position: 'absolute', top: '-10%', right: '-10%',
    opacity: 0.65, pointerEvents: 'none',
    filter: 'drop-shadow(0 0 40px rgba(16, 185, 129, 0.15))',
  },
  painelBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 99,
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--primary)',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 16,
  },
  headlineDesktop: {
    margin: '0 0 16px',
    fontFamily: 'var(--font-headline)',
    fontSize: 44, fontWeight: 800, lineHeight: 1.15,
    color: 'var(--text-pure)', letterSpacing: '-0.02em',
  },
  headlineDestaque: {
    background: 'linear-gradient(135deg, #10B981, #2DD4BF)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headlineMobile: {
    margin: '0 0 10px',
    fontFamily: 'var(--font-headline)',
    fontSize: 28, fontWeight: 800, lineHeight: 1.2,
    color: 'var(--text-pure)', letterSpacing: '-0.02em',
  },
  subDesktop: {
    margin: 0, fontSize: 15, lineHeight: 1.6,
    color: 'var(--text-muted)', maxWidth: 360,
  },
  subMobile: {
    margin: 0, fontSize: 13, lineHeight: 1.5,
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
  formWrapDesktop: { width: '100%', maxWidth: 400 },
  formWrapMobile:  { width: '100%' },

  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  logoAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #153E32, #0A1E17)',
    border: '1.5px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.22)',
    flexShrink: 0,
  },
  logoTitulo: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 11.5,
    fontWeight: 500,
    color: 'var(--text-muted)',
  },

  formTitulo: {
    margin: '0 0 4px',
    fontSize: 22,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  formSubtitulo: {
    margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  inputWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text)' },
  input: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    fontSize: 14, background: 'var(--surface-raised)',
    outline: 'none', color: 'var(--text-pure)',
    boxSizing: 'border-box', width: '100%',
    fontFamily: 'var(--font-body)',
  },
  botao: {
    marginTop: 6,
    padding: '13px',
    borderRadius: 10, border: 'none',
    background: 'var(--primary)', color: '#0A0F0D',
    fontSize: 15, fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
  },
  erro: { color: 'var(--tertiary)', fontSize: 13, margin: 0 },
  sucesso: { color: 'var(--primary)', fontSize: 13, margin: 0 },
  linksRow: {
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  linkBtn: {
    background: 'none', border: 'none',
    color: 'var(--primary)', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', padding: 0,
  },
  linkBtnSolo: {
    marginTop: 20,
    display: 'block',
    background: 'none', border: 'none',
    color: 'var(--primary)', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', textAlign: 'center', width: '100%',
  },
}
