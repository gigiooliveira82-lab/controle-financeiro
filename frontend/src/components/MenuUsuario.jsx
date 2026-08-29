import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconConfiguracoes, IconLogout, IconSol, IconLua } from './Icones'
import { useTheme } from '../hooks/useTheme'

// Menu suspenso do usuário — avatar + email no header abrem um dropdown
// com alternador de Modo Claro/Escuro, Configurações e Sair.
export default function MenuUsuario({ email, onLogout }) {
  const [aberto, setAberto] = useState(false)
  const rootRef = useRef(null)
  const { isDark, toggleTheme } = useTheme()
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
    <div style={m.root} ref={rootRef}>
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        style={m.trigger}
        aria-haspopup="menu"
        aria-expanded={aberto}
        title={email}
      >
        <div style={m.avatar}>{letraInicial}</div>
        <span style={m.email}>{email}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginLeft: 2, transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div style={m.menu} role="menu">
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

          <Link
            to="/configuracoes"
            role="menuitem"
            style={m.item}
            onClick={() => setAberto(false)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <IconConfiguracoes size={16} color="var(--text-muted)" />
            <span style={m.itemTexto}>Configurações</span>
          </Link>

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
    padding: '6px 12px 6px 8px',
    borderRadius: 99,
    maxWidth: 270,
    cursor: 'pointer',
    boxShadow: 'var(--card-shadow-sm)',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.18)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: 'var(--primary)',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'var(--font-headline)',
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
    minWidth: 220,
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 6,
    boxShadow: 'var(--dropdown-shadow)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    backdropFilter: 'blur(8px)',
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
    margin: '4px 6px',
  },
  itemSair: {
    color: 'var(--tertiary)',
  },
}
