import { Router } from 'express'
import autenticar from '../middleware/autenticar.js'
import supabase from '../services/supabase.js'
import { isUsuarioAdmin, gerarHashAdmin } from '../utils/hashAdmin.js'
import { gravarLogAcesso, lerLogsPaginados } from '../utils/logger.js'

const router = Router()

// Middleware de verificação de permissão de administrador
async function verificarPermissaoAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ erro: 'Usuário não autenticado' })
    }

    if (!isUsuarioAdmin(user)) {
      return res.status(403).json({ erro: 'Acesso negado. Esta área é restrita a administradores.' })
    }

    req.adminUser = user
    next()
  } catch (err) {
    console.error('Erro na verificação de admin:', err)
    return res.status(500).json({ erro: 'Erro interno na verificação de permissão' })
  }
}

// POST /admin/logs/evento - Registra exclusivamente eventos de LOGIN e LOGOUT
router.post('/logs/evento', async (req, res) => {
  try {
    const { evento, email, usuarioId } = req.body

    if (evento !== 'login' && evento !== 'logout') {
      return res.status(400).json({ erro: 'Evento inválido. Apenas "login" e "logout" são registrados.' })
    }

    const emailAlvo = (email || 'anônimo').trim().toLowerCase()
    const acao = evento === 'login' ? 'login' : 'logout'

    await gravarLogAcesso(req, { id: usuarioId, email: emailAlvo }, acao)

    return res.json({ sucesso: true, evento: acao })
  } catch (err) {
    console.error('Erro ao registrar log de autenticação:', err)
    return res.status(500).json({ erro: 'Erro interno ao gravar log' })
  }
})

// GET /admin/verificar - Verifica se o usuário atual é admin e retorna seu hash
router.get('/verificar', autenticar, verificarPermissaoAdmin, async (req, res) => {
  const hash = gerarHashAdmin(req.adminUser.email)
  res.json({
    admin: true,
    email: req.adminUser.email,
    hash,
  })
})

// GET /admin/metricas - Retorna as estatísticas do painel administrativo
router.get('/metricas', autenticar, verificarPermissaoAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (error) {
      console.error('Erro ao listar usuários no Supabase:', error)
      return res.status(500).json({ erro: 'Erro ao buscar dados dos usuários' })
    }

    const users = data?.users || []
    const totalUsuarios = users.length

    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const mesAtual = hoje.getMonth()

    const novosUsuariosMes = users.filter(u => {
      if (!u.created_at) return false
      const dataCriacao = new Date(u.created_at)
      return (
        dataCriacao.getFullYear() === anoAtual &&
        dataCriacao.getMonth() === mesAtual
      )
    }).length

    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    const mesReferencia = `${nomesMeses[mesAtual]} de ${anoAtual}`

    return res.json({
      totalUsuarios,
      novosUsuariosMes,
      mesReferencia,
      atualizadoEm: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Erro ao processar métricas de admin:', err)
    return res.status(500).json({ erro: 'Erro interno ao processar métricas do painel' })
  }
})

// GET /admin/usuarios - Listagem paginada de usuários com campos Nome, Email, Telefone, Criação, Último Login e Admin
router.get('/usuarios', autenticar, verificarPermissaoAdmin, async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1
    const porPagina = parseInt(req.query.porPagina) || 10
    const busca = (req.query.busca || '').trim().toLowerCase()

    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (error) {
      console.error('Erro ao listar usuários:', error)
      return res.status(500).json({ erro: 'Erro ao listar usuários' })
    }

    let users = (data?.users || []).map(u => ({
      id: u.id,
      email: u.email,
      nome: u.user_metadata?.nome || u.user_metadata?.name || u.user_metadata?.full_name || '',
      telefone: u.phone || u.user_metadata?.telefone || u.user_metadata?.phone || '',
      criado_em: u.created_at,
      ultimo_acesso: u.last_sign_in_at,
      confirmado: Boolean(u.confirmed_at || u.email_confirmed_at),
      is_admin: isUsuarioAdmin(u),
    }))

    // Filtro por busca (nome ou email)
    if (busca) {
      users = users.filter(u =>
        u.email?.toLowerCase().includes(busca) ||
        u.nome?.toLowerCase().includes(busca)
      )
    }

    // Ordenação: mais recentes primeiro
    users.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))

    const total = users.length
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
    const inicio = (pagina - 1) * porPagina
    const usuariosPaginados = users.slice(inicio, inicio + porPagina)

    return res.json({
      usuarios: usuariosPaginados,
      total,
      pagina,
      porPagina,
      totalPaginas,
    })
  } catch (err) {
    console.error('Erro na listagem de usuários admin:', err)
    return res.status(500).json({ erro: 'Erro interno ao buscar lista de usuários' })
  }
})

