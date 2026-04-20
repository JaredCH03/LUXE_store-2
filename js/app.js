// =====================================================
// app.js - LUXE STORE - VERSIÓN COMPLETA Y ORDENADA
// =====================================================

// ============ VARIABLES GLOBALES ============
window.cart = [];
window.cartTotal = 0;

let cart = window.cart;
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

// Variables para búsqueda y filtros
let allProducts = [];
let filteredProducts = [];
let currentFilters = {
    search: '',
    category: '',
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
    sortBy: 'default'
};

// ============ FUNCIONES DE UTILIDAD ============

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

/**
 * Muestra u oculta el loader global
 */
function showLoading(show) {
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

/**
 * Muestra una notificación flotante
 */
function showNotification(message, type = 'success') {
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

// Asegurar que showNotification esté disponible globalmente
window.showNotification = showNotification;

// ============ FUNCIONES DE API ============

/**
 * Obtiene productos paginados desde la API
 */
async function fetchProducts(page = 1) {
    if (isLoading) return [];
    isLoading = true;
    try {
        const res = await fetch(`${API_URL}/products?page=${page}&limit=12`);
        const data = await res.json();
        if (data.success) {
            currentPage = data.pagination.page;
            totalPages = data.pagination.totalPages;
            return data.products;
        }
        throw new Error('API error');
    } catch (err) {
        console.warn('Error al cargar productos:', err);
        return [];
    } finally {
        isLoading = false;
    }
}

/**
 * Carga todos los productos para filtros locales
 */
async function loadAllProducts() {
    try {
        // Mostrar skeletons en todas las categorías
        ['cadenasGrid', 'anillosGrid', 'zapatosGrid'].forEach(gridId => {
            renderSkeletons(gridId, 6);
        });
        
        showLoading(true);
        const res = await fetch(`${API_URL}/products?page=1&limit=100`);
        const data = await res.json();
        if (data.success) {
            allProducts = data.products || [];
            console.log(`📦 ${allProducts.length} productos cargados`);
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        allProducts = [];
    } finally {
        showLoading(false);
    }
}

// ============ FUNCIONES DE RENDERIZADO ============
/**
 * Renderiza skeletons mientras cargan los productos
 */
function renderSkeletons(containerId, count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="product-info">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-price"></div>
                    <div class="skeleton-button"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}
/**
 * Renderiza productos en una categoría específica
 */

function renderCategory(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:2rem;">No hay productos en esta categoría</p>';
        return;
    }

    container.innerHTML = products.map(p => {
        const productName = p.name || 'Producto';
        const encodedName = encodeURIComponent(productName);
        
        // ESCAPAR COMILLAS SIMPLES
        const placeholder = `data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 viewBox=%270 0 300 300%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%23f0f0f0%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23999%27 font-size=%2716%27%3E${encodedName}%3C/text%3E%3C/svg%3E`;
        
        const imgSrc = (p.image && p.image !== '' && p.image !== 'null' && p.image !== 'undefined') 
            ? p.image 
            : placeholder;
        
        const outOfStock = !p.stock || p.stock <= 0;
        const escapedName = escapeHtml(productName);
        
        return `
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
                <div style="position: relative;">
                    <img src="${imgSrc}" alt="${escapedName}" class="product-image" onerror="this.src='${placeholder}'">
                    ${outOfStock ? '<span class="out-of-stock-badge">Agotado</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${escapedName}</h3>
                    <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})" ${outOfStock ? 'disabled' : ''}>
                        ${outOfStock ? 'Agotado' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
/**
 * Renderiza productos filtrados por categorías
 */
function renderFilteredProducts() {
    const cadenas = filteredProducts.filter(p => p.category === 'cadenas');
    const anillos = filteredProducts.filter(p => p.category === 'anillos');
    const zapatos = filteredProducts.filter(p => p.category === 'zapatos');
    const perfumes = filteredProducts.filter(p => p.category === 'perfumes');

    renderCategory(cadenas, 'cadenasGrid');
    renderCategory(anillos, 'anillosGrid');
    renderCategory(zapatos, 'zapatosGrid');
    renderCategory(perfumes, 'perfumesGrid');

    toggleSectionVisibility('cadenas', cadenas.length > 0);
    toggleSectionVisibility('anillos', anillos.length > 0);
    toggleSectionVisibility('zapatos', zapatos.length > 0);
    toggleSectionVisibility('perfumes', perfumes.length > 0); 
}

/**
 * Muestra u oculta una sección de categoría
 */
function toggleSectionVisibility(category, hasProducts) {
    const section = document.getElementById(category);
    if (section) {
        section.style.display = hasProducts ? 'block' : 'none';
    }
}

/**
 * Renderiza productos con paginación
 */
async function renderProducts(page = 1) {
    const products = await fetchProducts(page);
    const cadenas = products.filter(p => p.category === 'cadenas');
    const anillos = products.filter(p => p.category === 'anillos');
    const zapatos = products.filter(p => p.category === 'zapatos');

    const cadenasSection = document.getElementById('cadenas');
    const anillosSection = document.getElementById('anillos');
    const zapatosSection = document.getElementById('zapatos');

    if (cadenasSection) {
        cadenasSection.style.display = cadenas.length > 0 ? 'block' : 'none';
        renderCategory(cadenas, 'cadenasGrid');
    }
    if (anillosSection) {
        anillosSection.style.display = anillos.length > 0 ? 'block' : 'none';
        renderCategory(anillos, 'anillosGrid');
    }
    if (zapatosSection) {
        zapatosSection.style.display = zapatos.length > 0 ? 'block' : 'none';
        renderCategory(zapatos, 'zapatosGrid');
    }
    renderPaginationControls();
}

/**
 * Renderiza controles de paginación
 */
function renderPaginationControls() {
    let paginationContainer = document.getElementById('paginationControls');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationControls';
        paginationContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        `;
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.appendChild(paginationContainer);
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let buttons = '';
    if (currentPage > 1) {
        buttons += `<button class="pagination-btn" data-page="${currentPage - 1}" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Anterior</button>`;
    }

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
        const activeStyle = i === currentPage ? 'background: #c9a03d; color: white; border-color: #c9a03d;' : '';
        buttons += `<button class="pagination-btn" data-page="${i}" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer; ${activeStyle}">${i}</button>`;
    }

    if (currentPage < totalPages) {
        buttons += `<button class="pagination-btn" data-page="${currentPage + 1}" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Siguiente</button>`;
    }

    paginationContainer.innerHTML = buttons;
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const newPage = parseInt(btn.dataset.page);
            if (!isNaN(newPage) && newPage !== currentPage) {
                await renderProducts(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}


// ============ FILTROS BAR - PREMIUM ============
function initFiltersBar() {
    const categoryBtns = document.querySelectorAll('[data-category]');
    const sortBtns = document.querySelectorAll('[data-sort]');
    const inStockCheck = document.getElementById('quickInStock');
    const clearBtn = document.getElementById('quickClearFilters');
    
    // Categorías
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentFilters.category = category;
            
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) categoryFilter.value = category;
            
            applyFilters();
        });
    });
    
    // Ordenamiento
    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sort = btn.dataset.sort;
            
            sortBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentFilters.sortBy = sort;
            
            const sortBy = document.getElementById('sortBy');
            if (sortBy) sortBy.value = sort;
            
            applyFilters();
        });
    });
    
    // Stock
    if (inStockCheck) {
        inStockCheck.addEventListener('change', () => {
            currentFilters.inStockOnly = inStockCheck.checked;
            
            const inStockOnly = document.getElementById('inStockOnly');
            if (inStockOnly) inStockOnly.checked = inStockCheck.checked;
            
            applyFilters();
        });
    }
    
    // Limpiar
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearAllFilters();
            
            categoryBtns.forEach(b => b.classList.remove('active'));
            categoryBtns[0]?.classList.add('active');
            
            sortBtns.forEach(b => b.classList.remove('active'));
            sortBtns[0]?.classList.add('active');
            
            if (inStockCheck) inStockCheck.checked = false;
        });
    }
    
    // Sincronizar
    window.syncFiltersBar = function() {
        categoryBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === currentFilters.category);
        });
        
        sortBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentFilters.sortBy);
        });
        
        if (inStockCheck) {
            inStockCheck.checked = currentFilters.inStockOnly;
        }
    };
    
    const originalApply = applyFilters;
    applyFilters = function() {
        originalApply();
        if (window.syncFiltersBar) window.syncFiltersBar();
    };
}

