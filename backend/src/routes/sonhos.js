import { Router } from 'express'
import supabase from '../services/supabase.js'
import autenticar from '../middleware/autenticar.js'

const router = Router()

router.use(autenticar)

// GET /sonhos/:usuario_id — lista sonhos cadastrados
router.get('/:usuario_id', async (req, res) => {
  const usuario_id = req.usuarioId

  const { data, error } = await supabase
    .from('sonhos')
    .select('*')
    .eq('usuario_id', usuario_id)
    .order('criado_em', { ascending: true })

  if (error) {
    return res.status(500).json({ erro: 'Falha ao buscar sonhos', detalhe: error.message })
  }

  return res.json({ sonhos: data })
})

// POST /sonhos — cria um novo sonho
router.post('/', async (req, res) => {
  const usuario_id = req.usuarioId
  const { nome, valor_total, valor_guardado, data_alvo, cor } = req.body

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Campo obrigatório: nome' })
  }

  const total = Number(valor_total)
  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ erro: 'Campo valor_total deve ser um número maior que zero' })
  }

  if (!data_alvo) {
    return res.status(400).json({ erro: 'Campo obrigatório: data_alvo' })
  }

  const guardado = Number(valor_guardado)
  const valorGuardadoValido = Number.isFinite(guardado) && guardado >= 0 ? guardado : 0

  const { data, error } = await supabase
    .from('sonhos')
    .insert({
      usuario_id,
      nome: nome.trim(),
      valor_total: total,
      valor_guardado: valorGuardadoValido,
      data_alvo,
      cor: cor || null,
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ erro: 'Falha ao criar sonho', detalhe: error.message })
  }

  return res.status(201).json({ sonho: data })
})

// PUT /sonhos/:id — atualiza um sonho existente (nome, valor_total, valor_guardado, data_alvo, cor)
router.put('/:id', async (req, res) => {
  const usuario_id = req.usuarioId
  const { id } = req.params
  const { nome, valor_total, valor_guardado, data_alvo, cor } = req.body

  const campos = {}

  if (nome !== undefined) {
    if (!nome.trim()) return res.status(400).json({ erro: 'Campo nome não pode ser vazio' })
    campos.nome = nome.trim()
  }
  if (valor_total !== undefined) {
    const total = Number(valor_total)
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ erro: 'Campo valor_total deve ser um número maior que zero' })
    }
    campos.valor_total = total
  }
  if (valor_guardado !== undefined) {
    const guardado = Number(valor_guardado)
    if (!Number.isFinite(guardado) || guardado < 0) {
      return res.status(400).json({ erro: 'Campo valor_guardado deve ser um número maior ou igual a zero' })
    }
    campos.valor_guardado = guardado
  }
  if (data_alvo !== undefined) {
    if (!data_alvo) return res.status(400).json({ erro: 'Campo data_alvo não pode ser vazio' })
    campos.data_alvo = data_alvo
  }
  if (cor !== undefined) campos.cor = cor || null

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ erro: 'Nenhum campo para atualizar' })
  }

  const { data, error } = await supabase
    .from('sonhos')
    .update(campos)
    .eq('id', id)
    .eq('usuario_id', usuario_id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ erro: 'Falha ao atualizar sonho', detalhe: error.message })
  }

  return res.json({ sonho: data })
})

// POST /sonhos/:id/guardar — soma um valor ao valor_guardado atual
router.post('/:id/guardar', async (req, res) => {
  const usuario_id = req.usuarioId
  const { id } = req.params
  const valor = Number(req.body.valor)

  if (!Number.isFinite(valor) || valor <= 0) {
    return res.status(400).json({ erro: 'Campo valor deve ser um número maior que zero' })
  }

  const { data: atual, error: erroBusca } = await supabase
    .from('sonhos')
    .select('valor_guardado')
    .eq('id', id)
    .eq('usuario_id', usuario_id)
    .single()

  if (erroBusca) {
    return res.status(500).json({ erro: 'Falha ao buscar sonho', detalhe: erroBusca.message })
  }

  const novoValor = Number(atual.valor_guardado) + valor

  const { data, error } = await supabase
    .from('sonhos')
    .update({ valor_guardado: novoValor })
    .eq('id', id)
    .eq('usuario_id', usuario_id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ erro: 'Falha ao atualizar valor guardado', detalhe: error.message })
  }

  return res.json({ sonho: data })
})

// DELETE /sonhos/:id — remove o sonho
router.delete('/:id', async (req, res) => {
  const usuario_id = req.usuarioId
  const { id } = req.params

  const { error } = await supabase
    .from('sonhos')
    .delete()
    .eq('id', id)
    .eq('usuario_id', usuario_id)

  if (error) {
    return res.status(500).json({ erro: 'Falha ao excluir sonho', detalhe: error.message })
  }

  return res.json({ mensagem: 'Sonho excluído com sucesso' })
})

export default router
