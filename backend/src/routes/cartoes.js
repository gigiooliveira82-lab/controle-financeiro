import { Router } from 'express'
import supabase from '../services/supabase.js'
import autenticar from '../middleware/autenticar.js'

const router = Router()

router.use(autenticar)

// GET /cartoes/:usuario_id — lista cartões cadastrados
router.get('/:usuario_id', async (req, res) => {
  const usuario_id = req.usuarioId

  const { data, error } = await supabase
    .from('cartoes')
    .select('*')
    .eq('usuario_id', usuario_id)
    .order('criado_em', { ascending: true })

  if (error) {
    return res.status(500).json({ erro: 'Falha ao buscar cartões', detalhe: error.message })
  }

  return res.json({ cartoes: data })
})

// POST /cartoes — cria um novo cartão
router.post('/', async (req, res) => {
  const usuario_id = req.usuarioId
  const { nome, dia_fechamento, dia_vencimento, cor } = req.body

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Campo obrigatório: nome' })
  }

  const fechamento = Number(dia_fechamento)
  const vencimento = Number(dia_vencimento)

  if (!Number.isInteger(fechamento) || fechamento < 1 || fechamento > 31) {
    return res.status(400).json({ erro: 'Campo dia_fechamento deve ser um número entre 1 e 31' })
  }
  if (!Number.isInteger(vencimento) || vencimento < 1 || vencimento > 31) {
    return res.status(400).json({ erro: 'Campo dia_vencimento deve ser um número entre 1 e 31' })
  }

  const { data, error } = await supabase
    .from('cartoes')
    .insert({
      usuario_id,
      nome: nome.trim(),
      dia_fechamento: fechamento,
      dia_vencimento: vencimento,
      cor: cor || null,
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ erro: 'Falha ao criar cartão', detalhe: error.message })
  }

  return res.status(201).json({ cartao: data })
})

// GET /cartoes/:id/compras/contagem — total de compras vinculadas ao cartão (todos os meses)
router.get('/:id/compras/contagem', async (req, res) => {
  const usuario_id = req.usuarioId
  const { id } = req.params

  const { count, error } = await supabase
    .from('transacoes')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuario_id)
    .eq('cartao_id', id)

  if (error) {
    return res.status(500).json({ erro: 'Falha ao contar compras do cartão', detalhe: error.message })
  }

  return res.json({ total: count })
})

// PUT /cartoes/:id — atualiza um cartão existente
router.put('/:id', async (req, res) => {
  const usuario_id = req.usuarioId
  const { id } = req.params
  const { nome, dia_fechamento, dia_vencimento, cor } = req.body

  const campos = {}

  if (nome !== undefined) {
    if (!nome.trim()) return res.status(400).json({ erro: 'Campo nome não pode ser vazio' })
    campos.nome = nome.trim()
  }
  if (dia_fechamento !== undefined) {
    const fechamento = Number(dia_fechamento)
    if (!Number.isInteger(fechamento) || fechamento < 1 || fechamento > 31) {
      return res.status(400).json({ erro: 'Campo dia_fechamento deve ser um número entre 1 e 31' })
    }
    campos.dia_fechamento = fechamento
  }
  if (dia_vencimento !== undefined) {
    const vencimento = Number(dia_vencimento)
    if (!Number.isInteger(vencimento) || vencimento < 1 || vencimento > 31) {
      return res.status(400).json({ erro: 'Campo dia_vencimento deve ser um número entre 1 e 31' })
    }
    campos.dia_vencimento = vencimento
  }
  if (cor !== undefined) campos.cor = cor || null

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ erro: 'Nenhum campo para atualizar' })
  }

  const { data, error } = await supabase
    .from('cartoes')
    .update(campos)
    .eq('id', id)
    .eq('usuario_id', usuario_id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ erro: 'Falha ao atualizar cartão', detalhe: error.message })
  }

  return res.json({ cartao: data })
})

// DELETE /cartoes/:id — remove o cartão (compras vinculadas ficam com cartao_id nulo,
// via ON DELETE SET NULL da FK — nenhuma despesa é apagada)
router.delete('/:id', async (req, res) => {
  const usuario_id = req.usuarioId
  const { id } = req.params

  const { error } = await supabase
    .from('cartoes')
    .delete()
    .eq('id', id)
    .eq('usuario_id', usuario_id)

  if (error) {
    return res.status(500).json({ erro: 'Falha ao excluir cartão', detalhe: error.message })
  }

  return res.json({ mensagem: 'Cartão excluído com sucesso' })
})

export default router