// Actualizar breadcrumb de categoría
/*function updateBreadcrumbCategory() {
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    const categoryName = document.getElementById('categoryName');
    
    if (breadcrumbCategory && categoryName) {
        const categoryMap = {
            'cadenas': 'Cadenas',
            'anillos': 'Anillos',
            'zapatos': 'Zapatos',
            'perfumes':'Perfumes'
        };
        
        if (currentFilters.category && categoryMap[currentFilters.category]) {
            breadcrumbCategory.style.display = 'inline';
            categoryName.textContent = categoryMap[currentFilters.category];
        } else {
            breadcrumbCategory.style.display = 'none';
        }
    }
}*/
/**
 * Aplica todos los filtros y actualiza la UI
 */
function applyFilters() {
    // Animación de filtrado
    const productsGrid = document.querySelector('.products-grid');
    if (productsGrid) {
        productsGrid.classList.add('filtering');
        setTimeout(() => {
            productsGrid.classList.remove('filtering');
        }, 400);
    }

    // Filtrar productos
    filteredProducts = allProducts.filter(product => {
        // Filtro por búsqueda (nombre o descripción)
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const nameMatch = (product.name || '').toLowerCase().includes(searchTerm);
            const descMatch = (product.description || '').toLowerCase().includes(searchTerm);
            if (!nameMatch && !descMatch) return false;
        }

        // Filtro por categoría
        if (currentFilters.category && product.category !== currentFilters.category) {
            return false;
        }

        // Filtro por precio mínimo
        if (currentFilters.minPrice !== null && product.price < currentFilters.minPrice) {
            return false;
        }

        // Filtro por precio máximo
        if (currentFilters.maxPrice !== null && product.price > currentFilters.maxPrice) {
            return false;
        }

        // Filtro por stock
        if (currentFilters.inStockOnly && (!product.stock || product.stock <= 0)) {
            return false;
        }

        return true;
    });

    // Ordenar productos
    sortProducts();

    // Renderizar
    renderFilteredProducts();
    updateResultsCount();
}

