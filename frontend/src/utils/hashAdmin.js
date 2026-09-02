// Utilitário para verificação de administradores e geração de hash único por e-mail

const SALT_ADMIN = 'contas_claras_admin_secure_salt_v1_'

/**
 * Gera o hash único determinístico (128-bit / 32 hex chars) para o e-mail do administrador
 * @param {string} email
 * @returns {string}
 */
export function gerarHashAdmin(email) {
  if (!email || typeof email !== 'string') return ''
  const str = `${SALT_ADMIN}${email.trim().toLowerCase()}`

  let h1 = 0xdeadbeef ^ str.length
  let h2 = 0x41c64e6d ^ str.length
  let h3 = 0x811c9dc5 ^ str.length
  let h4 = 0x9e3779b9 ^ str.length

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
    h3 = Math.imul(h3 ^ ch, 3812004987)
    h4 = Math.imul(h4 ^ ch, 2246822519)
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909)
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909)
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0')
  return `${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}`
}

/**
 * Lista padrão de emails administradores configurados ou obtidos via env
 */
export function getAdminEmails() {
  let envAdmins = ''
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAILS) {
      envAdmins = import.meta.env.VITE_ADMIN_EMAILS
    } else if (typeof process !== 'undefined' && process.env?.VITE_ADMIN_EMAILS) {
      envAdmins = process.env.VITE_ADMIN_EMAILS
    }
  } catch {
    envAdmins = ''
  }
  const lista = envAdmins.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  // Administradores pré-configurados por padrão
  const defaults = [
    'gigiooliveira82@gmail.com',
    'tmarsiglia@gmail.com',
    'admin@contasclaras.app.br',
    'admin@email.com'
  ]
  return Array.from(new Set([...defaults, ...lista]))
}

/**
 * Verifica se um usuário / e-mail é administrador
 * @param {object|string} usuarioOuEmail
 * @returns {boolean}
 */
export function isUsuarioAdmin(usuarioOuEmail) {
  if (!usuarioOuEmail) return false

  // Se for objeto de usuário Supabase
  if (typeof usuarioOuEmail === 'object') {
    const email = usuarioOuEmail.email || ''
    if (usuarioOuEmail.app_metadata?.role === 'admin' || usuarioOuEmail.user_metadata?.is_admin === true) {
      return true
    }
    return isUsuarioAdmin(email)
  }

  const emailLimpo = String(usuarioOuEmail).trim().toLowerCase()
  if (!emailLimpo) return false

  const admins = getAdminEmails()
  return admins.includes(emailLimpo)
}
