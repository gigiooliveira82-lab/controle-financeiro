import { useState } from 'react'
import { removerTransacao, atualizarTransacao, duplicarTransacao, cancelarParcelasGrupo } from '../services/api'
import { useConfirm } from '../components/ModalConfirmacao'

export function useTransacaoHandlers({ usuarioId, mesSelecionado, transacoes, onRemoveu, onAtualizou, onNova }) {
  const [removendo, setRemovendo] = useState(null)
  const confirmar = useConfirm()

  async function handleRemover(id) {
    const ok = await confirmar({
      titulo: 'Excluir Lançamento',
      mensagem: 'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
      variante: 'danger',
    })
    if (!ok) return

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
      return true
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message)
      return false
    }
  }

  async function handleDuplicar(id) {
    try {
      const nova = await duplicarTransacao(id, usuarioId)
      onNova(nova)
    } catch (err) {
      alert('Erro ao duplicar: ' + err.message)
    }
  }

  async function handleCancelarGrupoParcelas(grupoId) {
    const ok = await confirmar({
      titulo: 'Cancelar Parcelas Futuras',
      mensagem: 'Deseja cancelar todas as parcelas futuras vinculadas a este parcelamento?',
      textoConfirmar: 'Cancelar Parcelas',
      textoCancelar: 'Manter',
      variante: 'danger',
    })
    if (!ok) return

    try {
      await cancelarParcelasGrupo(grupoId, usuarioId)
      const hoje = new Date()
      const mesAtualISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
      if (mesSelecionado > mesAtualISO) {
        transacoes
          .filter(t => t.grupo_parcela_id === grupoId)
          .forEach(t => onRemoveu(t.id))
      }
    } catch (err) {
      alert('Erro ao cancelar parcelas: ' + err.message)
    }
  }

  return { removendo, handleRemover, handleAtualizar, handleDuplicar, handleCancelarGrupoParcelas }
}