/**
 * Ordena los productos filtrados
 */
function sortProducts() {
    switch (currentFilters.sortBy) {
        case 'price_asc':
            filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price_desc':
            filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'best_selling':
            filteredProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
            break;
        default:
            filteredProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            break;
    }
}

/**
 * Actualiza el contador de resultados
 */
function updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        if (filteredProducts.length === 0) {
            countEl.innerHTML = '<p style="text-align: center; color: #999;">😕 No se encontraron productos</p>';
        } else {
            countEl.textContent = `${filteredProducts.length} producto(s) encontrado(s)`;
        }
    }
}

/**
 * Limpia todos los filtros
 */
function clearAllFilters() {
    currentFilters = {
        search: '',
        category: '',
        minPrice: null,
        maxPrice: null,
        inStockOnly: false,
        sortBy: 'default'
    };

    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const inStockOnly = document.getElementById('inStockOnly');
    const sortBy = document.getElementById('sortBy');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';
    if (inStockOnly) inStockOnly.checked = false;
    if (sortBy) sortBy.value = 'default';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';

    applyFilters();
    showNotification('✨ Filtros limpiados', 'info');
}

// ============ FUNCIONES DEL CARRITO ============

/**
 * Guarda el carrito en localStorage
 */
function saveCart() {
    localStorage.setItem('luxe_cart', JSON.stringify(window.cart));
}

/**
 * Carga el carrito desde localStorage
 */
function loadCart() {
    const saved = localStorage.getItem('luxe_cart');
    if (saved) {
        try {
            window.cart = JSON.parse(saved);
            cart = window.cart;
            updateCartUI();
        } catch (e) {
            console.error('Error al cargar carrito:', e);
            window.cart = [];
            cart = [];
        }
    }
}

/**
 * Actualiza la UI del carrito
 */
function updateCartUI() {
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = count;

    const total = cart.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    renderCartItems();
    saveCart();
}

/**
 * Renderiza los items del carrito
 */
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
                    <div class="cart-item-price">$${price.toFixed(2)}</div>
                    ${sizeDisplay}
                    <div class="cart-item-actions">
                        <button class="qty-btn" data-action="decrease" data-index="${idx}">−</button>
                        <span class="qty-value">${quantity}</span>
                        <button class="qty-btn" data-action="increase" data-index="${idx}">+</button>
                        <button class="remove-btn" data-index="${idx}" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div style="font-weight:600;">$${totalItemPrice.toFixed(2)}</div>
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

/**
 * Maneja el clic en cantidad (+/-)
 */
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

/**
 * Maneja el clic en eliminar
 */
function handleRemoveClick(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index);
    if (isNaN(index) || !cart[index]) return;

    const productName = cart[index].name;
    cart.splice(index, 1);
    updateCartUI();
    showNotification(`🗑️ ${productName} eliminado del carrito`, 'info');
}

