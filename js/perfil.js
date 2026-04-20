// =====================================================
// PERFIL DE USUARIO
// =====================================================

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = '../cuenta/login.html';
        return;
    }
    
    currentUser = getCurrentUser();
    loadUserProfile();
    initTabs();
    initForms();
    loadOrders();
});

function loadUserProfile() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userInitial').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('fullName').value = currentUser.name || '';
    document.getElementById('email').value = currentUser.email || '';
    
    // Formatear fecha
    if (currentUser.created_at) {
        const date = new Date(currentUser.created_at);
        document.getElementById('memberSince').textContent = date.toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });
}

function initForms() {
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedData = {
            name: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value
        };
        
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });
            
            const data = await res.json();
            
            if (data.success) {
                // Actualizar localStorage
                currentUser.name = updatedData.name;
                localStorage.setItem('luxe_user', JSON.stringify(currentUser));
                showNotification('✅ Perfil actualizado correctamente', 'success');
                loadUserProfile();
            } else {
                showNotification(data.message || 'Error al actualizar', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
        }
    });
    
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await res.json();
            
            if (data.success) {
                showNotification('✅ Contraseña actualizada', 'success');
                document.getElementById('passwordForm').reset();
            } else {
                showNotification(data.message || 'Error al cambiar contraseña', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
        }
    });
}

async function loadOrders() {
    try {
        const token = getToken();
        const res = await fetch(`${API_URL}/orders/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.success) {
            renderOrders(data.orders);
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No tienes pedidos aún</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <strong>Pedido #${order.order_number}</strong>
                    <div style="font-size:0.85rem; color:#666;">
                        ${new Date(order.created_at).toLocaleDateString()}
                    </div>
                </div>
                <span class="order-status status-${order.status || 'completed'}">
                    ${order.status || 'Completado'}
                </span>
            </div>
            <div style="margin-bottom:1rem;">
                ${order.items.map(item => `
                    <div style="display:flex; justify-content:space-between; padding:0.3rem 0;">
                        <span>${item.name} x${item.quantity}</span>
                        <span>$${item.price.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div style="text-align:right; font-weight:600; border-top:1px solid #ddd; padding-top:1rem;">
                Total: $${parseFloat(order.total).toFixed(2)}
            </div>
        </div>
    `).join('');
}

function showNotification(message, type) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}