const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Seguridad
app.use(helmet());

const globalLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { success: false, message: 'Demasiadas peticiones' } 
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    skipSuccessfulRequests: true, 
    message: { success: false, message: 'Demasiados intentos' } 
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS
const corsOptions = { origin: 'http://127.0.0.1:5500', credentials: true };
app.use(cors(corsOptions));

// Webhook de Stripe (DEBE ir antes de express.json())
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./routes/paymentRoutes'));

// Middlewares para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============ RUTAS ============
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error no capturado:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));