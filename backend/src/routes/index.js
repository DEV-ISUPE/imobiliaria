const express = require('express')
const router = express.Router()
const authController = require('../controllers/AuthController')
const propertyController = require('../controllers/ImovelController')
const appointmentController = require('../controllers/AgendamentoController')

// Auth routes
router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)

// Property routes
router.get('/properties', propertyController.index)
router.get('/properties/:id', propertyController.show)
router.post('/properties', propertyController.create)
router.delete('/properties/:id', propertyController.delete)

// Appointment routes
router.post('/appointments', appointmentController.create)
router.get('/appointments/property/:imovel_id', appointmentController.listByProperty)

module.exports = router
