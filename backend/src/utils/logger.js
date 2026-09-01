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
 * Grava uma linha de log no arquivo acessos.jsonl de forma assíncrona e ultrarrápida
 */
export async function gravarLogAcesso(req, user, acao = 'acesso_painel') {
  try {
    garantirDiretorioLogs()

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

// Inicia rotina periódica de limpeza de logs (a cada 24 horas)
const timerLimpeza = setInterval(() => {
  limparLogsAntigos(60)
}, 24 * 60 * 60 * 1000)

if (timerLimpeza?.unref) {
  timerLimpeza.unref()
}

// Executa na inicialização
limparLogsAntigos(60)

