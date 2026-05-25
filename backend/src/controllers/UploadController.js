// ===========================================
// IMPORTAÇÃO DE DEPENDÊNCIAS
//
// multer: middleware para upload de ficheiros
//   no Express. Lida com multipart/form-data.
//
// path: módulo nativo do Node para manipular
//   caminhos de ficheiros (extensões, diretórios).
//
// crypto: módulo nativo para criptografia.
//   Usamos randomBytes() para gerar nomes
//   aleatórios e evitar conflitos de ficheiros.
// ===========================================
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

// ===========================================
// CONFIGURAÇÃO DE ARMAZENAMENTO (DiskStorage)
//
// destination: pasta onde os ficheiros são salvos.
//   Usamos path.join(__dirname, '..', '..', 'uploads')
//   que corresponde a /backend/uploads/
//
// filename: função que define o nome do ficheiro
//   no disco. Usamos crypto.randomBytes(16) para
//   gerar 16 bytes aleatórios → 32 caracteres hex.
//   Isto garante nomes únicos e evita:
//   - Conflitos (dois users enviarem "foto.jpg")
//   - Problemas de segurança (nomes previsíveis)
//   Mantemos a extensão original do ficheiro.
// ===========================================
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = crypto.randomBytes(16).toString('hex')
    cb(null, `${name}${ext}`)
  }
})

// ===========================================
// CONFIGURAÇÃO DO MULTER
//
// storage: usa a configuração definida acima.
//
// limits: define o tamanho máximo do ficheiro.
//   10 * 1024 * 1024 = 10 megabytes (em bytes).
//
// fileFilter: função que valida o tipo de ficheiro.
//   Só permite imagens: jpg, jpeg, png, gif, webp.
//   Se o formato não for permitido, chamamos
//   cb(new Error(...)) que o multer trata como
//   erro e passa para o middleware de erro.
// ===========================================
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowed.includes(ext)) {
      return cb(new Error('Formato não permitido. Use: jpg, png, gif, webp'))
    }
    cb(null, true)
  }
})

// ===========================================
// MIDDLEWARE: uploadHandler()
//
// PROPÓSITO:
// Processar os ficheiros já validados pelo multer
// e devolver as URLs públicas de cada um.
//
// FLUXO:
// 1. Acede a req.files — array de objetos com
//    dados dos ficheiros (colocado pelo multer).
// 2. Se não houver ficheiros, devolve erro 400.
// 3. Mapeia cada ficheiro para a URL relativa:
//    /uploads/<nome_aleatorio>.ext
// 4. Devolve o array de URLs como JSON.
//
// NOTA:
// O prefixo /uploads é servido estaticamente
// pelo Express em server.js:
//   app.use('/uploads', express.static(...))
// ===========================================
function uploadHandler(req, res) {
  const files = req.files
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Nenhum ficheiro enviado' })
  }
  const urls = files.map(f => `/uploads/${f.filename}`)
  res.json({ urls })
}

// ===========================================
// MIDDLEWARE DE ERRO: handleMulterError()
//
// PROPÓSITO:
// Capturar e tratar erros específicos do multer
// de forma elegante, devolvendo JSON em vez de
// HTML ou mensagens genéricas.
//
// ASSINATURA ESPECIAL (err, req, res, next):
// No Express, middlewares de erro têm 4 parâmetros.
// O primeiro (err) contém o erro lançado.
// Se um middleware normal chamar next(err),
// o Express salta todos os middlewares normais
// e procura o próximo middleware de erro (4 params).
//
// TIPOS DE ERRO:
// - multer.MulterError: erros específicos do multer
//   (ex.: LIMIT_FILE_SIZE — ficheiro demasiado grande).
// - Outros erros: mensagem genérica do fileFilter.
//
// next() sem argumentos: passa para o próximo
// middleware normal (se não houve erro).
// ===========================================
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Ficheiro demasiado grande. Máximo 10MB.' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err) {
    return res.status(400).json({ error: err.message })
  }
  next()
}

// ===========================================
// EXPORTAÇÃO
// Exportamos três elementos:
// - upload: configuração do multer (usado como middleware)
// - uploadHandler: processa os ficheiros e devolve URLs
// - handleMulterError: trata erros do upload
//
// São usados nas rotas:
//   router.post('/upload', auth, upload.array(...), uploadHandler, handleMulterError)
// ===========================================
module.exports = { upload, uploadHandler, handleMulterError }
