// ===========================================
// IMPORTAÇÃO DO JSON WEB TOKEN (JWT)
//
// JWT é um padrão (RFC 7519) que permite transmitir
// informações entre partes como um objeto JSON
// assinado digitalmente. É usado aqui para:
// 1. Autenticar utilizadores sem guardar sessão no servidor
// 2. Transportar dados do utilizador (id, nome, role)
//    de forma segura dentro do token
//
// JWT_SECRET: é a "chave secreta" usada para ASSINAR
// e VERIFICAR os tokens. Se alguém descobrir esta
// chave, pode forjar tokens. Por isso está no .env.
// ===========================================
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'maison-huambo-secret-key-2024'

// ===========================================
// MIDDLEWARE: auth()
//
// PROPÓSITO:
// Garantir que o utilizador está autenticado antes
// de aceder a uma rota protegida.
//
// COMO FUNCIONA:
// 1. Lê o cabeçalho "Authorization" da requisição HTTP.
// 2. Se não existir, devolve erro 401 (não autorizado).
// 3. Extrai o token (formato: "Bearer <token>" ou só "<token>").
// 4. Verifica se o token é válido usando jwt.verify().
//    - Se válido: coloca os dados do utilizador em req.user
//      e chama next() para prosseguir para a rota.
//    - Se inválido (expirado, adulterado): devolve erro 401.
//
// PARÂMETROS:
// req  - objeto da requisição (Request)
// res  - objeto da resposta (Response)
// next - função que chama o próximo middleware/rota
//
// RETORNO: chama next() ou devolve erro JSON.
//
// NOTA DIDÁTICA:
// req.user fica disponível em TODOS os middlewares
// e rotas seguintes porque o Express passa o mesmo
// objeto req em cadeia. É assim que partilhamos dados
// entre middlewares.
// ===========================================
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

// ===========================================
// MIDDLEWARE: optionalAuth()
//
// PROPÓSITO:
// Tal como o auth(), mas não bloqueia se não houver
// token. Útil para rotas que se comportam de forma
// diferente conforme o utilizador está ou não logado.
//
// COMO FUNCIONA:
// 1. Lê o cabeçalho Authorization.
// 2. Se não existir, define req.user = null e segue.
// 3. Se existir, tenta verificar o token.
//    - Se válido: coloca os dados no req.user.
//    - Se inválido: define req.user = null (não bloqueia).
// 4. Chama next() em qualquer caso.
//
// EXEMPLO DE USO:
// Na listagem de imóveis: se user for corretor, vê
// os seus imóveis; se for visitante, vê só disponíveis.
// ===========================================
function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header) {
    req.user = null
    return next()
  }
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  try {
    req.user = jwt.verify(token, JWT_SECRET)
  } catch {
    req.user = null
  }
  next()
}

// ===========================================
// MIDDLEWARE FACTORY: requireRole()
//
// PROPÓSITO:
// Restringir acesso a utilizadores com determinadas
// funções (roles). É uma "fábrica de middlewares" —
// uma função que RETORNA outra função.
//
// COMO FUNCIONA:
// 1. Recebe uma lista de roles permitidas (ex.: 'admin').
// 2. Retorna um middleware que:
//    a. Verifica se req.user existe (senão, 401).
//    b. Verifica se a role do user está na lista (senão, 403).
//    c. Se tudo ok, chama next().
//
// USO DE SPREAD OPERATOR (...roles):
// Permite passar múltiplos argumentos:
// requireRole('admin', 'corretor') — aceita ambos.
//
// CÓDIGO 403 vs 401:
// - 401: "não autenticado" — não sabemos quem é.
// - 403: "proibido" — sabemos quem é, mas não tem permissão.
// ===========================================
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão negada' })
    }
    next()
  }
}

// ===========================================
// EXPORTAÇÃO
// Exportamos as três funções para uso nas rotas.
// A sintaxe com chaves {} é "destructuring" na
// importação: const { auth, optionalAuth, requireRole }
// ===========================================
module.exports = { auth, optionalAuth, requireRole }
