import { Router } from 'express'
import { randomUUID } from 'crypto'
import { interpretarLancamento } from '../services/ia.js'
import { gerarAnalise } from '../services/analise.js'
import { responderPergunta } from '../services/pergunta.js'
import supabase from '../services/supabase.js'

const router = Router()

// POST /transacoes/analise-mes/:usuario_id — análise inteligente do mês via IA
router.post('/analise-mes/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params
  const { mes_referencia } = req.body

  if (!mes_referencia) {
    return res.status(400).json({ erro: 'Campo obrigatório: mes_referencia' })
  }

  const { data: transacoes, error } = await supabase
    .from('transacoes')
    .select('*')
    .eq('usuario_id', usuario_id)
    .eq('mes_referencia', mes_referencia)

  if (error) {
    return res.status(500).json({ erro: 'Falha ao buscar transações', detalhe: error.message })
  }

  if (!transacoes.length) {
    return res.status(422).json({ erro: 'Nenhum lançamento encontrado neste mês para análise' })
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const soma  = (arr) => arr.reduce((s, t) => s + Number(t.valor), 0)
  const arred = (v)   => Math.round(v * 100) / 100

  // ── Contexto temporal ────────────────────────────────────────────────────
  const hoje       = new Date()
  const diaAtual   = hoje.getDate()
  const mesHojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const ehAtual    = mes_referencia === mesHojeISO
  const ehPassado  = mes_referencia < mesHojeISO

  // ── Separação por tipo ───────────────────────────────────────────────────
  const creditos  = transacoes.filter(t => t.tipo === 'credito')
  const fixas     = transacoes.filter(t => t.tipo === 'despesa_fixa')
  const variaveis = transacoes.filter(t => t.tipo === 'despesa_variavel')

  const cPago = soma(creditos.filter(t => t.status === 'pago'))
  const cPend = soma(creditos.filter(t => t.status === 'pendente'))
  const fPago = soma(fixas.filter(t => t.status === 'pago'))
  const fPend = soma(fixas.filter(t => t.status === 'pendente'))
  const vPago = soma(variaveis.filter(t => t.status === 'pago'))
  const vPend = soma(variaveis.filter(t => t.status === 'pendente'))

  const saldoReal      = arred(cPago - fPago - vPago)
  const saldoProjetado = arred((cPago + cPend) - (fPago + fPend + vPago + vPend))

  // ── Dependência de créditos pendentes ────────────────────────────────────
  const totalCreditos  = cPago + cPend
  const dependenciaPct = totalCreditos > 0
    ? Math.round((cPend / totalCreditos) * 100)
    : 0

  // ── Categorias de despesas ────────────────────────────────────────────────
  const porCategoria = {}
  ;[...fixas, ...variaveis].forEach(t => {
    const c = t.categoria || 'outros'
    porCategoria[c] = arred((porCategoria[c] || 0) + Number(t.valor))
  })

  // ── Top 3 maiores despesas individuais ───────────────────────────────────
  const top3 = [...fixas, ...variaveis]
    .sort((a, b) => Number(b.valor) - Number(a.valor))
    .slice(0, 3)
    .map(t => ({
      descricao: t.descricao,
      categoria: t.categoria,
      valor: arred(Number(t.valor)),
      status: t.status,
    }))

  // ── Contas vencidas (pendentes com dia de pagamento já passado) ───────────
  const contas_vencidas = [...fixas, ...variaveis]
    .filter(t => {
      if (t.status !== 'pendente') return false
      if (!ehAtual && !ehPassado) return false   // mês futuro: nada vencido
      if (ehPassado) return true                  // mês passado: tudo pendente é vencido
      return t.dia_pagamento < diaAtual           // mês atual: só os que já passaram
    })
    .map(t => ({
      descricao: t.descricao,
      valor: arred(Number(t.valor)),
      dia_vencimento: t.dia_pagamento,
    }))

  // ── Créditos pendentes ───────────────────────────────────────────────────
  const creditos_pendentes = creditos
    .filter(t => t.status === 'pendente')
    .map(t => ({
      descricao: t.descricao,
      valor: arred(Number(t.valor)),
      dia_esperado: t.dia_pagamento,
    }))

  // ── Formatação do mês para o prompt ─────────────────────────────────────
  const [anoStr, mesStr] = mes_referencia.split('-')
  const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const mesFormatado = `${nomesMes[parseInt(mesStr) - 1]} ${anoStr}`

  // ── Resumo estruturado enviado à IA ─────────────────────────────────────
  const dados = {
    contexto: ehAtual
      ? `Mês em andamento (hoje é dia ${diaAtual})`
      : ehPassado
        ? 'Mês já encerrado'
        : 'Mês futuro (planejamento)',

    saldo_real:      saldoReal,
    saldo_projetado: saldoProjetado,

    creditos: {
      recebidos:      arred(cPago),
      a_receber:      arred(cPend),
      dependencia_pct: dependenciaPct,
      itens_pendentes: creditos_pendentes,
    },

    despesas: {
      fixas_total:      arred(fPago + fPend),
      variaveis_total:  arred(vPago + vPend),
      total_pago:       arred(fPago + vPago),
      total_pendente:   arred(fPend + vPend),
      por_categoria:    porCategoria,
      top3_maiores:     top3,
      contas_vencidas:  contas_vencidas,
    },
  }

  try {
    const analise = await gerarAnalise(dados, mesFormatado)
    return res.json({ analise })
  } catch (err) {
    console.error('Erro na análise IA:', err.message)
    return res.status(502).json({ erro: 'Falha ao gerar análise com IA', detalhe: err.message })
  }
})

