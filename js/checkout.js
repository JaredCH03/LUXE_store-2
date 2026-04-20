// =====================================================
// CHECKOUT - LÓGICA DE PAGO CORREGIDA
// =====================================================

let cart = [];
let stripe = null;

// ============ INICIALIZACIÓN ============

/**
 * Inicializa Stripe
 */
function initStripe() {
    // Usar clave pública de config.js o variable de entorno
    const stripePublicKey = window.STRIPE_PUBLIC_KEY || 'pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(stripePublicKey);
        console.log('✅ Stripe inicializado');
    } else {
        console.warn('⚠️ Stripe no está disponible');
    }
}

// ============ NOTIFICACIONES ============

/**
 * Muestra una notificación flotante
 */
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#2196f3',
        warning: '#ff9800'
    };

    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 10000;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
        max-width: 350px;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// ============ CARRITO ============

/**
 * Obtiene el carrito del localStorage
 */
function getCart() {
    try {
        const saved = localStorage.getItem('checkout_cart');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Error al leer carrito:', e);
        return [];
    }
}

/**
 * Muestra el resumen del pedido
 */
function displaySummary() {
    cart = getCart();
    const container = document.getElementById('orderItems');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');

    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;">🛒 Carrito vacío</p>';
        subtotalEl.textContent = '$0.00';
        totalEl.textContent = '$10.00';
        return;
    }

    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const total = subtotal + 10;

    container.innerHTML = cart.map(i => {
        const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3E${encodeURIComponent(i.name || 'Producto')}%3C/text%3E%3C/svg%3E`;
        const imgSrc = (i.image && i.image !== '') ? i.image : placeholderSvg;

        return `
            <div class="order-item">
                <img src="${imgSrc}" class="order-item-image" onerror="this.onerror=null; this.src='${placeholderSvg}'">
                <div class="order-item-info">
                    <div class="order-item-name">${escapeHtml(i.name)}</div>
                    <div class="order-item-price">$${i.price.toFixed(2)}</div>
                    <div class="order-item-quantity">Cantidad: ${i.quantity}</div>
                    ${i.size ? `<div class="order-item-size">📏 Talla: ${i.size}</div>` : ''}
                </div>
                <div style="font-weight:600;">$${(i.price * i.quantity).toFixed(2)}</div>
            </div>
        `;
    }).join('');

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

// ============ FORMULARIO ============

/**
 * Muestra/oculta campos de tarjeta según método de pago
 */
function toggleCardFields() {
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const cardFields = document.getElementById('cardFields');
    if (cardFields) {
        cardFields.style.display = method === 'credit_card' ? 'block' : 'none';
    }
}

/**
 * Valida el formulario de envío
 */
function validateForm() {
    const email = document.getElementById('email')?.value?.trim();
    const fullName = document.getElementById('fullName')?.value?.trim();
    const address = document.getElementById('address')?.value?.trim();
    const city = document.getElementById('city')?.value?.trim();
    const phone = document.getElementById('phone')?.value?.trim();
    
    if (!email) {
        showNotification('Por favor, ingresa tu correo electrónico', 'warning');
        return false;
    }
    
    if (!fullName) {
        showNotification('Por favor, ingresa tu nombre completo', 'warning');
        return false;
    }
    
    if (!address) {
        showNotification('Por favor, ingresa tu dirección', 'warning');
        return false;
    }
    
    if (!city) {
        showNotification('Por favor, ingresa tu ciudad', 'warning');
        return false;
    }
    
    if (!phone) {
        showNotification('Por favor, ingresa tu teléfono', 'warning');
        return false;
    }
    
    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Por favor, ingresa un correo electrónico válido', 'warning');
        return false;
    }
    
    return true;
}

// ============ VALIDACIÓN DE STOCK ============

/**
 * Valida que haya stock suficiente (usando endpoint optimizado)
 */
async function validateStock() {
    const cart = getCart();
    if (cart.length === 0) return false;

    try {
        const token = getToken();
        const res = await fetch(`${API_URL}/products/check-stock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cart.map(i => ({
                    id: i.id,
                    quantity: i.quantity,
                    size: i.size || null
                }))
            })
        });

        const data = await res.json();

        if (!data.success) {
            showNotification('Error al verificar disponibilidad', 'error');
            return false;
        }

        if (!data.valid) {
            const issues = data.issues.map(i => 
                `❌ ${i.name}${i.size ? ` (Talla ${i.size})` : ''}: Solo ${i.available} disponible(s)`
            ).join('\n');
            showNotification(issues, 'error');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validando stock:', error);
        showNotification('Error al verificar disponibilidad', 'error');
        return false;
    }
}

