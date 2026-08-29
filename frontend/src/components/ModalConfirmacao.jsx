import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { IconLixeira, IconAlerta } from './Icones'

const ConfirmContext = createContext(null)

/**
 * Hook para disparar confirmações com modal personalizada assíncrona (Promise-based)
 * Exemplo:
 * const confirmar = useConfirm()
 * const ok = await confirmar({
 *   titulo: 'Excluir Lançamento',
 *   mensagem: 'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
 *   textoConfirmar: 'Excluir',
 *   variante: 'danger',
 * })
 * if (!ok) return
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    // Fallback gracioso caso esteja fora do provider
    return (options) => {
      const msg = typeof options === 'string' ? options : options.mensagem || options.titulo
      return Promise.resolve(window.confirm(msg))
    }
  }
  return ctx
}

/**
 * Provider global para exibir modais de confirmação no padrão visual do sistema
 */
export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    aberto: false,
    titulo: 'Confirmar ação',
    mensagem: 'Tem certeza que deseja continuar?',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    variante: 'danger', // 'danger' | 'warning' | 'primary'
    icone: 'lixeira',   // 'lixeira' | 'alerta'
    resolvido: null,
  })

  const resolverRef = useRef(null)

  function confirmar(opcoes = {}) {
    return new Promise((resolve) => {
      resolverRef.current = resolve

      const titulo = opcoes.titulo || 'Confirmar exclusão'
      const mensagem = opcoes.mensagem || (typeof opcoes === 'string' ? opcoes : 'Tem certeza que deseja prosseguir?')
      const textoConfirmar = opcoes.textoConfirmar || 'Excluir'
      const textoCancelar = opcoes.textoCancelar || 'Cancelar'
      const variante = opcoes.variante || 'danger'
      const icone = opcoes.icone || (variante === 'danger' ? 'lixeira' : 'alerta')

      setModalState({
        aberto: true,
        titulo,
        mensagem,
        textoConfirmar,
        textoCancelar,
        variante,
        icone,
      })
    })
  }

  function fechar(resultado) {
    setModalState(s => ({ ...s, aberto: false }))
    if (resolverRef.current) {
      resolverRef.current(resultado)
      resolverRef.current = null
    }
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <ModalConfirmacao
        aberto={modalState.aberto}
        titulo={modalState.titulo}
        mensagem={modalState.mensagem}
        textoConfirmar={modalState.textoConfirmar}
        textoCancelar={modalState.textoCancelar}
        variante={modalState.variante}
        icone={modalState.icone}
        onConfirmar={() => fechar(true)}
        onCancelar={() => fechar(false)}
      />
    </ConfirmContext.Provider>
  )
}

/**
 * Componente de Modal de Confirmação Visual
 * Padrão fiel ao ModalAlterarSenha.jsx (Midnight Emerald / Glassmorphism)
 */
export default function ModalConfirmacao({
  aberto,
  titulo = 'Confirmar exclusão',
  mensagem = 'Tem certeza que deseja excluir? Esta ação não pode ser desfeita.',
  textoConfirmar = 'Excluir',
  textoCancelar = 'Cancelar',
  variante = 'danger',
  icone = 'lixeira',
  carregando = false,
  onConfirmar,
  onCancelar,
}) {
  const btnConfirmarRef = useRef(null)

  useEffect(() => {
    if (!aberto) return

    function handleEsc(e) {
      if (e.key === 'Escape' && !carregando) onCancelar?.()
    }
    window.addEventListener('keydown', handleEsc)

    // Foco automático para acessibilidade
    const timer = setTimeout(() => {
      btnConfirmarRef.current?.focus()
    }, 50)

    return () => {
      window.removeEventListener('keydown', handleEsc)
      clearTimeout(timer)
    }
  }, [aberto, carregando, onCancelar])

  if (!aberto) return null

  const isDanger = variante === 'danger'

  return (
    <div
      style={st.overlay}
      onClick={(e) => { if (e.target === e.currentTarget && !carregando) onCancelar?.() }}
    >
      <div
        style={st.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-confirmacao"
        aria-describedby="desc-modal-confirmacao"
      >
        {/* Cabeçalho */}
        <div style={st.header}>
          <div
            style={{
              ...st.iconeWrap,
              ...(isDanger ? st.iconeWrapDanger : st.iconeWrapPrimary),
            }}
          >
            {icone === 'lixeira' || isDanger ? (
              <IconLixeira size={20} color={isDanger ? 'var(--tertiary)' : 'var(--primary)'} />
            ) : (
              <IconAlerta size={20} color="#F59E0B" />
            )}
          </div>
          <div style={st.headerTextos}>
            <h2 id="titulo-modal-confirmacao" style={st.titulo}>{titulo}</h2>
            <p id="desc-modal-confirmacao" style={st.subtitulo}>{mensagem}</p>
          </div>
          <button
            type="button"
            style={st.fecharBtn}
            onClick={onCancelar}
            disabled={carregando}
            aria-label="Fechar"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-pure)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ✕
          </button>
        </div>

        {/* Ações */}
        <div style={st.acoes}>
          <button
            type="button"
            onClick={onCancelar}
            style={st.btnCancelar}
            disabled={carregando}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {textoCancelar}
          </button>
          <button
            ref={btnConfirmarRef}
            type="button"
            onClick={onConfirmar}
            style={{
              ...st.btnConfirmar,
              ...(isDanger ? st.btnDanger : st.btnPrimary),
            }}
            disabled={carregando}
          >
            {carregando ? 'Excluindo...' : textoConfirmar}
          </button>
        </div>
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
    zIndex: 99999,
    animation: 'modalFadeIn 0.15s ease',
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px 26px',
    width: '100%',
    maxWidth: 420,
    boxShadow: 'var(--dropdown-shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    boxSizing: 'border-box',
    animation: 'modalScaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    position: 'relative',
  },
  iconeWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconeWrapDanger: {
    background: 'rgba(252, 124, 120, 0.15)',
    border: '1px solid rgba(252, 124, 120, 0.35)',
  },
  iconeWrapPrimary: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
  },
  headerTextos: {
    flex: 1,
    minWidth: 0,
  },
  titulo: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    lineHeight: 1.3,
  },
  subtitulo: {
    margin: '6px 0 0',
    fontSize: 13.5,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  fecharBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 15,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
    lineHeight: 1,
    transition: 'color 0.15s ease',
  },
  acoes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 2,
  },
  btnCancelar: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text)',
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
  },
  btnConfirmar: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease, transform 0.1s ease',
  },
  btnDanger: {
    background: 'var(--tertiary)',
    color: '#FFFFFF',
    boxShadow: '0 0 14px var(--tertiary-glow)',
  },
  btnPrimary: {
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    boxShadow: '0 0 14px var(--primary-glow)',
  },
}
