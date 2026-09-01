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
 * Lista de emails administradores configurados
 */
export function getAdminEmails() {
  const envAdmins = process.env.ADMIN_EMAILS || ''
  const lista = envAdmins.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
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
 * @param {object|string} userOuEmail
 * @returns {boolean}
 */
export function isUsuarioAdmin(userOuEmail) {
  if (!userOuEmail) return false

  if (typeof userOuEmail === 'object') {
    const email = userOuEmail.email || ''
    if (userOuEmail.app_metadata?.role === 'admin' || userOuEmail.user_metadata?.is_admin === true) {
      return true
    }
    return isUsuarioAdmin(email)
  }

  const emailLimpo = String(userOuEmail).trim().toLowerCase()
  if (!emailLimpo) return false

  const admins = getAdminEmails()
  return admins.includes(emailLimpo)
}
