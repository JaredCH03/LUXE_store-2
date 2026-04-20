// =====================================================
// MÓDULO DE CARRITO
// =====================================================

import { showNotification, escapeHtml } from './utils.js';

let cart = [];

export function initCart() {
    loadCart();
    return { cart, updateCartUI, addToCart, goToCheckout };
}

function loadCart() {
    const saved = localStorage.getItem('luxe_cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
            window.cart = cart;
        } catch (e) {
            console.error('Error al cargar carrito:', e);
            cart = [];
        }
    }
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
    window.cart = cart;
}

export function updateCartUI() {
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = count;

    const total = cart.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = formatPrice(total);

    renderCartItems();
    saveCart();
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (!cart || cart.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;">🛒 Carrito vacío</div>';
        return;
    }

    container.innerHTML = cart.map((item, idx) => {
        const price = parseFloat(item.price) || 0;
        const quantity = item.quantity || 1;
        const totalItemPrice = price * quantity;
        const sizeDisplay = item.size ? `<div class="cart-item-size">📏 Talla: ${item.size}</div>` : '';
        const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'%3E%3Crect width='70' height='70' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3E${encodeURIComponent(item.name)}%3C/text%3E%3C/svg%3E`;
        const imageUrl = item.image && item.image !== '' ? item.image : placeholderSvg;

        return `
            <div class="cart-item" data-id="${item.id}" data-size="${item.size || ''}" data-index="${idx}">
                <img src="${imageUrl}" class="cart-item-image" onerror="this.onerror=null; this.src='${placeholderSvg}'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${formatPrice(price)}</div>
                    ${sizeDisplay}
                    <div class="cart-item-actions">
                        <button class="qty-btn" data-action="decrease" data-index="${idx}">−</button>
                        <span class="qty-value">${quantity}</span>
                        <button class="qty-btn" data-action="increase" data-index="${idx}">+</button>
                        <button class="remove-btn" data-index="${idx}" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div style="font-weight:600;">${formatPrice(totalItemPrice)}</div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityClick);
    });
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', handleRemoveClick);
    });
}

function handleQuantityClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const index = parseInt(btn.dataset.index);

    if (isNaN(index) || !cart[index]) return;

    const change = action === 'increase' ? 1 : -1;
    const newQty = (cart[index].quantity || 1) + change;

    if (newQty <= 0) {
        const removedItem = cart[index];
        cart.splice(index, 1);
        showNotification(`🗑️ ${removedItem.name} eliminado del carrito`, 'info');
    } else {
        cart[index].quantity = newQty;
        showNotification(`✨ Cantidad actualizada`, 'success');
    }
    updateCartUI();
}

function handleRemoveClick(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index);
    if (isNaN(index) || !cart[index]) return;

    const productName = cart[index].name;
    cart.splice(index, 1);
    updateCartUI();
    showNotification(`🗑️ ${productName} eliminado del carrito`, 'info');
}

export async function addToCart(id) {
    if (!isLoggedIn()) {
        showNotification('🔐 Inicia sesión para agregar productos', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/products/${id}`);
        const data = await res.json();

        if (data.success) {
            const p = data.product;
            const exist = cart.find(i => i.id === id && !i.size);

            if (exist) {
                exist.quantity = (exist.quantity || 1) + 1;
                showNotification(`✨ ${p.name} (x${exist.quantity}) actualizado`, 'success');
            } else {
                cart.push({
                    id: p.id,
                    name: p.name,
                    price: parseFloat(p.price),
                    quantity: 1,
                    image: getProductImage(p),
                    size: null
                });
                showNotification(`🛍️ ${p.name} agregado al carrito`, 'success');
            }

            // Animaciones del carrito
            animateCart();
            updateCartUI();
        }
    } catch (err) {
        console.error('Error al agregar producto:', err);
        showNotification('❌ Error al agregar producto', 'error');
    }
}

function animateCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartCount = document.getElementById('cartCount');

    if (cartBtn) {
        cartBtn.classList.add('shake');
        setTimeout(() => cartBtn.classList.remove('shake'), 500);
    }

    if (cartCount) {
        cartCount.classList.add('pulse');
        setTimeout(() => cartCount.classList.remove('pulse'), 300);
    }
}

export function goToCheckout() {
    if (!isLoggedIn()) {
        showNotification('🔐 Por favor, inicia sesión para continuar', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    if (!cart || cart.length === 0) {
        showNotification('🛒 Tu carrito está vacío', 'info');
        return;
    }

    localStorage.setItem('checkout_cart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

// Helpers
function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

function getProductImage(product) {
    return product.image || product.imagen || product.image_url || '';
}

function isLoggedIn() {
    return typeof window.isLoggedIn === 'function' ? window.isLoggedIn() : !!localStorage.getItem('luxe_token');
}