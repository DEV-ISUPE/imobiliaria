// ===========================================
// IMPORTAÇÃO DO MYSQL2 (PROMISE)
// mysql2/promise é uma versão do mysql2 que suporta
// async/await — ou seja, podemos usar "await" em vez
// de callbacks para operações de base de dados.
// Isto torna o código mais legível e fácil de manter.
// ===========================================
const mysql = require('mysql2/promise')

// ===========================================
// CONFIGURAÇÃO DO POOL DE CONEXÕES
// poolConfig: objeto com as definições para criar
// um "pool" (conjunto) de ligações à base de dados.
//
// Porquê usar um pool e não uma única conexão?
// - Cada requisição ao servidor pode precisar de BD.
// - Criar uma ligação nova de cada vez é lento.
// - O pool mantém N ligações abertas (connectionLimit)
//   e reutiliza-as, melhorando a performance.
//
// Campos:
// - host: servidor MySQL (localhost se for XAMPP local)
// - user: utilizador da BD (root no XAMPP)
// - password: senha do utilizador
// - database: nome da base de dados do projeto
// - port: porta do MySQL (3306 é a padrão)
// - waitForConnections: se todas as N ligações estiverem
//   ocupadas, espera por uma ficar livre
// - connectionLimit: máximo de 10 ligações simultâneas
// - queueLimit: 0 = fila de espera ilimitada
// ===========================================
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'maison_huambo',
  port: parseInt(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// ===========================================
// CONFIGURAÇÃO DE SOCKET (OPCIONAL)
// No Linux/macOS, o XAMPP pode usar um socket Unix
// em vez de TCP (localhost:3306). Se a variável de
// ambiente DB_SOCKET estiver definida, usamos esse
// caminho para ligar ao MySQL via socket.
// Isto é útil quando o MySQL só aceita ligações
// locais por socket (mais seguro e rápido).
// ===========================================
if (process.env.DB_SOCKET) {
  poolConfig.socketPath = process.env.DB_SOCKET
}

// ===========================================
// CRIAÇÃO DO POOL
// mysql.createPool(poolConfig) cria o pool de
// conexões com a configuração definida acima.
// A partir de agora, podemos usar:
//   await db.query('SELECT ...')
//   await db.execute('INSERT ...', [valores])
// O pool escolhe automaticamente uma ligação livre.
// ===========================================
const pool = mysql.createPool(poolConfig)

// ===========================================
// EXPORTAÇÃO DO POOL
// Este módulo exporta o pool para que outros
// ficheiros (models, controllers) possam usá-lo.
// Sempre que alguém fizer require('...database'),
// recebe o pool já configurado e pronto a usar.
// ===========================================
module.exports = pool
