// =====================================================
// SERVICIO DE PAGOS - STRIPE
// =====================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    /**
     * Crear una sesión de pago de Stripe
     */
    async createCheckoutSession(orderData, customerEmail) {
        try {
            const lineItems = orderData.items.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        ...(item.size && { description: `Talla: ${item.size}` })
                    },
                    unit_amount: Math.round(item.price * 100) // Stripe usa centavos
                },
                quantity: item.quantity
            }));

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/checkout.html?canceled=true`,
                customer_email: customerEmail,
                metadata: {
                    order_items: JSON.stringify(orderData.items.map(i => i.id))
                },
                shipping_address_collection: {
                    allowed_countries: ['US', 'MX', 'ES', 'NI', 'CR', 'PA']
                }
            });

            return { success: true, sessionId: session.id, url: session.url };
        } catch (error) {
            console.error('Error creando sesión de Stripe:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar el estado de una sesión de pago
     */
    async getSession(sessionId) {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            return { 
                success: true, 
                session,
                paymentStatus: session.payment_status,
                customerEmail: session.customer_details?.email,
                shippingAddress: session.shipping_details?.address
            };
        } catch (error) {
            console.error('Error obteniendo sesión:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Crear un Payment Intent (para Stripe Elements)
     */
    async createPaymentIntent(amount, currency = 'usd') {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: currency,
                automatic_payment_methods: { enabled: true }
            });

            return { 
                success: true, 
                clientSecret: paymentIntent.client_secret,
                id: paymentIntent.id
            };
        } catch (error) {
            console.error('Error creando PaymentIntent:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Manejar webhook de Stripe
     */
    async handleWebhook(signature, payload) {
        try {
            const event = stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object);
                    break;
                case 'payment_intent.succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    console.log('Pago fallido:', event.data.object.id);
                    break;
            }

            return { success: true, event };
        } catch (error) {
            console.error('Error en webhook:', error);
            return { success: false, error: error.message };
        }
    }

    async handleCheckoutCompleted(session) {
        console.log('✅ Checkout completado:', session.id);
        // Aquí se puede crear la orden automáticamente
    }

    async handlePaymentSucceeded(paymentIntent) {
        console.log('✅ Pago exitoso:', paymentIntent.id);
    }
}

module.exports = new PaymentService();