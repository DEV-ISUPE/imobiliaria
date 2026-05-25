// ===========================================
// IMPORTAÇÃO DO MODELO IMOVEL
//
// O modelo Imovel contém os métodos para interagir
// com a tabela 'imoveis' na base de dados SQL.
// findAll(), findById(), create(), update(), delete().
// ===========================================
const Imovel = require('../models/Imovel')

// ===========================================
// CLASSE: ImovelController
//
// Controlador responsável por gerir as operações
// sobre imóveis: listar, ver detalhes, criar,
// atualizar e remover.
//
// Cada método lida com a requisição HTTP, valida
// dados, chama o modelo apropriado e devolve a
// resposta JSON.
// ===========================================
class ImovelController {
  // ===========================================
  // MÉTODO: index()
  //
  // PROPÓSITO:
  // Listar imóveis com filtros opcionais.
  // É uma rota pública, mas com comportamentos
  // diferentes conforme o tipo de utilizador.
  //
  // REGRAS DE NEGÓCIO:
  // - Se um corretor ou proprietário está logado:
  //   vê APENAS os seus próprios imóveis (filtro por
  //   corretor_id).
  // - Se um visitante (não logado) acede: vê apenas
  //   imóveis com status = 'disponivel'.
  // - Qualquer utilizador pode filtrar por status
  //   (?status=...).
  //
  // Como o optionalAuth já passou, req.user pode
  // ser um objeto (logado) ou null (visitante).
  // ===========================================
  async index(req, res) {
    try {
      const filters = {}
      if (req.query.status) {
        filters.status = req.query.status
      }
      if (req.user && (req.user.role === 'proprietario' || req.user.role === 'corretor')) {
        filters.corretor_id = req.user.id
      }
      if (!req.user) {
        filters.status = 'disponivel'
      }
      const properties = await Imovel.findAll(filters)
      res.json({ properties })
    } catch (error) {
      console.error('List error:', error)
      res.status(500).json({ error: 'Erro ao listar imóveis' })
    }
  }

  // ===========================================
  // MÉTODO: show()
  //
  // PROPÓSITO:
  // Mostrar os detalhes de um imóvel específico
  // pelo seu ID.
  //
  // FLUXO:
  // 1. Recebe o ID do imóvel nos parâmetros da URL
  //    (req.params.id).
  // 2. Chama Imovel.findById() que faz JOIN com a
  //    tabela usuarios para trazer dados do corretor.
  // 3. Se não existir, devolve 404.
  // 4. Devolve o imóvel como JSON.
  // ===========================================
  async show(req, res) {
    try {
      const property = await Imovel.findById(req.params.id)
      if (!property) {
        return res.status(404).json({ error: 'Imóvel não encontrado' })
      }
      res.json({ property })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar imóvel' })
    }
  }

  // ===========================================
  // MÉTODO: create()
  //
  // PROPÓSITO:
  // Registar um novo imóvel no sistema.
  //
  // FLUXO:
  // 1. Extrai os campos do corpo da requisição:
  //    titulo, descricao, preco, quartos, localizacao,
  //    imagem_url, galeria (array de fotos), tipo.
  // 2. Define o corretor_id: se o user está logado,
  //    usa o id dele; senão, usa o enviado no body.
  // 3. Valida campos obrigatórios (título e preço).
  // 4. Chama Imovel.create() que insere na BD.
  // 5. Devolve status 201 com o ID do novo imóvel.
  // ===========================================
  async create(req, res) {
    try {
      const { titulo, descricao, preco, quartos, localizacao, imagem_url, galeria, tipo } = req.body
      const corretor_id = req.user ? req.user.id : req.body.corretor_id

      if (!titulo || !preco) {
        return res.status(400).json({ error: 'Título e preço são obrigatórios' })
      }

      const id = await Imovel.create({ titulo, descricao, preco, quartos, localizacao, imagem_url, galeria, corretor_id, tipo })
      res.status(201).json({ message: 'Imóvel cadastrado com sucesso', id })
    } catch (error) {
      console.error('Create error:', error)
      res.status(500).json({ error: 'Erro ao cadastrar imóvel' })
    }
  }

  // ===========================================
  // MÉTODO: update()
  //
  // PROPÓSITO:
  // Atualizar os dados de um imóvel existente.
  //
  // FLUXO:
  // 1. Verifica se o imóvel existe (findById).
  // 2. Se não existir, devolve 404.
  // 3. Chama Imovel.update() que constrói dinamicamente
  //    o SET da query UPDATE com apenas os campos enviados.
  //    Isto permite atualizações parciais (PATCH-like).
  // 4. Devolve mensagem de sucesso.
  // ===========================================
  async update(req, res) {
    try {
      const property = await Imovel.findById(req.params.id)
      if (!property) {
        return res.status(404).json({ error: 'Imóvel não encontrado' })
      }
      await Imovel.update(req.params.id, req.body)
      res.json({ message: 'Imóvel atualizado com sucesso' })
    } catch (error) {
      console.error('Update error:', error)
      res.status(500).json({ error: 'Erro ao atualizar imóvel' })
    }
  }

  // ===========================================
  // MÉTODO: delete()
  //
  // PROPÓSITO:
  // Remover um imóvel e todos os seus agendamentos
  // associados.
  //
  // FLUXO:
  // 1. Verifica se o imóvel existe.
  // 2. Chama Imovel.delete() que:
  //    a. Apaga os agendamentos relacionados (FK).
  //    b. Apaga o próprio imóvel.
  // 3. Devolve mensagem de sucesso.
  //
  // NOTA:
  // A ordem importa: primeiro apagamos os agendamentos
  // (tabela filha) e depois o imóvel (tabela pai),
  // para evitar erros de chave estrangeira (FK).
  // ===========================================
  async delete(req, res) {
    try {
      const property = await Imovel.findById(req.params.id)
      if (!property) {
        return res.status(404).json({ error: 'Imóvel não encontrado' })
      }
      await Imovel.delete(req.params.id)
      res.json({ message: 'Imóvel removido com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover imóvel' })
    }
  }
}

// ===========================================
// EXPORTAÇÃO (INSTÂNCIA ÚNICA)
// Padrão singleton para o controlador.
// ===========================================
module.exports = new ImovelController()
