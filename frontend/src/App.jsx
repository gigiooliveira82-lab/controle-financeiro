import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useIsNavMobile } from './hooks/useIsNavMobile'
import { supabase } from './services/supabase'
import { buscarTransacoes, gerarRecorrentes, buscarCartoes, registrarLogAuth } from './services/api'
import Login from './components/Login'
import RedefinirSenha from './components/RedefinirSenha'
import PaginaLanding from './pages/PaginaLanding'
import NavLateral from './components/NavLateral'
import PaginaDashboard from './pages/PaginaDashboard'
import PaginaLancamentos from './pages/PaginaLancamentos'
import PaginaReceitas from './pages/PaginaReceitas'
import PaginaCartoes from './pages/PaginaCartoes'
import PaginaAplicacoes from './pages/PaginaAplicacoes'
import PaginaSonhos from './pages/PaginaSonhos'
import PaginaContas from './pages/PaginaContas'
import PaginaConfiguracoes from './pages/PaginaConfiguracoes'
import PaginaAdmin from './pages/PaginaAdmin'
import PaginaAdminUsuarios from './pages/PaginaAdminUsuarios'
import PaginaAdminLogs from './pages/PaginaAdminLogs'
import PaginaTermosPrivacidade from './pages/PaginaTermosPrivacidade'
import MenuUsuario from './components/MenuUsuario'
import ModalOnboardingTour from './components/ModalOnboardingTour'
import { ConfirmProvider } from './components/ModalConfirmacao'
import logoImg from './assets/logomarca.svg'


function mesISOHoje() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
}

