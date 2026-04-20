// =====================================================
// CONTROLADOR DE RESEÑAS
// =====================================================

const Review = require('../models/Review');

/**
 * Obtener reseñas de un producto
 */
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.getByProduct(productId);
        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Error obteniendo reseñas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reseñas' });
    }
};

/**
 * Crear o actualizar una reseña
 */
exports.createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;
        
        // Validar rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'La calificación debe ser entre 1 y 5' 
            });
        }
        
        // Verificar si el usuario puede reseñar (opcional)
        // const canReview = await Review.canUserReview(userId, productId);
        // if (!canReview) {
        //     return res.status(403).json({ 
        //         success: false, 
        //         message: 'Solo puedes reseñar productos que has comprado' 
        //     });
        // }
        
        const review = await Review.createOrUpdate({
            productId,
            userId,
            rating,
            comment: comment || ''
        });
        
        res.json({ 
            success: true, 
            message: 'Reseña guardada correctamente',
            review 
        });
    } catch (error) {
        console.error('Error creando reseña:', error);
        res.status(500).json({ success: false, message: 'Error al guardar reseña' });
    }
};

/**
 * Obtener la reseña del usuario actual para un producto
 */
exports.getMyReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
        
        const review = await Review.getUserReview(userId, productId);
        const canReview = await Review.canUserReview(userId, productId);
        
        res.json({ 
            success: true, 
            review: review || null,
            canReview 
        });
    } catch (error) {
        console.error('Error obteniendo reseña:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reseña' });
    }
};

/**
 * Eliminar una reseña
 */
exports.deleteReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
        
        await Review.delete(userId, productId);
        
        res.json({ success: true, message: 'Reseña eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminando reseña:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar reseña' });
    }
};