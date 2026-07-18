// Calcula o vencimento da fatura (mes_referencia + dia_pagamento) para uma compra
// no cartão, a partir da data real da compra e do fechamento/vencimento do cartão.
//
// Regra padrão de fatura: compra antes do fechamento entra na fatura que fecha
// naquele mês (vence no mês seguinte); compra no dia do fechamento ou depois
// já não entra mais nessa fatura, e vence dois meses à frente.
export function calcularVencimentoCartao(dataCompraISO, diaFechamento, diaVencimento) {
  const [ano, mes, dia] = dataCompraISO.split('-').map(Number)
  const mesesAFrente = dia < diaFechamento ? 1 : 2
  const vencData = new Date(ano, mes - 1 + mesesAFrente, 1)
  const mes_referencia = `${vencData.getFullYear()}-${String(vencData.getMonth() + 1).padStart(2, '0')}-01`
  return { mes_referencia, dia_pagamento: diaVencimento }
}
