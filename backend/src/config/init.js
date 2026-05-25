// ===========================================
// IMPORTAÇÃO DE MÓDULOS
// mysql2/promise: cliente MySQL com suporte async/await.
// path: manipulação de caminhos de ficheiros (cross-platform).
// fs: File System — permite ler ficheiros do disco.
// ===========================================
const mysql = require('mysql2/promise')
const path = require('path')
const fs = require('fs')

// ===========================================
// CONFIGURAÇÃO DA BASE DE DADOS
// Estas variáveis são lidas do ambiente (.env)
// ou usam valores padrão para desenvolvimento local.
// DB_NAME: 'maison_huambo' é o nome da base de dados
//          da imobiliária Maison Huambo.
// ===========================================
const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'maison_huambo'
const DB_PORT = process.env.DB_PORT || 3306
const DB_SOCKET = process.env.DB_SOCKET || undefined

// ===========================================
// FUNÇÃO: initDatabase()
//
// PROPÓSITO:
// Esta função é chamada no arranque do servidor
// (server.js) para garantir que a base de dados
// e as tabelas existem. É um "auto-setup" —
// elimina a necessidade de executar scripts SQL
// manualmente.
//
// COMO FUNCIONA:
// 1. Liga ao MySQL sem especificar uma base de dados
//    (porque a DB pode não existir ainda).
// 2. Cria a base de dados se não existir:
//    CREATE DATABASE IF NOT EXISTS ...
// 3. Muda para essa base de dados: USE ...
// 4. Verifica se existem tabelas (SHOW TABLES).
// 5. Se não houver tabelas, lê o ficheiro
//    schema.sql, extrai os CREATE TABLE e executa-os.
// 6. Depois, verifica se há utilizadores na tabela
//    'usuarios'. Se estiver vazia, executa seed.sql
//    para popular com dados iniciais.
// 7. Se as tabelas já existem, tenta executar
//    migrações (ALTER TABLE) para adicionar colunas
//    que possam faltar de versões anteriores.
//
// PARÂMETROS: Nenhum.
// RETORNO: Promise<void> — nada, mas lança erro se falhar.
//
// NOTA DIDÁTICA:
// O uso de "multipleStatements: true" permite executar
// vários comandos SQL separados por ponto e vírgula
// numa só chamada. É útil para scripts, mas cuidado
// em produção (risco de SQL injection se não sanitizar).
// ===========================================
async function initDatabase() {
  let connection
  try {
    const connConfig = {
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: parseInt(DB_PORT),
      multipleStatements: true
    }
    if (DB_SOCKET) connConfig.socketPath = DB_SOCKET

    // Cria uma ligação TEMPORÁRIA ao MySQL
    // (ainda não selecionamos uma base de dados específica)
    connection = await mysql.createConnection(connConfig)

    console.log('[DB] Conectado ao MySQL')

    // Cria a base de dados com charset utf8mb4
    // (suporta emojis e caracteres especiais)
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log(`[DB] Base de dados "${DB_NAME}" pronta`)

    // Seleciona a base de dados para os comandos seguintes
    await connection.query(`USE \`${DB_NAME}\``)

    // Verifica se existem tabelas
    const [tables] = await connection.query('SHOW TABLES')
    if (tables.length === 0) {
      // --- PRIMEIRA EXECUÇÃO: criar tabelas ---
      console.log('[DB] A criar tabelas...')

      // Lê o ficheiro schema.sql do disco
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql')
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')

      // Remove comandos de DROP/CREATE DATABASE e USE
      // pois já tratámos disso acima
      const statements = schemaSql
        .replace(/DROP DATABASE IF EXISTS .*?;/i, '')
        .replace(/CREATE DATABASE .*?;/i, '')
        .replace(/USE .*?;/i, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      // Executa cada CREATE TABLE com IF NOT EXISTS
      // para evitar erros se a tabela já existir
      for (const stmt of statements) {
        if (stmt.toUpperCase().startsWith('CREATE TABLE')) {
          const createSql = stmt.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS')
          await connection.query(createSql)
        }
      }
      console.log('[DB] Tabelas criadas')

      // Verifica se a tabela de utilizadores está vazia
      const [rows] = await connection.query('SELECT COUNT(*) as count FROM usuarios')
      if (rows[0].count === 0) {
        // --- POPULAR DADOS INICIAIS (SEED) ---
        console.log('[DB] A inserir dados iniciais...')
        const seedPath = path.join(__dirname, '..', 'database', 'seed.sql')
        const seedSql = fs.readFileSync(seedPath, 'utf8')

        // Filtra apenas comandos INSERT e ALTER
        // (ignora SELECT, DELETE e comentários)
        const seedStatements = seedSql
          .replace(/USE .*?;/i, '')
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.toUpperCase().startsWith('SELECT') && !s.toUpperCase().startsWith('DELETE') && !s.toUpperCase().startsWith('--'))

        for (const stmt of seedStatements) {
          if (stmt.toUpperCase().startsWith('INSERT') || stmt.toUpperCase().startsWith('ALTER')) {
            try {
              await connection.query(stmt)
            } catch (err) {
              // Se uma instrução falhar (ex.: registo duplicado),
              // apenas avisamos — não bloqueamos o resto
              console.warn(`[DB] Aviso em seed: ${err.message}`)
            }
          }
        }
        console.log('[DB] Dados iniciais inseridos')
      } else {
        console.log('[DB] Base de dados já contém dados')
      }
    } else {
      // --- BASE DE DADOS JÁ EXISTE: executar migrações ---
      console.log('[DB] Tabelas já existem')

      // Migrações: adicionar colunas que possam faltar
      // (útil quando actualizamos de uma versão anterior
      // que não tinha estas colunas).
      // O try/catch ignora erros de "coluna já existe".
      const migrations = [
        "ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(20) AFTER email",
        "ALTER TABLE imoveis ADD COLUMN galeria TEXT AFTER imagem_url",
        "ALTER TABLE imoveis ADD COLUMN tipo VARCHAR(50) AFTER descricao",
      ]
      for (const sql of migrations) {
        try {
          await connection.query(sql)
        } catch (_) {
          // coluna já existe, ignorar
        }
      }
    }

    console.log('[DB] Inicialização concluída com sucesso')
  } catch (error) {
    console.error('[DB] Erro na inicialização:', error.message)
    console.log('[DB] Certifique-se de que o MySQL está a correr (XAMPP, Homebrew, etc.)')
    throw error
  } finally {
    // ===========================================
    // BLOCO FINALLY
    // O bloco finally executa SEMPRE, quer tenha
    // havido erro ou não. Aqui fechamos a ligação
    // temporária ao MySQL, pois o resto da aplicação
    // usará o pool (database.js) para comunicar com a BD.
    // ===========================================
    if (connection) await connection.end()
  }
}

module.exports = initDatabase
