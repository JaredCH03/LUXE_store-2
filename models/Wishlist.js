const pool = require('../config/database');

class Wishlist {
    static async getByUser(userId) {
        const [rows] = await pool.execute(
            `SELECT w.*, p.name, p.price, p.image, p.category 
             FROM wishlist w
             JOIN products p ON w.product_id = p.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC`,
            [userId]
        );
        return rows;
    }
    
    static async add(userId, productId) {
        try {
            await pool.execute(
                'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
                [userId, productId]
            );
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return true; // Ya existe
            }
            throw error;
        }
    }
    
    static async remove(userId, productId) {
        await pool.execute(
            'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return true;
    }
    
    static async isInWishlist(userId, productId) {
        const [rows] = await pool.execute(
            'SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return rows.length > 0;
    }
    
    static async getCount(userId) {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?',
            [userId]
        );
        return rows[0].count;
    }
}

module.exports = Wishlist;