// POST /transacoes/pergunta/:usuario_id — responde perguntas em linguagem natural sobre os dados do usuário
router.post('/pergunta/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params
  const { pergunta } = req.body

  if (!pergunta || !pergunta.trim()) {
    return res.status(400).json({ erro: 'Campo obrigatório: pergunta' })
  }

  // ── Período: últimos 12 meses incluindo o mês atual ───────────────────────
  const hoje        = new Date()
  const mesAtualISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const d12         = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1)
  const mesLimite   = `${d12.getFullYear()}-${String(d12.getMonth() + 1).padStart(2, '0')}-01`

  // ── Busca transações dos últimos 12 meses (somente do usuario_id) ─────────
  const { data: transacoes, error: errTx } = await supabase
    .from('transacoes')
    .select('tipo, valor, status, categoria, subcategoria, mes_referencia')
    .eq('usuario_id', usuario_id)
    .gte('mes_referencia', mesLimite)
    .order('mes_referencia', { ascending: true })

  if (errTx) {
    return res.status(500).json({ erro: 'Falha ao buscar dados', detalhe: errTx.message })
  }

  // ── Busca todas aplicações (sem limite de data) para patrimônio acumulado ──
  const { data: todasAplic, error: errAplic } = await supabase
    .from('transacoes')
    .select('descricao, valor')
    .eq('usuario_id', usuario_id)
    .eq('tipo', 'aplicacao')
    .lte('mes_referencia', mesAtualISO)

  if (errAplic) {
    return res.status(500).json({ erro: 'Falha ao buscar patrimônio', detalhe: errAplic.message })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const soma    = (arr) => arr.reduce((s, t) => s + Number(t.valor), 0)
  const arred   = (v)   => Math.round(v * 100) / 100
  const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const nomeMesISO = (iso) => {
    const [ano, mes] = iso.split('-')
    return `${nomesMes[parseInt(mes) - 1]} ${ano}`
  }

  // ── Histórico mensal: backend faz todos os cálculos ───────────────────────
  const porMes = {}
  transacoes.forEach(t => {
    if (!porMes[t.mes_referencia]) porMes[t.mes_referencia] = []
    porMes[t.mes_referencia].push(t)
  })

  const historicoMensal = Object.entries(porMes).map(([mesISO, itens]) => {
    const creditos = itens.filter(t => t.tipo === 'credito')
    const despesas = itens.filter(t => t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel')

    const cPago = soma(creditos.filter(t => t.status === 'pago'))
    const cPend = soma(creditos.filter(t => t.status === 'pendente'))
    const dPago = soma(despesas.filter(t => t.status === 'pago'))
    const dPend = soma(despesas.filter(t => t.status === 'pendente'))

    const porCategoria = {}
    despesas.forEach(t => {
      const c = t.categoria || 'outros'
      if (!porCategoria[c]) porCategoria[c] = { total: 0 }
      porCategoria[c].total = arred(porCategoria[c].total + Number(t.valor))
      if (t.subcategoria) {
        porCategoria[c][t.subcategoria] = arred((porCategoria[c][t.subcategoria] || 0) + Number(t.valor))
      }
    })

    return {
      mes: nomeMesISO(mesISO),
      creditos_recebidos: arred(cPago),
      creditos_pendentes: arred(cPend),
      despesas_pagas:     arred(dPago),
      despesas_pendentes: arred(dPend),
      total_despesas:     arred(dPago + dPend),
      saldo_real:         arred(cPago - dPago),
      saldo_projetado:    arred((cPago + cPend) - (dPago + dPend)),
      por_categoria:      porCategoria,
    }
  })

  // ── Patrimônio de aplicações agrupado por ativo ───────────────────────────
  const normalizar   = (s) => s.toLowerCase().trim().replace(/\s+/g, ' ')
  const gruposAplic  = {}
  todasAplic.forEach(t => {
    const chave = normalizar(t.descricao)
    if (!gruposAplic[chave]) gruposAplic[chave] = { ativo: t.descricao, saldo: 0 }
    gruposAplic[chave].saldo += Number(t.valor)
  })
  const patrimonioItens = Object.values(gruposAplic)
    .map(g => ({ ativo: g.ativo, saldo: arred(g.saldo) }))
    .filter(g => g.saldo !== 0)
    .sort((a, b) => b.saldo - a.saldo)
  const patrimonioTotal = arred(patrimonioItens.reduce((s, p) => s + p.saldo, 0))

  // ── Parcelamentos ativos (grupos com parcelas pendentes) ─────────────────
  const { data: todasParcelas } = await supabase
    .from('transacoes')
    .select('grupo_parcela_id, descricao, parcela_atual, total_parcelas, valor, status')
    .eq('usuario_id', usuario_id)
    .not('grupo_parcela_id', 'is', null)

  const gruposParc = {}
  ;(todasParcelas || []).forEach(p => {
    const g = p.grupo_parcela_id
    if (!gruposParc[g]) gruposParc[g] = { descricao: p.descricao, total_parcelas: p.total_parcelas, valor_parcela: Number(p.valor), parcelas: [] }
    gruposParc[g].parcelas.push(p)
  })

  const parcelamentosAtivos = Object.values(gruposParc)
    .map(g => {
      const pendentes  = g.parcelas.filter(p => p.status === 'pendente')
      const pagas      = g.parcelas.filter(p => p.status === 'pago')
      const ultimaPaga = pagas.length ? Math.max(...pagas.map(p => p.parcela_atual || 0)) : 0
      return {
        descricao:            g.descricao,
        ultima_parcela_paga:  ultimaPaga,
        total_parcelas:       g.total_parcelas,
        valor_parcela:        g.valor_parcela,
        parcelas_restantes:   pendentes.length,
        valor_total_restante: arred(pendentes.reduce((s, p) => s + Number(p.valor), 0)),
      }
    })
    .filter(g => g.parcelas_restantes > 0)

  // ── Contexto enxuto enviado à IA (apenas resultados calculados) ───────────
  const contexto = {
    mes_atual:         nomeMesISO(mesAtualISO),
    periodo_analisado: `${nomeMesISO(mesLimite)} a ${nomeMesISO(mesAtualISO)}`,
    historico_mensal:  historicoMensal,
    patrimonio_investimentos: {
      total:    patrimonioTotal,
      por_ativo: patrimonioItens,
    },
    parcelamentos_ativos: parcelamentosAtivos,
  }

  try {
    const resposta = await responderPergunta(contexto, pergunta.trim())
    return res.json({ resposta })
  } catch (err) {
    console.error('Erro na pergunta IA:', err.message)
    return res.status(502).json({ erro: 'Falha ao processar a pergunta com IA', detalhe: err.message })
  }
})

