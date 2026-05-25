// ===========================================
// IMPORTAÇÃO DO POOL DE BASE DE DADOS
//
// db é o pool de conexões MySQL. Usamos
// db.query() para SELECTs simples e db.execute()
// para prepared statements com parâmetros.
// ===========================================
const db = require('../config/database')

// ===========================================
// CLASSE: Imovel (Modelo)
//
// Representa a tabela 'imoveis' na base de dados.
// Contém todos os métodos CRUD para gerir os
// imóveis da imobiliária.
//
// RELACIONAMENTOS:
// - Cada imóvel pertence a um corretor (FK: corretor_id
//   → usuarios.id). As queries fazem JOIN para incluir
//   o nome, email e telefone do corretor.
// - Um imóvel pode ter múltiplos agendamentos (tabela
//   agendamentos). Quando um imóvel é apagado, os
//   agendamentos associados também são removidos.
// ===========================================
class Imovel {
  // ===========================================
  // MÉTODO: create({ titulo, descricao, preco, ... })
  //
  // PROPÓSITO:
  // Inserir um novo imóvel na base de dados.
  //
  // PARÂMETROS:
  // - titulo: nome/descrição curta do imóvel
  // - descricao: descrição detalhada
  // - preco: valor do imóvel (DECIMAL no MySQL)
  // - quartos: número de quartos (opcional)
  // - localizacao: endereço ou bairro (opcional)
  // - imagem_url: URL da foto principal (opcional)
  // - galeria: array de URLs de fotos adicionais
  //   (convertido para JSON string na BD)
  // - corretor_id: ID do corretor responsável
  // - tipo: tipo de imóvel (casa, apto, terreno, ...)
  //
  // NOTA SOBRE JSON.stringify(galeria):
  // O MySQL não suporta nativamente arrays. Guardamos
  // a galeria como TEXT (string JSON). Quando lemos,
  // fazemos JSON.parse() se necessário.
  // ===========================================
  static async create({ titulo, descricao, preco, quartos, localizacao, imagem_url, galeria, corretor_id, tipo }) {
    const [[{ id }]] = await db.query('SELECT UUID() as id')
    await db.execute(
      `INSERT INTO imoveis (id, titulo, descricao, preco, quartos, localizacao, imagem_url, galeria, corretor_id, tipo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, titulo, descricao, preco, quartos, localizacao, imagem_url, galeria ? JSON.stringify(galeria) : null, corretor_id, tipo || null]
    )
    return id
  }

  // ===========================================
  // MÉTODO: findAll(filters = {})
  //
  // PROPÓSITO:
  // Listar imóveis com filtros opcionais.
  //
  // COMO FUNCIONA (QUERY DINÂMICA):
  // 1. Começa com o SELECT base com LEFT JOIN para
  //    trazer os dados do corretor (nome, telefone, email).
  // 2. Constrói uma lista de condições WHERE dinamicamente
  //    com base nos filtros fornecidos.
  // 3. Se houver condições, junta-as com AND.
  // 4. Ordena por data de criação descendente (mais
  //    recentes primeiro).
  //
  // EXEMPLOS DE USO:
  // Imovel.findAll({ status: 'disponivel' })
  // → ... WHERE p.status = 'disponivel' ORDER BY ...
  //
  // Imovel.findAll({ corretor_id: 'abc', status: 'disponivel' })
  // → ... WHERE p.corretor_id = ? AND p.status = ? ...
  //
  // LEFT JOIN vs INNER JOIN:
  // LEFT JOIN garante que o imóvel aparece mesmo que
  // o corretor tenha sido apagado (corretor_id = NULL).
  // ===========================================
  static async findAll(filters = {}) {
    let sql = `SELECT p.*, u.nome as corretor_nome, u.telefone as corretor_telefone, u.email as corretor_email 
               FROM imoveis p 
               LEFT JOIN usuarios u ON p.corretor_id = u.id`
    const conditions = []
    const values = []

    if (filters.status) {
      conditions.push('p.status = ?')
      values.push(filters.status)
    }
    if (filters.corretor_id) {
      conditions.push('p.corretor_id = ?')
      values.push(filters.corretor_id)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY p.created_at DESC'

    const [rows] = await db.execute(sql, values)
    return rows
  }

  // ===========================================
  // MÉTODO: findById(id)
  //
  // PROPÓSITO:
  // Buscar um imóvel pelo seu ID (UUID).
  //
  // FLUXO:
  // 1. Executa SELECT com LEFT JOIN para dados do corretor.
  // 2. Filtra WHERE p.id = ?.
  // 3. Retorna o primeiro (e único) resultado.
  //
  // RETORNO:
  // Objeto do imóvel com dados do corretor, ou undefined.
  // ===========================================
  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT p.*, u.nome as corretor_nome, u.telefone as corretor_telefone, u.email as corretor_email 
       FROM imoveis p 
       LEFT JOIN usuarios u ON p.corretor_id = u.id 
       WHERE p.id = ?`,
      [id]
    )
    return rows[0]
  }

