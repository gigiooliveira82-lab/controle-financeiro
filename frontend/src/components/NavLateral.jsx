import { NavLink } from 'react-router-dom'
import { useIsNavMobile } from '../hooks/useIsNavMobile'
import LogoMarca from './LogoMarca'

const NAV_ITENS = [
  { path: '/dashboard',     icone: '⊡', label: 'Dashboard',     curto: 'Dashboard'  },
  { path: '/despesas',      icone: '≡',  label: 'Despesas',      curto: 'Despesas'   },
  { path: '/receitas',      icone: '⊕',  label: 'Receitas',      curto: 'Receitas'   },
  { path: '/cartoes',       icone: '▤',  label: 'Cartões',       curto: 'Cartões'    },
  { path: '/aplicacoes',    icone: '◎',  label: 'Aplicações',    curto: 'Aplicações' },
  { path: '/configuracoes', icone: '⚙',  label: 'Configurações', curto: 'Config.'    },
]

export default function NavLateral({ qtdVencidas }) {
  const isMobile = useIsNavMobile()

  if (isMobile) {
    return (
      <nav style={st.bottomBar}>
        {NAV_ITENS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({ ...st.bottomItem, ...(isActive ? st.bottomItemActive : {}) })}
          >
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 19, lineHeight: 1 }}>{item.icone}</span>
              {item.path === '/despesas' && qtdVencidas > 0 && (
                <span style={st.badge} />
              )}
            </span>
            <span style={st.bottomLabel}>{item.curto}</span>
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav style={st.sidebar}>
      <div style={st.sidebarLogo}>
        <LogoMarca size={30} />
        <span style={st.sidebarLogoText}>Contas<br />Claras</span>
      </div>

      {NAV_ITENS.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({ ...st.sidebarItem, ...(isActive ? st.sidebarItemActive : {}) })}
        >
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={st.sidebarIcone}>{item.icone}</span>
            {item.path === '/despesas' && qtdVencidas > 0 && (
              <span style={st.badge} />
            )}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

const st = {
  sidebar: {
    width: 210, minWidth: 210,
    background: 'var(--verde-profundo)',
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '28px 14px',
    minHeight: '100vh',
    position: 'sticky', top: 0, alignSelf: 'flex-start',
    flexShrink: 0,
    boxShadow: '2px 0 8px rgba(31,93,69,0.15)',
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 4px 28px', marginBottom: 16,
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },
  sidebarLogoText: {
    color: 'var(--creme-header)', fontWeight: 800, fontSize: 17,
    letterSpacing: '-0.02em', lineHeight: 1.2,
  },
  sidebarItem: {
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '11px 14px', borderRadius: 8,
    color: 'rgba(245,239,224,0.72)',
    textDecoration: 'none', fontWeight: 500, fontSize: 15,
    letterSpacing: '0.005em',
  },
  sidebarItemActive: {
    background: 'rgba(255,255,255,0.15)',
    color: 'var(--creme-header)',
    fontWeight: 600,
  },
  sidebarIcone: { fontSize: 17, lineHeight: 1 },

  bottomBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    background: 'var(--verde-profundo)',
    display: 'flex', justifyContent: 'space-around', alignItems: 'stretch',
    boxShadow: '0 -2px 12px rgba(31,93,69,0.25)',
  },
  bottomItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    color: 'rgba(245,239,224,0.65)', textDecoration: 'none',
    padding: '9px 4px', flex: 1, justifyContent: 'center',
  },
  bottomItemActive: {
    color: 'var(--creme-header)',
    background: 'rgba(255,255,255,0.1)',
  },
  bottomLabel: { fontSize: 9, fontWeight: 600, letterSpacing: '0.02em' },

  badge: {
    position: 'absolute', top: -1, right: -5,
    width: 7, height: 7, borderRadius: '50%',
    background: '#ef4444',
    border: '1.5px solid var(--verde-profundo)',
  },
}
