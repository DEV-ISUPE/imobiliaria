const Imovel = require('../models/Imovel')

class ImovelController {
  async index(req, res) {
    try {
      const properties = await Imovel.findAll()
      res.json({ properties })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar imóveis' })
    }
  }

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

  async create(req, res) {
    try {
      const { titulo, descricao, preco, quartos, localizacao, imagem_url } = req.body
      const corretor_id = req.body.corretor_id
      
      await Imovel.create({ titulo, descricao, preco, quartos, localizacao, imagem_url, corretor_id })
      res.status(201).json({ message: 'Imóvel cadastrado com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao cadastrar imóvel' })
    }
  }

  async delete(req, res) {
    try {
      await Imovel.delete(req.params.id)
      res.json({ message: 'Imóvel removido com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover imóvel' })
    }
  }
}

module.exports = new ImovelController()
