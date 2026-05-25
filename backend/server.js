// ===========================================
// IMPORTAÇÃO DE DEPENDÊNCIAS
// Carregamos as bibliotecas necessárias para o
// funcionamento do servidor: Express (framework web),
// CORS (segurança para requisições cross-origin),
// dotenv (variáveis de ambiente), path (manipulação
// de caminhos de ficheiros) e os nossos módulos locais.
// ===========================================
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const routes = require('./src/routes')
const path = require('path')
const initDatabase = require('./src/config/init')

// ===========================================
// CARREGAR VARIÁVEIS DE AMBIENTE
// O dotenv lê o ficheiro .env na raiz do projeto
// e disponibiliza os valores em process.env.
// Isto permite configurar senhas, portas, etc.
// sem as escrever no código fonte.
// ===========================================
dotenv.config()

// ===========================================
// CRIAÇÃO DA APLICAÇÃO EXPRESS
// "app" é o nosso servidor web. Ele vai receber
// requisições HTTP (GET, POST, etc.) e responder.
// PORT é a porta onde o servidor vai escutar —
// usamos a variável de ambiente ou 3000 por padrão.
// ===========================================
const app = express()
const PORT = process.env.PORT || 3000

// ===========================================
// MIDDLEWARES GLOBAIS
// app.use() regista middlewares — funções que o
// Express executa em TODAS as requisições.
// cors(): permite que o frontend (noutra porta/origem)
//         faça requisições ao backend sem ser bloqueado.
// express.json(): converte automaticamente o corpo
//         das requisições com JSON (Content-Type:
//         application/json) num objeto JavaScript.
// ===========================================
app.use(cors())
app.use(express.json())

// ===========================================
// SERVIÇÃO DE FICHEIROS ESTÁTICOS
// express.static() serve ficheiros diretamente
// sem precisar de uma rota específica.
// 1. Servimos o frontend (HTML, CSS, JS) da pasta ../frontend
// 2. Servimos as imagens enviadas (uploads) da pasta uploads
//    no prefixo /uploads — assim /uploads/foto.jpg devolve
//    o ficheiro correspondente.
// ===========================================
app.use(express.static(path.join(__dirname, '../frontend')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ===========================================
// ROTAS DA API
// Todas as rotas definidas em ./src/routes/index.js
// ficam disponíveis sob o prefixo /api.
// Exemplo: /api/auth/login, /api/properties, etc.
// ===========================================
app.use('/api', routes)

// ===========================================
// FUNÇÃO DE INICIALIZAÇÃO DO SERVIDOR
// start()
//
// Esta função é ASSÍNCRONA (async) porque precisa
// esperar pela inicialização da base de dados antes
// de começar a aceitar requisições.
//
// Passo a passo:
// 1. Chama initDatabase() que cria o schema e tabelas
//    se não existirem (auto-setup).
// 2. Se correr bem, liga o servidor na PORT definida.
// 3. Se houver erro (ex.: MySQL não está a correr),
//    mostramos uma mensagem amigável e saímos com
//    código 1 (indicando falha ao sistema operativo).
//
// Uso de process.exit(1): termina o Node.js com
// código de erro — útil para scripts e deploys.
// ===========================================
async function start() {
  try {
    await initDatabase()
    app.listen(PORT, () => {
      console.log(`\n  → Servidor: http://localhost:${PORT}`)
      console.log(`  → Frontend: http://localhost:${PORT}/login.html\n`)
    })
  } catch (error) {
    console.error('\n[ERRO] Não foi possível conectar ao MySQL.')
    console.log('[ERRO] Verifique se o XAMPP/MySQL está a correr.')
    console.log(`[ERRO] Detalhes: ${error.message}\n`)
    process.exit(1)
  }
}

// ===========================================
// EXECUÇÃO INICIAL
// Chamamos a função start() para arrancar tudo.
// Este é o ponto de entrada da aplicação.
// ===========================================
start()
