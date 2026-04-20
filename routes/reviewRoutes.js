// =====================================================
// RUTAS DE RESEÑAS
// =====================================================

const express = require('express');
const {
    getProductReviews,
    createReview,
    getMyReview,
    deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas
router.get('/product/:productId', getProductReviews);

// Rutas protegidas
router.get('/my/:productId', protect, getMyReview);
router.post('/product/:productId', protect, createReview);
router.delete('/product/:productId', protect, deleteReview);

module.exports = router;