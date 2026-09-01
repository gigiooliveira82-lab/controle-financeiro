import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { isUsuarioAdmin, gerarHashAdmin } from '../utils/hashAdmin'
import { buscarLogsAdmin } from '../services/api'
import {
  IconLogs,
  IconLocalizacao,
  IconBusca,
  IconAtualizar,
  IconVoltar,
} from '../components/Icones'

export default function PaginaAdminLogs({ usuario }) {
  const { hash } = useParams()
  const navigate = useNavigate()

  const [logs, setLogs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // Paginação e busca
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')

  // Validação de segurança
  const emailLogado = usuario?.email || ''
  const ehAdmin = isUsuarioAdmin(emailLogado)
  const hashEsperado = ehAdmin ? gerarHashAdmin(emailLogado) : ''

  if (!ehAdmin || !hash || hash !== hashEsperado) {
    return <Navigate to="/dashboard" replace />
  }

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca)
      setPagina(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [busca])

  async function carregarLogs() {
    setCarregando(true)
    setErro(null)
    try {
      const resp = await buscarLogsAdmin(pagina, 15, buscaDebounced)
      setLogs(resp.logs || [])
      setTotal(resp.total || 0)
      setTotalPaginas(resp.totalPaginas || 1)
    } catch (err) {
      console.error('Erro ao carregar logs:', err)
      setErro(err.message || 'Erro ao buscar logs de acesso')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarLogs()
  }, [pagina, buscaDebounced])

  return (
    <div style={estilos.container}>
      {/* Top Header */}
      <div style={estilos.headerRow}>
        <div>
          <h1 style={estilos.titulo}>
            Logs de Acesso
          </h1>
          <p style={estilos.subtitulo}>
            Auditoria e monitoramento de entradas (login) e saídas (logout) do sistema ({total} {total === 1 ? 'registro' : 'registros'})
          </p>
        </div>

        <div style={estilos.acoesHeader}>
          <button
            type="button"
            onClick={carregarLogs}
            disabled={carregando}
            style={estilos.botaoAtualizar}
            title="Atualizar logs"
          >
            <IconAtualizar size={16} color="var(--text-muted)" />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={estilos.botaoVoltar}
          >
            <IconVoltar size={16} color="var(--primary)" />
            <span>Voltar ao Sistema</span>
          </button>
        </div>
      </div>

      {erro && (
        <div style={estilos.alertaErro}>
          <span>⚠️ {erro}</span>
          <button onClick={carregarLogs} style={estilos.btnTentar}>Tentar novamente</button>
        </div>
      )}

      {/* Barra de Filtro / Busca */}
      <div style={estilos.filtroCard}>
        <div style={estilos.buscaWrap}>
          <IconBusca size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por IP, local ou e-mail..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={estilos.inputBusca}
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              style={estilos.btnLimparBusca}
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        <div style={estilos.contadorRegistros}>
          Exibindo <strong>{logs.length}</strong> de <strong>{total}</strong>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div style={estilos.tabelaWrapper}>
        <table style={estilos.tabela}>
          <thead>
            <tr>
              <th style={estilos.th}>IP</th>
              <th style={estilos.th}>Data / Hora</th>
              <th style={estilos.th}>Local de Acesso</th>
              <th style={estilos.th}>E-mail / Usuário</th>
              <th style={estilos.th}>Evento</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={5} style={estilos.tdVazio}>
                  <div style={estilos.loadingRow}>
                    <IconAtualizar size={20} color="var(--primary)" />
                    <span>Carregando registros de login/logout...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={estilos.tdVazio}>
                  Nenhum registro de login/logout encontrado {busca ? `com o termo "${busca}"` : ''}.
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const dataFormatada = log.criado_em
                  ? new Date(log.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '-'

                const ehLogin = log.acao === 'login'

                return (
                  <tr key={log.id} style={estilos.tr}>
                    {/* IP */}
                    <td style={estilos.td}>
                      <span style={estilos.badgeIp}>
                        {log.ip || '127.0.0.1'}
                      </span>
                    </td>

                    {/* Data / Hora de Acesso */}
                    <td style={estilos.td}>
                      <span style={estilos.textoDataHora}>{dataFormatada}</span>
                    </td>

                    {/* Local de Acesso */}
                    <td style={estilos.td}>
                      <div style={estilos.localCell}>
                        <IconLocalizacao size={14} color="#06B6D4" />
                        <span style={estilos.textoLocal}>
                          {log.localizacao || 'Brasil (IP Local)'}
                        </span>
                      </div>
                    </td>

                    {/* E-mail / Usuário */}
                    <td style={estilos.td}>
                      <span style={estilos.textoEmail}>
                        {log.email || 'anônimo'}
                      </span>
                    </td>

                    {/* Evento (Login / Logout) */}
                    <td style={estilos.td}>
                      <span style={{
                        ...estilos.badgeAcao,
                        background: ehLogin ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        borderColor: ehLogin ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)',
                        color: ehLogin ? 'var(--primary)' : '#F59E0B',
                        fontWeight: 700,
                      }}>
                        {ehLogin ? '● Login' : '○ Logout'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={estilos.paginacaoBar}>
          <button
            type="button"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina <= 1 || carregando}
            style={{
              ...estilos.btnPaginacao,
              opacity: pagina <= 1 ? 0.5 : 1,
              cursor: pagina <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ‹ Anterior
          </button>

          <span style={estilos.textoPaginacao}>
            Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
          </span>

          <button
            type="button"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas || carregando}
            style={{
              ...estilos.btnPaginacao,
              opacity: pagina >= totalPaginas ? 0.5 : 1,
              cursor: pagina >= totalPaginas ? 'not-allowed' : 'pointer',
            }}
          >
            Próxima ›
          </button>
        </div>
      )}
    </div>
  )
}

