import { useState } from 'react'
import { criarCartao, atualizarCartao, contarComprasCartao, removerCartao } from '../services/api'
import { useTransacaoHandlers } from '../hooks/useTransacaoHandlers'
import { ItemLinha, soma, fmtSaldo } from '../components/Dashboard'
import LancamentoTexto from '../components/LancamentoTexto'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { IconCartoes } from '../components/Icones'
import { useConfirm } from '../components/ModalConfirmacao'

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
      <CabecalhoPagina icone={<IconCartoes size={20} />} titulo="Cartões de Crédito" subtitulo="Compras no crédito organizadas com suas faturas." />
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
          + Adicionar novo cartão
        </button>
      )}

      {cartoes.length === 0 ? (
        <div style={c.placeholder}>
          <p style={{ ...c.placeholderTexto, fontWeight: 600, color: 'var(--text-pure)' }}>Nenhum cartão cadastrado.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Use o botão acima para cadastrar seu primeiro cartão.</p>
        </div>
      ) : (
        cartoes.map(cartao => (
          <BlocoCartao
            key={cartao.id}
            cartao={cartao}
            compras={transacoes.filter(t => t.cartao_id === cartao.id && t.mes_referencia === mesSelecionado)}
            transacoes={transacoes}
            usuarioId={usuarioId}
            mesSelecionado={mesSelecionado}
            cartoesById={cartoesById}
            removendo={removendo}
            onRemover={handleRemover}
            onAtualizar={handleAtualizar}
            onDuplicar={handleDuplicar}
            onCancelarParcelas={handleCancelarGrupoParcelas}
            onAtualizarCartao={onAtualizouCartao}
            onRemoverCartao={onRemoveuCartao}
            onNovaTransacao={onNovaTransacao}
            onAtualizouTransacao={onAtualizou}
          />
        ))
      )}
    </div>
  )
}

function BlocoCartao({
  cartao, compras, transacoes, usuarioId, mesSelecionado, cartoesById, removendo, onRemover, onAtualizar, onDuplicar, onCancelarParcelas,
  onAtualizarCartao, onRemoverCartao, onNovaTransacao, onAtualizouTransacao,
}) {
  const [editando, setEditando]     = useState(false)
  const [excluindo, setExcluindo]   = useState(false)
  const [lancando, setLancando]     = useState(false)
  const total = soma(compras)
  const corCartao = cartao.cor || 'var(--primary)'
  const confirmar = useConfirm()

  async function handleExcluir() {
    setExcluindo(true)
    try {
      const totalCompras = await contarComprasCartao(cartao.id)
      const msg = totalCompras > 0
        ? `Este cartão possui ${totalCompras} compra(s) vinculada(s). Excluir o cartão vai desvincular essas compras. Deseja continuar?`
        : `Tem certeza que deseja excluir o cartão "${cartao.nome}"? Esta ação não pode ser desfeita.`

      const ok = await confirmar({
        titulo: 'Excluir Cartão',
        mensagem: msg,
        textoConfirmar: 'Excluir Cartão',
        variante: 'danger',
      })
      if (!ok) return

      await removerCartao(cartao.id)
      onRemoverCartao(cartao.id)
    } catch (err) {
      alert('Erro ao excluir cartão: ' + err.message)
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div style={c.bloco}>
      <div style={c.blocoTopo}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...c.corDot, background: corCartao }} />
          <div>
            <h3 style={c.cartaoNome}>{cartao.nome}</h3>
            <span style={c.cartaoInfo}>
              Fecha dia {cartao.dia_fechamento} · Vence dia {cartao.dia_vencimento}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={c.totalLabel}>Fatura do mês</span>
          <span style={c.totalValor}>{fmtSaldo(total)}</span>
        </div>
      </div>

      {editando ? (
        <FormCartao
          titulo={`Editar ${cartao.nome}`}
          dadosIniciais={cartao}
          textoSalvar="Salvar alterações"
          onSalvar={async (dados) => {
            const atualizado = await atualizarCartao(cartao.id, dados)
            onAtualizarCartao(cartao.id, atualizado)
            setEditando(false)
          }}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <>
          {lancando ? (
            <div style={{ marginBottom: 12 }}>
              <LancamentoTexto
                usuarioId={usuarioId}
                titulo={`Nova Compra em ${cartao.nome}`}
                onFechar={() => setLancando(false)}
                onNovaTransacao={onNovaTransacao}
                onAtualizouTransacao={onAtualizouTransacao}
                cartoes={[cartao]}
                cartaoFixo={cartao}
                transacoes={transacoes}
                mesSelecionado={mesSelecionado}
              />
            </div>
          ) : (
            <button onClick={() => setLancando(true)} style={{ ...c.btnLancarCompra, borderColor: corCartao, color: corCartao }}>
              + Lançar compra nesta fatura
            </button>
          )}
          <div style={c.comprasLista}>
            {compras.length === 0 ? (
              <p style={c.textoVazio}>Nenhuma compra neste cartão para o mês selecionado.</p>
            ) : (
              compras.map(t => (
                <ItemLinha
                  key={t.id}
                  transacao={t}
                  cor={corCartao}
                  mostrarStatus
                  removendo={removendo === t.id}
                  onRemover={() => onRemover(t.id)}
                  onAtualizar={campos => onAtualizar(t.id, campos)}
                  onDuplicar={() => onDuplicar(t.id)}
                  onCancelarParcelas={onCancelarParcelas}
                  cartoesById={cartoesById}
                />
              ))
            )}
          </div>
        </>
      )}

      <div style={c.blocoAcoes}>
        <button onClick={() => setEditando(!editando)} style={c.btnAcao}>
          {editando ? 'Fechar edição' : 'Editar cartão'}
        </button>
        <button onClick={handleExcluir} disabled={excluindo} style={{ ...c.btnAcao, color: 'var(--tertiary)' }}>
          Excluir
        </button>
      </div>
    </div>
  )
}

