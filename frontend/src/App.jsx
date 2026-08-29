import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useIsNavMobile } from './hooks/useIsNavMobile'
import { supabase } from './services/supabase'
import { buscarTransacoes, gerarRecorrentes, buscarCartoes } from './services/api'
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
import PaginaConfiguracoes from './pages/PaginaConfiguracoes'
import { IconLogout } from './components/Icones'

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
  const isMobileNav                           = useIsNavMobile()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null)
      setCarregando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setModoRedefinir(true)
        setUsuario(session?.user ?? null)
      } else {
        setModoRedefinir(false)
        setUsuario(session?.user ?? null)
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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUsuario} />} />
        <Route path="/"      element={<PaginaLanding />} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
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
  }

  const letraInicial = usuario.email ? usuario.email[0].toUpperCase() : 'U'

  return (
    <BrowserRouter>
      <div style={estilos.layout}>
        <NavLateral qtdVencidas={qtdVencidas} />

        <div style={estilos.conteudo}>
          {/* Header Superior — Conforme solicitado pelo usuário */}
          <header style={estilos.header}>
            <div style={estilos.headerLeft}>
              <div style={estilos.mesNavegacao}>
                <button
                  onClick={() => setMesSelecionado(navegarMes(mesSelecionado, -1))}
                  style={estilos.botaoSetaMes}
                  aria-label="Mês anterior"
                >
                  ‹
                </button>
                <h1 style={estilos.tituloMes}>
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
              <span style={estilos.subtituloHeader}>Visão geral financeira</span>
            </div>

            {/* Identificação do Usuário + Botão Sair ao lado */}
            <div style={estilos.headerRight}>
              <div style={estilos.usuarioBadge} title={usuario.email}>
                <div style={estilos.usuarioAvatar}>{letraInicial}</div>
                <span style={estilos.usuarioEmail}>{usuario.email}</span>
              </div>

              <button
                onClick={handleLogout}
                style={estilos.botaoLogout}
                title="Encerrar sessão"
              >
                <IconLogout size={16} />
                <span>Sair</span>
              </button>
            </div>
          </header>

          <main style={{ ...estilos.main, paddingBottom: isMobileNav ? 100 : 40 }}>
            <Routes>
              <Route path="/"              element={<Navigate to="/dashboard" replace />} />
              <Route path="/login"         element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"     element={<PaginaDashboard   {...propsPaginas} />} />
              <Route path="/despesas"      element={<PaginaLancamentos {...propsPaginas} />} />
              <Route path="/receitas"      element={<PaginaReceitas    {...propsPaginas} />} />
              <Route path="/cartoes"       element={<PaginaCartoes     {...propsPaginas} />} />
              <Route path="/aplicacoes"    element={<PaginaAplicacoes  {...propsPaginas} />} />
              <Route path="/sonhos"        element={<PaginaSonhos      {...propsPaginas} />} />
              <Route path="/configuracoes" element={<PaginaConfiguracoes />} />
              <Route path="*"              element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
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
  header: {
    padding: '24px 36px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  mesNavegacao: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 13,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  botaoSetaMes: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 22,
    background: 'var(--surface)',
    color: 'var(--text)',
    padding: '14px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  navMes: { display: 'flex', alignItems: 'center', gap: 8 },
  usuarioArea: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 },
  usuarioEmail: {
    fontSize: 12,
    color: 'var(--text-muted)',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerMes: { fontSize: 16, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize', minWidth: 140, textAlign: 'center', letterSpacing: '0.01em' },
  botaoNav: {
    background: 'transparent',
    border: 'none',
    color: 'var(--mint)',
    fontSize: 24,
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
  },
  usuarioBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '6px 14px 6px 8px',
    borderRadius: 99,
    maxWidth: 260,
  },
  usuarioAvatar: {
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
  usuarioEmail: {
    fontSize: 13,
    color: 'var(--text)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 180,
  },
  botaoLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-muted)',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '16px 36px 36px',
    width: '100%',
    boxSizing: 'border-box',
  },
}
