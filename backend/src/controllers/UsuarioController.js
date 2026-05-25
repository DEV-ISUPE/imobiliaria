// ===========================================
// IMPORTAÇÃO DO MODELO USUARIO
//
// Usuario é o modelo que representa a tabela
// 'usuarios' na base de dados.
// findAll(), findById(), update().
// ===========================================
const Usuario = require('../models/Usuario')

// ===========================================
// CLASSE: UsuarioController
//
// Controlador responsável pela gestão de
// utilizadores (CRUD básico). Apenas administradores
// podem listar e editar utilizadores.
//
// NOTA:
// A criação de utilizadores é feita pelo
// AuthController.register(). Este controller
// foca-se na administração (listar, ver, editar).
// ===========================================
class UsuarioController {
  // ===========================================
  // MÉTODO: index()
  //
  // PROPÓSITO:
  // Listar todos os utilizadores do sistema.
  // Acesso restrito a administradores (requireRole('admin')).
  //
  // Retorna: id, nome, email, role, telefone, created_at
  // (NUNCA retorna a password_hash, por segurança).
  //
  // A query SQL no modelo exclui explicitamente
  // o campo password_hash — nunca devemos expor
  // passwords, mesmo que hashed!
  // ===========================================
  async index(req, res) {
    try {
      const users = await Usuario.findAll()
      res.json({ users })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar usuários' })
    }
  }

  // ===========================================
  // MÉTODO: show()
  //
  // PROPÓSITO:
  // Mostrar os dados de um utilizador específico
  // pelo seu ID.
  //
  // FLUXO:
  // 1. Recebe o ID nos parâmetros da URL.
  // 2. Chama Usuario.findById() que retorna tudo
  //    exceto a password_hash.
  // 3. Se não existir, devolve 404.
  // 4. Devolve os dados do utilizador.
  //
  // NOTA:
  // Esta rota usa apenas o middleware auth() —
  // qualquer utilizador autenticado pode ver
  // o perfil de outro. Isto é útil para, por
  // exemplo, mostrar o corretor responsável
  // por um imóvel.
  // ===========================================
  async show(req, res) {
    try {
      const user = await Usuario.findById(req.params.id)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }
      res.json({ user })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuário' })
    }
  }

  // ===========================================
  // MÉTODO: update()
  //
  // PROPÓSITO:
  // Atualizar os dados de um utilizador.
  // Apenas administradores podem usar esta rota.
  //
  // FLUXO:
  // 1. Verifica se o utilizador existe.
  // 2. Chama Usuario.update() que constrói o SET
  //    dinamicamente com apenas os campos enviados.
  // 3. Devolve mensagem de sucesso.
  //
  // CAMPOS EDITÁVEIS:
  // nome, email, role, telefone.
  // A password NÃO é alterada por aqui — existe
  // uma rota específica para isso (se implementada).
  // ===========================================
  async update(req, res) {
    try {
      const user = await Usuario.findById(req.params.id)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }
      await Usuario.update(req.params.id, req.body)
      res.json({ message: 'Usuário atualizado com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar usuário' })
    }
  }
}

// ===========================================
// EXPORTAÇÃO (INSTÂNCIA ÚNICA)
// ===========================================
module.exports = new UsuarioController()