// GET /transacoes/acumulados-aplicacao/:usuario_id — patrimônio acumulado até hoje por aplicação
router.get('/acumulados-aplicacao/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params

  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('transacoes')
    .select('descricao, valor, criado_em')
    .eq('usuario_id', usuario_id)
    .eq('tipo', 'aplicacao')
    .lte('mes_referencia', mesAtual)
    .order('criado_em', { ascending: true })

  if (error) {
    return res.status(500).json({ erro: 'Falha ao buscar acumulados', detalhe: error.message })
  }

  const normalizar = (s) => s.toLowerCase().trim().replace(/\s+/g, ' ')

  // Agrupa por chave normalizada; label = descrição da primeira ocorrência (original do usuário)
  const grupos = {}
  data.forEach((t) => {
    const chave = normalizar(t.descricao)
    if (!grupos[chave]) {
      grupos[chave] = { total: 0, label: t.descricao }
    }
    grupos[chave].total += Number(t.valor)
  })

  return res.json({ acumulados: grupos })
})

// POST /transacoes/gerar-recorrentes — copia recorrentes do mês anterior para o mês atual
router.post('/gerar-recorrentes', async (req, res) => {
  const { usuario_id, mes_referencia } = req.body

  if (!usuario_id || !mes_referencia) {
    return res.status(400).json({ erro: 'Campos obrigatórios: usuario_id, mes_referencia' })
  }

  const [ano, mes] = mes_referencia.split('-').map(Number)
  const dataMesAnterior = new Date(ano, mes - 2, 1)
  const mesAnterior = `${dataMesAnterior.getFullYear()}-${String(dataMesAnterior.getMonth() + 1).padStart(2, '0')}-01`

  const { data: recorrentes, error: erroBusca } = await supabase
    .from('transacoes')
    .select('*')
    .eq('usuario_id', usuario_id)
    .eq('mes_referencia', mesAnterior)
    .eq('recorrente', true)

  if (erroBusca) {
    return res.status(500).json({ erro: 'Falha ao buscar recorrentes', detalhe: erroBusca.message })
  }

  if (!recorrentes.length) return res.json({ geradas: [] })

  const { data: jaExistem } = await supabase
    .from('transacoes')
    .select('descricao')
    .eq('usuario_id', usuario_id)
    .eq('mes_referencia', mes_referencia)

  const descricoesExistentes = new Set((jaExistem || []).map((t) => t.descricao))

  const novas = recorrentes
    .filter((t) => !descricoesExistentes.has(t.descricao))
    .map(({ id: _id, criado_em: _c, ...resto }) => ({
      ...resto,
      mes_referencia,
      status: 'pendente',
    }))

  if (!novas.length) return res.json({ geradas: [] })

  const { data: inseridas, error: erroInsert } = await supabase
    .from('transacoes')
    .insert(novas)
    .select()

  if (erroInsert) {
    return res.status(500).json({ erro: 'Falha ao gerar recorrentes', detalhe: erroInsert.message })
  }

  return res.json({ geradas: inseridas })
})

