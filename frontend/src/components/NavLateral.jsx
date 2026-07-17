import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'

function useIsNavMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

const NAV_ITENS = [
  { path: '/dashboard',     icone: '⊡', label: 'Dashboard'  },
  { path: '/lancamentos',   icone: '≡',  label: 'Lançamentos' },
  { path: '/aplicacoes',    icone: '◎',  label: 'Aplicações'  },
  { path: '/configuracoes', icone: '⚙',  label: 'Config.'     },
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
              <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icone}</span>
              {item.path === '/lancamentos' && qtdVencidas > 0 && (
                <span style={st.badge} />
              )}
            </span>
            <span style={st.bottomLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav style={st.sidebar}>
      <div style={st.sidebarLogo}>
        <span style={{ color: '#9DC9B5', fontSize: 16 }}>✦</span>
        <span style={st.sidebarLogoText}>Controle<br />Financeiro</span>
      </div>
      {NAV_ITENS.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({ ...st.sidebarItem, ...(isActive ? st.sidebarItemActive : {}) })}
        >
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={st.sidebarIcone}>{item.icone}</span>
            {item.path === '/lancamentos' && qtdVencidas > 0 && (
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
    width: 200, minWidth: 200,
    background: 'var(--verde-profundo)',
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '24px 12px',
    minHeight: '100vh',
    position: 'sticky', top: 0, alignSelf: 'flex-start',
    flexShrink: 0,
    boxShadow: '2px 0 8px rgba(31,93,69,0.15)',
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 8px 20px', marginBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },
  sidebarLogoText: {
    color: 'var(--creme-header)', fontWeight: 800, fontSize: 13,
    letterSpacing: '-0.01em', lineHeight: 1.3,
  },
  sidebarItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 8,
    color: 'rgba(245,239,224,0.7)',
    textDecoration: 'none', fontWeight: 500, fontSize: 14,
  },
  sidebarItemActive: {
    background: 'rgba(255,255,255,0.15)',
    color: 'var(--creme-header)',
  },
  sidebarIcone: { fontSize: 16, lineHeight: 1 },

  bottomBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    background: 'var(--verde-profundo)',
    display: 'flex', justifyContent: 'space-around', alignItems: 'stretch',
    boxShadow: '0 -2px 12px rgba(31,93,69,0.25)',
  },
  bottomItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    color: 'rgba(245,239,224,0.65)', textDecoration: 'none',
    padding: '10px 8px', flex: 1, justifyContent: 'center',
  },
  bottomItemActive: {
    color: 'var(--creme-header)',
    background: 'rgba(255,255,255,0.1)',
  },
  bottomLabel: { fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' },

  badge: {
    position: 'absolute', top: -1, right: -5,
    width: 7, height: 7, borderRadius: '50%',
    background: '#ef4444',
    border: '1.5px solid var(--verde-profundo)',
  },
}
