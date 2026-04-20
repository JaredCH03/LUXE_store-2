// =====================================================
// HISTORIAL DE PEDIDOS
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = '../cuenta/login.html';
        return;
    }
    
    await loadOrders();
});

async function loadOrders() {
    const container = document.getElementById('ordersList');
    
    try {
        container.innerHTML = '<div class="loading-spinner"></div>';
        
        const token = getToken();
        const res = await fetch(`${API_URL}/orders/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.success && data.orders.length > 0) {
            renderOrders(data.orders);
        } else {
            container.innerHTML = `
                <div class="empty-orders">
                    <div style="font-size:3rem; margin-bottom:1rem;">📭</div>
                    <h3>No tienes pedidos aún</h3>
                    <p>¡Explora nuestra tienda y haz tu primera compra!</p>
                    <a href="tienda.html" class="checkout-btn" style="display:inline-block; margin-top:1rem; text-decoration:none;">
                        Ir a la Tienda
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        container.innerHTML = '<p style="text-align:center; color:#f44336;">Error al cargar los pedidos</p>';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    
    container.innerHTML = orders.map(order => {
        const statusClass = `status-${order.status || 'completed'}`;
        const statusText = {
            pending: 'Pendiente',
            paid: 'Pagado',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado',
            completed: 'Completado'
        }[order.status] || 'Completado';
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <span class="order-number">#${order.order_number}</span>
                        <div class="order-date">${new Date(order.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}</div>
                    </div>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.image || 'https://via.placeholder.com/60'}" 
                                 class="order-item-image" 
                                 onerror="this.src='https://via.placeholder.com/60'">
                            <div class="order-item-info">
                                <div class="order-item-name">${item.name}</div>
                                <div class="order-item-details">
                                    Cantidad: ${item.quantity}
                                    ${item.size ? ` | Talla: ${item.size}` : ''}
                                </div>
                            </div>
                            <div class="order-item-price">$${parseFloat(item.price).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">Total: $${parseFloat(order.total).toFixed(2)}</div>
                    <button class="btn-track" onclick="trackOrder('${order.order_number}')">
                        Seguimiento
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function trackOrder(orderNumber) {
    showNotification(`🔍 Seguimiento del pedido #${orderNumber}`, 'info');
    // Aquí se puede implementar una página de seguimiento
}

function showNotification(message, type) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}