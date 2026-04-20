// =====================================================
// NAVBAR AUTO-HIDE - Animación de ocultar navbar
// COMPORTAMIENTO: Solo se muestra al mover mouse arriba o scroll arriba
// =====================================================

let hideTimeout;
let navbar = null;
let lastScrollY = window.scrollY;
let isNavbarHidden = false;
let mouseNearTop = false;

function initNavbarAutoHide() {
    navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    // Solo activar en página de detalle de producto
    const isProductDetail = window.location.pathname.includes('product-detail.html');
    if (!isProductDetail) {
        console.log('📱 Navbar auto-hide desactivado en esta página');
        return;
    }
    
    // Crear área de detección en la parte superior
    const trigger = document.createElement('div');
    trigger.className = 'navbar-trigger';
    document.body.appendChild(trigger);
    
    // Eventos para mostrar/ocultar navbar
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('scroll', handleScroll);
    
    // Iniciar timer para ocultar
    resetHideTimer();
    
    console.log('✅ Navbar auto-hide inicializado (modo inmersivo)');
}

function handleMouseMove(e) {
    // Si el mouse está en la parte superior (primeros 40px), mostrar navbar
    if (e.clientY <= 40) {
        if (!mouseNearTop) {
            mouseNearTop = true;
            showNavbar();
        }
    } else {
        mouseNearTop = false;
        
        // Si el navbar está visible y el mouse no está cerca, iniciar timer
        if (!isNavbarHidden && e.clientY > 80) {
            resetHideTimer();
        }
    }
}

function handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Solo mostrar navbar si ha scrolleado hacia arriba significativamente
    if (currentScrollY < lastScrollY - 20 || currentScrollY <= 10) {
        showNavbar();
    } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Si está scrolleando hacia abajo, reiniciar timer para ocultar
        resetHideTimer();
    }
    
    lastScrollY = currentScrollY;
}

function showNavbar() {
    if (!navbar) return;
    
    navbar.classList.remove('hidden');
    isNavbarHidden = false;
    
    // Reiniciar timer
    resetHideTimer();
}

function hideNavbar() {
    if (!navbar) return;
    
    // No ocultar si el mouse está cerca de la parte superior
    if (mouseNearTop) {
        resetHideTimer();
        return;
    }
    
    // No ocultar si el menú móvil está abierto
    const mobileMenu = document.getElementById('navMenu');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        resetHideTimer();
        return;
    }
    
    // No ocultar si el dropdown de usuario está abierto
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown && userDropdown.classList.contains('show')) {
        resetHideTimer();
        return;
    }
    
    // No ocultar si el panel de búsqueda está abierto
    const searchPanel = document.getElementById('searchPanel');
    if (searchPanel && searchPanel.classList.contains('active')) {
        resetHideTimer();
        return;
    }
    
    // No ocultar si el carrito está abierto
    const cartModal = document.getElementById('cartModal');
    if (cartModal && cartModal.style.display === 'block') {
        resetHideTimer();
        return;
    }
    
    navbar.classList.add('hidden');
    isNavbarHidden = true;
}

function resetHideTimer() {
    // Limpiar timer existente
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    
    // Solo iniciar timer si el navbar está visible y no estamos interactuando
    if (!isNavbarHidden && !mouseNearTop) {
        hideTimeout = setTimeout(() => {
            hideNavbar();
        }, 1500); // Ocultar después de 1.5 segundos de inactividad
    }
}

// Limpiar al salir de la página
function cleanup() {
    if (hideTimeout) {
        clearTimeout(hideTimeout);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbarAutoHide);
} else {
    initNavbarAutoHide();
}

// Limpiar al salir
window.addEventListener('beforeunload', cleanup);