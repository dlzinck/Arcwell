import express from 'express'
import cors from 'cors'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Arcwell API is running'
  })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Arcwell API running on http://localhost:${PORT}`)
})
