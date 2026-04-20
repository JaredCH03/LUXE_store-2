// =====================================================
// MODELO DE USUARIO - OPERACIONES EN TABLA "users"
// =====================================================

const pool = require('../config/database');
const bcrypt = require('bcryptjs');  // Para encriptar y comparar contraseñas

class User {
    /**
     * Crear un nuevo usuario en la base de datos
     * @param {Object} param0 - Datos del usuario
     * @param {string} param0.name - Nombre completo
     * @param {string} param0.email - Correo electrónico
     * @param {string} param0.password - Contraseña en texto plano
     * @param {string} param0.role - 'customer' o 'seller' (por defecto 'customer')
     * @returns {Object} - Usuario recién creado (sin contraseña)
     */
    static async create({ name, email, password, role = 'customer' }) {
        // Encriptar la contraseña con bcrypt (10 rondas)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar registro en la tabla 'users'
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        
        // Retornar el objeto del usuario (sin la contraseña encriptada)
        return { id: result.insertId, name, email, role };
    }

    /**
     * Buscar un usuario por su email
     * @param {string} email 
     * @returns {Object|null} - Usuario encontrado o null
     */
    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, password, created_at FROM users WHERE email = ?',
            [email]
        );
        return rows[0];   // undefined si no existe
    }

    /**
     * Buscar un usuario por su ID
     * @param {number} id 
     * @returns {Object|null} - Usuario (sin contraseña)
     */
    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    /**
     * Comparar una contraseña en texto plano con su hash almacenado
     * @param {string} password - Contraseña ingresada
     * @param {string} hashedPassword - Hash guardado en la BD
     * @returns {boolean} - true si coinciden
     */
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // recuperar contraseña

static async saveResetToken(userId, token, expiry) {
    await pool.execute(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
        [token, expiry, userId]
    );
}

static async findByResetToken(token) {
    const [rows] = await pool.execute(
        'SELECT id, name, email, reset_token_expiry FROM users WHERE reset_token = ?',
        [token]
    );
    return rows[0];
}

static async updatePassword(userId, hashedPassword) {
    await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
    );
}

static async clearResetToken(userId) {
    await pool.execute(
        'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [userId]
    );
}
}


module.exports = User;