import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import transacoesRouter from './routes/transacoes.js'

const app = express()
const PORT = process.env.PORT || 3001

const ORIGENS_PERMITIDAS = [
  'http://localhost:5173',
  'https://controle-financeiro-peach-alpha.vercel.app',
]
app.use(cors({ origin: ORIGENS_PERMITIDAS }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok' }))
app.use('/transacoes', transacoesRouter)

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
})
