import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './services/supabase'
import { buscarTransacoes, gerarRecorrentes } from './services/api'
import Login from './components/Login'
import RedefinirSenha from './components/RedefinirSenha'
import NavLateral from './components/NavLateral'
import PaginaDashboard from './pages/PaginaDashboard'
import PaginaLancamentos from './pages/PaginaLancamentos'
import PaginaAplicacoes from './pages/PaginaAplicacoes'
import PaginaConfiguracoes from './pages/PaginaConfiguracoes'

function useIsMobileHeader() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 500)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 500)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function useIsNavMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

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
  const [usuario, setUsuario]               = useState(null)
  const [transacoes, setTransacoes]         = useState([])
  const [carregando, setCarregando]         = useState(true)
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [mesSelecionado, setMesSelecionado] = useState(mesISOHoje)
  const [modoRedefinir, setModoRedefinir]   = useState(false)
  const isMobileHeader = useIsMobileHeader()
  const isMobileNav    = useIsNavMobile()

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

  async function handleLogout() {
    await supabase.auth.signOut()
    setTransacoes([])
  }

  if (carregando) return <div style={estilos.loading}>Carregando...</div>

  if (modoRedefinir) return (
    <RedefinirSenha onConcluido={async () => {
      await supabase.auth.signOut()
      setModoRedefinir(false)
    }} />
  )

  if (!usuario) return <Login onLogin={setUsuario} />

  // Badge de vencidas para NavLateral
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
    usuarioId:        usuario.id,
    mesSelecionado,
    mostrarLancamento: mesSelecionado >= mesISOHoje(),
    onNovaTransacao:  handleNovaTransacao,
    onRemoveu:        handleRemoveu,
    onAtualizou:      handleAtualizou,
    carregando:       carregandoDados,
  }

  return (
    <BrowserRouter>
      <div style={estilos.layout}>
        <NavLateral qtdVencidas={qtdVencidas} />

        <div style={estilos.conteudo}>
          <header style={{ ...estilos.header, padding: isMobileHeader ? '10px 14px' : '14px 28px' }}>
            <div>
              <h1 style={{ ...estilos.headerTitulo, fontSize: isMobileHeader ? 15 : 20 }}>
                <span style={estilos.headerIcone}>✦</span>Controle Financeiro
              </h1>
              <div style={estilos.navMes}>
                <button onClick={() => setMesSelecionado(navegarMes(mesSelecionado, -1))} style={estilos.botaoNav}>‹</button>
                <span style={{ ...estilos.headerMes, minWidth: isMobileHeader ? 110 : 140, fontSize: isMobileHeader ? 13 : 16 }}>
                  {formatarMesHeader(mesSelecionado)}
                </span>
                <button onClick={() => setMesSelecionado(navegarMes(mesSelecionado, 1))} style={estilos.botaoNav}>›</button>
              </div>
            </div>
            <button onClick={handleLogout} style={estilos.botaoLogout}>Sair</button>
          </header>

          <main style={{ ...estilos.main, paddingBottom: isMobileNav ? 90 : 32 }}>
            <Routes>
              <Route path="/dashboard"     element={<PaginaDashboard     {...propsPaginas} />} />
              <Route path="/lancamentos"   element={<PaginaLancamentos   {...propsPaginas} />} />
              <Route path="/aplicacoes"    element={<PaginaAplicacoes    {...propsPaginas} />} />
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
    background: 'var(--creme-fundo)',
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
    color: '#666',
  },
  header: {
    background: 'var(--verde-profundo)',
    color: 'var(--creme-header)',
    padding: '14px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 12px rgba(31,93,69,0.30)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerIcone: {
    color: '#9DC9B5',
    marginRight: 9,
    fontSize: 14,
    verticalAlign: 'middle',
  },
  headerTitulo: { margin: '0 0 5px', fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' },
  navMes: { display: 'flex', alignItems: 'center', gap: 8 },
  headerMes: { fontSize: 16, fontWeight: 700, color: 'var(--creme-header)', textTransform: 'capitalize', minWidth: 140, textAlign: 'center', letterSpacing: '0.01em' },
  botaoNav: {
    background: 'transparent',
    border: 'none',
    color: '#9DC9B5',
    fontSize: 24,
    cursor: 'pointer',
    padding: '0 6px',
    lineHeight: 1,
  },
  main: { maxWidth: 1400, margin: '0 auto', padding: '24px 16px', width: '100%', boxSizing: 'border-box' },
  botaoLogout: {
    background: 'transparent',
    border: '1px solid #ffffff44',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
}
