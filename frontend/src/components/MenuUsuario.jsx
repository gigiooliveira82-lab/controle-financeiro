import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconConfiguracoes, IconLogout } from './Icones'

// Menu suspenso do usuário — avatar + email no header abrem um dropdown
// com "Configurações" e "Sair" (consolidados aqui, já que essa é a
// entrada de "Configurações" na navegação desde que saiu do menu lateral).
export default function MenuUsuario({ email, onLogout }) {
  const [aberto, setAberto] = useState(false)
  const rootRef = useRef(null)
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
      </button>

      {aberto && (
        <div style={m.menu} role="menu">
          <Link
            to="/configuracoes"
            role="menuitem"
            style={m.item}
            onClick={() => setAberto(false)}
          >
            <IconConfiguracoes size={16} />
            <span>Configurações</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            style={{ ...m.item, ...m.itemSair }}
            onClick={() => { setAberto(false); onLogout() }}
          >
            <IconLogout size={16} />
            <span>Sair</span>
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
    padding: '6px 14px 6px 8px',
    borderRadius: 99,
    maxWidth: 260,
    cursor: 'pointer',
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
    maxWidth: 180,
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 200,
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 6,
    boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
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
  },
  itemSair: {
    color: 'var(--tertiary)',
  },
}
