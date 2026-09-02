import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCadeado, IconExportar, IconLogout, IconSol, IconLua, IconPainelAdm } from './Icones'
import { useTheme } from '../hooks/useTheme'
import { useIsNavMobile } from '../hooks/useIsNavMobile'
import { isUsuarioAdmin, gerarHashAdmin } from '../utils/hashAdmin'
import ModalAlterarSenha from './ModalAlterarSenha'
import ModalExportarDados from './ModalExportarDados'

// Menu suspenso do usuário — adaptável a tema claro e escuro (Inter font-family)
export default function MenuUsuario({ email, onLogout, usuarioId, onAbrirTour }) {
  const [aberto, setAberto] = useState(false)
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const [modalExportarAberto, setModalExportarAberto] = useState(false)
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const isMobile = useIsNavMobile()
  const letraInicial = email ? email[0].toUpperCase() : 'U'
  const ehAdmin = isUsuarioAdmin(email)
  const adminHash = ehAdmin ? gerarHashAdmin(email) : ''

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

  // Cores dinâmicas com base no tema (Light vs Dark)
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--surface-hover, #F1F5F9)'
  const hoverSairBg = isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.08)'
  const textoPrincipal = isDark ? '#FFFFFF' : 'var(--text-pure, #0F172A)'
  const textoSecundario = isDark ? '#CBD5E1' : 'var(--text, #334155)'
  const iconeNeutro = isDark ? '#9CA3AF' : 'var(--text-muted, #64748B)'
  const corSair = isDark ? '#F87171' : 'var(--tertiary, #EF4444)'

  return (
    <>
      <div style={m.root} ref={rootRef}>
        <button
          type="button"
          onClick={() => setAberto(v => !v)}
          style={{
            ...m.trigger,
            ...(isMobile ? m.triggerMobile : {}),
            ...(isDark ? m.triggerDark : m.triggerLight),
            ...(aberto ? (isDark ? m.triggerAbertoDark : m.triggerAbertoLight) : {}),
          }}
          aria-haspopup="menu"
          aria-expanded={aberto}
          title={email}
        >
          <div style={m.avatar}>{letraInicial}</div>
          {!isMobile && <span style={{ ...m.email, color: textoPrincipal }}>{email}</span>}
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
                color: iconeNeutro,
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
          <div
            style={{
              ...m.menu,
              ...(isDark ? m.menuDark : m.menuLight),
              ...(isMobile ? m.menuMobile : {}),
            }}
            role="menu"
          >
            {/* Cabeçalho do usuário dentro do menu suspenso */}
            <div style={m.usuarioInfoBox}>
              <div style={m.avatarGrande}>{letraInicial}</div>
              <div style={m.usuarioTextos}>
                <span style={{ ...m.usuarioEmail, color: textoPrincipal }} title={email}>{email}</span>
                <span style={m.usuarioBadge}>{ehAdmin ? 'Administrador' : 'Conta ativa'}</span>
              </div>
            </div>

            {/* Painel Adm (somente para administradores) */}
            {ehAdmin && (
              <button
                type="button"
                role="menuitem"
                style={m.painelAdmBtn}
                onClick={() => {
                  setAberto(false)
                  navigate(`/admin/${adminHash}`)
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.14)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.28)'
                }}
              >
                <IconPainelAdm size={16} color="var(--primary)" />
                <span style={m.painelAdmTexto}>Painel Adm</span>
                <span style={m.adminBadge}>ADMIN</span>
              </button>
            )}

            {/* Alternador de Modo Claro / Escuro */}
            <button
              type="button"
              role="menuitem"
              style={m.item}
              onClick={() => {
                toggleTheme()
              }}
              onMouseEnter={e => e.currentTarget.style.background = hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                {isDark ? (
                  <IconSol size={18} color="#F59E0B" />
                ) : (
                  <IconLua size={18} color="#0F766E" />
                )}
              </span>
              <span style={{ ...m.itemTexto, color: textoPrincipal, fontWeight: 300 }}>
                {isDark ? 'Modo Claro' : 'Modo Escuro'}
              </span>
              <span style={isDark ? m.badgeTemaDark : m.badgeTemaLight}>Ativar</span>
            </button>

            {/* Divisor */}
            <div style={{ ...m.divisor, background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--border, #E2E8F0)' }} />

            {/* Tour do Sistema */}
            {onAbrirTour && (
              <button
                type="button"
                role="menuitem"
                style={m.item}
                onClick={() => {
                  setAberto(false)
                  onAbrirTour()
                }}
                onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 14, color: textoPrincipal, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>✦</span>
                <span style={{ ...m.itemTexto, color: textoPrincipal, fontWeight: 700 }}>Tour do Sistema</span>
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
              onMouseEnter={e => e.currentTarget.style.background = hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                <IconExportar size={16} color={iconeNeutro} />
              </span>
              <span style={{ ...m.itemTexto, color: textoSecundario }}>Exportar Dados</span>
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
              onMouseEnter={e => e.currentTarget.style.background = hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                <IconCadeado size={16} color={iconeNeutro} />
              </span>
              <span style={{ ...m.itemTexto, color: textoSecundario }}>Alterar Senha</span>
            </button>

            {/* Sair */}
            <button
              type="button"
              role="menuitem"
              style={{ ...m.item, color: corSair }}
              onClick={() => { setAberto(false); onLogout() }}
              onMouseEnter={e => e.currentTarget.style.background = hoverSairBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                <IconLogout size={16} color={corSair} />
              </span>
              <span style={{ ...m.itemTexto, color: corSair }}>Sair</span>
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
  root: {
    position: 'relative',
    fontFamily: "'Inter', sans-serif",
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '5px 12px 5px 6px',
    borderRadius: 9999,
    maxWidth: 270,
    cursor: 'pointer',
    boxShadow: 'var(--card-shadow-sm)',
    transition: 'border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease',
    fontFamily: "'Inter', sans-serif",
  },
  triggerDark: {
    background: 'var(--surface, #121A16)',
    border: '1px solid rgba(16, 185, 129, 0.28)',
  },
  triggerLight: {
    background: 'var(--surface, #FFFFFF)',
    border: '1px solid var(--border, #E2E8F0)',
  },
  triggerAbertoDark: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  triggerAbertoLight: {
    borderColor: 'var(--border-focus, #10B981)',
  },
  triggerMobile: {
    padding: 0,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    borderRadius: '50%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.18)',
    border: '1.5px solid rgba(16, 185, 129, 0.45)',
    color: 'var(--primary)',
    fontSize: 13.5,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif",
  },
  email: {
    fontSize: 13.5,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 170,
    fontFamily: "'Inter', sans-serif",
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 250,
    borderRadius: 18,
    padding: '12px 10px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    backdropFilter: 'blur(12px)',
    fontFamily: "'Inter', sans-serif",
  },
  menuDark: {
    background: '#0B1713',
    border: '1px solid rgba(16, 185, 129, 0.22)',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.08)',
  },
  menuLight: {
    background: 'var(--surface-raised, #FFFFFF)',
    border: '1px solid var(--border, #E2E8F0)',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  menuMobile: {
    right: 0,
    minWidth: 230,
    maxWidth: 'calc(100vw - 32px)',
  },
  usuarioInfoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '4px 6px 12px 6px',
    fontFamily: "'Inter', sans-serif",
  },
  avatarGrande: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.16)',
    border: '1.5px solid rgba(16, 185, 129, 0.4)',
    color: 'var(--primary)',
    fontSize: 15,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif",
  },
  usuarioTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
    flex: 1,
    fontFamily: "'Inter', sans-serif",
  },
  usuarioEmail: {
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: "'Inter', sans-serif",
  },
  usuarioBadge: {
    fontSize: 12,
    color: 'var(--primary)',
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
  },
  painelAdmBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 10,
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.28)',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'background 0.15s ease, border-color 0.15s ease',
    marginBottom: 4,
    fontFamily: "'Inter', sans-serif",
  },
  painelAdmTexto: {
    fontSize: 13.5,
    fontWeight: 700,
    color: 'var(--primary)',
    fontFamily: "'Inter', sans-serif",
  },
  adminBadge: {
    marginLeft: 'auto',
    fontSize: 10.5,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '2.5px 7px',
    borderRadius: 5,
    background: 'var(--primary)',
    color: '#071F16',
    fontFamily: "'Inter', sans-serif",
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 8,
    background: 'transparent',
    border: 'none',
    textDecoration: 'none',
    fontSize: 13.5,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'background 0.12s ease',
    fontFamily: "'Inter', sans-serif",
  },
  itemTexto: {
    fontSize: 13.5,
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
  },
  badgeTemaDark: {
    marginLeft: 'auto',
    fontSize: 11.5,
    fontWeight: 600,
    color: '#9CA3AF',
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '2.5px 8px',
    borderRadius: 6,
    fontFamily: "'Inter', sans-serif",
  },
  badgeTemaLight: {
    marginLeft: 'auto',
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--text-muted, #64748B)',
    background: 'var(--surface-active, #E2E8F0)',
    padding: '2.5px 8px',
    borderRadius: 6,
    fontFamily: "'Inter', sans-serif",
  },
  divisor: {
    height: 1,
    margin: '4px 2px',
  },
}
