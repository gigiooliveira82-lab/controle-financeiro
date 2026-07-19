import { useState } from 'react'
import { criarCartao, atualizarCartao, contarComprasCartao, removerCartao } from '../services/api'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { ItemLinha, soma, fmtSaldo } from '../components/Dashboard'

export default function PaginaCartoes({
  cartoes, transacoes, usuarioId, mesSelecionado,
  onNovoCartao, onAtualizouCartao, onRemoveuCartao,
  onNovaTransacao, onRemoveu, onAtualizou, carregando,
}) {
  const [expandido, setExpandido] = useState(false)

  const { removendo, handleRemover, handleAtualizar, handleDuplicar, handleCancelarGrupoParcelas } =
    useTransacaoHandlers({ usuarioId, mesSelecionado, transacoes, onRemoveu, onAtualizou, onNova: onNovaTransacao })

  if (carregando) {
    return (
      <div style={c.placeholder}>
        <p style={c.placeholderTexto}>Carregando cartões...</p>
      </div>
    )
  }

  const cartoesById = {}
  cartoes.forEach(cartao => { cartoesById[cartao.id] = cartao })

  return (
    <div style={c.root}>
      {expandido ? (
        <FormCartao
          titulo="Novo cartão"
          textoSalvar="Salvar cartão"
          onSalvar={async (dados) => {
            const novo = await criarCartao(dados)
            onNovoCartao(novo)
            setExpandido(false)
          }}
          onCancelar={() => setExpandido(false)}
        />
      ) : (
        <button onClick={() => setExpandido(true)} style={c.botaoNovo}>
          + Novo cartão
        </button>
      )}

      {cartoes.length === 0 ? (
        <div style={c.placeholder}>
          <p style={{ ...c.placeholderTexto, fontWeight: 600, color: '#334155' }}>Nenhum cartão cadastrado.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Use o botão acima para cadastrar seu primeiro cartão.</p>
        </div>
      ) : (
        cartoes.map(cartao => (
          <BlocoCartao
            key={cartao.id}
            cartao={cartao}
            compras={transacoes.filter(t => t.cartao_id === cartao.id && t.mes_referencia === mesSelecionado)}
            cartoesById={cartoesById}
            removendo={removendo}
            onRemover={handleRemover}
            onAtualizar={handleAtualizar}
            onDuplicar={handleDuplicar}
            onCancelarParcelas={handleCancelarGrupoParcelas}
            onAtualizarCartao={onAtualizouCartao}
            onRemoverCartao={onRemoveuCartao}
          />
        ))
      )}
    </div>
  )
}

