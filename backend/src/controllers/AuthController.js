const Usuario = require('../models/Usuario')
const bcrypt = require('bcrypt')

class AuthController {
  async register(req, res) {
    try {
      const { nome, email, password } = req.body
      
      const existingUser = await Usuario.findByEmail(email)
      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' })
      }

      const password_hash = await bcrypt.hash(password, 10)
      await Usuario.create({ nome, email, password_hash })
      
      res.status(201).json({ message: 'Usuário criado com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar usuário' })
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body
      
      const user = await Usuario.findByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' })
      }

      const validPassword = await bcrypt.compare(password, user.password_hash)
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' })
      }

      res.json({ 
        message: 'Login realizado com sucesso',
        user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
      })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao fazer login' })
    }
  }
}

module.exports = new AuthController()
