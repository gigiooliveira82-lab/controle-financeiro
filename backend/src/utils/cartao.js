// Calcula o vencimento da fatura (mes_referencia + dia_pagamento) para uma compra
// no cartão, a partir da data real da compra e do fechamento/vencimento do cartão.
//
// Regra de fatura de cartão:
// 1. Caso comum: diaVencimento > diaFechamento (ex: fecha dia 18 e vence dia 25 do mesmo mês):
//    - Compras antes do fechamento (dia < diaFechamento): entram na fatura do mesmo mês da compra (mesesAFrente = 0).
//    - Compras a partir do fechamento (dia >= diaFechamento): entram na fatura que vence no mês seguinte (mesesAFrente = 1).
//
// 2. Caso de virada de mês: diaVencimento <= diaFechamento (ex: fecha dia 28 e vence dia 5 do mês seguinte):
//    - Compras antes do fechamento (dia < diaFechamento): vencem no mês seguinte (mesesAFrente = 1).
//    - Compras a partir do fechamento (dia >= diaFechamento): vencem dois meses à frente (mesesAFrente = 2).
export function calcularVencimentoCartao(dataCompraISO, diaFechamento, diaVencimento) {
  const [ano, mes, dia] = dataCompraISO.split('-').map(Number)
  const fechamento = Number(diaFechamento)
  const vencimento = Number(diaVencimento)

  let mesesAFrente = 0
  if (vencimento > fechamento) {
    mesesAFrente = dia < fechamento ? 0 : 1
  } else {
    mesesAFrente = dia < fechamento ? 1 : 2
  }

  const vencData = new Date(ano, mes - 1 + mesesAFrente, 1)
  const mes_referencia = `${vencData.getFullYear()}-${String(vencData.getMonth() + 1).padStart(2, '0')}-01`
  return { mes_referencia, dia_pagamento: vencimento }
}

