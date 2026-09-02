import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { IconExportar } from './Icones'
import { fmtBRL } from '../utils/fmt'

// Helper para formatar data ISO 'YYYY-MM-DD' em 'DD/MM/YYYY'
function formatarDataBR(iso) {
  if (!iso) return ''
  const partes = iso.split('-')
  if (partes.length !== 3) return iso
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

// Helper para escapar campos de CSV
function escaparCSV(campo) {
  if (campo === null || campo === undefined) return '""'
  const str = String(campo).replace(/"/g, '""')
  return `"${str}"`
}

export default function ModalExportarDados({ aberto, onFechar, usuarioId, email }) {
  const [formato, setFormato]       = useState('csv') // 'csv' | 'json'
  const [periodo, setPeriodo]       = useState('todos') // 'todos' | 'ano' | 'mes'
  const [mesAno, setMesAno]         = useState(() => {
    const hoje = new Date()
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]             = useState('')
  const [sucesso, setSucesso]       = useState(false)

  useEffect(() => {
    if (!aberto) return
    setErro('')
    setSucesso(false)

    function handleEsc(e) {
      if (e.key === 'Escape' && !carregando) onFechar()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [aberto, carregando, onFechar])

  if (!aberto) return null

  async function handleExportar() {
    setCarregando(true)
    setErro('')
    setSucesso(false)

    try {
      // 1. Busca todas as informações necessárias do Supabase
      let queryTransacoes = supabase
        .from('transacoes')
        .select('*')
        .order('mes_referencia', { ascending: false })
        .order('dia_pagamento', { ascending: false })

      if (usuarioId) {
        queryTransacoes = queryTransacoes.eq('usuario_id', usuarioId)
      }

      if (periodo === 'mes' && mesAno) {
        queryTransacoes = queryTransacoes.eq('mes_referencia', `${mesAno}-01`)
      } else if (periodo === 'ano') {
        const anoAtual = new Date().getFullYear()
        queryTransacoes = queryTransacoes
          .gte('mes_referencia', `${anoAtual}-01-01`)
          .lte('mes_referencia', `${anoAtual}-12-31`)
      }

      const [resTransacoes, resCartoes, resContas, resSonhos] = await Promise.all([
        queryTransacoes,
        supabase.from('cartoes').select('*').eq('usuario_id', usuarioId || ''),
        supabase.from('contas').select('*').eq('usuario_id', usuarioId || ''),
        supabase.from('sonhos').select('*').eq('usuario_id', usuarioId || ''),
      ])

      if (resTransacoes.error) throw resTransacoes.error

      const transacoes = resTransacoes.data || []
      const cartoes    = resCartoes.data || []
      const contas     = resContas.data || []
      const sonhos     = resSonhos.data || []

      const cartoesMap = new Map(cartoes.map(c => [c.id, c.nome]))
      const dataHoraExport = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

      if (formato === 'csv') {
        // Cabeçalhos em português formatados para Excel Brasil
        const cabecalhos = [
          'Mês de Referência',
          'Dia do Pagamento',
          'Descrição',
          'Tipo',
          'Categoria',
          'Subcategoria',
          'Valor (R$)',
          'Status',
          'Cartão',
          'Recorrente',
          'Total de Parcelas',
          'Parcela Atual',
          'Observações / Notas',
        ]

        const linhasCSV = transacoes.map(t => {
          const valorNumerico = Number(t.valor || 0)
          // Formata valor com vírgula para Excel em português (ex: "150,50")
          const valorFormatado = valorNumerico.toFixed(2).replace('.', ',')

          const tipoFormatado = {
            despesa_fixa: 'Despesa Fixa',
            despesa_variavel: 'Despesa Variável',
            credito: 'Receita / Crédito',
            aplicacao: 'Aplicação / Investimento',
          }[t.tipo] || t.tipo

          return [
            escaparCSV(t.mes_referencia ? t.mes_referencia.slice(0, 7) : ''),
            escaparCSV(t.dia_pagamento || ''),
            escaparCSV(t.descricao || ''),
            escaparCSV(tipoFormatado),
            escaparCSV(t.categoria || ''),
            escaparCSV(t.subcategoria || ''),
            escaparCSV(valorFormatado),
            escaparCSV(t.status === 'pago' ? 'Pago' : 'Pendente'),
            escaparCSV(t.cartao_id ? (cartoesMap.get(t.cartao_id) || 'Cartão de Crédito') : 'Conta / À Vista'),
            escaparCSV(t.recorrente ? 'Sim' : 'Não'),
            escaparCSV(t.total_parcelas || ''),
            escaparCSV(t.parcela_atual || ''),
            escaparCSV(t.observacao || ''),
          ].join(';')
        })

        // \uFEFF adiciona o Byte Order Mark (BOM) para compatibilidade com UTF-8 no Excel
        const conteudoCSV = '\uFEFF' + [cabecalhos.join(';'), ...linhasCSV].join('\r\n')
        const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `contas-claras-lancamentos_${dataHoraExport}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

      } else if (formato === 'json') {
        // Backup estruturado completo com metadados
        const backupCompleto = {
          versao_app: '1.0.0',
          sistema: 'Contas Claras — Inteligência Financeira',
          exportado_em: new Date().toISOString(),
          usuario: {
            id: usuarioId,
            email: email,
          },
          filtro_periodo: periodo,
          totais: {
            total_transacoes: transacoes.length,
            total_cartoes: cartoes.length,
            total_contas: contas.length,
            total_sonhos: sonhos.length,
          },
          dados: {
            transacoes,
            cartoes,
            contas,
            sonhos,
          },
        }

        const jsonString = JSON.stringify(backupCompleto, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `contas-claras-backup-completo_${dataHoraExport}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      setSucesso(true)
      setTimeout(() => {
        onFechar()
      }, 1500)

    } catch (err) {
      console.error('Erro ao exportar dados:', err)
      setErro('Não foi possível gerar a exportação dos dados. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={st.overlay} onClick={(e) => { if (e.target === e.currentTarget && !carregando) onFechar() }}>
      <div style={st.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-exportar-dados">
        {/* Cabeçalho */}
        <div style={st.header}>
          <div style={st.iconeWrap}>
            <IconExportar size={20} color="var(--primary)" />
          </div>
          <div style={st.headerTextos}>
            <h2 id="titulo-exportar-dados" style={st.titulo}>Exportar Dados</h2>
            <p style={st.subtitulo}>Baixe uma cópia dos seus lançamentos e finanças para seu computador.</p>
          </div>
          <button
            type="button"
            style={st.fecharBtn}
            onClick={onFechar}
            disabled={carregando}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {sucesso ? (
          <div style={st.sucessoBox}>
            <div style={st.sucessoCheck}>✓</div>
            <span style={st.sucessoTexto}>Arquivo baixado com sucesso!</span>
          </div>
        ) : (
          <div style={st.form}>
            {/* Escolha do Formato */}
            <div style={st.campo}>
              <label style={st.label}>Formato do Arquivo</label>
              <div style={st.gridFormatos}>
                <button
                  type="button"
                  onClick={() => setFormato('csv')}
                  style={{
                    ...st.cardFormato,
                    ...(formato === 'csv' ? st.cardFormatoAtivo : {}),
                  }}
                >
                  <div style={st.formatoTopo}>
                    <span style={st.formatoIcone}>📊</span>
                    <strong style={st.formatoNome}>Planilha CSV (Excel)</strong>
                  </div>
                  <p style={st.formatoDesc}>
                    Ideal para abrir no Microsoft Excel, Google Planilhas ou importar em outros sistemas.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormato('json')}
                  style={{
                    ...st.cardFormato,
                    ...(formato === 'json' ? st.cardFormatoAtivo : {}),
                  }}
                >
                  <div style={st.formatoTopo}>
                    <span style={st.formatoIcone}>📦</span>
                    <strong style={st.formatoNome}>JSON (Backup Completo)</strong>
                  </div>
                  <p style={st.formatoDesc}>
                    Estrutura técnica completa com lançamentos, cartões, contas e sonhos.
                  </p>
                </button>
              </div>
            </div>

            {/* Escolha do Período */}
            <div style={st.campo}>
              <label style={st.label}>Período dos Lançamentos</label>
              <div style={st.pillsContainer}>
                <button
                  type="button"
                  onClick={() => setPeriodo('todos')}
                  style={{
                    ...st.pillBtn,
                    ...(periodo === 'todos' ? st.pillBtnAtivo : {}),
                  }}
                >
                  Todo o Histórico
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodo('ano')}
                  style={{
                    ...st.pillBtn,
                    ...(periodo === 'ano' ? st.pillBtnAtivo : {}),
                  }}
                >
                  Ano Atual ({new Date().getFullYear()})
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodo('mes')}
                  style={{
                    ...st.pillBtn,
                    ...(periodo === 'mes' ? st.pillBtnAtivo : {}),
                  }}
                >
                  Mês Específico
                </button>
              </div>

              {periodo === 'mes' && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="month"
                    value={mesAno}
                    onChange={e => setMesAno(e.target.value)}
                    style={st.inputMes}
                  />
                </div>
              )}
            </div>

            {erro && <div style={st.erroBox}>⚠️ {erro}</div>}

            {/* Ações */}
            <div style={st.acoes}>
              <button
                type="button"
                onClick={onFechar}
                style={st.btnCancelar}
                disabled={carregando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExportar}
                style={st.btnSalvar}
                disabled={carregando}
              >
                {carregando ? 'Exportando...' : `Baixar arquivo ${formato.toUpperCase()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const st = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 9999,
    animation: 'modalFadeIn 0.15s ease',
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px 28px',
    width: '100%',
    maxWidth: 480,
    boxShadow: 'var(--dropdown-shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    position: 'relative',
  },
  iconeWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextos: {
    flex: 1,
    minWidth: 0,
  },
  titulo: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  subtitulo: {
    margin: '3px 0 0',
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  fecharBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
    lineHeight: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text)',
  },
  gridFormatos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardFormato: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    transition: 'all 0.15s ease',
  },
  cardFormatoAtivo: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1.5px solid var(--primary)',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.12)',
  },
  formatoTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  formatoIcone: {
    fontSize: 16,
  },
  formatoNome: {
    fontSize: 13.5,
    color: 'var(--text-pure)',
    fontWeight: 600,
  },
  formatoDesc: {
    margin: 0,
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  pillsContainer: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  pillBtn: {
    padding: '7px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-raised)',
    color: 'var(--text)',
    fontSize: 12.5,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  },
  pillBtnAtivo: {
    background: 'var(--primary)',
    borderColor: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontWeight: 700,
  },
  inputMes: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-hover)',
    color: 'var(--text-pure)',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  erroBox: {
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--tertiary)',
    fontSize: 13,
    fontWeight: 500,
  },
  sucessoBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '28px 16px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
  },
  sucessoCheck: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 800,
  },
  sucessoTexto: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--primary)',
    textAlign: 'center',
  },
  acoes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  btnCancelar: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSalvar: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    cursor: 'pointer',
    boxShadow: '0 0 14px var(--primary-glow)',
  },
}
