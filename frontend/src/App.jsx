import { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import { buscarTransacoes, gerarRecorrentes } from './services/api'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import RedefinirSenha from './components/RedefinirSenha'

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
  const [usuario, setUsuario]             = useState(null)
  const [transacoes, setTransacoes]       = useState([])
  const [carregando, setCarregando]       = useState(true)
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [mesSelecionado, setMesSelecionado]   = useState(mesISOHoje)
  const [modoRedefinir, setModoRedefinir] = useState(false)

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

  return (
    <div style={estilos.pagina}>
      <header style={estilos.header}>
        <div>
          <h1 style={estilos.headerTitulo}>
            <span style={estilos.headerIcone}>✦</span>Controle Financeiro
          </h1>
          <div style={estilos.navMes}>
            <button onClick={() => setMesSelecionado(navegarMes(mesSelecionado, -1))} style={estilos.botaoNav}>‹</button>
            <span style={estilos.headerMes}>{formatarMesHeader(mesSelecionado)}</span>
            <button
              onClick={() => setMesSelecionado(navegarMes(mesSelecionado, 1))}
              style={estilos.botaoNav}
            >›</button>
          </div>
        </div>
        <button onClick={handleLogout} style={estilos.botaoLogout}>Sair</button>
      </header>

      <main style={estilos.main}>
        <Dashboard
          transacoes={transacoes}
          usuarioId={usuario.id}
          mesSelecionado={mesSelecionado}
          mostrarLancamento={mesSelecionado >= mesISOHoje()}
          onNovaTransacao={handleNovaTransacao}
          onRemoveu={handleRemoveu}
          onAtualizou={handleAtualizou}
          carregando={carregandoDados}
        />
      </main>
    </div>
  )
}

const estilos = {
  pagina: { minHeight: '100vh', background: '#f0f4f8' },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
  },
  header: {
    background: 'linear-gradient(to right, #1a1a2e, #0d1b2a)',
    color: '#fff',
    padding: '16px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 0 0 #6366f1, 0 4px 24px rgba(0,0,0,0.35)',
  },
  headerIcone: {
    color: '#a78bfa',
    marginRight: 9,
    fontSize: 14,
    verticalAlign: 'middle',
  },
  headerTitulo: { margin: '0 0 5px', fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' },
  navMes: { display: 'flex', alignItems: 'center', gap: 8 },
  headerMes: { fontSize: 16, fontWeight: 700, color: '#fff', textTransform: 'capitalize', minWidth: 140, textAlign: 'center', letterSpacing: '0.01em' },
  botaoNav: {
    background: 'transparent',
    border: 'none',
    color: '#c4b5fd',
    fontSize: 24,
    cursor: 'pointer',
    padding: '0 6px',
    lineHeight: 1,
  },
  main: { maxWidth: 1400, margin: '0 auto', padding: '24px 16px' },
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
