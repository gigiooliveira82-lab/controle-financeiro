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

export default router
