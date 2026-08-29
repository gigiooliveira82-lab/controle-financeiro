import { Router } from 'express'
import supabase from '../services/supabase.js'
import autenticar from '../middleware/autenticar.js'

const router = Router()

router.use(autenticar)

// GET /contas/:usuario_id — lista contas correntes cadastradas
router.get('/:usuario_id', async (req, res) => {
  const usuario_id = req.usuarioId

  const { data, error } = await supabase
    .from('contas_correntes')
    .select('*')
    .eq('usuario_id', usuario_id)
    .order('criado_em', { ascending: true })

  if (error) {
    return res.status(500).json({ erro: 'Falha ao buscar contas', detalhe: error.message })
  }

  return res.json({ contas: data })
})

// POST /contas — cria uma nova conta corrente
router.post('/', async (req, res) => {
  const usuario_id = req.usuarioId
  const { nome, saldo_atual, cor } = req.body

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Campo obrigatório: nome' })
  }

  const saldo = saldo_atual === undefined ? 0 : Number(saldo_atual)
  if (!Number.isFinite(saldo)) {
    return res.status(400).json({ erro: 'Campo saldo_atual deve ser um número' })
  }

  const { data, error } = await supabase
    .from('contas_correntes')
    .insert({
      usuario_id,
      nome: nome.trim(),
      saldo_atual: saldo,
      cor: cor || null,
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ erro: 'Falha ao criar conta', detalhe: error.message })
  }

  return res.status(201).json({ conta: data })
})

// PUT /contas/:id — atualiza nome, saldo e/ou cor de uma conta
router.put('/:id', async (req, res) => {
  const usuario_id = req.usuarioId
  const { id } = req.params
  const { nome, saldo_atual, cor } = req.body

  const campos = {}

  if (nome !== undefined) {
    if (!nome.trim()) return res.status(400).json({ erro: 'Campo nome não pode ser vazio' })
    campos.nome = nome.trim()
  }
  if (saldo_atual !== undefined) {
    const saldo = Number(saldo_atual)
    if (!Number.isFinite(saldo)) {
      return res.status(400).json({ erro: 'Campo saldo_atual deve ser um número' })
    }
    campos.saldo_atual = saldo
    campos.atualizado_em = new Date().toISOString()
  }
  if (cor !== undefined) campos.cor = cor || null

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ erro: 'Nenhum campo para atualizar' })
  }

  const { data, error } = await supabase
    .from('contas_correntes')
    .update(campos)
    .eq('id', id)
    .eq('usuario_id', usuario_id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ erro: 'Falha ao atualizar conta', detalhe: error.message })
  }

  return res.json({ conta: data })
})

// DELETE /contas/:id — remove a conta
router.delete('/:id', async (req, res) => {
  const usuario_id = req.usuarioId
  const { id } = req.params

  const { error } = await supabase
    .from('contas_correntes')
    .delete()
    .eq('id', id)
    .eq('usuario_id', usuario_id)

  if (error) {
    return res.status(500).json({ erro: 'Falha ao excluir conta', detalhe: error.message })
  }

  return res.json({ mensagem: 'Conta excluída com sucesso' })
})

export default router
