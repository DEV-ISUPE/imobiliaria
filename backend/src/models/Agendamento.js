// ===========================================
// IMPORTAÇÃO DO POOL DE BASE DE DADOS
//
// db é o pool de conexões MySQL configurado em
// src/config/database.js.
// ===========================================
const db = require('../config/database')

// ===========================================
// CLASSE: Agendamento (Modelo)
//
// Representa a tabela 'agendamentos' na base de dados.
// Cada agendamento regista o interesse de um cliente
// em visitar um imóvel numa data específica.
//
// RELACIONAMENTOS:
// - Cada agendamento está ligado a um imóvel
//   (FK: imovel_id → imoveis.id).
// - Quando listamos agendamentos, fazemos JOIN com
//   a tabela imoveis para mostrar o título do imóvel.
// ===========================================
class Agendamento {
  // ===========================================
  // MÉTODO: create({ cliente_nome, cliente_email, ... })
  //
  // PROPÓSITO:
  // Registar um novo agendamento de visita.
  // Este método é chamado pelo AgendamentoController.create()
  // e está disponível ao público (sem autenticação).
  //
  // PARÂMETROS:
  // - cliente_nome: nome do visitante (obrigatório)
  // - cliente_email: email do visitante (opcional)
  // - cliente_telefone: telefone do visitante (opcional)
  // - data_visita: data/hora agendada (obrigatório)
  // - imovel_id: ID do imóvel a visitar (obrigatório)
  //
  // VALORES PADRÃO:
  // cliente_email e cliente_telefone são opcionais.
  // Se não forem fornecidos, guardamos NULL na BD.
  // O status do agendamento é definido como 'pendente'
  // pelo DEFAULT na definição da tabela SQL.
  // ===========================================
  static async create({ cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id }) {
    const [[{ id }]] = await db.query('SELECT UUID() as id')
    await db.execute(
      `INSERT INTO agendamentos (id, cliente_nome, cliente_email, cliente_telefone, data_visita, imovel_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, cliente_nome, cliente_email || null, cliente_telefone || null, data_visita, imovel_id]
    )
    return id
  }

  // ===========================================
  // MÉTODO: findByProperty(imovel_id)
  //
  // PROPÓSITO:
  // Listar todos os agendamentos de um imóvel
  // específico. Útil para o corretor ver quem
  // quer visitar aquele imóvel.
  //
  // FLUXO:
  // 1. Faz SELECT com LEFT JOIN para incluir o
  //    título do imóvel (imovel_titulo).
  // 2. Filtra por imovel_id.
  // 3. Ordena por data_visita (mais próximos primeiro).
  //
  // LEFT JOIN vs INNER JOIN:
  // LEFT JOIN para o caso de o imóvel ter sido apagado
  // — ainda assim queremos ver os agendamentos, embora
  // o título apareça como NULL.
  // ===========================================
  static async findByProperty(imovel_id) {
    const [rows] = await db.execute(
      'SELECT a.*, i.titulo as imovel_titulo FROM agendamentos a LEFT JOIN imoveis i ON a.imovel_id = i.id WHERE a.imovel_id = ? ORDER BY a.data_visita',
      [imovel_id]
    )
    return rows
  }

  // ===========================================
  // MÉTODO: findAllByUser(userId)
  //
  // PROPÓSITO:
  // Listar agendamentos dos imóveis de um corretor
  // específico. Usado quando um corretor faz login
  // e quer ver os seus agendamentos.
  //
  // FLUXO:
  // 1. Faz INNER JOIN entre agendamentos e imoveis.
  // 2. Filtra WHERE i.corretor_id = ? (imóveis do corretor).
  // 3. Ordena por data_visita descendente.
  //
  // DIFERENÇA findAllByUser vs findAll:
  // - findAllByUser: apenas agendamentos de imóveis
  //   do corretor (usa INNER JOIN, porque só interessa
  //   se houver correspondência).
  // - findAll: todos os agendamentos (admin).
  // ===========================================
  static async findAllByUser(userId) {
    const [rows] = await db.execute(
      `SELECT a.*, i.titulo as imovel_titulo 
       FROM agendamentos a 
       JOIN imoveis i ON a.imovel_id = i.id 
       WHERE i.corretor_id = ? 
       ORDER BY a.data_visita DESC`,
      [userId]
    )
    return rows
  }

  // ===========================================
  // MÉTODO: findAll()
  //
  // PROPÓSITO:
  // Listar TODOS os agendamentos do sistema.
  // Acesso restrito a administradores.
  //
  // FLUXO:
  // LEFT JOIN com imoveis (para mostrar o título
  // mesmo que o imóvel já não exista).
  // Ordenado por data_visita descendente.
  // ===========================================
  static async findAll() {
    const [rows] = await db.execute(
      `SELECT a.*, i.titulo as imovel_titulo 
       FROM agendamentos a 
       LEFT JOIN imoveis i ON a.imovel_id = i.id 
       ORDER BY a.data_visita DESC`
    )
    return rows
  }

  // ===========================================
  // MÉTODO: updateStatus(id, status)
  //
  // PROPÓSITO:
  // Alterar o estado de um agendamento.
  // Chamado quando o corretor confirma, cancela
  // ou marca como realizada uma visita.
  //
  // PARÂMETROS:
  // - id: UUID do agendamento
  // - status: string ('pendente', 'confirmado',
  //   'cancelado', 'realizado')
  //
  // NOTA:
  // Não validamos o status aqui — a validação
  // fica a cargo do controlador. O modelo apenas
  // executa o SQL.
  // ===========================================
  static async updateStatus(id, status) {
    await db.execute(
      'UPDATE agendamentos SET status = ? WHERE id = ?',
      [status, id]
    )
  }

  // ===========================================
  // MÉTODO: delete(id)
  //
  // PROPÓSITO:
  // Remover um agendamento da base de dados.
  //
  // NOTA:
  // Ao contrário do Imovel.delete(), não precisamos
  // de apagar registos relacionados porque não há
  // tabelas que referenciem agendamentos — ele é
  // a "folha" da árvore de dependências.
  // ===========================================
  static async delete(id) {
    await db.execute('DELETE FROM agendamentos WHERE id = ?', [id])
  }
}

// ===========================================
// EXPORTAÇÃO DA CLASSE
// ===========================================
module.exports = Agendamento