function navegarMes(mesISO, delta) {
  const [ano, mes] = mesISO.split('-').map(Number)
  const d = new Date(ano, mes - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatarMesHeader(mesISO) {
  const [ano, mes] = mesISO.split('-')
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${nomes[parseInt(mes) - 1]} ${ano}`
}

export default function App() {
  const [usuario, setUsuario]                 = useState(null)
  const [transacoes, setTransacoes]           = useState([])
  const [cartoes, setCartoes]                 = useState([])
  const [carregando, setCarregando]           = useState(true)
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [mesSelecionado, setMesSelecionado]   = useState(mesISOHoje)
  const [modoRedefinir, setModoRedefinir]     = useState(false)
  const [tourAberto, setTourAberto]           = useState(false)
  const isMobileNav                           = useIsNavMobile()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      setUsuario(user)
      setCarregando(false)
      if (user?.id) {
        // Marca que a sessão já está ativa para evitar reenvio de login ao atualizar a página
        sessionStorage.setItem(`cc_sessao_${user.id}`, 'true')
        const tourFeito = localStorage.getItem(`contas_claras_onboarding_${user.id}`)
        if (!tourFeito) setTourAberto(true)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setModoRedefinir(true)
        setUsuario(session?.user ?? null)
      } else {
        setModoRedefinir(false)
        const user = session?.user ?? null
        setUsuario(user)
        if (user?.id && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          if (event === 'SIGNED_IN' && user?.email) {
            const jaRegistrado = sessionStorage.getItem(`cc_sessao_${user.id}`)
            if (!jaRegistrado) {
              sessionStorage.setItem(`cc_sessao_${user.id}`, 'true')
              registrarLogAuth('login', user.email)
            }
          }
          const tourFeito = localStorage.getItem(`contas_claras_onboarding_${user.id}`)
          if (!tourFeito) setTourAberto(true)
        }
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (usuario) inicializarMes()
  }, [usuario, mesSelecionado])

  useEffect(() => {
    if (!usuario) { setCartoes([]); return }
    buscarCartoes(usuario.id)
      .then(setCartoes)
      .catch(err => console.error('Erro ao buscar cartões:', err.message))
  }, [usuario])

  async function inicializarMes() {
    setCarregandoDados(true)
    try {
      if (mesSelecionado >= mesISOHoje()) {
        await gerarRecorrentes(usuario.id, mesSelecionado)
      }
      const lista = await buscarTransacoes(usuario.id, mesSelecionado)
      setTransacoes(lista)
    } catch (err) {
      console.error('Erro ao inicializar mês:', err.message)
    } finally {
      setCarregandoDados(false)
    }
  }

  function handleNovaTransacao(nova) {
    setTransacoes((prev) => [nova, ...prev])
  }

  function handleAtualizou(id, dadosAtualizados) {
    setTransacoes((prev) => prev.map((t) => t.id === id ? { ...t, ...dadosAtualizados } : t))
  }

  function handleRemoveu(id) {
    setTransacoes((prev) => prev.filter((t) => t.id !== id))
  }

  function handleNovoCartao(novo) {
    setCartoes((prev) => [...prev, novo])
  }

  function handleAtualizouCartao(id, dadosAtualizados) {
    setCartoes((prev) => prev.map((c) => c.id === id ? { ...c, ...dadosAtualizados } : c))
  }

  function handleRemoveuCartao(id) {
    setCartoes((prev) => prev.filter((c) => c.id !== id))
    setTransacoes((prev) => prev.map((t) => t.cartao_id === id ? { ...t, cartao_id: null } : t))
  }

  async function handleLogout() {
    if (usuario?.id) {
      sessionStorage.removeItem(`cc_sessao_${usuario.id}`)
    }
    if (usuario?.email) {
      await registrarLogAuth('logout', usuario.email)
    }
    await supabase.auth.signOut()
    setTransacoes([])
  }

  if (carregando) return <div style={estilos.loading}>Carregando Contas Claras...</div>

  if (modoRedefinir) return (
    <RedefinirSenha onConcluido={async () => {
      await supabase.auth.signOut()
      setModoRedefinir(false)
    }} />
  )

  if (!usuario) return (
    <div data-theme="dark" data-theme-locked="dark" className="theme-dark-locked" style={{ minHeight: '100vh', background: '#0A0F0D' }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={setUsuario} />} />
          <Route path="/termos" element={<PaginaTermosPrivacidade />} />
          <Route path="/privacidade" element={<PaginaTermosPrivacidade />} />
          <Route path="/"      element={<PaginaLanding />} />
          <Route path="*"      element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )

  // Badge de pendências vencidas
  const hoje       = new Date()
  const diaHoje    = hoje.getDate()
  const mesHojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const qtdVencidas = transacoes.filter(t =>
    t.status === 'pendente' &&
    t.mes_referencia === mesHojeISO &&
    t.dia_pagamento < diaHoje &&
    (t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel')
  ).length

  const propsPaginas = {
    transacoes,
    cartoes,
    usuarioId:        usuario.id,
    mesSelecionado,
    mostrarLancamento: mesSelecionado >= mesISOHoje(),
    onNovaTransacao:  handleNovaTransacao,
    onNovoCartao:     handleNovoCartao,
    onAtualizouCartao: handleAtualizouCartao,
    onRemoveuCartao:  handleRemoveuCartao,
    onRemoveu:        handleRemoveu,
    onAtualizou:      handleAtualizou,
    carregando:       carregandoDados,
    onAbrirTour:      () => setTourAberto(true),
  }

  return (
    <BrowserRouter>
      <ConfirmProvider>
        <AppAutenticado
          usuario={usuario}
          isMobileNav={isMobileNav}
          qtdVencidas={qtdVencidas}
          mesSelecionado={mesSelecionado}
          setMesSelecionado={setMesSelecionado}
          propsPaginas={propsPaginas}
          handleLogout={handleLogout}
          tourAberto={tourAberto}
          setTourAberto={setTourAberto}
        />
      </ConfirmProvider>
    </BrowserRouter>
  )
}

function AppAutenticado({
  usuario,
  isMobileNav,
  qtdVencidas,
  mesSelecionado,
  setMesSelecionado,
  propsPaginas,
  handleLogout,
  tourAberto,
  setTourAberto,
}) {
  const location = useLocation()
  const isRotaAdmin = location.pathname.startsWith('/admin')

  return (
    <div style={estilos.layout}>
      <NavLateral qtdVencidas={qtdVencidas} />

      <div style={estilos.conteudo}>
        {/* Header Mobile com Identificação do Sistema (apenas fora do painel administrativo) */}
        {isMobileNav && !isRotaAdmin && (
          <div style={estilos.mobileTopBar}>
            <div style={estilos.mobileBrandLogo}>
              <div style={estilos.logoAvatar}>
                <img src={logoImg} alt="Contas Claras" style={estilos.logoImg} />
              </div>
              <div style={estilos.logoTextWrap}>
                <span style={estilos.logoTitulo}>Contas Claras</span>
                <span style={estilos.logoSub}>Inteligência Financeira</span>
              </div>
            </div>
            <MenuUsuario
              email={usuario.email}
              onLogout={handleLogout}
              usuarioId={usuario.id}
              onAbrirTour={() => setTourAberto(true)}
            />
          </div>
        )}

        {/* Header Superior / Subheader (oculto quando estiver no Painel Admin) */}
        {!isRotaAdmin && (
          <header style={{
            ...estilos.header,
            padding: isMobileNav ? '14px 16px 6px' : '24px 36px 12px',
            justifyContent: isMobileNav ? 'center' : 'space-between',
          }}>
            <div style={{
              ...estilos.headerLeft,
              alignItems: isMobileNav ? 'center' : 'flex-start',
              textAlign: isMobileNav ? 'center' : 'left',
            }}>
              <div style={estilos.mesNavegacao}>
                <button
                  onClick={() => setMesSelecionado(navegarMes(mesSelecionado, -1))}
                  style={estilos.botaoSetaMes}
                  aria-label="Mês anterior"
                >
                  ‹
                </button>
                <h1 style={{
                  ...estilos.tituloMes,
                  fontSize: isMobileNav ? 22 : 28,
                }}>
                  {formatarMesHeader(mesSelecionado)}
                </h1>
                <button
                  onClick={() => setMesSelecionado(navegarMes(mesSelecionado, 1))}
                  style={estilos.botaoSetaMes}
                  aria-label="Próximo mês"
                >
                  ›
                </button>
              </div>
              <span style={{
                ...estilos.subtituloHeader,
                fontSize: isMobileNav ? 13.5 : 14.5,
              }}>
                Visão geral financeira
              </span>
            </div>

            {/* Menu suspenso: visível no header superior no desktop */}
            {!isMobileNav && (
              <div style={estilos.headerRight}>
                <MenuUsuario
                  email={usuario.email}
                  onLogout={handleLogout}
                  usuarioId={usuario.id}
                  onAbrirTour={() => setTourAberto(true)}
                />
              </div>
            )}
          </header>
        )}

        <main style={{ ...estilos.main, paddingBottom: isMobileNav ? 100 : 40 }}>
          <Routes>
            <Route path="/"              element={<Navigate to="/dashboard" replace />} />
            <Route path="/login"         element={<Navigate to="/dashboard" replace />} />
            <Route path="/termos"        element={<PaginaTermosPrivacidade />} />
            <Route path="/privacidade"   element={<PaginaTermosPrivacidade />} />
            <Route path="/dashboard"     element={<PaginaDashboard   {...propsPaginas} />} />
            <Route path="/despesas"      element={<PaginaLancamentos {...propsPaginas} />} />
            <Route path="/receitas"      element={<PaginaReceitas    {...propsPaginas} />} />
            <Route path="/contas"        element={<PaginaContas      usuarioId={usuario.id} />} />
            <Route path="/cartoes"       element={<PaginaCartoes     {...propsPaginas} />} />
            <Route path="/aplicacoes"    element={<PaginaAplicacoes  {...propsPaginas} />} />
            <Route path="/sonhos"        element={<PaginaSonhos      {...propsPaginas} />} />
            <Route path="/configuracoes" element={<PaginaConfiguracoes onAbrirTour={() => setTourAberto(true)} />} />
            
            {/* Rotas Administrativas com Proteção por Hash */}
            <Route path="/admin/:hash"          element={<PaginaAdmin usuario={usuario} />} />
            <Route path="/admin/:hash/usuarios" element={<PaginaAdminUsuarios usuario={usuario} />} />
            <Route path="/admin/:hash/logs"     element={<PaginaAdminLogs usuario={usuario} />} />
            <Route path="/admin"                element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/*"              element={<Navigate to="/dashboard" replace />} />
            
            <Route path="*"                     element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Modal de Onboarding Tour */}
      <ModalOnboardingTour
        aberto={tourAberto}
        onFechar={() => setTourAberto(false)}
        usuarioId={usuario.id}
      />
    </div>
  )
}

const estilos = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-deep)',
  },
  conteudo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-deep)',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-headline)',
    fontSize: 16,
  },
  mobileTopBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  mobileBrandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1.5px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 14px var(--primary-glow)',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoImg: {
    width: 22,
    height: 22,
    objectFit: 'contain',
    display: 'block',
  },
  logoTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.15,
  },
  logoTitulo: {
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.01em',
  },
  logoSub: {
    fontSize: 10.5,
    fontWeight: 500,
    color: 'var(--text-muted)',
    marginTop: 1,
  },
  header: {
    padding: '24px 36px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'nowrap',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
    flex: 1,
  },
  mesNavegacao: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  tituloMes: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
  },
  subtituloHeader: {
    fontSize: 14.5,
    color: 'var(--text-muted)',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  botaoSetaMes: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 22,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '16px 36px 36px',
    width: '100%',
    boxSizing: 'border-box',
  },
}
