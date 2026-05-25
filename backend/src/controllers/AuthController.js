// ===========================================
// IMPORTAÇÃO DE DEPENDÊNCIAS
//
// Usuario: modelo que representa a tabela 'usuarios'
//   na base de dados. Contém métodos como findByEmail(),
//   findById(), create().
//
// bcrypt: biblioteca para encriptar (hash) passwords.
//   Nunca guardamos passwords em texto puro!
//   O hash é uma via única — não dá para reverter.
//
// jwt: jsonwebtoken — cria e verifica tokens JWT
//   para autenticação sem estado (stateless).
// ===========================================
const Usuario = require('../models/Usuario')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// ===========================================
// CHAVE SECRETA DO JWT
// Usada para assinar e verificar tokens.
// Em produção, deve estar apenas no .env.
// ===========================================
const JWT_SECRET = process.env.JWT_SECRET || 'maison-huambo-secret-key-2024'

// ===========================================
// CLASSE: AuthController
//
// Controlador responsável pela autenticação:
// registo, login e consulta do perfil atual.
//
// Cada método corresponde a uma rota e segue o
// padrão (req, res) => { ... } exigido pelo Express.
//
// NOTA: Usamos uma CLASS em vez de funções soltas
// para organizar melhor o código. O controller é
// exportado como instância única (singleton).
// ===========================================
class AuthController {
  // ===========================================
  // MÉTODO: register()
  //
  // PROPÓSITO:
  // Criar uma nova conta de utilizador (corretor ou admin).
  //
  // FLUXO:
  // 1. Extrai nome, email, password, role e telefone do corpo
  //    da requisição (req.body).
  // 2. Valida campos obrigatórios (nome, email, password).
  // 3. Verifica se já existe um utilizador com esse email.
  // 4. Cria o hash da password com bcrypt (10 rounds de salt).
  // 5. Insere o novo utilizador na BD via Usuario.create().
  // 6. Gera um token JWT com os dados do utilizador.
  // 7. Devolve status 201 (Created) com token e dados do user.
  //
  // PORQUE 10 ROUNDS DE SALT?
  // O número de rounds (custo computacional) torna mais
  // lento para um atacante testar passwords. 10 é um
  // bom equilíbrio entre segurança e performance.
  //
  // EXPIRESIN: '7d'
  // O token expira em 7 dias. Após esse prazo, o user
  // precisa de fazer login novamente.
  // ===========================================
  async register(req, res) {
    try {
      const { nome, email, password, role, telefone } = req.body

      if (!nome || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
      }

      const existingUser = await Usuario.findByEmail(email)
      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' })
      }

      const password_hash = await bcrypt.hash(password, 10)
      const userId = await Usuario.create({ nome, email, password_hash, role: role || 'corretor', telefone })

      const token = jwt.sign(
        { id: userId, nome, email, role: role || 'corretor' },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        token,
        user: { id: userId, nome, email, role: role || 'corretor' }
      })
    } catch (error) {
      console.error('Register error:', error)
      res.status(500).json({ error: 'Erro ao criar usuário' })
    }
  }

  // ===========================================
  // MÉTODO: login()
  //
  // PROPÓSITO:
  // Autenticar um utilizador existente e devolver
  // um token JWT para as requisições seguintes.
  //
  // FLUXO:
  // 1. Extrai email e password do corpo da requisição.
  // 2. Valida se ambos foram enviados.
  // 3. Procura o utilizador pelo email na BD.
  // 4. Se não encontrar, devolve erro 401 (genérico:
  //    "Credenciais inválidas" — não diz se foi o email
  //    ou a password, por segurança).
  // 5. Compara a password enviada com o hash guardado
  //    usando bcrypt.compare().
  // 6. Se não coincidir, devolve 401.
  // 7. Se tudo ok, gera um token JWT e devolve-o juntamente
  //    com os dados do utilizador.
  //
  // SEGURANÇA:
  // A mensagem "Credenciais inválidas" é propositadamente
  // genérica para não dar pistas sobre qual campo está errado.
  // ===========================================
  async login(req, res) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' })
      }

      const user = await Usuario.findByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' })
      }

      const validPassword = await bcrypt.compare(password, user.password_hash)
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' })
      }

      const token = jwt.sign(
        { id: user.id, nome: user.nome, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: { id: user.id, nome: user.nome, email: user.email, role: user.role, telefone: user.telefone }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Erro ao fazer login' })
    }
  }

  // ===========================================
  // MÉTODO: me()
  //
  // PROPÓSITO:
  // Devolver os dados do utilizador atualmente autenticado
  // com base no token JWT enviado.
  //
  // FLUXO:
  // 1. O middleware auth() já verificou o token e colocou
  //    os dados em req.user (nome, email, role, id).
  // 2. Usamos req.user.id para buscar o registo completo
  //    na BD (excluindo password_hash).
  // 3. Se o utilizador foi entretanto apagado, devolve 404.
  // 4. Devolve os dados como JSON.
  //
  // NOTA:
  // Como o token pode ter até 7 dias, o user pode estar
  // autenticado mas o registo já não existir na BD.
  // Por isso fazemos a verificação extra com findById().
  // ===========================================
  async me(req, res) {
    try {
      const user = await Usuario.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }
      res.json({ user })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar perfil' })
    }
  }
}

// ===========================================
// EXPORTAÇÃO (INSTÂNCIA ÚNICA)
// Exportamos uma instância única de AuthController
// (new AuthController()) — é o padrão Singleton.
// Isto significa que todos os módulos que fizerem
// require() recebem o mesmo objeto e podem chamar
// authController.register(), authController.login(), etc.
// ===========================================
module.exports = new AuthController()
