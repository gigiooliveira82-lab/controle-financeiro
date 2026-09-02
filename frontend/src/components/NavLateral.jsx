import { NavLink, useLocation, Link } from 'react-router-dom'
import { useIsNavMobile } from '../hooks/useIsNavMobile'
import logoImg from '../assets/logomarca.svg'
import {
  IconDashboard,
  IconDespesas,
  IconReceitas,
  IconContas,
  IconCartoes,
  IconAplicacoes,
  IconSonhos,
  IconPainelAdm,
  IconUsuarios,
  IconLogs,
  IconVoltar,
} from './Icones'

const NAV_ITENS_SISTEMA = [
  { path: '/dashboard',     Icon: IconDashboard,  label: 'Dashboard',   curto: 'Dashboard'  },
  { path: '/despesas',      Icon: IconDespesas,   label: 'Despesas',    curto: 'Despesas'   },
  { path: '/receitas',      Icon: IconReceitas,   label: 'Receitas',    curto: 'Receitas'   },
  { path: '/contas',        Icon: IconContas,     label: 'Contas',      curto: 'Contas'     },
  { path: '/cartoes',       Icon: IconCartoes,    label: 'Cartões',     curto: 'Cartões'    },
  { path: '/aplicacoes',    Icon: IconAplicacoes, label: 'Aplicações',  curto: 'Aplicações' },
  { path: '/sonhos',        Icon: IconSonhos,     label: 'Meus Sonhos', curto: 'Sonhos'     },
]

export default function NavLateral({ qtdVencidas }) {
  const isMobile = useIsNavMobile()
  const location = useLocation()

  const isRotaAdmin = location.pathname.startsWith('/admin')
  const partesRota = location.pathname.split('/')
  const adminHash = partesRota[2] || ''

  // Itens dinâmicos para a barra lateral do painel de administração
  const navItensAdmin = [
    {
      path: `/admin/${adminHash}`,
      end: true,
      Icon: IconDashboard,
      label: 'Visão Geral',
      curto: 'Visão Geral',
    },
    {
      path: `/admin/${adminHash}/usuarios`,
      Icon: IconUsuarios,
      label: 'Usuários',
      curto: 'Usuários',
    },
    {
      path: `/admin/${adminHash}/logs`,
      Icon: IconLogs,
      label: 'Logs',
      curto: 'Logs',
    },
  ]

  const itensAtuais = isRotaAdmin ? navItensAdmin : NAV_ITENS_SISTEMA

  if (isMobile) {
    return (
      <nav style={st.bottomBar}>
        {itensAtuais.map(({ path, end, Icon, curto }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            style={({ isActive }) => ({
              ...st.bottomItem,
              ...(isActive ? st.bottomItemActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} />
                  {!isRotaAdmin && path === '/despesas' && qtdVencidas > 0 && <span style={st.badge} />}
                </span>
                <span style={st.bottomLabel}>{curto}</span>
                {isActive && <span style={st.activeDot} />}
              </>
            )}
          </NavLink>
        ))}

        {isRotaAdmin && (
          <Link
            to="/dashboard"
            style={{ ...st.bottomItem, color: 'var(--primary)' }}
            title="Voltar ao sistema"
          >
            <IconVoltar size={18} color="var(--primary)" />
            <span style={{ ...st.bottomLabel, color: 'var(--primary)', fontWeight: 600 }}>Voltar</span>
          </Link>
        )}
      </nav>
    )
  }

  return (
    <nav style={st.sidebar}>
      {/* Brand Header */}
      <div style={st.sidebarLogo}>
        <div style={st.logoAvatar}>
          <img src={logoImg} alt="Contas Claras" style={st.logoImg} />
        </div>
        <div style={st.logoTextWrap}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={st.logoTitulo}>Contas Claras</span>
          </div>
          {isRotaAdmin ? (
            <span style={st.badgeAdminLateral}>
              <IconPainelAdm size={10} color="#0A0F0D" />
              Painel Adm
            </span>
          ) : (
            <span style={st.logoSub}>Inteligência Financeira</span>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div style={st.navGroup}>
        {itensAtuais.map(({ path, end, Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            style={({ isActive }) => ({
              ...st.sidebarItem,
              ...(isActive ? st.sidebarItemActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
                  {!isRotaAdmin && path === '/despesas' && qtdVencidas > 0 && <span style={st.badge} />}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Botão de Voltar ao Sistema quando na barra lateral de Admin */}
      {isRotaAdmin && (
        <div style={st.footerAdminWrap}>
          <div style={st.divisorAdmin} />
          <Link
            to="/dashboard"
            style={st.btnVoltarSidebar}
            title="Voltar ao dashboard do sistema"
          >
            <IconVoltar size={18} color="var(--primary)" />
            <span>Voltar ao Sistema</span>
          </Link>
        </div>
      )}
    </nav>
  )
}

const st = {
  sidebar: {
    width: 250,
    minWidth: 250,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '28px 14px',
    minHeight: '100vh',
    position: 'sticky',
    top: 0,
    alignSelf: 'flex-start',
    flexShrink: 0,
    boxSizing: 'border-box',
    boxShadow: 'var(--sidebar-shadow)',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '4px 8px 24px',
    marginBottom: 8,
    borderBottom: '1px solid var(--border)',
  },
  logoAvatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1.5px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px var(--primary-glow)',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoImg: {
    width: 24,
    height: 24,
    objectFit: 'contain',
    display: 'block',
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
    background: 'rgba(16, 185, 129, 0.12)',
    color: 'var(--text-pure)',
    fontWeight: 600,
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },

  // Mobile Bottom Bar
  bottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '8px 2px 6px',
    backdropFilter: 'blur(12px)',
    boxShadow: 'var(--dropdown-shadow)',
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
    fontSize: 9,
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
    border: '1.5px solid var(--surface)',
  },
  badgeAdminLateral: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 9.5,
    fontWeight: 700,
    color: '#0A0F0D',
    background: 'var(--primary)',
    padding: '2px 6px',
    borderRadius: 4,
    marginTop: 2,
    width: 'fit-content',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  footerAdminWrap: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  divisorAdmin: {
    height: 1,
    background: 'var(--border)',
    margin: '4px 0',
  },
  btnVoltarSidebar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 14px',
    borderRadius: 10,
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 13.5,
    transition: 'all 0.15s ease',
  },
}
