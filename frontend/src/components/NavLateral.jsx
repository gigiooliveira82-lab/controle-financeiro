import { NavLink } from 'react-router-dom'
import { useIsNavMobile } from '../hooks/useIsNavMobile'
import {
  IconDashboard,
  IconDespesas,
  IconReceitas,
  IconCartoes,
  IconAplicacoes,
  IconSonhos,
} from './Icones'

const NAV_ITENS = [
  { path: '/dashboard',     Icon: IconDashboard, label: 'Dashboard',     curto: 'Dashboard'  },
  { path: '/despesas',      Icon: IconDespesas,  label: 'Despesas',      curto: 'Despesas'   },
  { path: '/receitas',      Icon: IconReceitas,  label: 'Receitas',      curto: 'Receitas'   },
  { path: '/cartoes',       Icon: IconCartoes,   label: 'Cartões',       curto: 'Cartões'    },
  { path: '/aplicacoes',    Icon: IconAplicacoes,label: 'Aplicações',    curto: 'Aplicações' },
  { path: '/sonhos',        Icon: IconSonhos,    label: 'Meus Sonhos',   curto: 'Sonhos'     },
]

export default function NavLateral({ qtdVencidas }) {
  const isMobile = useIsNavMobile()

  if (isMobile) {
    return (
      <nav style={st.bottomBar}>
        {NAV_ITENS.map(({ path, Icon, curto }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              ...st.bottomItem,
              ...(isActive ? st.bottomItemActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} />
                  {path === '/despesas' && qtdVencidas > 0 && <span style={st.badge} />}
                </span>
                <span style={st.bottomLabel}>{curto}</span>
                {isActive && <span style={st.activeDot} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav style={st.sidebar}>
      {/* Brand Header */}
      <div style={st.sidebarLogo}>
        <div style={st.logoAvatar}>
          <div style={st.logoAvatarRing}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>
        <div style={st.logoTextWrap}>
          <span style={st.logoTitulo}>Contas Claras</span>
          <span style={st.logoSub}>Inteligência Financeira</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div style={st.navGroup}>
        {NAV_ITENS.map(({ path, Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              ...st.sidebarItem,
              ...(isActive ? st.sidebarItemActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Icon size={18} />
                  {path === '/despesas' && qtdVencidas > 0 && <span style={st.badge} />}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

const st = {
  sidebar: {
    width: 230,
    minWidth: 230,
    background: '#0A0F0D',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 14px',
    minHeight: '100vh',
    position: 'sticky',
    top: 0,
    alignSelf: 'flex-start',
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '4px 8px 28px',
    marginBottom: 8,
  },
  logoAvatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #153E32, #0A1E17)',
    border: '1.5px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)',
    flexShrink: 0,
  },
  logoAvatarRing: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  },
  logoTitulo: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.01em',
  },
  logoSub: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  navGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 14px',
    borderRadius: 10,
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 14,
    transition: 'all 0.15s ease',
  },
  sidebarItemActive: {
    background: 'rgba(15, 118, 110, 0.32)',
    color: 'var(--primary)',
    fontWeight: 600,
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },

  // Mobile Bottom Bar
  bottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: '#0D1411',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '8px 2px 6px',
    backdropFilter: 'blur(12px)',
  },
  bottomItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    color: 'var(--text-muted)',
    textDecoration: 'none',
    padding: '4px 6px',
    flex: 1,
    position: 'relative',
    fontSize: 10,
    minWidth: 0,
  },
  bottomItemActive: {
    color: 'var(--primary)',
    fontWeight: 600,
  },
  bottomLabel: {
    fontSize: 10,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--primary)',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--tertiary)',
    border: '1.5px solid #0A0F0D',
  },
}
