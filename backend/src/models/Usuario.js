const db = require('../config/database')

class Usuario {
  static async create({ nome, email, password_hash, role = 'corretor' }) {
    const [result] = await db.execute(
      'INSERT INTO usuarios (id, nome, email, password_hash, role) VALUES (UUID(), ?, ?, ?, ?)',
      [nome, email, password_hash, role]
    )
    return result
  }

  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email])
    return rows[0]
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT id, nome, email, role, created_at FROM usuarios WHERE id = ?', [id])
    return rows[0]
  }
}

module.exports = Usuario