// POST /transacoes/lancar — recebe texto livre, IA categoriza e salva
router.post('/lancar', async (req, res) => {
  const { texto, usuario_id } = req.body

  if (!texto || !usuario_id) {
    return res.status(400).json({ erro: 'Campos obrigatórios: texto, usuario_id' })
  }

  let dadosIA
  try {
    dadosIA = await interpretarLancamento(texto, usuario_id)
  } catch (err) {
    console.error('Erro na IA:', err.message)
    return res.status(502).json({ erro: 'Falha ao interpretar o lançamento com IA', detalhe: err.message })
  }

  const TIPOS_VALIDOS = ['despesa_fixa', 'despesa_variavel', 'credito', 'aplicacao']
  if (!TIPOS_VALIDOS.includes(dadosIA.tipo)) {
    console.warn('IA retornou tipo inválido:', dadosIA.tipo, '| texto:', texto)
    return res.status(422).json({
      erro: 'Não consegui identificar o tipo do lançamento. Tente ser mais específico (ex: "gastei", "recebi", "paguei", "investi").',
    })
  }

  if (isNaN(dadosIA.valor) || dadosIA.valor === 0) {
    return res.status(422).json({
      erro: 'Não encontrei um valor numérico no texto. Informe o valor explicitamente (ex: "gastei 80 reais no mercado").',
    })
  }

  if (dadosIA.tipo !== 'aplicacao' && dadosIA.valor < 0) {
    return res.status(422).json({
      erro: 'Apenas lançamentos do tipo aplicação aceitam valor negativo (para resgates). Para despesas e créditos, use valores positivos.',
    })
  }

  // ── Parcelamento: gera todas as parcelas em lote ──────────────────────────
  if (dadosIA.total_parcelas && dadosIA.total_parcelas > 1) {
    const grupoId  = randomUUID()
    const hoje     = new Date()
    const parcelas = []

    for (let i = 1; i <= dadosIA.total_parcelas; i++) {
      const diffMeses = i - dadosIA.parcela_inicial
      const mesData   = new Date(hoje.getFullYear(), hoje.getMonth() + diffMeses, 1)
      const mesRef    = `${mesData.getFullYear()}-${String(mesData.getMonth() + 1).padStart(2, '0')}-01`

      // Parcelas anteriores à inicial: já ocorreram → pago
      // Parcela inicial: segue o que a IA detectou no texto
      // Parcelas posteriores: ainda não ocorreram → pendente
      const statusParcela = i < dadosIA.parcela_inicial
        ? 'pago'
        : i === dadosIA.parcela_inicial
          ? dadosIA.status
          : 'pendente'

      parcelas.push({
        usuario_id:       dadosIA.usuario_id,
        descricao:        dadosIA.descricao,
        tipo:             dadosIA.tipo,
        categoria:        dadosIA.categoria,
        subcategoria:     dadosIA.subcategoria || null,
        valor:            dadosIA.valor,
        dia_pagamento:    dadosIA.dia_pagamento,
        mes_referencia:   mesRef,
        status:           statusParcela,
        recorrente:       false,  // parcelamento nunca é recorrente
        parcela_atual:    i,
        total_parcelas:   dadosIA.total_parcelas,
        grupo_parcela_id: grupoId,
        texto_original:   i === dadosIA.parcela_inicial ? dadosIA.texto_original : null,
      })
    }

    const { data: inseridas, error: erroInsert } = await supabase
      .from('transacoes')
      .insert(parcelas)
      .select()

    if (erroInsert) {
      console.error('Erro ao inserir parcelas:', erroInsert.message)
      return res.status(500).json({ erro: 'Falha ao salvar parcelas no banco de dados', detalhe: erroInsert.message })
    }

    const mesAtualISO    = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
    const parcelaVisivel = inseridas.find(p => p.mes_referencia === mesAtualISO)
      || inseridas[dadosIA.parcela_inicial - 1]
      || inseridas[0]

    return res.status(201).json({
      transacao:     parcelaVisivel,
      interpretado:  { ...dadosIA, parcela_atual: dadosIA.parcela_inicial },
      parcelado:     true,
      total_geradas: inseridas.length,
    })
  }

  // ── Lançamento simples (sem parcelas) ─────────────────────────────────────
  // Extrai campos exclusivos de parcelamento para não enviar null ao Supabase
  // caso a migration ainda não tenha sido executada
  const { total_parcelas: _tp, parcela_inicial: _pi, ...dadosSimples } = dadosIA
  const { data, error } = await supabase
    .from('transacoes')
    .insert([dadosSimples])
    .select()
    .single()

  if (error) {
    console.error('Erro no Supabase:', error.message)
    return res.status(500).json({ erro: 'Falha ao salvar no banco de dados', detalhe: error.message })
  }

  return res.status(201).json({ transacao: data, interpretado: dadosIA })
})

