// ===========================================
// IMPORTAÇÃO DO POOL DE BASE DE DADOS
//
// db é o pool de conexões MySQL configurado em
// src/config/database.js. Disponibiliza os métodos
// db.query() e db.execute() para executar SQL.
//
// Diferença entre query() e execute():
// - query(): para comandos simples (ex.: SELECT UUID())
// - execute(): para comandos com parâmetros (prepared
//   statements), protegendo contra SQL injection.
// ===========================================
const db = require('../config/database')

// ===========================================
// CLASSE: Usuario (Modelo)
//
// Representa a tabela 'usuarios' na base de dados.
// Contém métodos estáticos (static) para operações
// comuns: criar, buscar por email, buscar por ID,
// listar todos e atualizar.
//
// Porquê "static"?
// Métodos estáticos pertencem à classe em si, não
// a uma instância. Podemos chamá-los sem criar um
// objeto: Usuario.create(...) em vez de new Usuario().
// Isto é comum em modelos (Data Mapper pattern).
// ===========================================
class Usuario {
  // ===========================================
  // MÉTODO: create({ nome, email, password_hash, role, telefone })
  //
  // PROPÓSITO:
  // Inserir um novo utilizador na base de dados.
  //
  // PARÂMETROS (objeto destruturado):
  // - nome: nome do utilizador
  // - email: email (único na BD)
  // - password_hash: hash bcrypt da password
  // - role: função ('admin', 'corretor', 'proprietario')
  // - telefone: contacto (opcional)
  //
  // FLUXO:
  // 1. Gera um UUID (identificador único universal)
  //    com SELECT UUID(). Isto evita usar AUTO_INCREMENT
  //    e permite IDs únicos mesmo em sistemas distribuídos.
  // 2. Insere o registo com INSERT INTO usando prepared
  //    statements (db.execute) para segurança.
  // 3. Retorna o ID gerado.
  //
  // NOTA SOBRE UUID VS AUTO_INCREMENT:
  // UUIDs são strings de 36 caracteres (ex.:
  // "550e8400-e29b-41d4-a716-446655440000").
  // Vantagem: únicos globalmente (úteis para sincronização).
  // Desvantagem: ocupam mais espaço e são mais lentos
  // em índices grandes que inteiros AUTO_INCREMENT.
  //
  // SINTAXE "[[{ id }]]":
  // db.query() retorna uma array [rows, fields].
  // rows é uma array de linhas. Cada linha é { id: '...' }.
  // A desestruturação aninhada extrai o valor de id.
  // ===========================================
  static async create({ nome, email, password_hash, role = 'corretor', telefone }) {
    const [[{ id }]] = await db.query('SELECT UUID() as id')
    await db.execute(
      'INSERT INTO usuarios (id, nome, email, password_hash, role, telefone) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nome, email, password_hash, role, telefone || null]
    )
    return id
  }

  // ===========================================
  // MÉTODO: findByEmail(email)
  //
  // PROPÓSITO:
  // Buscar um utilizador pelo seu email (único).
  // Usado no login para verificar credenciais e
  // no registo para verificar duplicados.
  //
  // PARÂMETROS:
  // - email: string com o email a procurar
  //
  // RETORNO:
  // Objeto do utilizador COMPLETO (incluindo
  // password_hash) ou undefined se não existir.
  //
  // SEGURANÇA:
  // Este método retorna a password_hash porque é
  // usado pelo AuthController para comparar senhas.
  // O controller NUNCA deve enviá-la na resposta HTTP.
  // Para respostas ao cliente, usar findById() que
  // omite a password_hash.
  // ===========================================
  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email])
    return rows[0]
  }

  // ===========================================
  // MÉTODO: findById(id)
  //
  // PROPÓSITO:
  // Buscar um utilizador pelo seu ID (UUID).
  // Usado no AuthController.me() e UsuarioController.show().
  //
  // DIFERENÇA CRÍTICA vs findByEmail():
  // SELECT explícito das colunas — NÃO inclui
  // password_hash. Isto é uma medida de segurança:
  // mesmo que um programador se engane e use este
  // método numa resposta pública, a password nunca
  // vaza.
  //
  // RETORNO:
  // Objeto com id, nome, email, role, telefone,
  // created_at ou undefined.
  // ===========================================
  static async findById(id) {
    const [rows] = await db.execute('SELECT id, nome, email, role, telefone, created_at FROM usuarios WHERE id = ?', [id])
    return rows[0]
  }

  // ===========================================
  // MÉTODO: findAll()
  //
  // PROPÓSITO:
  // Listar todos os utilizadores (apenas admin).
  //
  // RETORNO:
  // Array de objetos (sem password_hash) ordenados
  // alfabeticamente por nome (ORDER BY nome).
  // ===========================================
  static async findAll() {
    const [rows] = await db.execute('SELECT id, nome, email, role, telefone, created_at FROM usuarios ORDER BY nome')
    return rows
  }

  // ===========================================
  // MÉTODO: update(id, { nome, email, role, telefone })
  //
  // PROPÓSITO:
  // Atualizar os dados de um utilizador.
  //
  // COMO FUNCIONA (UPDATE DINÂMICO):
  // Em vez de fazer um UPDATE fixo, este método
  // constrói a query dinamicamente com base nos
  // campos que foram enviados. Isto permite:
  // - Atualizar apenas 1 campo sem enviar os outros
  // - Reutilizar o mesmo método para diferentes cenários
  //
  // FLUXO:
  // 1. Cria dois arrays vazios: fields (nomes das colunas)
  //    e values (valores correspondentes).
  // 2. Para cada campo opcional, se foi enviado (!== undefined),
  //    adiciona à lista.
  // 3. Se nenhum campo foi enviado, retorna sem fazer nada.
  // 4. Junta os campos com vírgulas e executa o UPDATE.
  //
  // EXEMPLO:
  // Usuario.update('abc', { nome: 'Novo Nome', telefone: '999' })
  // Gera: UPDATE usuarios SET nome = ?, telefone = ? WHERE id = ?
  // Com valores: ['Novo Nome', '999', 'abc']
  // ===========================================
  static async update(id, { nome, email, role, telefone }) {
    const fields = []
    const values = []
    if (nome !== undefined) { fields.push('nome = ?'); values.push(nome) }
    if (email !== undefined) { fields.push('email = ?'); values.push(email) }
    if (role !== undefined) { fields.push('role = ?'); values.push(role) }
    if (telefone !== undefined) { fields.push('telefone = ?'); values.push(telefone) }
    if (fields.length === 0) return
    values.push(id)
    await db.execute(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values)
  }
}

// ===========================================
// EXPORTAÇÃO DA CLASSE
// Exportamos a classe diretamente (NÃO uma instância).
// Cada módulo que fizer require() pode usar:
// const Usuario = require('./Usuario')
// Usuario.create(), Usuario.findByEmail(), etc.
// ===========================================
module.exports = Usuario
