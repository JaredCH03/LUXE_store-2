// =====================================================
// UTILIDADES
// =====================================================

export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

export function showLoading(show) {
    const existingLoader = document.querySelector('.global-loader');
    if (show) {
        if (!existingLoader) {
            const loader = document.createElement('div');
            loader.className = 'global-loader';
            loader.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 9999;
            `;
            loader.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(loader);
        }
    } else {
        if (existingLoader) existingLoader.remove();
    }
}

export function showNotification(message, type = 'success') {
    // Usar el sistema unificado de notifications.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    }
}

export function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

export function getProductImage(product) {
    return product.image || product.imagen || product.image_url || '';
}