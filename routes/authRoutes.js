const express = require('express');
const { 
    register, 
    login, 
    getMe, 
    validateRegister, 
    validateLogin,
    forgotPassword,    // ← Asegúrate de que existe en authController.js
    resetPassword      // ← Asegúrate de que existe en authController.js
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Autenticación básica
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);

// Recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;