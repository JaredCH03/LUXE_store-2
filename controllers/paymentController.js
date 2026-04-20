// =====================================================
// CONTROLADOR DE PAGOS
// =====================================================

const paymentService = require('../services/paymentService');
const Order = require('../models/Order');

/**
 * Crear una sesión de checkout
 */
exports.createCheckoutSession = async (req, res) => {
    try {
        const { items, total, shippingAddress } = req.body;
        const userEmail = req.user.email;

        const orderData = { items, total, shippingAddress };
        const session = await paymentService.createCheckoutSession(orderData, userEmail);

        if (session.success) {
            res.json({ 
                success: true, 
                sessionId: session.sessionId,
                url: session.url 
            });
        } else {
            res.status(400).json({ success: false, message: session.error });
        }
    } catch (error) {
        console.error('Error en createCheckoutSession:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Crear un Payment Intent (para Stripe Elements)
 */
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount } = req.body;
        const paymentIntent = await paymentService.createPaymentIntent(amount);

        if (paymentIntent.success) {
            res.json({ 
                success: true, 
                clientSecret: paymentIntent.clientSecret 
            });
        } else {
            res.status(400).json({ success: false, message: paymentIntent.error });
        }
    } catch (error) {
        console.error('Error en createPaymentIntent:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Verificar sesión de pago
 */
exports.verifySession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await paymentService.getSession(sessionId);

        if (session.success) {
            res.json({ success: true, session: session.session });
        } else {
            res.status(400).json({ success: false, message: session.error });
        }
    } catch (error) {
        console.error('Error en verifySession:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Webhook de Stripe
 */
exports.stripeWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    const result = await paymentService.handleWebhook(signature, payload);

    if (result.success) {
        res.json({ received: true });
    } else {
        res.status(400).json({ error: result.error });
    }
};