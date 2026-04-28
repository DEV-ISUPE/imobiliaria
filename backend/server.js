const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const routes = require('./src/routes')
const path = require('path')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Servir ficheiros estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')))

// API Routes
app.use('/api', routes)

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
