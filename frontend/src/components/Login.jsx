import { useState } from 'react'
import { supabase } from '../services/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState('')
  const [carregando, setCarregando] = useState(false)

  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [emailRec, setEmailRec] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [erroRec, setErroRec]   = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('Email ou senha incorretos.')
    } else {
      onLogin(data.user)
    }
    setCarregando(false)
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setErroRec('')
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailRec.trim(), {
      redirectTo: window.location.origin,
    })
    if (error) {
      setErroRec('Não foi possível enviar o e-mail. Verifique o endereço digitado.')
    } else {
      setEnviado(true)
    }
    setEnviando(false)
  }

  function voltarParaLogin() {
    setModoRecuperar(false)
    setEmailRec('')
    setEnviado(false)
    setErroRec('')
  }

  return (
    <div style={estilos.container}>
      <div style={estilos.card}>
        <h1 style={estilos.titulo}>Controle Financeiro</h1>

        {!modoRecuperar ? (
          <>
            <p style={estilos.subtitulo}>Faça login para continuar</p>
            <form onSubmit={handleLogin} style={estilos.form}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={estilos.input}
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={estilos.input}
                required
              />
              {erro && <p style={estilos.erro}>{erro}</p>}
              <button type="submit" style={estilos.botao} disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setModoRecuperar(true)}
              style={estilos.linkRecuperar}
            >
              Esqueci minha senha
            </button>
          </>
        ) : (
          <>
            <p style={estilos.subtitulo}>Recuperação de senha</p>

            {enviado ? (
              <div style={estilos.sucessoBox}>
                <p style={estilos.sucessoTexto}>
                  ✓ Link enviado! Verifique sua caixa de entrada (e a pasta de spam).
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecuperar} style={estilos.form}>
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={emailRec}
                  onChange={(e) => setEmailRec(e.target.value)}
                  style={estilos.input}
                  required
                  autoFocus
                />
                {erroRec && <p style={estilos.erro}>{erroRec}</p>}
                <button type="submit" style={estilos.botao} disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={voltarParaLogin}
              style={estilos.linkRecuperar}
            >
              ← Voltar para o login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const estilos = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f4f8',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '40px 36px',
    width: 360,
    boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
  },
  titulo:    { margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  subtitulo: { margin: '0 0 28px', color: '#666', fontSize: 14 },
  form:      { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 15,
    outline: 'none',
  },
  botao: {
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  erro: { color: '#dc2626', fontSize: 13, margin: 0 },
  linkRecuperar: {
    marginTop: 16,
    display: 'block',
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'center',
    padding: 0,
    width: '100%',
  },
  sucessoBox: {
    padding: '14px 16px',
    borderRadius: 8,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    marginBottom: 4,
  },
  sucessoTexto: { margin: 0, fontSize: 14, fontWeight: 500, color: '#16a34a' },
}
