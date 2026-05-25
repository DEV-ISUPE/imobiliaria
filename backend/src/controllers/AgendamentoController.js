// ===========================================
// IMPORTAÇÃO DO MODELO AGENDAMENTO
//
// O modelo Agendamento contém os métodos para
// interagir com a tabela 'agendamentos' na BD.
// create(), findByProperty(), findAll(),
// findAllByUser(), updateStatus(), delete().
// ===========================================
const Agendamento = require('../models/Agendamento')

// ===========================================
// CLASSE: AgendamentoController
//
// Controlador responsável por gerir agendamentos
// de visitas a imóveis. Os agendamentos são criados
// por clientes (público) e geridos por corretores/admins.
// ===========================================
class AgendamentoController {
  // ===========================================
  // MÉTODO: create()
  //
  // PROPÓSITO:
  // Registar um novo agendamento de visita.
  // Esta rota é PÚBLICA — qualquer visitante pode
  // agendar uma visita sem precisar de conta.
  //
  // FLUXO:
  // 1. Extrai os dados do cliente: nome, email,
  //    telefone, data da visita e ID do imóvel.
  // 2. Valida campos obrigatórios:
  //    cliente_nome, data_visita e imovel_id.
  // 3. Insere na BD com status "pendente" (padrão
  //    definido no schema SQL).
  // 4. Devolve status 201 com o ID do agendamento.
  //
  // NOTA:
  // O campo cliente_email e cliente_telefone são
  // opcionais — o cliente pode fornecer apenas
  // o nome e a data.
  // ===========================================
  async create(req, res) {
    try {
      const { cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id } = req.body

      if (!cliente_nome || !data_visita || !imovel_id) {
        return res.status(400).json({ error: 'Nome, data e imóvel são obrigatórios' })
      }

      const id = await Agendamento.create({ cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id })
      res.status(201).json({ message: 'Agendamento realizado com sucesso', id })
    } catch (error) {
      console.error('Create appointment error:', error)
      res.status(500).json({ error: 'Erro ao agendar visita' })
    }
  }

  // ===========================================
  // MÉTODO: listByProperty()
  //
  // PROPÓSITO:
  // Listar todos os agendamentos de um imóvel
  // específico. Útil para o corretor ver quem
  // quer visitar aquele imóvel.
  //
  // FLUXO:
  // 1. Recebe o imovel_id nos parâmetros da URL.
  // 2. Chama Agendamento.findByProperty() que faz
  //    JOIN com a tabela imoveis para incluir
  //    o título do imóvel.
  // 3. Devolve a lista ordenada por data da visita.
  // ===========================================
  async listByProperty(req, res) {
    try {
      const appointments = await Agendamento.findByProperty(req.params.imovel_id)
      res.json({ appointments })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar agendamentos' })
    }
  }

  // ===========================================
  // MÉTODO: listAll()
  //
  // PROPÓSITO:
  // Listar agendamentos com base no tipo de
  // utilizador autenticado.
  //
  // REGRAS DE NEGÓCIO:
  // - Admin: vê TODOS os agendamentos do sistema.
  // - Corretor: vê apenas agendamentos dos seus
  //   próprios imóveis (filtro por corretor_id).
  //
  // O req.user.role foi definido pelo middleware auth()
  // com base nos dados do token JWT.
  // ===========================================
  async listAll(req, res) {
    try {
      let appointments
      if (req.user.role === 'admin') {
        appointments = await Agendamento.findAll()
      } else {
        appointments = await Agendamento.findAllByUser(req.user.id)
      }
      res.json({ appointments })
    } catch (error) {
      console.error('List appointments error:', error)
      res.status(500).json({ error: 'Erro ao listar agendamentos' })
    }
  }

  // ===========================================
  // MÉTODO: updateStatus()
  //
  // PROPÓSITO:
  // Alterar o estado de um agendamento.
  // Estados típicos: pendente, confirmado, cancelado,
  // realizado.
  //
  // FLUXO:
  // 1. Recebe o novo status do corpo da requisição.
  // 2. Valida se o status foi enviado.
  // 3. Chama Agendamento.updateStatus() que executa
  //    um UPDATE na tabela.
  // 4. Devolve mensagem de sucesso.
  //
  // NOTA:
  // Usamos PATCH em vez de PUT porque alteramos
  // apenas um campo específico (status), não o
  // recurso inteiro. PATCH é semanticamente mais
  // correto para atualizações parciais.
  // ===========================================
  async updateStatus(req, res) {
    try {
      const { status } = req.body
      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' })
      }
      await Agendamento.updateStatus(req.params.id, status)
      res.json({ message: 'Agendamento atualizado com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar agendamento' })
    }
  }

  // ===========================================
  // MÉTODO: delete()
  //
  // PROPÓSITO:
  // Remover um agendamento do sistema.
  //
  // FLUXO:
  // 1. Chama Agendamento.delete() que executa
  //    DELETE FROM agendamentos WHERE id = ?
  // 2. Devolve mensagem de sucesso.
  //
  // NOTA:
  // Ao contrário do Imovel.delete(), aqui não
  // precisamos de apagar registos relacionados
  // porque agendamentos é a tabela "filha" (as FK
  // apontam para imoveis e não o contrário).
  // ===========================================
  async delete(req, res) {
    try {
      await Agendamento.delete(req.params.id)
      res.json({ message: 'Agendamento removido com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover agendamento' })
    }
  }
}

// ===========================================
// EXPORTAÇÃO (INSTÂNCIA ÚNICA)
// ===========================================
module.exports = new AgendamentoController()
