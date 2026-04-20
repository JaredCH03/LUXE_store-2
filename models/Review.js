// =====================================================
// MODELO DE RESEÑAS
// =====================================================

const pool = require('../config/database');

class Review {
    /**
     * Crear o actualizar una reseña
     */
    static async createOrUpdate(review) {
        const { productId, userId, rating, comment } = review;
        
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // Insertar o actualizar reseña
            const [result] = await connection.execute(
                `INSERT INTO reviews (product_id, user_id, rating, comment) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 rating = VALUES(rating), 
                 comment = VALUES(comment)`,
                [productId, userId, rating, comment]
            );
            
            // Actualizar promedio del producto
            await this.updateProductRating(connection, productId);
            
            await connection.commit();
            return { id: result.insertId, productId, userId, rating, comment };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    /**
     * Actualizar rating promedio del producto
     */
    static async updateProductRating(connection, productId) {
        const [avgResult] = await connection.execute(
            `SELECT AVG(rating) as avg_rating, COUNT(*) as total 
             FROM reviews WHERE product_id = ?`,
            [productId]
        );
        
        const avgRating = avgResult[0].avg_rating || 0;
        const totalReviews = avgResult[0].total || 0;
        
        await connection.execute(
            `UPDATE products SET avg_rating = ?, total_reviews = ? WHERE id = ?`,
            [avgRating, totalReviews, productId]
        );
    }
    
    /**
     * Obtener reseñas de un producto
     */
    static async getByProduct(productId) {
        const [rows] = await pool.execute(
            `SELECT r.*, u.name as user_name 
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC`,
            [productId]
        );
        return rows;
    }
    
    /**
     * Verificar si un usuario puede reseñar (ha comprado el producto)
     */
/**
 * Verificar si un usuario puede reseñar (ha comprado el producto)
 */
static async canUserReview(userId, productId) {
    const [rows] = await pool.execute(
        `SELECT COUNT(*) as count 
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('paid', 'shipped', 'delivered', 'completed')`,
        [userId, productId]
    );
    return rows[0].count > 0;
}
    
    /**
     * Obtener reseña de un usuario para un producto
     */
    static async getUserReview(userId, productId) {
        const [rows] = await pool.execute(
            `SELECT * FROM reviews WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );
        return rows[0] || null;
    }
    
    /**
     * Eliminar una reseña
     */
    static async delete(userId, productId) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            await connection.execute(
                'DELETE FROM reviews WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );
            
            await this.updateProductRating(connection, productId);
            
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Review;