  // ===========================================
  // MÉTODO: update(id, fields)
  //
  // PROPÓSITO:
  // Atualizar os dados de um imóvel.
  //
  // COMO FUNCIONA (UPDATE DINÂMICO):
  // 1. Lista de campos permitidos (whitelist) — só estes
  //    podem ser alterados. Isto evita que alguém
  //    altere colunas sensíveis como created_at ou id.
  // 2. Percorre os campos permitidos e verifica se
  //    foram enviados no objeto fields.
  // 3. Se o campo 'galeria' for um array, serializa
  //    para JSON antes de guardar.
  // 4. Constrói e executa o UPDATE.
  //
  // WHITELIST (Lista Branca):
  // É uma prática de segurança: em vez de permitir
  // qualquer campo do req.body, definimos explicitamente
  // quais campos podem ser alterados.
  // ===========================================
  static async update(id, fields) {
    const setClauses = []
    const values = []
    const allowed = ['titulo', 'descricao', 'preco', 'quartos', 'localizacao', 'imagem_url', 'galeria', 'status', 'tipo']
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setClauses.push(`${key} = ?`)
        let val = fields[key]
        if (key === 'galeria' && Array.isArray(val)) val = JSON.stringify(val)
        values.push(val)
      }
    }
    if (setClauses.length === 0) return
    values.push(id)
    await db.execute(`UPDATE imoveis SET ${setClauses.join(', ')} WHERE id = ?`, values)
  }

  // ===========================================
  // MÉTODO: delete(id)
  //
  // PROPÓSITO:
  // Remover um imóvel e todos os seus agendamentos.
  //
  // ORDEM DE ELIMINAÇÃO (importante!):
  // 1. Primeiro: DELETE FROM agendamentos WHERE imovel_id = ?
  //    (apaga os registos da tabela filha)
  // 2. Depois: DELETE FROM imoveis WHERE id = ?
  //    (apaga o registo da tabela pai)
  //
  // PORQUE NESTA ORDEM?
  // Se apagássemos o imóvel primeiro, a base de dados
  // impediria (ou teria um erro de chave estrangeira
  // dependendo da configuração ON DELETE). A ordem
  // correta é sempre: filhos primeiro, pais depois.
  //
  // NOTA:
  // Se a tabela tivesse ON DELETE CASCADE, bastaria
  // apagar o imóvel que os agendamentos seriam apagados
  // automaticamente. Mas fazemos explicitamente para
  // garantir o comportamento.
  // ===========================================
  static async delete(id) {
    await db.execute('DELETE FROM agendamentos WHERE imovel_id = ?', [id])
    const [result] = await db.execute('DELETE FROM imoveis WHERE id = ?', [id])
    return result
  }
}

// ===========================================
// EXPORTAÇÃO DA CLASSE
// ===========================================
module.exports = Imovel
