import { Link } from 'react-router-dom'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { IconConfiguracoes, IconSol, IconLua } from '../components/Icones'
import { useTheme } from '../hooks/useTheme'

export default function PaginaConfiguracoes({ onAbrirTour }) {
  const { theme, isDark, toggleTheme, setTheme } = useTheme()
  const savedPreference = typeof window !== 'undefined' ? localStorage.getItem('contas_claras_theme') : null
  const modoAtual = !savedPreference ? 'system' : theme

  return (
    <div style={s.root}>
      <CabecalhoPagina
        icone={<IconConfiguracoes size={20} />}
        titulo="Configurações"
        subtitulo="Personalize suas preferências de visualização e uso do sistema."
      />

      <div style={s.card}>
        <div style={s.secaoHeader}>
          <h3 style={s.secaoTitulo}>Aparência e Tema</h3>
          <p style={s.secaoDesc}>
            Escolha como o Contas Claras deve ser exibido. Por padrão, ele se adapta automaticamente ao modo do seu dispositivo.
          </p>
        </div>

        <div style={s.opcoesTema}>
          {/* Opção Sistema */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            style={{
              ...s.btnTema,
              ...(modoAtual === 'system' ? s.btnTemaAtivo : {}),
            }}
          >
            <div style={s.iconeTemaWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>
            </div>
            <div style={s.temaTextos}>
              <span style={s.temaTitulo}>Padrão do Sistema</span>
              <span style={s.temaSub}>Segue as configurações do seu SO</span>
            </div>
            {modoAtual === 'system' && <span style={s.checkPill}>Ativo</span>}
          </button>

          {/* Opção Claro */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{
              ...s.btnTema,
              ...(modoAtual === 'light' ? s.btnTemaAtivo : {}),
            }}
          >
            <div style={{ ...s.iconeTemaWrap, color: '#F59E0B' }}>
              <IconSol size={20} />
            </div>
            <div style={s.temaTextos}>
              <span style={s.temaTitulo}>Modo Claro</span>
              <span style={s.temaSub}>Visual limpo, nítido e iluminado</span>
            </div>
            {modoAtual === 'light' && <span style={s.checkPill}>Ativo</span>}
          </button>

          {/* Opção Escuro */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            style={{
              ...s.btnTema,
              ...(modoAtual === 'dark' ? s.btnTemaAtivo : {}),
            }}
          >
            <div style={{ ...s.iconeTemaWrap, color: '#10B981' }}>
              <IconLua size={20} />
            </div>
            <div style={s.temaTextos}>
              <span style={s.temaTitulo}>Modo Escuro</span>
              <span style={s.temaSub}>Conforto visual em ambientes escuros</span>
            </div>
            {modoAtual === 'dark' && <span style={s.checkPill}>Ativo</span>}
          </button>
        </div>
      </div>

      {/* Card Tour de Introdução */}
      {onAbrirTour && (
        <div style={s.card}>
          <div style={s.secaoHeader}>
            <h3 style={s.secaoTitulo}>Guia de Introdução</h3>
            <p style={s.secaoDesc}>
              Reveja o tour inicial para relembrar os recursos e funcionalidades da plataforma.
            </p>
          </div>

          <button
            type="button"
            onClick={onAbrirTour}
            style={{
              ...s.btnTema,
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ ...s.iconeTemaWrap, color: 'var(--primary)' }}>
                <span style={{ fontSize: 18 }}>✦</span>
              </div>
              <div style={s.temaTextos}>
                <span style={s.temaTitulo}>Rever Tour do Sistema</span>
                <span style={s.temaSub}>Guia interativo de 4 passos com dicas práticas</span>
              </div>
            </div>
            <span style={{ color: 'var(--primary)', fontSize: 16, fontWeight: 700 }}>→</span>
          </button>
        </div>
      )}

      {/* Card Jurídico & Privacidade */}
      <div style={s.card}>
        <div style={s.secaoHeader}>
          <h3 style={s.secaoTitulo}>Privacidade e Termos Legais</h3>
          <p style={s.secaoDesc}>
            Consulte os termos de serviço e nossa política de conformidade com a LGPD.
          </p>
        </div>

        <Link
          to="/termos"
          style={{
            ...s.btnTema,
            textDecoration: 'none',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ ...s.iconeTemaWrap, color: 'var(--primary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div style={s.temaTextos}>
              <span style={s.temaTitulo}>Termos de Uso e Política de Privacidade</span>
              <span style={s.temaSub}>Direitos do titular, segurança e tratamento de dados</span>
            </div>
          </div>
          <span style={{ color: 'var(--primary)', fontSize: 16, fontWeight: 700 }}>→</span>
        </Link>
      </div>
    </div>
  )
}

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '28px 32px',
    boxShadow: 'var(--card-shadow)',
    maxWidth: 640,
  },
  secaoHeader: {
    marginBottom: 20,
  },
  secaoTitulo: {
    margin: '0 0 6px',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-pure)',
    fontFamily: 'var(--font-headline)',
  },
  secaoDesc: {
    margin: 0,
    fontSize: 13.5,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  opcoesTema: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  btnTema: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 18px',
    borderRadius: 12,
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  btnTemaAtivo: {
    background: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'var(--primary)',
    boxShadow: '0 0 12px var(--primary-glow)',
  },
  iconeTemaWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    flexShrink: 0,
    color: 'var(--text)',
  },
  temaTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  temaTitulo: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-pure)',
  },
  temaSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  checkPill: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--primary)',
    background: 'rgba(16, 185, 129, 0.18)',
    padding: '4px 10px',
    borderRadius: 20,
  },
}
