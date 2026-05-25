// ===========================================
// CONFIGURAÇÃO DO ROUTER DO EXPRESS
//
// express.Router() cria um objeto que permite
// agrupar rotas relacionadas. Depois exportamos
// este router e o registamos no servidor principal
// (server.js) com app.use('/api', router).
// Assim, todas as rotas ficam sob o prefixo /api.
// ===========================================
const express = require('express')
const router = express.Router()

// ===========================================
// IMPORTAÇÃO DE MIDDLEWARES E CONTROLADORES
//
// Middlewares:
// - auth: exige token JWT válido
// - optionalAuth: se houver token, usa-o; senão, segue
// - requireRole: verifica se o utilizador tem uma role específica
//
// Controladores: contêm a lógica de cada rota.
// UploadController: lida com upload de imagens (multer).
// ===========================================
const { auth, optionalAuth, requireRole } = require('../middlewares/auth')
const authController = require('../controllers/AuthController')
const propertyController = require('../controllers/ImovelController')
const appointmentController = require('../controllers/AgendamentoController')
const userController = require('../controllers/UsuarioController')
const { upload, uploadHandler, handleMulterError } = require('../controllers/UploadController')

// ===========================================
// ROTAS DE AUTENTICAÇÃO  (/api/auth/*)
//
// register (POST):
//   Cria um novo utilizador (corretor/admin).
//   Devolve token JWT para login automático.
//
// login (POST):
//   Valida email + password e devolve token JWT.
//
// me (GET) — protegida por auth:
//   Devolve os dados do utilizador atual com base
//   no token JWT enviado no cabeçalho Authorization.
// ===========================================
router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/auth/me', auth, authController.me)

// ===========================================
// ROTAS DE UTILIZADORES  (/api/users/*)
//
// index (GET) — admin apenas:
//   Lista todos os utilizadores do sistema.
//
// show (GET) — autenticado:
//   Mostra os dados de um utilizador específico.
//
// update (PUT) — admin apenas:
//   Atualiza os dados de um utilizador.
// ===========================================
router.get('/users', auth, requireRole('admin'), userController.index)
router.get('/users/:id', auth, userController.show)
router.put('/users/:id', auth, requireRole('admin'), userController.update)

// ===========================================
// ROTAS DE IMÓVEIS  (/api/properties/*)
//
// index (GET) — opcionalmente autenticada:
//   Lista imóveis. Se o utilizador for corretor,
//   vê apenas os seus. Visitantes veem só disponíveis.
//
// show (GET):
//   Mostra detalhes de um imóvel específico (público).
//
// create (POST) — autenticado:
//   Regista um novo imóvel no sistema.
//
// update (PUT) — autenticado:
//   Edita os dados de um imóvel.
//
// delete (DELETE) — autenticado:
//   Remove um imóvel (e os seus agendamentos).
// ===========================================
router.get('/properties', optionalAuth, propertyController.index)
router.get('/properties/:id', propertyController.show)
router.post('/properties', auth, propertyController.create)
router.put('/properties/:id', auth, propertyController.update)
router.delete('/properties/:id', auth, propertyController.delete)

// ===========================================
// ROTA DE UPLOAD DE IMAGENS  (/api/upload)
//
// upload.array('images', 10): middleware do multer
//   que aceita até 10 ficheiros no campo "images".
// uploadHandler: processa os ficheiros e devolve
//   as URLs de cada um.
// handleMulterError: captura erros do multer
//   (ex.: ficheiro demasiado grande, formato inválido).
// ===========================================
router.post('/upload', auth, upload.array('images', 10), uploadHandler, handleMulterError)

// ===========================================
// ROTAS DE AGENDAMENTOS  (/api/appointments/*)
//
// create (POST):
//   Público — qualquer visitante pode agendar
//   uma visita a um imóvel.
//
// listAll (GET) — autenticado:
//   Admin vê todos os agendamentos.
//   Corretor vê apenas os dos seus imóveis.
//
// listByProperty (GET) — autenticado:
//   Lista agendamentos de um imóvel específico.
//
// updateStatus (PATCH) — autenticado:
//   Altera o estado do agendamento
//   (ex.: "pendente" → "confirmado").
//
// delete (DELETE) — autenticado:
//   Remove um agendamento.
// ===========================================
router.post('/appointments', appointmentController.create)
router.get('/appointments', auth, appointmentController.listAll)
router.get('/appointments/property/:imovel_id', auth, appointmentController.listByProperty)
router.patch('/appointments/:id/status', auth, appointmentController.updateStatus)
router.delete('/appointments/:id', auth, appointmentController.delete)

// ===========================================
// EXPORTAÇÃO DO ROUTER
// Este router é importado em server.js e montado
// sob o prefixo /api.
// ===========================================
module.exports = router
