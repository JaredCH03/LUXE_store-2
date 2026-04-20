// =====================================================
// RUTAS DE PAGOS
// =====================================================

const express = require('express');
const { 
    createCheckoutSession, 
    createPaymentIntent, 
    verifySession,
    stripeWebhook 
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Webhook de Stripe (NO requiere autenticación, usa raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Rutas protegidas
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/create-payment-intent', protect, createPaymentIntent);
router.get('/verify-session/:sessionId', protect, verifySession);

module.exports = router;