// POST /transacoes/duplicar — cria cópia de uma transação com status pendente
router.post('/duplicar', async (req, res) => {
  const { transacao_id, usuario_id } = req.body

  if (!transacao_id || !usuario_id) {
    return res.status(400).json({ erro: 'Campos obrigatórios: transacao_id, usuario_id' })
  }

  const { data: original, error: erroBusca } = await supabase
    .from('transacoes')
    .select('*')
    .eq('id', transacao_id)
    .eq('usuario_id', usuario_id)
    .single()

  if (erroBusca || !original) {
    return res.status(404).json({ erro: 'Transação não encontrada' })
  }

  const { id: _id, criado_em: _c, ...resto } = original

  const { data: nova, error: erroInsert } = await supabase
    .from('transacoes')
    .insert({ ...resto, status: 'pendente' })
    .select()
    .single()

  if (erroInsert) {
    return res.status(500).json({ erro: 'Falha ao duplicar transação', detalhe: erroInsert.message })
  }

  return res.status(201).json({ transacao: nova })
})

// DELETE /transacoes/parcelas/grupo/:grupo_parcela_id/:usuario_id — cancela parcelas futuras de um grupo
router.delete('/parcelas/grupo/:grupo_parcela_id/:usuario_id', async (req, res) => {
  const { grupo_parcela_id, usuario_id } = req.params

  if (!grupo_parcela_id || !usuario_id) {
    return res.status(400).json({ erro: 'Parâmetros obrigatórios: grupo_parcela_id, usuario_id' })
  }

  const hoje        = new Date()
  const mesAtualISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

  // Exclui apenas parcelas de meses FUTUROS (não toca no mês atual ou passados)
  const { error } = await supabase
    .from('transacoes')
    .delete()
    .eq('grupo_parcela_id', grupo_parcela_id)
    .eq('usuario_id', usuario_id)
    .gt('mes_referencia', mesAtualISO)

  if (error) {
    return res.status(500).json({ erro: 'Falha ao cancelar parcelas', detalhe: error.message })
  }

  return res.json({ mensagem: 'Parcelas futuras canceladas com sucesso' })
})

