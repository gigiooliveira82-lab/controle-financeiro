const _brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const _num = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtBRL = (v) => _brl.format(Number(v))
export const fmtNum = (v) => _num.format(Math.abs(Number(v)))
