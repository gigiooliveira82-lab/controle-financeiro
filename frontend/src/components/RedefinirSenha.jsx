import { useState } from 'react'
import { supabase } from '../services/supabase'

export default function RedefinirSenha({ onConcluido }) {
  const [senha, setSenha]         = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]           = useState('')
  const [sucesso, setSucesso]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setErro('Não foi possível atualizar a senha. Solicite um novo link de recuperação.')
    } else {
      setSucesso(true)
      setTimeout(onConcluido, 2500)
    }
    setCarregando(false)
  }

  return (
    <div style={e.container} data-theme="dark" data-theme-locked="dark" className="theme-dark-locked">
      <div style={e.card}>
        <h1 style={e.titulo}>Contas Claras</h1>
        <p style={e.subtitulo}>Defina sua nova senha</p>

        {sucesso ? (
          <div style={e.sucessoBox}>
            <p style={e.sucessoTexto}>✓ Senha atualizada com sucesso! Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={e.form}>
            <input
              type="password"
              aria-label="Nova senha"
              autoComplete="new-password"
              placeholder="Nova senha"
              value={senha}
              onChange={ev => setSenha(ev.target.value)}
              style={e.input}
              required
              autoFocus
            />
            <input
              type="password"
              aria-label="Confirmar nova senha"
              autoComplete="new-password"
              placeholder="Confirmar nova senha"
              value={confirmar}
              onChange={ev => setConfirmar(ev.target.value)}
              style={e.input}
              required
            />
            {erro && <p style={e.erro}>{erro}</p>}
            <button type="submit" style={e.botao} disabled={carregando}>
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const e = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0A0F0D',
  },
  card: {
    background: '#121A16',
    border: '1px solid #1E2C26',
    borderRadius: 16,
    padding: '40px 36px',
    width: 360,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  titulo:    { margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-headline)' },
  subtitulo: { margin: '0 0 28px', color: '#8FA69B', fontSize: 14 },
  form:      { display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #1E2C26',
    background: '#18231E',
    color: '#FFFFFF',
    fontSize: 14,
    outline: 'none',
  },
  botao: {
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: '#10B981',
    color: '#0A0F0D',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    marginTop: 4,
    boxShadow: '0 0 14px rgba(16, 185, 129, 0.25)',
  },
  erro: { color: '#FC7C78', fontSize: 13, margin: 0 },
  sucessoBox: {
    padding: '14px 16px',
    borderRadius: 8,
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1px solid #10B981',
  },
  sucessoTexto: { margin: 0, fontSize: 14, fontWeight: 600, color: '#10B981' },
}
