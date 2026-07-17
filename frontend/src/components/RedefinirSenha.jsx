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
    <div style={e.container}>
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
              placeholder="Nova senha"
              value={senha}
              onChange={ev => setSenha(ev.target.value)}
              style={e.input}
              required
              autoFocus
            />
            <input
              type="password"
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
  sucessoBox: {
    padding: '14px 16px',
    borderRadius: 8,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
  },
  sucessoTexto: { margin: 0, fontSize: 14, fontWeight: 600, color: '#16a34a' },
}
