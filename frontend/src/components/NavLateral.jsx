import { useState, useEffect } from 'react'
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
  IconMais,
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

// 4 itens primários focais no celular para eliminar toques errados (Lei de Miller & Fitts)
const NAV_ITENS_MOBILE_PRINCIPAIS = [
  { path: '/dashboard', Icon: IconDashboard, label: 'Início',   curto: 'Início'   },
  { path: '/despesas',  Icon: IconDespesas,  label: 'Despesas', curto: 'Despesas' },
  { path: '/cartoes',   Icon: IconCartoes,   label: 'Cartões',  curto: 'Cartões'  },
  { path: '/sonhos',    Icon: IconSonhos,    label: 'Sonhos',   curto: 'Sonhos'   },
]

// Itens secundários agrupados no menu expansor 'Mais'
const NAV_ITENS_MOBILE_EXTRAS = [
  { path: '/receitas',   Icon: IconReceitas,   label: 'Receitas',          curto: 'Receitas' },
  { path: '/contas',     Icon: IconContas,     label: 'Contas Bancárias',  curto: 'Contas' },
  { path: '/aplicacoes', Icon: IconAplicacoes, label: 'Aplicações / Invest.', curto: 'Aplicações' },
]

export default function NavLateral({ qtdVencidas }) {
  const isMobile = useIsNavMobile()
  const location = useLocation()
  const [menuMaisAberto, setMenuMaisAberto] = useState(false)

  const isRotaAdmin = location.pathname.startsWith('/admin')
  const partesRota = location.pathname.split('/')
  const adminHash = partesRota[2] || ''

  // Fecha o menu 'Mais' automaticamente ao navegar
  useEffect(() => {
    setMenuMaisAberto(false)
  }, [location.pathname])

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

  const extraAtivo = !isRotaAdmin && NAV_ITENS_MOBILE_EXTRAS.find(item => location.pathname === item.path)

  if (isMobile) {
    if (isRotaAdmin) {
      return (
        <nav style={st.bottomBar}>
          {navItensAdmin.map(({ path, end, Icon, curto }) => (
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
                  </span>
                  <span style={st.bottomLabel}>{curto}</span>
                  {isActive && <span style={st.activeDot} />}
                </>
              )}
            </NavLink>
          ))}

          <Link
            to="/dashboard"
            style={{ ...st.bottomItem, color: 'var(--primary)' }}
            title="Voltar ao sistema"
          >
            <IconVoltar size={18} color="var(--primary)" />
            <span style={{ ...st.bottomLabel, color: 'var(--primary)', fontWeight: 600 }}>Voltar</span>
          </Link>
        </nav>
      )
    }

    // Modo normal mobile: 4 itens principais + botão expansor 'Mais'
    return (
      <>
        {/* Backdrop para fechar o menu 'Mais' */}
        {menuMaisAberto && (
          <div
            style={st.maisBackdrop}
            onClick={() => setMenuMaisAberto(false)}
          />
        )}

        {/* Painel Flutuante do Menu Mais */}
        {menuMaisAberto && (
          <div style={st.maisCard}>
            <div style={st.maisCardTitulo}>Mais Módulos</div>
            <div style={st.maisCardLista}>
              {NAV_ITENS_MOBILE_EXTRAS.map(({ path, Icon, label }) => {
                const ativo = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMenuMaisAberto(false)}
                    style={{
                      ...st.maisCardItem,
                      ...(ativo ? st.maisCardItemAtivo : {}),
                    }}
                  >
                    <Icon size={18} color={ativo ? 'var(--primary)' : 'var(--text-muted)'} />
                    <span style={{
                      fontSize: 13.5,
                      fontWeight: ativo ? 700 : 500,
                      color: ativo ? 'var(--primary)' : 'var(--text-pure)',
                    }}>
                      {label}
                    </span>
                    {ativo && <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: 11 }}>●</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <nav style={st.bottomBar}>
          {NAV_ITENS_MOBILE_PRINCIPAIS.map(({ path, Icon, curto }) => (
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
                    <Icon size={19} color={isActive ? 'var(--primary)' : 'currentColor'} />
                    {path === '/despesas' && qtdVencidas > 0 && <span style={st.badge} />}
                  </span>
                  <span style={st.bottomLabel}>{curto}</span>
                  {isActive && <span style={st.activeDot} />}
                </>
              )}
            </NavLink>
          ))}

          {/* Botão 'Mais' que agrupa os módulos secundários */}
          <button
            type="button"
            onClick={() => setMenuMaisAberto(v => !v)}
            style={{
              ...st.bottomItemBtn,
              ...((extraAtivo || menuMaisAberto) ? st.bottomItemActive : {}),
            }}
            aria-label="Mais módulos"
            aria-expanded={menuMaisAberto}
          >
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {extraAtivo ? (
                <extraAtivo.Icon size={19} color="var(--primary)" />
              ) : (
                <IconMais size={20} color={(extraAtivo || menuMaisAberto) ? 'var(--primary)' : 'currentColor'} />
              )}
            </span>
            <span style={st.bottomLabel}>
              {extraAtivo ? extraAtivo.curto : 'Mais'}
            </span>
            {(extraAtivo || menuMaisAberto) && <span style={st.activeDot} />}
          </button>
        </nav>
      </>
    )
  }

  // Visualização Desktop
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
        {(isRotaAdmin ? navItensAdmin : NAV_ITENS_SISTEMA).map(({ path, end, Icon, label }) => (
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
            title="Sair do painel administrativo e voltar ao aplicativo"
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
    width: 240,
    minHeight: '100vh',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    boxSizing: 'border-box',
    flexShrink: 0,
    zIndex: 30,
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    padding: '0 8px',
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
    paddingTop: 6,
    paddingLeft: 4,
    paddingRight: 4,
    paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    minHeight: 'calc(58px + env(safe-area-inset-bottom, 0px))',
    boxSizing: 'border-box',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.35)',
  },
  bottomItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    color: 'var(--text-muted)',
    textDecoration: 'none',
    padding: '6px 4px',
    flex: 1,
    position: 'relative',
    minHeight: 48,
    minWidth: 0,
    transition: 'color 0.15s ease',
  },
  bottomItemBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    padding: '6px 4px',
    flex: 1,
    position: 'relative',
    minHeight: 48,
    cursor: 'pointer',
    minWidth: 0,
    transition: 'color 0.15s ease',
  },
  bottomItemActive: {
    color: 'var(--primary)',
    fontWeight: 600,
  },
  bottomLabel: {
    fontSize: 10.5,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.15,
    maxWidth: '100%',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--primary)',
    marginTop: 1,
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

  // Modal / Drawer expansor 'Mais'
  maisBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    zIndex: 98,
    backdropFilter: 'blur(2px)',
  },
  maisCard: {
    position: 'fixed',
    bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
    right: 12,
    left: 12,
    maxWidth: 320,
    marginLeft: 'auto',
    background: 'var(--surface-raised)',
    border: '1.5px solid var(--border)',
    borderRadius: 16,
    padding: '14px 16px',
    zIndex: 99,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  maisCardTitulo: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    marginBottom: 4,
  },
  maisCardLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  maisCardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 10,
    textDecoration: 'none',
    background: 'transparent',
    transition: 'background 0.15s ease',
  },
  maisCardItemAtivo: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
}
