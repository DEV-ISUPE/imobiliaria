const db = require('../config/database')

class Imovel {
  static async create({ titulo, descricao, preco, quartos, localizacao, imagem_url, corretor_id }) {
    const [result] = await db.execute(
      `INSERT INTO imoveis (id, titulo, descricao, preco, quartos, localizacao, imagem_url, corretor_id) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descricao, preco, quartos, localizacao, imagem_url, corretor_id]
    )
    return result
  }

  static async findAll() {
    const [rows] = await db.execute(
      `SELECT p.*, u.nome as corretor_nome 
       FROM imoveis p 
       LEFT JOIN usuarios u ON p.corretor_id = u.id 
       WHERE p.status = 'disponivel'`
    )
    return rows
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT p.*, u.nome as corretor_nome 
       FROM imoveis p 
       LEFT JOIN usuarios u ON p.corretor_id = u.id 
       WHERE p.id = ?`,
      [id]
    )
    return rows[0]
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM imoveis WHERE id = ?', [id])
    return result
  }
}

module.exports = Imovel
