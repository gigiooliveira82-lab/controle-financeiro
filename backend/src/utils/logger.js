import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Diretório e caminho do arquivo de logs
const LOGS_DIR = path.resolve(__dirname, '../../logs')
const LOGS_FILE = path.join(LOGS_DIR, 'acessos.jsonl')

// Garante que o diretório de logs exista
function garantirDiretorioLogs() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true })
  }
}

// Extrai IP e localização aproximada a partir da requisição
export function extrairIpELocal(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  let ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || '127.0.0.1'
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1'

  let localizacao = 'Brasil (IP Local)'
  if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    localizacao = 'São Paulo, BR (Ambiente Local)'
  } else {
    localizacao = 'Brasil'
  }

  return { ip, localizacao }
}

/**
 * Busca o último registro de autenticação (login ou logout) de um usuário específico
 */
export async function obterUltimoLogUsuario(email, usuarioId) {
  try {
    garantirDiretorioLogs()
    if (!fs.existsSync(LOGS_FILE)) return null

    const conteudo = await fs.promises.readFile(LOGS_FILE, 'utf8')
    const linhas = conteudo.split('\n').filter(Boolean)
    const emailAlvo = (email || '').trim().toLowerCase()
    const idAlvo = usuarioId ? String(usuarioId).trim() : ''

    for (let i = linhas.length - 1; i >= 0; i--) {
      try {
        const log = JSON.parse(linhas[i])
        if (log.acao !== 'login' && log.acao !== 'logout') continue

        const match =
          (idAlvo && log.usuario_id && String(log.usuario_id).trim() === idAlvo) ||
          (emailAlvo && log.email && log.email.trim().toLowerCase() === emailAlvo)

        if (match) {
          return log
        }
      } catch {
        // Ignora linhas corrompidas
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Grava uma linha de log no arquivo acessos.jsonl com validação estrita de alternância (Login -> Logout -> Login)
 */
export async function gravarLogAcesso(req, user, acao = 'acesso_painel') {
  try {
    garantirDiretorioLogs()

    // Regra estrita de integridade para autenticação: apenas 1 login por logout
    if (acao === 'login' || acao === 'logout') {
      const emailAlvo = (user?.email || '').trim().toLowerCase()
      const ultimoLog = await obterUltimoLogUsuario(emailAlvo, user?.id)

      // Se a última ação já foi a mesma (ex: 2 logins seguidos ou 2 logouts seguidos), ignora a duplicata
      if (ultimoLog && ultimoLog.acao === acao) {
        return { ignorado: true, motivo: `Evento duplicado "${acao}" ignorado para ${emailAlvo || 'usuário'}` }
      }

      // Se for logout mas não há nenhum login anterior, ignora logout órfão
      if (acao === 'logout' && (!ultimoLog || ultimoLog.acao !== 'login')) {
        return { ignorado: true, motivo: `Logout sem sessão aberta ignorado para ${emailAlvo || 'usuário'}` }
      }
    }

    const { ip, localizacao } = extrairIpELocal(req)
    const userAgent = (req.headers?.['user-agent'] || 'Desconhecido').slice(0, 255)

    const logEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      usuario_id: user?.id || null,
      email: user?.email || 'anônimo',
      ip,
      localizacao,
      user_agent: userAgent,
      acao,
      sucesso: true,
      criado_em: new Date().toISOString(),
    }

    const linha = JSON.stringify(logEntry) + '\n'
    await fs.promises.appendFile(LOGS_FILE, linha, 'utf8')
    return logEntry
  } catch (err) {
    console.error('Erro ao escrever log em arquivo:', err.message)
    return null
  }
}

/**
 * Lê e pagina os logs do arquivo acessos.jsonl (do mais recente para o mais antigo)
 */
export async function lerLogsPaginados({ pagina = 1, porPagina = 15, busca = '' }) {
  try {
    garantirDiretorioLogs()

    if (!fs.existsSync(LOGS_FILE)) {
      return {
        logs: [],
        total: 0,
        pagina,
        porPagina,
        totalPaginas: 1,
      }
    }

    const conteudo = await fs.promises.readFile(LOGS_FILE, 'utf8')
    const linhas = conteudo.split('\n').filter(Boolean)

    const logs = []
    const buscaLimpa = busca.trim().toLowerCase()

    // Itera das linhas mais recentes para as mais antigas (de trás para frente)
    for (let i = linhas.length - 1; i >= 0; i--) {
      try {
        const log = JSON.parse(linhas[i])
        if (buscaLimpa) {
          const match =
            log.email?.toLowerCase().includes(buscaLimpa) ||
            log.ip?.toLowerCase().includes(buscaLimpa) ||
            log.localizacao?.toLowerCase().includes(buscaLimpa) ||
            log.acao?.toLowerCase().includes(buscaLimpa)

          if (!match) continue
        }
        logs.push(log)
      } catch {
        // Ignora linhas corrompidas, se houver
      }
    }

    const total = logs.length
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
    const inicio = (pagina - 1) * porPagina
    const logsPaginados = logs.slice(inicio, inicio + porPagina)

    return {
      logs: logsPaginados,
      total,
      pagina,
      porPagina,
      totalPaginas,
    }
  } catch (err) {
    console.error('Erro ao ler logs do arquivo:', err.message)
    return {
      logs: [],
      total: 0,
      pagina,
      porPagina,
      totalPaginas: 1,
    }
  }
}

/**
 * Formata duração em segundos para string amigável (curta e extensa)
 */
function formatarDuracao(segundosTotais) {
  if (!segundosTotais || segundosTotais <= 0) {
    return {
      curto: '0 min',
      extenso: 'Nenhuma sessão finalizada',
    }
  }

  const horas = Math.floor(segundosTotais / 3600)
  const minutos = Math.floor((segundosTotais % 3600) / 60)
  const segundos = segundosTotais % 60

  if (horas > 0) {
    const curto = minutos > 0 ? `${horas}h ${minutos}m` : `${horas}h`
    const extenso = `${horas} hora${horas > 1 ? 's' : ''}${minutos > 0 ? ` e ${minutos} min` : ''}`
    return { curto, extenso }
  }

  if (minutos > 0) {
    const curto = segundos > 0 ? `${minutos}m ${segundos}s` : `${minutos} min`
    const extenso = `${minutos} min${minutos > 1 ? 's' : ''}${segundos > 0 ? ` e ${segundos}s` : ''}`
    return { curto, extenso }
  }

  return {
    curto: `${segundos}s`,
    extenso: `${segundos} segundo${segundos > 1 ? 's' : ''}`,
  }
}

/**
 * Calcula o tempo médio que os usuários permanecem no sistema com base nos logs de login e logout.
 */
export async function calcularTempoMedioSessao() {
  try {
    garantirDiretorioLogs()

    if (!fs.existsSync(LOGS_FILE)) {
      return {
        tempoMedioMs: 0,
        tempoMedioSegundos: 0,
        tempoFormatado: '0 min',
        tempoFormatadoExtenso: 'Nenhuma sessão registrada',
        totalSessoes: 0,
      }
    }

    const conteudo = await fs.promises.readFile(LOGS_FILE, 'utf8')
    const linhas = conteudo.split('\n').filter(Boolean)

    // Agrupa logs por usuário (chave: usuario_id || email)
    const logsPorUsuario = new Map()

    for (const linha of linhas) {
      try {
        const log = JSON.parse(linha)
        if (!log.acao || (log.acao !== 'login' && log.acao !== 'logout')) continue
        if (!log.criado_em) continue

        const chave = (log.usuario_id || log.email || 'anonimo').toLowerCase()
        if (!logsPorUsuario.has(chave)) {
          logsPorUsuario.set(chave, [])
        }
        logsPorUsuario.get(chave).push(log)
      } catch {
        // Ignora linhas corrompidas
      }
    }

    const MAX_DURACAO_MS = 24 * 60 * 60 * 1000 // Máximo 24h por sessão
    const duracoesSessaoMs = []

    for (const [, eventos] of logsPorUsuario.entries()) {
      // Ordena cronologicamente (mais antigo para mais recente)
      eventos.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())

      let ultimoLogin = null

      for (const ev of eventos) {
        if (ev.acao === 'login') {
          ultimoLogin = new Date(ev.criado_em).getTime()
        } else if (ev.acao === 'logout' && ultimoLogin !== null) {
          const timestampLogout = new Date(ev.criado_em).getTime()
          const duracao = timestampLogout - ultimoLogin
          if (duracao > 0 && duracao <= MAX_DURACAO_MS) {
            duracoesSessaoMs.push(duracao)
          }
          ultimoLogin = null // Reseta para a próxima sessão
        }
      }
    }

    const totalSessoes = duracoesSessaoMs.length
    const tempoTotalMs = duracoesSessaoMs.reduce((acc, curr) => acc + curr, 0)
    const tempoMedioMs = totalSessoes > 0 ? Math.round(tempoTotalMs / totalSessoes) : 0
    const tempoMedioSegundos = Math.round(tempoMedioMs / 1000)

    const formatado = formatarDuracao(tempoMedioSegundos)

    return {
      tempoMedioMs,
      tempoMedioSegundos,
      tempoFormatado: formatado.curto,
      tempoFormatadoExtenso: formatado.extenso,
      totalSessoes,
    }
  } catch (err) {
    console.error('Erro ao calcular tempo médio de sessão:', err.message)
    return {
      tempoMedioMs: 0,
      tempoMedioSegundos: 0,
      tempoFormatado: '0 min',
      tempoFormatadoExtenso: 'Erro no cálculo',
      totalSessoes: 0,
    }
  }
}

/**
 * Limpa registros com mais de X dias (padrão: 60 dias)
 */
export async function limparLogsAntigos(diasRetencao = 60) {
  try {
    garantirDiretorioLogs()

    if (!fs.existsSync(LOGS_FILE)) return

    const conteudo = await fs.promises.readFile(LOGS_FILE, 'utf8')
    const linhas = conteudo.split('\n').filter(Boolean)

    const limiteData = new Date()
    limiteData.setDate(limiteData.getDate() - diasRetencao)
    const limiteMs = limiteData.getTime()

    const linhasValidas = []
    let registrosRemovidos = 0

    for (const linha of linhas) {
      try {
        const log = JSON.parse(linha)
        const dataLog = new Date(log.criado_em).getTime()
        if (dataLog >= limiteMs) {
          linhasValidas.push(linha)
        } else {
          registrosRemovidos++
        }
      } catch {
        // Remove linhas corrompidas
      }
    }

    if (registrosRemovidos > 0) {
      const novoConteudo = linhasValidas.join('\n') + (linhasValidas.length > 0 ? '\n' : '')
      await fs.promises.writeFile(LOGS_FILE, novoConteudo, 'utf8')
      console.log(`[LOGS PURGE] ${registrosRemovidos} logs com mais de ${diasRetencao} dias foram removidos.`)
    }
  } catch (err) {
    console.error('Erro na rotação/limpeza de logs:', err.message)
  }
}

/**
 * Sanitiza o arquivo de logs garantindo estritamente a alternância 1 Login para 1 Logout por usuário
 */
export async function sanitizarHistoricoLogs() {
  try {
    garantirDiretorioLogs()
    if (!fs.existsSync(LOGS_FILE)) return

    const conteudo = await fs.promises.readFile(LOGS_FILE, 'utf8')
    const linhas = conteudo.split('\n').filter(Boolean)

    const logsValidos = []
    for (const linha of linhas) {
      try {
        const log = JSON.parse(linha)
        if (log.acao === 'login' || log.acao === 'logout') {
          logsValidos.push(log)
        }
      } catch {}
    }

    // Ordena cronologicamente
    logsValidos.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())

    const logsFiltradosPorUsuario = new Map()

    for (const log of logsValidos) {
      const chave = (log.usuario_id || log.email || 'anonimo').toLowerCase().trim()
      if (!logsFiltradosPorUsuario.has(chave)) {
        logsFiltradosPorUsuario.set(chave, [])
      }
      const lista = logsFiltradosPorUsuario.get(chave)
      const ultimo = lista.length > 0 ? lista[lista.length - 1] : null

      if (log.acao === 'login') {
        if (!ultimo || ultimo.acao === 'logout') {
          lista.push(log)
        }
      } else if (log.acao === 'logout') {
        if (ultimo && ultimo.acao === 'login') {
          lista.push(log)
        }
      }
    }

    // Junta todos os logs sanitizados de todos os usuários ordenados por data
    const todosLogsSanitizados = []
    for (const [, lista] of logsFiltradosPorUsuario.entries()) {
      todosLogsSanitizados.push(...lista)
    }

    todosLogsSanitizados.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())

    const novoConteudo = todosLogsSanitizados.map(l => JSON.stringify(l)).join('\n') + (todosLogsSanitizados.length > 0 ? '\n' : '')
    await fs.promises.writeFile(LOGS_FILE, novoConteudo, 'utf8')
  } catch (err) {
    console.error('Erro ao sanitizar histórico de logs:', err.message)
  }
}

// Inicia rotina periódica de limpeza de logs (a cada 24 horas)
const timerLimpeza = setInterval(() => {
  limparLogsAntigos(60)
}, 24 * 60 * 60 * 1000)

if (timerLimpeza?.unref) {
  timerLimpeza.unref()
}

// Executa na inicialização
limparLogsAntigos(60)
sanitizarHistoricoLogs()

