import { useState, useRef, useEffect } from 'react'
import { IconCadeado, IconExportar, IconLogout, IconSol, IconLua } from './Icones'
import { useTheme } from '../hooks/useTheme'
import { useIsNavMobile } from '../hooks/useIsNavMobile'
import ModalAlterarSenha from './ModalAlterarSenha'
import ModalExportarDados from './ModalExportarDados'

// Menu suspenso do usuário — avatar no header abre um dropdown com:
// - Info do usuário (email/status)
// - Alternador de Modo Claro/Escuro
// - Exportar Dados (CSV / JSON)
// - Alterar Senha
// - Sair
export default function MenuUsuario({ email, onLogout, usuarioId, onAbrirTour }) {
  const [aberto, setAberto] = useState(false)
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const [modalExportarAberto, setModalExportarAberto] = useState(false)
  const rootRef = useRef(null)
  const { isDark, toggleTheme } = useTheme()
  const isMobile = useIsNavMobile()
  const letraInicial = email ? email[0].toUpperCase() : 'U'

  useEffect(() => {
    if (!aberto) return

    function handleClickFora(ev) {
      if (rootRef.current && !rootRef.current.contains(ev.target)) setAberto(false)
    }
    function handleEsc(ev) {
      if (ev.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', handleClickFora)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickFora)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [aberto])

  return (
    <>
      <div style={m.root} ref={rootRef}>
        <button
          type="button"
          onClick={() => setAberto(v => !v)}
          style={{
            ...m.trigger,
            ...(isMobile ? m.triggerMobile : {}),
          }}
          aria-haspopup="menu"
          aria-expanded={aberto}
          title={email}
        >
          <div style={m.avatar}>{letraInicial}</div>
          {!isMobile && <span style={m.email}>{email}</span>}
          {!isMobile && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                color: 'var(--text-muted)',
                marginLeft: 2,
                transform: aberto ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </button>

        {aberto && (
          <div style={{ ...m.menu, ...(isMobile ? m.menuMobile : {}) }} role="menu">
            {/* Cabeçalho do usuário dentro do menu suspenso */}
            <div style={m.usuarioInfoBox}>
              <div style={m.avatarGrande}>{letraInicial}</div>
              <div style={m.usuarioTextos}>
                <span style={m.usuarioEmail} title={email}>{email}</span>
                <span style={m.usuarioBadge}>Conta ativa</span>
              </div>
            </div>

            <div style={m.divisor} />

            {/* Alternador de Tema (Light / Dark) */}
            <button
              type="button"
              role="menuitem"
              style={m.item}
              onClick={() => {
                toggleTheme()
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={m.temaIconWrap}>
                {isDark ? (
                  <IconSol size={16} color="#F59E0B" />
                ) : (
                  <IconLua size={16} color="#0F766E" />
                )}
              </span>
              <div style={m.temaTextWrap}>
                <span style={m.itemTexto}>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
                <span style={m.badgeTema}>{isDark ? 'Ativar' : 'Ativar'}</span>
              </div>
            </button>

            <div style={m.divisor} />

            {/* Tour do Sistema / Guia de Introdução */}
            {onAbrirTour && (
              <button
                type="button"
                role="menuitem"
                style={m.item}
                onClick={() => {
                  setAberto(false)
                  onAbrirTour()
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>✦</span>
                <span style={{ ...m.itemTexto, color: 'var(--primary)', fontWeight: 600 }}>Tour do Sistema</span>
              </button>
            )}

            {/* Exportar Dados */}
            <button
              type="button"
              role="menuitem"
              style={m.item}
              onClick={() => {
                setAberto(false)
                setModalExportarAberto(true)
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <IconExportar size={16} color="var(--primary)" />
              <span style={m.itemTexto}>Exportar Dados</span>
            </button>

            {/* Alterar Senha */}
            <button
              type="button"
              role="menuitem"
              style={m.item}
              onClick={() => {
                setAberto(false)
                setModalSenhaAberto(true)
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <IconCadeado size={16} color="var(--text-muted)" />
              <span style={m.itemTexto}>Alterar Senha</span>
            </button>

            {/* Sair */}
            <button
              type="button"
              role="menuitem"
              style={{ ...m.item, ...m.itemSair }}
              onClick={() => { setAberto(false); onLogout() }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <IconLogout size={16} color="var(--tertiary)" />
              <span style={{ ...m.itemTexto, color: 'var(--tertiary)' }}>Sair</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Alterar Senha */}
      <ModalAlterarSenha
        aberto={modalSenhaAberto}
        onFechar={() => setModalSenhaAberto(false)}
      />

      {/* Modal de Exportar Dados */}
      <ModalExportarDados
        aberto={modalExportarAberto}
        onFechar={() => setModalExportarAberto(false)}
        usuarioId={usuarioId}
        email={email}
      />
    </>
  )
}

const m = {
  root: { position: 'relative' },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '5px 12px 5px 6px',
    borderRadius: 99,
    maxWidth: 270,
    cursor: 'pointer',
    boxShadow: 'var(--card-shadow-sm)',
    transition: 'border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease',
  },
  triggerMobile: {
    padding: 0,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    borderRadius: '50%',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.18)',
    border: '1.5px solid rgba(16, 185, 129, 0.45)',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'var(--font-headline)',
    boxShadow: '0 0 10px var(--primary-glow)',
  },
  email: {
    fontSize: 13,
    color: 'var(--text)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 170,
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 230,
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 8,
    boxShadow: 'var(--dropdown-shadow)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    backdropFilter: 'blur(10px)',
  },
  menuMobile: {
    right: 0,
    minWidth: 220,
    maxWidth: 'calc(100vw - 32px)',
  },
  usuarioInfoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px 10px',
  },
  avatarGrande: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.18)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'var(--font-headline)',
  },
  usuarioTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
    flex: 1,
  },
  usuarioEmail: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-pure)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  usuarioBadge: {
    fontSize: 11,
    color: 'var(--primary)',
    fontWeight: 500,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    color: 'var(--text)',
    background: 'none',
    border: 'none',
    textDecoration: 'none',
    fontSize: 13.5,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'background 0.12s ease',
  },
  itemTexto: {
    fontSize: 13.5,
    fontWeight: 500,
    color: 'var(--text)',
  },
  temaIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 6,
    background: 'var(--surface-hover)',
    flexShrink: 0,
  },
  temaTextWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  badgeTema: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    background: 'var(--surface-active)',
    padding: '2px 6px',
    borderRadius: 4,
  },
  divisor: {
    height: 1,
    background: 'var(--border-subtle)',
    margin: '4px 4px',
  },
  itemSair: {
    color: 'var(--tertiary)',
  },
}