// PUT /admin/usuarios/:id - Edição dos dados do usuário (Nome, Telefone e Senha opcional). E-mail NUNCA é alterado.
router.put('/usuarios/:id', autenticar, verificarPermissaoAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { nome, telefone, senha } = req.body

    // Busca usuário atual para preservar metadados existentes
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(id)
    if (getUserError || !userData?.user) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    const userAtual = userData.user
    const userMetadataAtual = userAtual.user_metadata || {}

    const updates = {
      user_metadata: {
        ...userMetadataAtual,
        nome: nome !== undefined ? String(nome).trim() : userMetadataAtual.nome || '',
        telefone: telefone !== undefined ? String(telefone).trim() : userMetadataAtual.telefone || '',
      },
    }

    // Atualiza senha apenas se foi preenchida
    if (senha && typeof senha === 'string' && senha.trim().length > 0) {
      if (senha.trim().length < 6) {
        return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' })
      }
      updates.password = senha.trim()
    }

    const { data, error } = await supabase.auth.admin.updateUserById(id, updates)

    if (error) {
      console.error('Erro ao atualizar usuário:', error)
      return res.status(400).json({ erro: error.message || 'Não foi possível atualizar o usuário' })
    }

    const u = data.user
    return res.json({
      sucesso: true,
      mensagem: 'Dados do usuário atualizados com sucesso',
      usuario: {
        id: u.id,
        email: u.email,
        nome: u.user_metadata?.nome || '',
        telefone: u.phone || u.user_metadata?.telefone || '',
        criado_em: u.created_at,
        ultimo_acesso: u.last_sign_in_at,
        is_admin: isUsuarioAdmin(u),
      },
    })
  } catch (err) {
    console.error('Erro ao editar usuário:', err)
    return res.status(500).json({ erro: 'Erro interno ao atualizar usuário' })
  }
})

// DELETE /admin/usuarios/:id - Exclusão de usuário
router.delete('/usuarios/:id', autenticar, verificarPermissaoAdmin, async (req, res) => {
  try {
    const { id } = req.params

    if (req.adminUser.id === id) {
      return res.status(400).json({ erro: 'Você não pode excluir sua própria conta de administrador em uso.' })
    }

    // Deleta os dados do usuário nas tabelas do sistema
    await Promise.allSettled([
      supabase.from('transacoes').delete().eq('usuario_id', id),
      supabase.from('cartoes').delete().eq('usuario_id', id),
      supabase.from('sonhos').delete().eq('usuario_id', id),
      supabase.from('contas_correntes').delete().eq('usuario_id', id),
    ])

    // Deleta o usuário no Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
      console.error('Erro ao excluir usuário no Supabase Auth:', error)
      return res.status(400).json({ erro: error.message || 'Não foi possível excluir o usuário' })
    }

    return res.json({
      sucesso: true,
      mensagem: 'Usuário excluído com sucesso',
    })
  } catch (err) {
    console.error('Erro ao excluir usuário:', err)
    return res.status(500).json({ erro: 'Erro interno ao excluir usuário' })
  }
})

// PUT /admin/usuarios/:id/role - Alternar permissão de administrador
router.put('/usuarios/:id/role', autenticar, verificarPermissaoAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { isAdmin } = req.body

    const role = isAdmin ? 'admin' : 'authenticated'

    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      app_metadata: { role },
      user_metadata: { is_admin: Boolean(isAdmin) },
    })

    if (error) {
      console.error('Erro ao alterar cargo do usuário:', error)
      return res.status(400).json({ erro: error.message || 'Erro ao alterar permissão' })
    }

    return res.json({
      sucesso: true,
      mensagem: isAdmin ? 'Usuário promovido a Administrador' : 'Permissão de Administrador revogada',
      usuario: {
        id: data.user.id,
        email: data.user.email,
        is_admin: Boolean(isAdmin),
      },
    })
  } catch (err) {
    console.error('Erro ao alterar role:', err)
    return res.status(500).json({ erro: 'Erro interno ao alterar permissões' })
  }
})

// GET /admin/logs - Listagem paginada de logs de acesso (apenas Login e Logout)
router.get('/logs', autenticar, verificarPermissaoAdmin, async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1
    const porPagina = parseInt(req.query.porPagina) || 15
    const busca = (req.query.busca || '').trim().toLowerCase()

    const resultado = await lerLogsPaginados({ pagina, porPagina, busca })

    return res.json(resultado)
  } catch (err) {
    console.error('Erro ao buscar logs:', err)
    return res.status(500).json({ erro: 'Erro interno ao buscar logs de acesso' })
  }
})

export default router
