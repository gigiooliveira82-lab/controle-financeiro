import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { isUsuarioAdmin, gerarHashAdmin } from '../utils/hashAdmin'
import { buscarMetricasAdmin } from '../services/api'
import {
  IconPainelAdm,
  IconUsuarios,
  IconNovosUsuarios,
  IconVoltar,
  IconAtualizar,
} from '../components/Icones'
import logoImg from '../assets/logomarca.svg'

export default function PaginaAdmin({ usuario }) {
  const { hash } = useParams()
  const navigate = useNavigate()
  const [metricas, setMetricas] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState(null)

  // Validação de segurança: o usuário deve ser admin e o hash da URL deve bater com o hash do e-mail
  const email = usuario?.email || ''
  const ehAdmin = isUsuarioAdmin(email)
  const hashEsperado = ehAdmin ? gerarHashAdmin(email) : ''

  if (!ehAdmin || !hash || hash !== hashEsperado) {
    return <Navigate to="/dashboard" replace />
  }

  const nomeExibicao = email.split('@')[0]

  async function carregarMetricas(mostrarLoadingSuave = false) {
    if (mostrarLoadingSuave) setAtualizando(true)
    else setCarregando(true)
    setErro(null)

    try {
      const dados = await buscarMetricasAdmin()
      setMetricas(dados)
    } catch (err) {
      console.error('Erro ao buscar métricas de admin:', err)
      setErro(err.message || 'Não foi possível carregar as métricas administrativas.')
    } finally {
      setCarregando(false)
      setAtualizando(false)
    }
  }

  useEffect(() => {
    carregarMetricas()
  }, [])

  return (
    <div style={estilos.container}>
      {/* Barra superior de navegação administrativa */}
      <header style={estilos.topBar}>
        <div style={estilos.brandWrap}>
          <div style={estilos.logoAvatar}>
            <img src={logoImg} alt="Contas Claras" style={estilos.logoImg} />
          </div>
          <div style={estilos.brandText}>
            <div style={estilos.brandTitleRow}>
              <span style={estilos.brandName}>Contas Claras</span>
              <span style={estilos.adminBadge}>
                <IconPainelAdm size={12} color="#0A0F0D" />
                Painel Adm
              </span>
            </div>
            <span style={estilos.brandSub}>Área de Gestão e Monitoramento</span>
          </div>
        </div>

        {/* Botão para voltar ao sistema */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={estilos.botaoVoltar}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <IconVoltar size={18} color="var(--primary)" />
          <span>Voltar ao Sistema</span>
        </button>
      </header>

      {/* Seção de Boas-Vindas */}
      <section style={estilos.welcomeSection}>
        <div style={estilos.welcomeLeft}>
          <h1 style={estilos.tituloPrincipal}>
            Bem-vindo(a) ao Painel, <span style={estilos.destaqueNome}>{nomeExibicao}</span>! 👋
          </h1>
          <p style={estilos.subtitulo}>
            Aqui você acompanha a visão geral de crescimento e a base de usuários da plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={() => carregarMetricas(true)}
          disabled={atualizando || carregando}
          style={{
            ...estilos.botaoAtualizar,
            opacity: atualizando || carregando ? 0.7 : 1,
            cursor: atualizando || carregando ? 'not-allowed' : 'pointer',
          }}
          title="Atualizar métricas agora"
        >
          <span style={{
            display: 'inline-flex',
            transform: atualizando ? 'rotate(360deg)' : 'none',
            transition: atualizando ? 'transform 0.8s ease-in-out' : 'none',
          }}>
            <IconAtualizar size={16} color="var(--text-muted)" />
          </span>
          <span>{atualizando ? 'Atualizando...' : 'Atualizar Dados'}</span>
        </button>
      </section>

      {/* Exibição de erro, se houver */}
      {erro && (
        <div style={estilos.boxErro}>
          <span>⚠️ {erro}</span>
          <button onClick={() => carregarMetricas()} style={estilos.botaoTentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Grid de Cards de Métricas */}
      <div style={estilos.gridCards}>
        {/* Card 1: Total de Usuários Cadastrados */}
        <div
          style={{ ...estilos.card, cursor: 'pointer' }}
          onClick={() => navigate(`/admin/${hash}/usuarios`)}
          title="Clique para gerenciar usuários"
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.transform = 'none'
          }}
        >
          <div style={estilos.cardHeader}>
            <span style={estilos.cardLabel}>Total de Usuários</span>
            <div style={{ ...estilos.iconeWrap, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
              <IconUsuarios size={22} color="var(--primary)" />
            </div>
          </div>

          <div style={estilos.cardBody}>
            {carregando ? (
              <div style={estilos.skeletonNumero} />
            ) : (
              <div style={estilos.numeroGrande}>
                {metricas?.totalUsuarios?.toLocaleString('pt-BR') ?? '0'}
              </div>
            )}
            <div style={estilos.cardSubtexto}>
              Cadastrados até o momento na plataforma
            </div>
          </div>

          <div style={estilos.cardFooter}>
            <span style={estilos.badgeConsolidado}>
              ● Gerenciar Lista de Usuários ›
            </span>
          </div>
        </div>

        {/* Card 2: Novos Usuários no Mês */}
        <div
          style={{ ...estilos.card, cursor: 'pointer' }}
          onClick={() => navigate(`/admin/${hash}/usuarios`)}
          title="Clique para ver novos usuários"
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#06B6D4'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.transform = 'none'
          }}
        >
          <div style={estilos.cardHeader}>
            <span style={estilos.cardLabel}>Novos Usuários no Mês</span>
            <div style={{ ...estilos.iconeWrap, background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }}>
              <IconNovosUsuarios size={22} color="#06B6D4" />
            </div>
          </div>

          <div style={estilos.cardBody}>
            {carregando ? (
              <div style={estilos.skeletonNumero} />
            ) : (
              <div style={{ ...estilos.numeroGrande, color: '#06B6D4' }}>
                +{metricas?.novosUsuariosMes?.toLocaleString('pt-BR') ?? '0'}
              </div>
            )}
            <div style={estilos.cardSubtexto}>
              Cadastros registrados em <strong>{metricas?.mesReferencia || 'mês vigente'}</strong>
            </div>
          </div>

          <div style={estilos.cardFooter}>
            <span style={estilos.badgeNovosMes}>
              ✦ Ver Detalhes do Mês ›
            </span>
          </div>
        </div>
      </div>

      {/* Card Informativo de Segurança e Status do Sistema */}
      <section style={estilos.painelInfo}>
        <div style={estilos.painelInfoHeader}>
          <div style={estilos.painelInfoTitulo}>
            <IconPainelAdm size={18} color="var(--primary)" />
            <span>Informações da Sessão Administrativa</span>
          </div>
          <span style={estilos.badgeSessaoAtiva}>Sessão Autenticada</span>
        </div>

        <div style={estilos.infoGrid}>
          <div style={estilos.infoItem}>
            <span style={estilos.infoLabel}>Administrador Autenticado:</span>
            <span style={estilos.infoValor}>{email}</span>
          </div>

          <div style={estilos.infoItem}>
            <span style={estilos.infoLabel}>Hash de Acesso Seguro:</span>
            <span style={estilos.infoValorHash} title={hash}>
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </span>
          </div>

          <div style={estilos.infoItem}>
            <span style={estilos.infoLabel}>Última Sincronização:</span>
            <span style={estilos.infoValor}>
              {metricas?.atualizadoEm
                ? new Date(metricas.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Aguardando...'}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

const estilos = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '8px 0 32px',
    animation: 'fadeIn 0.25s ease',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    padding: '16px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    boxShadow: 'var(--card-shadow-sm)',
  },
  brandWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  logoAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    width: 26,
    height: 26,
    objectFit: 'contain',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  brandTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
  },
  adminBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    color: '#0A0F0D',
    background: 'var(--primary)',
    padding: '3px 8px',
    borderRadius: 6,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  brandSub: {
    fontSize: 12.5,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  botaoVoltar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface-hover)',
    color: 'var(--text-pure)',
    border: '1px solid var(--border)',
    padding: '10px 18px',
    borderRadius: 10,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: 'var(--card-shadow-sm)',
  },
  welcomeSection: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  welcomeLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  tituloPrincipal: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
  },
  destaqueNome: {
    color: 'var(--primary)',
  },
  subtitulo: {
    margin: 0,
    fontSize: 14.5,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  botaoAtualizar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.15s ease',
  },
  boxErro: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#EF4444',
    padding: '12px 18px',
    borderRadius: 12,
    fontSize: 14,
  },
  botaoTentarNovamente: {
    background: 'none',
    border: '1px solid #EF4444',
    color: '#EF4444',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20,
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: 'var(--card-shadow)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  iconeWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  numeroGrande: {
    fontSize: 38,
    fontWeight: 900,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  skeletonNumero: {
    width: 120,
    height: 40,
    borderRadius: 8,
    background: 'var(--surface-hover)',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  cardSubtexto: {
    fontSize: 13.5,
    color: 'var(--text-muted)',
    lineHeight: 1.35,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
  },
  badgeConsolidado: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--primary)',
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '4px 10px',
    borderRadius: 6,
  },
  badgeNovosMes: {
    fontSize: 12,
    fontWeight: 600,
    color: '#06B6D4',
    background: 'rgba(6, 182, 212, 0.1)',
    padding: '4px 10px',
    borderRadius: 6,
  },
  painelInfo: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: 'var(--card-shadow-sm)',
  },
  painelInfoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  painelInfoTitulo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-pure)',
    fontFamily: 'var(--font-headline)',
  },
  badgeSessaoAtiva: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--primary)',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '3px 8px',
    borderRadius: 99,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 14,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    padding: '10px 14px',
    background: 'var(--surface-hover)',
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
  },
  infoLabel: {
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  infoValor: {
    fontSize: 13.5,
    fontWeight: 600,
    color: 'var(--text-pure)',
    wordBreak: 'break-all',
  },
  infoValorHash: {
    fontSize: 12.5,
    fontFamily: 'monospace',
    fontWeight: 600,
    color: 'var(--primary)',
  },
}
