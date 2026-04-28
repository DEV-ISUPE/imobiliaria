const db = require('../config/database')

class Agendamento {
  static async create({ cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id }) {
    const [result] = await db.execute(
      `INSERT INTO agendamentos (id, cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id) 
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id]
    )
    return result
  }

  static async findByProperty(imovel_id) {
    const [rows] = await db.execute(
      'SELECT * FROM agendamentos WHERE imovel_id = ? ORDER BY data_visita',
      [imovel_id]
    )
    return rows
  }

  static async updateStatus(id, status) {
    const [result] = await db.execute(
      'UPDATE agendamentos SET status = ? WHERE id = ?',
      [status, id]
    )
    return result
  }
}

module.exports = Agendamento
