import { useState } from 'react'
import { removerTransacao, atualizarTransacao } from '../services/api'
import { fmtBRL } from '../utils/fmt'

const TIPO_LABEL = {
  despesa_fixa: 'Fixa',
  despesa_variavel: 'Variável',
  credito: 'Crédito',
  aplicacao: 'Aplicação',
}

const TIPO_COR = {
  despesa_fixa: '#7c3aed',
  despesa_variavel: '#dc2626',
  credito: '#16a34a',
  aplicacao: '#2563eb',
}

export default function ListaTransacoes({ transacoes, usuarioId, onRemoveu, onAtualizou, carregando }) {
  const [removendo, setRemovendo] = useState(null)

  async function handleRemover(id) {
    if (!confirm('Remover este lançamento?')) return
    setRemovendo(id)
    try {
      await removerTransacao(id, usuarioId)
      onRemoveu(id)
    } catch (err) {
      alert('Erro ao remover: ' + err.message)
    } finally {
      setRemovendo(null)
    }
  }

  async function handleAtualizar(id, campos) {
    try {
      const atualizada = await atualizarTransacao(id, usuarioId, campos)
      onAtualizou(id, atualizada)
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message)
    }
  }

  if (carregando) {
    return (
      <div style={estilos.vazio}>
        <p style={{ color: '#94a3b8' }}>Carregando lançamentos...</p>
      </div>
    )
  }

  if (!transacoes.length) {
    return (
      <div style={estilos.vazio}>
        <p>Nenhum lançamento neste mês ainda.</p>
        <p style={{ fontSize: 13, color: '#999' }}>Use o campo acima para adicionar o primeiro.</p>
      </div>
    )
  }

  const totalCreditos = transacoes
    .filter((t) => t.tipo === 'credito' && t.status === 'pago')
    .reduce((s, t) => s + Number(t.valor), 0)

  const totalDespesas = transacoes
    .filter((t) => (t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel') && t.status === 'pago')
    .reduce((s, t) => s + Number(t.valor), 0)

  const saldo = totalCreditos - totalDespesas

  return (
    <div>
      <div style={estilos.resumo}>
        <ResumoItem label="Entradas pagas" valor={totalCreditos} cor="#16a34a" />
        <ResumoItem label="Saídas pagas" valor={totalDespesas} cor="#dc2626" />
        <ResumoItem label="Saldo real" valor={saldo} cor={saldo >= 0 ? '#2563eb' : '#dc2626'} destaque />
      </div>

      <h2 style={estilos.titulo}>Lançamentos do mês</h2>

      <div style={estilos.lista}>
        {transacoes.map((t) => (
          <ItemTransacao
            key={t.id}
            transacao={t}
            removendo={removendo === t.id}
            onRemover={() => handleRemover(t.id)}
            onAtualizar={(campos) => handleAtualizar(t.id, campos)}
          />
        ))}
      </div>
    </div>
  )
}

function ResumoItem({ label, valor, cor, destaque }) {
  return (
    <div style={{ ...estilos.resumoItem, ...(destaque ? estilos.resumoDestaque : {}) }}>
      <span style={estilos.resumoLabel}>{label}</span>
      <span style={{ ...estilos.resumoValor, color: cor }}>
        {fmtBRL(Math.abs(valor))}
      </span>
    </div>
  )
}

function ItemTransacao({ transacao: t, removendo, onRemover, onAtualizar }) {
  const [editandoValor, setEditandoValor] = useState(false)
  const [novoValor, setNovoValor] = useState(String(t.valor))
  const [salvando, setSalvando] = useState(false)

  async function handleToggleStatus() {
    if (salvando) return
    setSalvando(true)
    try {
      await onAtualizar({ status: t.status === 'pago' ? 'pendente' : 'pago' })
    } finally {
      setSalvando(false)
    }
  }

  async function handleToggleRecorrente() {
    if (salvando) return
    setSalvando(true)
    try {
      await onAtualizar({ recorrente: !t.recorrente })
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarValor() {
    const valor = parseFloat(novoValor.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) {
      setNovoValor(String(t.valor))
      setEditandoValor(false)
      return
    }
    setSalvando(true)
    try {
      await onAtualizar({ valor })
    } finally {
      setSalvando(false)
      setEditandoValor(false)
    }
  }

  function handleValorKeyDown(e) {
    if (e.key === 'Enter') handleSalvarValor()
    if (e.key === 'Escape') {
      setNovoValor(String(t.valor))
      setEditandoValor(false)
    }
  }

  return (
    <div style={{ ...estilos.item, opacity: salvando ? 0.6 : 1 }}>
      <div style={estilos.itemEsq}>
        <span style={{ ...estilos.tipoBadge, background: TIPO_COR[t.tipo] }}>
          {TIPO_LABEL[t.tipo]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={estilos.itemDesc}>{t.descricao}</p>
          <p style={estilos.itemMeta}>
            {t.categoria} · dia {t.dia_pagamento}
          </p>
          <div style={estilos.acoes}>
            <button
              onClick={handleToggleRecorrente}
              style={{
                ...estilos.botaoAcao,
                color: t.recorrente ? '#7c3aed' : '#aaa',
                borderColor: t.recorrente ? '#c4b5fd' : '#e5e7eb',
                background: t.recorrente ? '#faf5ff' : '#f9fafb',
              }}
              title={t.recorrente ? 'Remover recorrência' : 'Tornar recorrente'}
              disabled={salvando}
            >
              ↺ {t.recorrente ? 'Recorrente' : 'Tornar recorrente'}
            </button>
          </div>
        </div>
      </div>
      <div style={estilos.itemDir}>
        {editandoValor ? (
          <div style={estilos.editValorWrap}>
            <input
              autoFocus
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
              onBlur={handleSalvarValor}
              onKeyDown={handleValorKeyDown}
              style={estilos.inputValor}
            />
            <span style={estilos.editDica}>Enter para salvar</span>
          </div>
        ) : (
          <p
            onClick={() => { setNovoValor(String(t.valor)); setEditandoValor(true) }}
            style={{ ...estilos.itemValor, color: t.tipo === 'credito' ? '#16a34a' : '#1a1a2e', cursor: 'pointer' }}
            title="Clique para editar o valor"
          >
            {t.tipo === 'credito' ? '+' : '-'} {fmtBRL(Math.abs(Number(t.valor)))}
          </p>
        )}
        <button
          onClick={handleToggleStatus}
          style={{
            ...estilos.statusBadge,
            background: t.status === 'pago' ? '#dcfce7' : '#fef9c3',
            color: t.status === 'pago' ? '#16a34a' : '#a16207',
            cursor: 'pointer',
            border: 'none',
          }}
          disabled={salvando}
          title="Clique para alternar status"
        >
          {t.status === 'pago' ? 'Pago' : 'Pendente'}
        </button>
        <button
          onClick={onRemover}
          style={estilos.botaoRemover}
          disabled={removendo}
          title="Remover"
        >
          ×
        </button>
      </div>
    </div>
  )
}

const estilos = {
  resumo: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  resumoItem: {
    flex: 1,
    minWidth: 140,
    background: '#fff',
    borderRadius: 10,
    padding: '14px 18px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  resumoDestaque: {
    border: '2px solid #2563eb22',
  },
  resumoLabel: { fontSize: 12, color: '#888', fontWeight: 500 },
  resumoValor: { fontSize: 20, fontWeight: 700 },
  titulo: { margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  lista: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    background: '#fff',
    borderRadius: 10,
    padding: '12px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    gap: 12,
    transition: 'opacity 0.15s',
  },
  itemEsq: { display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 },
  tipoBadge: {
    padding: '2px 8px',
    borderRadius: 20,
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    marginTop: 2,
  },
  itemDesc: { margin: '0 0 2px', fontWeight: 600, fontSize: 14, color: '#1a1a2e' },
  itemMeta: { margin: '0 0 6px', fontSize: 12, color: '#888' },
  acoes: { display: 'flex', gap: 6 },
  botaoAcao: {
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.15s',
  },
  itemDir: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  itemValor: { margin: 0, fontWeight: 700, fontSize: 15 },
  editValorWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  inputValor: {
    width: 100,
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #2563eb',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'right',
    outline: 'none',
  },
  editDica: { fontSize: 10, color: '#94a3b8' },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  },
  botaoRemover: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    fontSize: 20,
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
  },
  vazio: {
    background: '#fff',
    borderRadius: 12,
    padding: '40px',
    textAlign: 'center',
    color: '#666',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
}
