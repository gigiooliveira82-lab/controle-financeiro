/**
 * Utilitários de data com garantia de fuso horário de Brasília (America/Sao_Paulo).
 * Garante que mesmo que o servidor (ex: Digital Ocean) esteja em UTC ou fuso americano,
 * as datas e cálculos do usuário no Brasil sejam sempre precisos.
 */

export function obterDataBrasil(dataReferenciaISO = null) {
  if (dataReferenciaISO && /^\d{4}-\d{2}-\d{2}$/.test(dataReferenciaISO)) {
    const [anoStr, mesStr, diaStr] = dataReferenciaISO.split('-')
    const ano = parseInt(anoStr, 10)
    const mes = parseInt(mesStr, 10)
    const dia = parseInt(diaStr, 10)
    return {
      ano,
      mes,
      dia,
      mesISO: `${anoStr}-${mesStr}-01`,
      dataFormatada: `${diaStr}/${mesStr}/${anoStr}`,
      dataISO: dataReferenciaISO,
    }
  }

  const agora = new Date()
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora)

  const dia = partes.find((p) => p.type === 'day')?.value || '01'
  const mes = partes.find((p) => p.type === 'month')?.value || '01'
  const ano = partes.find((p) => p.type === 'year')?.value || '2026'

  return {
    ano: parseInt(ano, 10),
    mes: parseInt(mes, 10),
    dia: parseInt(dia, 10),
    mesISO: `${ano}-${mes}-01`,
    dataFormatada: `${dia}/${mes}/${ano}`,
    dataISO: `${ano}-${mes}-${dia}`,
  }
}
