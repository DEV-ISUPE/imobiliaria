const Agendamento = require('../models/Agendamento')

class AgendamentoController {
  async create(req, res) {
    try {
      const { cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id } = req.body
      
      await Agendamento.create({ cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id })
      res.status(201).json({ message: 'Agendamento realizado com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao agendar visita' })
    }
  }

  async listByProperty(req, res) {
    try {
      const appointments = await Agendamento.findByProperty(req.params.imovel_id)
      res.json({ appointments })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar agendamentos' })
    }
  }
}

module.exports = new AgendamentoController()
