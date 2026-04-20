// =====================================================
// PÁGINA DE DETALLE DEL PRODUCTO - VERSIÓN FINAL
// =====================================================

let currentProduct = null;
let selectedSize = null;
let additionalImages = [];

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadProductDetail() {
    const productId = getProductIdFromUrl();
    if (!productId) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/products/${productId}`);
        const data = await res.json();
        
        if (data.success) {
            currentProduct = data.product;
            displayProductInfo();
        } else {
            throw new Error('Producto no encontrado');
        }

        const imagesRes = await fetch(`${API_URL}/products/${productId}/images`);
        const imagesData = await imagesRes.json();
        if (imagesData.success) {
            additionalImages = imagesData.images;
            displayThumbnails();
        }
    } catch (error) {
        console.error('Error al cargar producto:', error);
        showNotification('Producto no encontrado', 'error');
        setTimeout(() => { 
            window.location.href = '../index.html'; 
        }, 2000);
    }
}

function displayProductInfo() {
    document.title = `${currentProduct.name} | LUXE`;
    
    const nameEl = document.getElementById('productName');
    const priceEl = document.getElementById('productPrice');
    const descEl = document.getElementById('productDescription');
    
    if (nameEl) nameEl.textContent = currentProduct.name;
    if (priceEl) priceEl.textContent = `$${parseFloat(currentProduct.price).toFixed(2)}`;
    if (descEl) descEl.textContent = currentProduct.description || 'Sin descripción';
    
    const mainImg = document.getElementById('mainImage');
    if (mainImg) {
        mainImg.src = currentProduct.image || 'https://placehold.co/600x600/1a1a1a/c9a03d?text=LUXE';
        mainImg.onerror = () => { mainImg.src = 'https://placehold.co/600x600/1a1a1a/c9a03d?text=LUXE'; };
    }

    const sizes = currentProduct.sizes ? JSON.parse(currentProduct.sizes) : {};
    const sizeSection = document.getElementById('sizeSection');
    const sizeOptions = document.getElementById('sizeOptions');
    
    if (sizeSection && sizeOptions) {
        if (Object.keys(sizes).length > 0) {
            sizeSection.style.display = 'block';
            sizeOptions.innerHTML = '';
            for (const [size, stock] of Object.entries(sizes)) {
                const btn = document.createElement('div');
                btn.className = 'size-option';
                btn.textContent = size;
                btn.dataset.size = size;
                btn.dataset.stock = stock;
                if (stock > 0) {
                    btn.addEventListener('click', () => selectSize(size, btn));
                } else {
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.title = 'Sin stock';
                }
                sizeOptions.appendChild(btn);
            }
        } else {
            sizeSection.style.display = 'none';
        }
    }
    
    updateMetaTags(currentProduct);
}

function updateMetaTags(product) {
    const description = document.querySelector('meta[name="description"]');
    if (description) {
        description.setAttribute('content', `${product.name} - ${product.description || 'Producto exclusivo de LUXE'}`);
    }
}

function selectSize(size, element) {
    document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    selectedSize = size;
}

function displayThumbnails() {
    const container = document.getElementById('thumbnails');
    if (!container) return;
    container.innerHTML = '';
    
    if (currentProduct.image) {
        const thumb = createThumbnail(currentProduct.image);
        container.appendChild(thumb);
    }
    
    additionalImages.forEach(img => {
        const thumb = createThumbnail(img.image_url);
        container.appendChild(thumb);
    });
}

function createThumbnail(url) {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'thumbnail';
    img.addEventListener('click', () => {
        const mainImg = document.getElementById('mainImage');
        if (mainImg) mainImg.src = url;
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        img.classList.add('active');
    });
    return img;
}

async function addToCartWithSize() {
    if (!isLoggedIn()) {
        showNotification('🔐 Inicia sesión para agregar productos', 'warning');
        setTimeout(() => { window.location.href = '../cuenta/login.html'; }, 1500);
        return;
    }
    
    const sizes = currentProduct.sizes ? JSON.parse(currentProduct.sizes) : {};
    if (Object.keys(sizes).length > 0 && !selectedSize) {
        showNotification('📏 Por favor, selecciona una talla', 'warning');
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
    const existingIndex = cart.findIndex(item => 
        item.id === currentProduct.id && item.size === selectedSize
    );
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
        showNotification(`✨ ${currentProduct.name} (${selectedSize || 'Único'}) x${cart[existingIndex].quantity}`, 'success');
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: parseFloat(currentProduct.price),
            image: currentProduct.image,
            size: selectedSize || null,
            quantity: 1
        });
        showNotification(`🛍️ ${currentProduct.name}${selectedSize ? ` (Talla ${selectedSize})` : ''} agregado`, 'success');
    }
    
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
    
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
    
    if (window.cart) {
        window.cart.length = 0;
        cart.forEach(item => window.cart.push(item));
    }
    
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
}

function isLoggedIn() {
    return localStorage.getItem('luxe_token') !== null;
}

function showNotification(message, type) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.warn('Notificación:', message, type);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Detail.js inicializado');
    loadProductDetail();
    
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addToCartWithSize);
    }
});