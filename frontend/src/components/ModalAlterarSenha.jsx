import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { IconCadeado } from './Icones'

export default function ModalAlterarSenha({ aberto, onFechar }) {
  const [senha, setSenha]                 = useState('')
  const [confirmar, setConfirmar]         = useState('')
  const [verSenha, setVerSenha]           = useState(false)
  const [verConfirmar, setVerConfirmar]   = useState(false)
  const [carregando, setCarregando]       = useState(false)
  const [erro, setErro]                   = useState('')
  const [sucesso, setSucesso]             = useState(false)

  useEffect(() => {
    if (!aberto) return
    setSenha('')
    setConfirmar('')
    setErro('')
    setSucesso(false)

    function handleEsc(e) {
      if (e.key === 'Escape' && !carregando) onFechar()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [aberto, carregando, onFechar])

  if (!aberto) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmar) {
      setErro('As senhas não coincidem. Digite a mesma senha nos dois campos.')
      return
    }

    setCarregando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) {
        setErro(error.message || 'Erro ao atualizar a senha. Tente novamente.')
      } else {
        setSucesso(true)
        setTimeout(() => {
          onFechar()
        }, 1800)
      }
    } catch (err) {
      setErro('Ocorreu um erro ao tentar alterar a senha.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={st.overlay} onClick={(e) => { if (e.target === e.currentTarget && !carregando) onFechar() }}>
      <div style={st.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-alterar-senha">
        {/* Cabeçalho do Modal */}
        <div style={st.header}>
          <div style={st.iconeWrap}>
            <IconCadeado size={20} color="var(--primary)" />
          </div>
          <div style={st.headerTextos}>
            <h2 id="titulo-alterar-senha" style={st.titulo}>Alterar Senha</h2>
            <p style={st.subtitulo}>Digite e confirme a sua nova senha de acesso.</p>
          </div>
          <button
            type="button"
            style={st.fecharBtn}
            onClick={onFechar}
            disabled={carregando}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {sucesso ? (
          <div style={st.sucessoBox}>
            <div style={st.sucessoCheck}>✓</div>
            <span style={st.sucessoTexto}>Senha alterada com sucesso!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={st.form}>
            {/* Campo Nova Senha */}
            <div style={st.campo}>
              <label style={st.label} htmlFor="input-nova-senha">
                Nova senha
              </label>
              <div style={st.inputWrap}>
                <input
                  id="input-nova-senha"
                  type={verSenha ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={st.input}
                  required
                  autoFocus
                  disabled={carregando}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(v => !v)}
                  style={st.btnOlho}
                  title={verSenha ? 'Ocultar senha' : 'Ver senha'}
                  tabIndex={-1}
                >
                  {verSenha ? '👁' : '👁‍🗨'}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div style={st.campo}>
              <label style={st.label} htmlFor="input-confirmar-senha">
                Confirmar nova senha
              </label>
              <div style={st.inputWrap}>
                <input
                  id="input-confirmar-senha"
                  type={verConfirmar ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  style={st.input}
                  required
                  disabled={carregando}
                />
                <button
                  type="button"
                  onClick={() => setVerConfirmar(v => !v)}
                  style={st.btnOlho}
                  title={verConfirmar ? 'Ocultar senha' : 'Ver senha'}
                  tabIndex={-1}
                >
                  {verConfirmar ? '👁' : '👁‍🗨'}
                </button>
              </div>
            </div>

            {erro && <div style={st.erroBox}>⚠️ {erro}</div>}

            <div style={st.acoes}>
              <button
                type="button"
                onClick={onFechar}
                style={st.btnCancelar}
                disabled={carregando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={st.btnSalvar}
                disabled={carregando || !senha || !confirmar}
              >
                {carregando ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const st = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px 28px',
    width: '100%',
    maxWidth: 420,
    boxShadow: 'var(--dropdown-shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    position: 'relative',
  },
  iconeWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextos: {
    flex: 1,
    minWidth: 0,
  },
  titulo: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  subtitulo: {
    margin: '3px 0 0',
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  fecharBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
    lineHeight: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text)',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '11px 40px 11px 14px',
    fontSize: 14,
    color: 'var(--text-pure)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s ease',
  },
  btnOlho: {
    position: 'absolute',
    right: 10,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: 'var(--text-muted)',
    padding: 4,
  },
  erroBox: {
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--tertiary)',
    fontSize: 13,
    fontWeight: 500,
  },
  sucessoBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '24px 16px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
  },
  sucessoCheck: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 800,
  },
  sucessoTexto: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--primary)',
    textAlign: 'center',
  },
  acoes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  btnCancelar: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSalvar: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    boxShadow: '0 0 14px var(--primary-glow)',
  },
}
