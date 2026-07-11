import supabase from '../services/supabase.js'

export default async function autenticar(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação ausente' })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }

  req.usuarioId = user.id
  next()
}