function FormCartao({ titulo, dadosIniciais = {}, textoSalvar, onSalvar, onCancelar }) {
  const [nome, setNome]                     = useState(dadosIniciais.nome || '')
  const [diaFechamento, setDiaFechamento]   = useState(dadosIniciais.dia_fechamento || '')
  const [diaVencimento, setDiaVencimento]   = useState(dadosIniciais.dia_vencimento || '')
  const [cor, setCor]                       = useState(dadosIniciais.cor || '#10B981')
  const [salvando, setSalvando]             = useState(false)
  const [erro, setErro]                     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await onSalvar({
        nome: nome.trim(),
        dia_fechamento: parseInt(diaFechamento, 10),
        dia_vencimento: parseInt(diaVencimento, 10),
        cor,
      })
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={c.formCard}>
      <h4 style={c.formTitulo}>{titulo}</h4>
      <form onSubmit={handleSubmit} style={c.form}>
        <div style={c.inputGrid}>
          <div style={c.campo}>
            <label style={c.label}>Nome do Cartão</label>
            <input
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Nubank, Inter..."
              style={c.input}
            />
          </div>
          <div style={c.campo}>
            <label style={c.label}>Dia Fechamento</label>
            <input
              required
              type="number"
              min="1"
              max="31"
              value={diaFechamento}
              onChange={e => setDiaFechamento(e.target.value)}
              placeholder="Ex: 10"
              style={c.input}
            />
          </div>
          <div style={c.campo}>
            <label style={c.label}>Dia Vencimento</label>
            <input
              required
              type="number"
              min="1"
              max="31"
              value={diaVencimento}
              onChange={e => setDiaVencimento(e.target.value)}
              placeholder="Ex: 17"
              style={c.input}
            />
          </div>
        </div>

        {erro && <p style={c.erro}>{erro}</p>}

        <div style={c.formBotoes}>
          <button type="submit" disabled={salvando} style={c.btnSalvar}>
            {salvando ? 'Salvando...' : textoSalvar}
          </button>
          <button type="button" onClick={onCancelar} style={c.btnCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

const c = {
  root: { display: 'flex', flexDirection: 'column', gap: 20 },
  placeholder: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '48px 24px',
    textAlign: 'center',
  },
  placeholderTexto: { margin: 0, color: 'var(--text-muted)' },
  botaoNovo: {
    display: 'block', width: '100%', padding: '16px',
    borderRadius: 12, border: '1.5px dashed var(--border)',
    background: 'var(--surface)', color: 'var(--primary)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center', boxSizing: 'border-box',
    fontFamily: 'var(--font-headline)',
  },
  bloco: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  blocoTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottom: '1px solid var(--border-subtle)',
  },
  corDot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
  },
  cartaoNome: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  cartaoInfo: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  totalLabel: {
    display: 'block',
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  totalValor: {
    fontSize: 18,
    fontWeight: 800,
    color: 'var(--text-pure)',
  },
  comprasLista: {
    display: 'flex',
    flexDirection: 'column',
  },
  btnLancarCompra: {
    display: 'block', width: '100%', padding: '10px',
    borderRadius: 8, border: '1.5px dashed',
    background: 'transparent',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center', boxSizing: 'border-box',
    fontFamily: 'var(--font-headline)',
  },
  lancamentoWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  btnFecharLancamento: {
    alignSelf: 'flex-end',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '2px 4px',
  },
  textoVazio: {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  blocoAcoes: {
    display: 'flex',
    gap: 12,
    paddingTop: 8,
    borderTop: '1px solid var(--border-subtle)',
  },
  btnAcao: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  formCard: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '20px',
  },
  formTitulo: {
    margin: '0 0 16px',
    fontSize: 15,
    color: 'var(--text-pure)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-pure)',
    fontSize: 13,
    outline: 'none',
  },
  formBotoes: {
    display: 'flex',
    gap: 10,
  },
  btnSalvar: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-contrast)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnCancelar: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    cursor: 'pointer',
  },
  erro: {
    color: 'var(--tertiary)',
    fontSize: 13,
    margin: 0,
  },
}
