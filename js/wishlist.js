// =====================================================
// SISTEMA DE WISHLIST / FAVORITOS - CORREGIDO
// =====================================================

let wishlistProductId = null;
let isInWishlist = false;

document.addEventListener('DOMContentLoaded', () => {
    wishlistProductId = getProductIdFromUrl();
    
    if (wishlistProductId && checkLoginStatus()) {
        // NO REDIRIGIR - Solo verificar estado
        checkWishlistStatus();
        initWishlistButton();
    }
});

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function checkLoginStatus() {
    const token = localStorage.getItem('luxe_token');
    return token !== null;
}

async function checkWishlistStatus() {
    try {
        const token = getTokenLocal();
        const res = await fetch(`${API_URL}/wishlist/check/${wishlistProductId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.success) {
            isInWishlist = data.inWishlist;
            updateWishlistButton();
        }
    } catch (error) {
        console.error('Error verificando wishlist:', error);
    }
}

function updateWishlistButton() {
    const btn = document.getElementById('wishlistBtn');
    if (btn) {
        btn.classList.toggle('active', isInWishlist);
        btn.title = isInWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos';
    }
}

function initWishlistButton() {
    const btn = document.getElementById('wishlistBtn');
    if (!btn) return;
    
    btn.addEventListener('click', async () => {
        if (!checkLoginStatus()) {
            notify('Inicia sesión para guardar favoritos', 'warning');
            return;
        }
        
        try {
            const token = getTokenLocal();
            const method = isInWishlist ? 'DELETE' : 'POST';
            
            const res = await fetch(`${API_URL}/wishlist/${wishlistProductId}`, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            
            if (data.success) {
                isInWishlist = !isInWishlist;
                updateWishlistButton();
                notify(
                    isInWishlist ? '❤️ Agregado a favoritos' : '💔 Eliminado de favoritos',
                    'success'
                );
            }
        } catch (error) {
            console.error('Error actualizando wishlist:', error);
            notify('Error al actualizar favoritos', 'error');
        }
    });
}

function notify(message, type) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    }
}

function getTokenLocal() {
    const token = localStorage.getItem('luxe_token');
    if (token) return token;
    
    if (typeof window.getToken === 'function') {
        return window.getToken();
    }
    
    return null;
}