// ============ PROCESAMIENTO DE PAGOS ============

/**
 * Procesa pagos simulados (tarjeta, paypal, transferencia)
 */
async function processSimulatedPayment(method, total) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simular éxito (95% de probabilidad)
            const isSuccess = Math.random() < 0.95;
            
            if (isSuccess) {
                resolve({
                    success: true,
                    transactionId: 'SIM_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    message: 'Pago procesado exitosamente'
                });
            } else {
                reject(new Error('Error al procesar el pago. Intenta nuevamente.'));
            }
        }, 2000);
    });
}

/**
 * Crea la orden en el backend
 */
async function createOrder(paymentMethod, transactionId = null) {
    const cart = getCart();
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const total = subtotal + 10;
    
    const orderData = {
        items: cart.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            size: i.size || null
        })),
        total: total,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        shippingAddress: {
            fullName: document.getElementById('fullName').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city')?.value || '',
            zipCode: document.getElementById('zipCode')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email').value
        }
    };
    
    const token = getToken();
    const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
    });
    
    const data = await res.json();
    
    if (!data.success) {
        throw new Error(data.message || 'Error al crear la orden');
    }
    
    return data;
}

/**
 * Procesa el pago principal
 */
async function processPayment(e) {
    e.preventDefault();
    
    const payBtn = document.getElementById('payBtn');
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;

    if (!method) {
        showNotification('Selecciona un método de pago', 'warning');
        return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Verificando...';

    try {
        // 1. Validar stock
        const stockValid = await validateStock();
        if (!stockValid) {
            payBtn.disabled = false;
            payBtn.textContent = 'Pagar ahora';
            return;
        }

        payBtn.textContent = 'Procesando...';
        const cart = getCart();
        
        if (cart.length === 0) {
            throw new Error('Carrito vacío');
        }

        const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        const total = subtotal + 10;

        // 2. Procesar según método de pago
        if (method === 'stripe') {
            // Stripe Checkout
            const token = getToken();
            const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: cart.map(i => ({
                        id: i.id,
                        name: i.name,
                        quantity: i.quantity,
                        price: i.price,
                        size: i.size
                    })),
                    total: total
                })
            });

            const data = await res.json();

            if (data.success) {
                // Limpiar carrito antes de redirigir
                localStorage.removeItem('checkout_cart');
                localStorage.removeItem('luxe_cart');
                window.location.href = data.url;
            } else {
                throw new Error(data.message || 'Error al crear sesión de pago');
            }
        } else {
            // Métodos simulados
            payBtn.textContent = 'Procesando pago...';
            
            const result = await processSimulatedPayment(method, total);
            
            if (result.success) {
                // Crear orden en el backend
                const order = await createOrder(method, result.transactionId);
                
                // Limpiar carritos
                localStorage.removeItem('checkout_cart');
                localStorage.removeItem('luxe_cart');
                
                showNotification('✅ ¡Pedido realizado con éxito!', 'success');
                setTimeout(() => {
                    window.location.href = `../checkout/payment-success.html?orderId=${order.order.orderNumber}`;
                }, 1500);
            }
        }
    } catch (err) {
        console.error('Error en pago:', err);
        showNotification('❌ ' + err.message, 'error');
        payBtn.disabled = false;
        payBtn.textContent = 'Pagar ahora';
    }
}

// ============ INICIALIZACIÓN ============

document.addEventListener('DOMContentLoaded', () => {
    console.log('🛒 Inicializando checkout...');
    
    // Inicializar Stripe
    initStripe();
    
    // Verificar autenticación
    if (!isLoggedIn()) {
        showNotification('Debes iniciar sesión para acceder al checkout', 'warning');
        setTimeout(() => {
            window.location.href = '../cuenta/login.html';
        }, 1500);
        return;
    }

    // Verificar carrito
    const cart = getCart();
    if (!cart || cart.length === 0) {
        showNotification('🛒 No hay productos en tu carrito', 'info');
        setTimeout(() => {
            window.location.href = '../lujo/tienda.html';
        }, 1500);
        return;
    }

    // Mostrar resumen
    displaySummary();
    toggleCardFields();

    // Event listeners
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', toggleCardFields);
    });

    const form = document.getElementById('paymentForm');
    if (form) {
        form.addEventListener('submit', processPayment);
    }
    
    console.log('✅ Checkout inicializado');
});