const estilos = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '8px 0 32px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  titulo: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
  },
  subtitulo: {
    margin: '4px 0 0',
    fontSize: 14,
    color: 'var(--text-muted)',
  },
  acoesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  botaoAtualizar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  botaoVoltar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface-hover)',
    color: 'var(--text-pure)',
    border: '1px solid var(--border)',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  alertaErro: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#EF4444',
    padding: '10px 16px',
    borderRadius: 10,
    fontSize: 13.5,
  },
  btnTentar: {
    background: 'none',
    border: '1px solid #EF4444',
    color: '#EF4444',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  filtroCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '12px 18px',
    borderRadius: 14,
  },
  buscaWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '6px 12px',
  },
  inputBusca: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-pure)',
    fontSize: 13.5,
    width: '100%',
  },
  btnLimparBusca: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 0,
    fontSize: 13,
  },
  contadorRegistros: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  tabelaWrapper: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: 'var(--card-shadow-sm)',
  },
  tabela: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '14px 18px',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface-hover)',
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '14px 18px',
    fontSize: 13.5,
    color: 'var(--text)',
    verticalAlign: 'middle',
  },
  tdVazio: {
    padding: '36px 18px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  badgeIp: {
    fontFamily: 'monospace',
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--text-pure)',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-subtle)',
    padding: '3px 8px',
    borderRadius: 6,
  },
  textoDataHora: {
    fontSize: 13,
    color: 'var(--text-pure)',
    fontFamily: 'var(--font-headline)',
  },
  localCell: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  textoLocal: {
    fontSize: 13,
    color: '#06B6D4',
    fontWeight: 500,
  },
  textoEmail: {
    fontSize: 13.5,
    fontWeight: 600,
    color: 'var(--text-pure)',
  },
  badgeAcao: {
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--text-muted)',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-subtle)',
    padding: '2px 8px',
    borderRadius: 6,
  },
  paginacaoBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '12px',
  },
  btnPaginacao: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-pure)',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
  textoPaginacao: {
    fontSize: 13.5,
    color: 'var(--text-muted)',
  },
}