/**
 * Agrega un producto al carrito
 */
window.addToCart = async function (id) {
    if (!isLoggedIn()) {
        showNotification('🔐 Inicia sesión para agregar productos', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
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
                    image: p.image || p.imagen,
                    size: null
                });
                showNotification(`🛍️ ${p.name} agregado al carrito`, 'success');
            }

            // Animación del botón en la tarjeta
            const productCard = document.querySelector(`.product-card[onclick*="${id}"]`);
            if (productCard) {
                const addBtn = productCard.querySelector('.add-to-cart');
                if (addBtn && !addBtn.disabled) {
                    addBtn.classList.add('success');
                    addBtn.textContent = '✓ Agregado';

                    setTimeout(() => {
                        addBtn.classList.remove('success');
                        addBtn.textContent = 'Agregar al carrito';
                    }, 1500);
                }
            }

            // Animación del carrito
            const cartBtn = document.getElementById('cartBtn');
            const cartCount = document.getElementById('cartCount');

            console.log('🛒 cartBtn:', cartBtn);
            console.log('🔢 cartCount:', cartCount);

            if (cartBtn) {
                cartBtn.classList.add('shake');
                console.log('✅ Clase shake agregada');
                setTimeout(() => {
                    cartBtn.classList.remove('shake');
                    console.log('🔄 Clase shake removida');
                }, 500);
            } else {
                console.warn('⚠️ No se encontró #cartBtn');
            }

            if (cartCount) {
                cartCount.classList.add('pulse');
                console.log('✅ Clase pulse agregada');
                setTimeout(() => {
                    cartCount.classList.remove('pulse');
                    console.log('🔄 Clase pulse removida');
                }, 300);
            } else {
                console.warn('⚠️ No se encontró #cartCount');
            }
            updateCartUI();
        }
    } catch (err) {
        console.error('Error al agregar producto:', err);
        showNotification('❌ Error al agregar producto', 'error');
    }
};

/**
 * Redirige al checkout
 */
function goToCheckout() {
    if (!isLoggedIn()) {
        showNotification('🔐 Por favor, inicia sesión para continuar', 'warning');
        setTimeout(() => {
            window.location.href = '../cuenta/login.html';
        }, 1500);
        return;
    }

    if (!cart || cart.length === 0) {
        showNotification('🛒 Tu carrito está vacío', 'info');
        return;
    }

    localStorage.setItem('checkout_cart', JSON.stringify(cart));
    window.location.href = '../checkout/checkout.html';
}

// ============ FUNCIONES DE UI Y NAVEGACIÓN ============

/**
 * Actualiza la UI según el estado de autenticación
 */
function updateUserUI() {
    const user = getCurrentUser();
    const loggedIn = document.querySelectorAll('.logged-in-only');
    const loggedOut = document.querySelectorAll('.logged-out-only');

    if (user) {
        loggedIn.forEach(el => el.style.display = 'inline-block');
        loggedOut.forEach(el => el.style.display = 'none');
        const userName = user.name || user.nombre || 'Usuario';
        document.querySelectorAll('.user-name').forEach(el => el.textContent = userName.split(' ')[0]);
    } else {
        loggedIn.forEach(el => el.style.display = 'none');
        loggedOut.forEach(el => el.style.display = 'inline-block');
    }
}

/**
 * Inicializa el menú de usuario
 */
function initUserMenu() {
    const btn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardLink = document.getElementById('dashboardLink');
    const ordersLink = document.getElementById('ordersLink');

    const user = getCurrentUser();
    if (dashboardLink && user && user.role === 'seller') {
        dashboardLink.style.display = 'block';
        dashboardLink.href = 'dashboard/index.html';
    }

    if (ordersLink) {
        ordersLink.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('📦 Funcionalidad en desarrollo', 'info');
        });
    }

    if (btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        window.addEventListener('click', (e) => {
            if (!btn.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof logout === 'function') {
                logout();
            } else {
                localStorage.removeItem('luxe_token');
                localStorage.removeItem('luxe_user');
                localStorage.removeItem('luxe_cart');
                window.location.href = 'login.html';
            }
        });
    }
}

/**
 * Inicializa el modal del carrito
 */
