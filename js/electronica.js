// =====================================================
// ELECTRÓNICA - LÓGICA DE LA TIENDA DE ELECTRÓNICOS
// =====================================================

let electronicProducts = [];
let filteredElectronicProducts = [];
let currentCategory = '';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔌 Inicializando tienda de electrónicos...');
    
    initCategoryTabs();
    await loadElectronicProducts();
    
    if (typeof updateUserUI === 'function') updateUserUI();
    if (typeof initUserMenu === 'function') initUserMenu();
    if (typeof initCartModal === 'function') initCartModal();
});

function initCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            filterProducts();
        });
    });
}

async function loadElectronicProducts() {
    try {
        const electronicCategories = ['audifonos', 'cables', 'mouse', 'accesorios', 'gadgets'];
        const res = await fetch(`${API_URL}/products?page=1&limit=100`);
        const data = await res.json();
        
        if (data.success) {
            electronicProducts = data.products.filter(p => 
                electronicCategories.includes(p.category)
            );
            console.log(`📦 ${electronicProducts.length} productos electrónicos cargados`);
            filterProducts();
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function filterProducts() {
    if (currentCategory) {
        filteredElectronicProducts = electronicProducts.filter(p => p.category === currentCategory);
    } else {
        filteredElectronicProducts = [...electronicProducts];
    }
    renderElectronicProducts();
}

function renderElectronicProducts() {
    const categories = ['audifonos', 'cables', 'mouse', 'accesorios', 'gadgets'];
    
    categories.forEach(category => {
        const grid = document.getElementById(`${category}Grid`);
        const section = document.getElementById(category);
        
        if (!grid || !section) return;
        
        const productsInCategory = currentCategory 
            ? filteredElectronicProducts.filter(p => p.category === category)
            : electronicProducts.filter(p => p.category === category);
        
        if (productsInCategory.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        grid.innerHTML = '';
        
        productsInCategory.forEach(p => {
            const card = createProductCard(p);
            grid.appendChild(card);
        });
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
        window.location.href = `../product-detail.html?id=${product.id}`;
    });
    
    // Contenedor de imagen
    const imgContainer = document.createElement('div');
    imgContainer.style.position = 'relative';
    
    // Imagen
    const img = document.createElement('img');
    const productName = product.name || 'Producto';
    
    // Obtener la imagen del producto
    let imgSrc = product.image || product.imagen || product.image_url || '';
    
    // Si no hay imagen o está vacía, usar placeholder según categoría
    if (!imgSrc || imgSrc === 'null' || imgSrc === 'undefined' || imgSrc === '') {
        const colors = {
            'audifonos': { bg: '1a1a2e', text: '00d4ff' },
            'cables': { bg: '2e1a2e', text: 'c9a03d' },
            'mouse': { bg: '1a2e1a', text: 'ffffff' },
            'accesorios': { bg: '333333', text: 'ffffff' },
            'gadgets': { bg: '2e3a1a', text: 'ff9800' }
        };
        const color = colors[product.category] || { bg: '1a1a1a', text: 'ffffff' };
        imgSrc = `https://placehold.co/300x300/${color.bg}/${color.text}?text=${encodeURIComponent(productName.substring(0, 15))}`;
    }
    
    img.src = imgSrc;
    img.alt = productName;
    img.className = 'product-image';
    img.style.width = '100%';
    img.style.height = '280px';
    img.style.objectFit = 'cover';
    
    // Si la imagen falla, usar placeholder
    img.onerror = function() {
        const colors = {
            'audifonos': { bg: '1a1a2e', text: '00d4ff' },
            'cables': { bg: '2e1a2e', text: 'c9a03d' },
            'mouse': { bg: '1a2e1a', text: 'ffffff' },
            'accesorios': { bg: '333333', text: 'ffffff' },
            'gadgets': { bg: '2e3a1a', text: 'ff9800' }
        };
        const color = colors[product.category] || { bg: '1a1a1a', text: 'ffffff' };
        this.src = `https://placehold.co/300x300/${color.bg}/${color.text}?text=${encodeURIComponent(productName.substring(0, 15))}`;
    };
    
    imgContainer.appendChild(img);
    
    // Badge agotado
    const outOfStock = !product.stock || product.stock <= 0;
    if (outOfStock) {
        const badge = document.createElement('span');
        badge.className = 'out-of-stock-badge';
        badge.textContent = 'Agotado';
        imgContainer.appendChild(badge);
    }
    
    card.appendChild(imgContainer);
    
    // Info del producto
    const info = document.createElement('div');
    info.className = 'product-info';
    
    const nameEl = document.createElement('h3');
    nameEl.className = 'product-name';
    nameEl.textContent = productName;
    
    const priceEl = document.createElement('p');
    priceEl.className = 'product-price';
    priceEl.textContent = `$${parseFloat(product.price || 0).toFixed(2)}`;
    
    const btn = document.createElement('button');
    btn.className = 'add-to-cart';
    btn.textContent = outOfStock ? 'Agotado' : 'Agregar al carrito';
    if (outOfStock) btn.disabled = true;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.addToCart === 'function') {
            window.addToCart(product.id);
        }
    });
    
    info.appendChild(nameEl);
    info.appendChild(priceEl);
    info.appendChild(btn);
    
    card.appendChild(info);
    
    return card;
}