function BlocoCartao({
  cartao, compras, cartoesById, removendo, onRemover, onAtualizar, onDuplicar, onCancelarParcelas,
  onAtualizarCartao, onRemoverCartao,
}) {
  const [editando, setEditando]   = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const total = soma(compras)
  const corCartao = cartao.cor || 'var(--verde-profundo)'
  const comprasOrdenadas = [...compras].sort((a, b) => {
    const d = (a.dia_pagamento || 0) - (b.dia_pagamento || 0)
    return d !== 0 ? d : (a.criado_em || '') < (b.criado_em || '') ? -1 : 1
  })

  async function handleExcluir() {
    setExcluindo(true)
    try {
      const totalCompras = await contarComprasCartao(cartao.id)
      const msg = totalCompras > 0
        ? `Este cartão tem ${totalCompras} compra${totalCompras === 1 ? '' : 's'} registrada${totalCompras === 1 ? '' : 's'}. Excluir o cartão vai desvincular essas compras (elas continuam em Despesas, mas sem cartão associado). Deseja continuar?`
        : 'Tem certeza que deseja excluir este cartão?'
      if (!confirm(msg)) return
      await removerCartao(cartao.id)
      onRemoverCartao(cartao.id)
    } catch (err) {
      alert('Erro ao excluir cartão: ' + err.message)
    } finally {
      setExcluindo(false)
    }
  }

  if (editando) {
    return (
      <FormCartao
        inicial={cartao}
        titulo={`Editar ${cartao.nome}`}
        textoSalvar="Salvar alterações"
        onSalvar={async (dados) => {
          const atualizado = await atualizarCartao(cartao.id, dados)
          onAtualizarCartao(cartao.id, atualizado)
          setEditando(false)
        }}
        onCancelar={() => setEditando(false)}
      />
    )
  }

  return (
    <div style={{ ...c.bloco, borderLeft: `4px solid ${corCartao}` }}>
      <div style={c.blocoTopo}>
        <div>
          <div style={c.blocoNomeRow}>
            <span style={{ ...c.blocoTitulo, color: corCartao }}>{cartao.nome}</span>
            <button onClick={() => setEditando(true)} style={c.iconBtn} title="Editar cartão">✎</button>
            <button onClick={handleExcluir} disabled={excluindo} style={c.iconBtn} title="Excluir cartão">×</button>
          </div>
          <p style={c.blocoSub}>Fecha dia {cartao.dia_fechamento} · Vence dia {cartao.dia_vencimento}</p>
        </div>
        <span style={c.blocoTotalValor}>{fmtSaldo(total)}</span>
      </div>

      <div style={c.separador} />

      {comprasOrdenadas.length === 0 ? (
        <p style={c.blocoVazio}>Nenhuma compra nesta fatura</p>
      ) : (
        <div>
          {comprasOrdenadas.map(t => (
            <ItemLinha
              key={t.id}
              transacao={t}
              cor={corCartao}
              mostrarStatus
              mostrarRecorrente={false}
              removendo={removendo === t.id}
              onRemover={() => onRemover(t.id)}
              onAtualizar={campos => onAtualizar(t.id, campos)}
              onDuplicar={() => onDuplicar(t.id)}
              onCancelarParcelas={onCancelarParcelas}
              cartoesById={cartoesById}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FormCartao({ inicial, titulo, textoSalvar, onSalvar, onCancelar }) {
  const [nome, setNome]                 = useState(inicial?.nome || '')
  const [diaFechamento, setDiaFechamento] = useState(inicial ? String(inicial.dia_fechamento) : '')
  const [diaVencimento, setDiaVencimento] = useState(inicial ? String(inicial.dia_vencimento) : '')
  const [cor, setCor]                   = useState(inicial?.cor || '#1F5D45')
  const [salvando, setSalvando]         = useState(false)
  const [erro, setErro]                 = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    const fech = parseInt(diaFechamento, 10)
    const venc = parseInt(diaVencimento, 10)
    if (!nome.trim()) { setErro('Informe o nome do cartão'); return }
    if (isNaN(fech) || fech < 1 || fech > 31) { setErro('Dia de fechamento deve ser entre 1 e 31'); return }
    if (isNaN(venc) || venc < 1 || venc > 31) { setErro('Dia de vencimento deve ser entre 1 e 31'); return }

    setSalvando(true)
    try {
      await onSalvar({ nome: nome.trim(), dia_fechamento: fech, dia_vencimento: venc, cor })
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={c.form}>
      <h2 style={c.formTitulo}>{titulo}</h2>

      <input
        placeholder="Nome do cartão (ex: Cartão Master)"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={c.input}
        disabled={salvando}
      />

      <div style={c.formRow}>
        <label style={c.label}>
          Dia de fechamento
          <input
            type="number" min="1" max="31"
            value={diaFechamento}
            onChange={(e) => setDiaFechamento(e.target.value)}
            style={c.inputPequeno}
            disabled={salvando}
          />
        </label>
        <label style={c.label}>
          Dia de vencimento
          <input
            type="number" min="1" max="31"
            value={diaVencimento}
            onChange={(e) => setDiaVencimento(e.target.value)}
            style={c.inputPequeno}
            disabled={salvando}
          />
        </label>
        <label style={c.label}>
          Cor
          <input
            type="color"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            style={c.inputCor}
            disabled={salvando}
          />
        </label>
      </div>

      {erro && <div style={c.erroBox}>{erro}</div>}

      <div style={c.formBotoes}>
        <button type="submit" style={c.botaoSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : textoSalvar}
        </button>
        <button type="button" style={c.botaoCancelar} onClick={onCancelar} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

const c = {
  root: { display: 'flex', flexDirection: 'column', gap: 20 },
  placeholder:      { background: '#fff', borderRadius: 12, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  placeholderTexto: { margin: 0, color: '#64748b' },
  botaoNovo: {
    display: 'block', width: '100%', padding: '16px',
    borderRadius: 12, border: '2px dashed #BDD5CC',
    background: '#fff', color: 'var(--verde-profundo)',
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center', boxSizing: 'border-box',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },

  form: {
    background: '#fff', borderRadius: 12, padding: '24px 28px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  formTitulo: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  formRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  input: {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 8,
    border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 600 },
  inputPequeno: {
    width: 80, padding: '8px 10px', borderRadius: 8,
    border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  inputCor: { width: 60, height: 36, padding: 2, borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' },
  erroBox: {
    padding: '10px 14px', borderRadius: 8,
    background: '#fef2f2', color: '#dc2626',
    fontSize: 14, border: '1px solid #fecaca',
  },
  formBotoes: { display: 'flex', gap: 8 },
  botaoSalvar: {
    padding: '10px 18px', borderRadius: 8, border: 'none',
    background: 'var(--verde-profundo)', color: 'var(--creme-header)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  botaoCancelar: {
    padding: '10px 18px', borderRadius: 8, border: '1px solid #ddd',
    background: '#fff', color: '#64748b', fontSize: 14, cursor: 'pointer',
  },

  bloco:           { background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  blocoTopo:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  blocoNomeRow:    { display: 'flex', alignItems: 'center', gap: 2 },
  blocoTitulo:     { fontSize: 16, fontWeight: 700 },
  blocoSub:        { margin: '2px 0 0', fontSize: 12, color: '#94a3b8' },
  blocoTotalValor: { fontSize: 20, fontWeight: 800, color: '#1e293b' },
  separador:       { height: 1, background: 'var(--surface-line)', margin: '14px -20px' },
  blocoVazio:      { margin: '2px 0 0', fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' },
  iconBtn: {
    background: 'none', border: 'none', fontSize: 14,
    color: '#9ca3af', cursor: 'pointer', padding: '4px 6px', lineHeight: 1,
  },
}