function initCartModal() {
    const modal = document.getElementById('cartModal');
    const cartBtn = document.getElementById('cartBtn');
    const close = document.querySelector('.close-modal');

    if (cartBtn && modal) {
        cartBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            renderCartItems();
        });
    }
    if (close && modal) {
        close.addEventListener('click', () => modal.style.display = 'none');
    }
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
}

/**
 * Inicializa el botón de checkout
 */
function initCheckoutButton() {
    const btn = document.getElementById('checkoutBtn');
    if (btn) btn.addEventListener('click', goToCheckout);
}

/**
 * Inicializa el menú móvil
 */
function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('navMenu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.textContent = menu.classList.contains('active') ? '✕' : '☰';
        });
        menu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                toggle.textContent = '☰';
            });
        });
    }
}

/**
 * Inicializa el panel de búsqueda desplegable
 */
function initSearchPanel() {
    const searchToggle = document.getElementById('searchToggleBtn');
    const searchPanel = document.getElementById('searchPanel');
    const closeSearch = document.getElementById('closeSearchBtn');
    const overlay = document.getElementById('searchOverlay');

    function openSearchPanel() {
        if (searchPanel) searchPanel.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }

    function closeSearchPanel() {
        if (searchPanel) searchPanel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (searchToggle) searchToggle.addEventListener('click', openSearchPanel);
    if (closeSearch) closeSearch.addEventListener('click', closeSearchPanel);
    if (overlay) overlay.addEventListener('click', closeSearchPanel);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchPanel && searchPanel.classList.contains('active')) {
            closeSearchPanel();
        }
    });
}

/**
 * Inicializa los eventos de búsqueda y filtros
 */
function initSearchAndFilters() {
    let searchTimeout;

    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const inStockOnly = document.getElementById('inStockOnly');
    const sortBy = document.getElementById('sortBy');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // Búsqueda con debounce
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (clearSearchBtn) clearSearchBtn.style.display = value ? 'block' : 'none';

            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = value;
                applyFilters();
            }, 300);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                currentFilters.search = '';
                applyFilters();
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            currentFilters.search = '';
            applyFilters();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            applyFilters();
        });
    }

    if (minPrice) {
        minPrice.addEventListener('input', (e) => {
            currentFilters.minPrice = e.target.value ? parseFloat(e.target.value) : null;
            applyFilters();
        });
    }

    if (maxPrice) {
        maxPrice.addEventListener('input', (e) => {
            currentFilters.maxPrice = e.target.value ? parseFloat(e.target.value) : null;
            applyFilters();
        });
    }

    if (inStockOnly) {
        inStockOnly.addEventListener('change', (e) => {
            currentFilters.inStockOnly = e.target.checked;
            applyFilters();
        });
    }

    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            applyFilters();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

function initLazyLoad() {
    const images = document.querySelectorAll('.lazy-load');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                    img.src = src;
                    img.classList.add('loaded');
                }
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });
    
    images.forEach(img => observer.observe(img));
}
/**
 * Aplica filtro por categoría desde la URL
 */
function applyCategoryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const categoria = params.get('categoria');

    if (categoria) {
        console.log('🎯 Aplicando filtro por categoría desde URL:', categoria);

        setTimeout(() => {
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = categoria;
                currentFilters.category = categoria;
                applyFilters();
            }

            // Hacer scroll a la sección
            const section = document.getElementById(categoria);
            if (section) {
                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    section.style.boxShadow = '0 0 0 4px rgba(201, 160, 61, 0.3)';
                    setTimeout(() => section.style.boxShadow = 'none', 1500);
                }, 300);
            }
        }, 500);
    }
}


// ============ EXPORTACIONES GLOBALES ============
window.updateCartUI = updateCartUI;
window.saveCart = saveCart;
window.loadCart = loadCart;

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', async () => {
    // No ejecutar en páginas del dashboard
    if (window.location.pathname.includes('dashboard')) {
        console.log('📊 Dashboard detectado, app.js no se ejecuta completamente');
        return;
    }

    console.log('🚀 Inicializando LUXE Store...');

    // Inicializar componentes
    loadCart();
    initCartModal();
    initCheckoutButton();
    updateUserUI();
    initUserMenu();
    initMobileMenu();
    initSearchPanel();
    initSearchAndFilters();
initFiltersBar();

    // Cargar productos si estamos en la tienda
    if (document.getElementById('cadenasGrid')) {
        await loadAllProducts();
        filteredProducts = [...allProducts];
        applyFilters();
        applyCategoryFromUrl();
    }

    console.log('✅ LUXE Store inicializado correctamente');
});