// GET /transacoes/:usuario_id — lista transações do mês atual
router.get('/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params
  const { mes } = req.query

  const hoje = new Date()
  const mesRef = mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('transacoes')
    .select('*')
    .eq('usuario_id', usuario_id)
    .eq('mes_referencia', mesRef)
    .order('criado_em', { ascending: false })

  if (error) {
    return res.status(500).json({ erro: 'Falha ao buscar transações', detalhe: error.message })
  }

  return res.json({ transacoes: data })
})

// PUT /transacoes/:id — atualiza campos de uma transação
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { usuario_id, valor, status, recorrente, descricao, categoria, dia_pagamento, subcategoria } = req.body

  if (!usuario_id) {
    return res.status(400).json({ erro: 'Campo obrigatório: usuario_id' })
  }

  const campos = {}
  if (valor         !== undefined) campos.valor         = Number(valor)
  if (status        !== undefined) campos.status        = status
  if (recorrente    !== undefined) campos.recorrente    = recorrente
  if (descricao     !== undefined) campos.descricao     = descricao.trim()
  if (categoria     !== undefined) campos.categoria     = categoria.trim().toLowerCase()
  if (dia_pagamento !== undefined) campos.dia_pagamento = Number(dia_pagamento)
  if (subcategoria  !== undefined) campos.subcategoria  = subcategoria ? subcategoria.trim().toLowerCase() : null

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ erro: 'Nenhum campo para atualizar' })
  }

  const { data, error } = await supabase
    .from('transacoes')
    .update(campos)
    .eq('id', id)
    .eq('usuario_id', usuario_id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ erro: 'Falha ao atualizar transação', detalhe: error.message })
  }

  return res.json({ transacao: data })
})

// DELETE /transacoes/:id — remove uma transação
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const { usuario_id } = req.body

  if (!usuario_id) {
    return res.status(400).json({ erro: 'Campo obrigatório: usuario_id' })
  }

  const { error } = await supabase
    .from('transacoes')
    .delete()
    .eq('id', id)
    .eq('usuario_id', usuario_id)

  if (error) {
    return res.status(500).json({ erro: 'Falha ao remover transação', detalhe: error.message })
  }

  return res.json({ mensagem: 'Transação removida com sucesso' })
})

export default router
