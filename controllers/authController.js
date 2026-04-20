const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

exports.validateRegister = [
    body('name').trim().isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres').escape(),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role').optional().isIn(['customer', 'seller']).withMessage('Rol inválido')
];

exports.validateLogin = [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es requerida')
];

exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { name, email, password, role = 'customer' } = req.body;
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El email ya está registrado' });
        }
        const user = await User.create({ name, email, password, role });
        const token = generateToken(user.id);
        res.status(201).json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
        const isValid = await User.comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
        const token = generateToken(user.id);
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error en getMe:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/*Recuperacion de contraseña*/ 

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configurar transporte de email (usar Mailtrap para pruebas)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'No existe una cuenta con este correo' 
            });
        }
        
        // Generar token de recuperación
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
        
        // Guardar token en la base de datos
        await User.saveResetToken(user.id, resetToken, resetTokenExpiry);
        
        // Enviar email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
        
        await transporter.sendMail({
            from: '"LUXE Store" <noreply@luxestore.com>',
            to: email,
            subject: 'Recuperación de Contraseña - LUXE',
            html: `
                <h2>Recupera tu contraseña</h2>
                <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitaste este cambio, ignora este mensaje.</p>
            `
        });
        
        res.json({ 
            success: true, 
            message: 'Se ha enviado un enlace de recuperación a tu correo' 
        });
    } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// Restablecer contraseña
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        
        // Validar token
        const user = await User.findByResetToken(token);
        
        if (!user || user.reset_token_expiry < new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token inválido o expirado' 
            });
        }
        
        // Actualizar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.updatePassword(user.id, hashedPassword);
        await User.clearResetToken(user.id);
        
        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};