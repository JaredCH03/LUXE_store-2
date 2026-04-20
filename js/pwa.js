// =====================================================
// PWA - REGISTRO Y FUNCIONALIDADES
// =====================================================

let deferredPrompt;
let installButton;

document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    initInstallPrompt();
    checkOnlineStatus();
});

// Registrar Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('✅ Service Worker registrado:', registration.scope);
                    requestNotificationPermission();
                })
                .catch((error) => {
                    console.error('❌ Error registrando Service Worker:', error);
                });
        });
    }
}

// Solicitar permiso para notificaciones
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('🔔 Notificaciones permitidas');
        }
    }
}

// Prompt de instalación PWA
function initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostrar botón de instalación personalizado
        showInstallButton();
    });
}

function showInstallButton() {
    // Crear botón flotante de instalación
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerHTML = '📱 Instalar App';
    installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #1a1a1a;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 50px;
        font-weight: 500;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease;
    `;
    
    installButton = installBtn;
    document.body.appendChild(installBtn);
    
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
            deferredPrompt = null;
            installBtn.remove();
        }
    });
    
    // Ocultar después de 10 segundos si no se usa
    setTimeout(() => {
        if (installBtn.parentNode) {
            installBtn.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => installBtn.remove(), 300);
        }
    }, 10000);
}

// Detectar estado online/offline
function checkOnlineStatus() {
    function updateStatus() {
        const isOnline = navigator.onLine;
        if (!isOnline) {
            showOfflineBanner();
        } else {
            hideOfflineBanner();
        }
    }
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

function showOfflineBanner() {
    const existing = document.getElementById('offline-banner');
    if (existing) return;
    
    const banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.style.cssText = `
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background: #f44336;
        color: white;
        text-align: center;
        padding: 8px;
        font-size: 14px;
        z-index: 1001;
    `;
    banner.textContent = '📴 Sin conexión - Modo offline activado';
    document.body.appendChild(banner);
}

function hideOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.remove();
}

// Animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(100px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(100px); }
    }
`;
document.head.appendChild(style);