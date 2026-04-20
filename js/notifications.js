// =====================================================
// SISTEMA DE NOTIFICACIONES UNIFICADO
// =====================================================

(function() {
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#2196f3',
        warning: '#ff9800'
    };
    
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.custom-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        
        notification.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 350px;
            animation: slideInNotification 0.3s ease;
            pointer-events: none;
        `;
        
        // Icono según tipo
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };
        
        notification.innerHTML = `
            <span style="font-size: 18px;">${icons[type] || icons.info}</span>
            <span style="flex: 1;">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 300);
        }, 3500);
    }
    
    // Agregar animaciones si no existen
    if (!document.querySelector('#notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes slideInNotification {
                from { opacity: 0; transform: translateX(100px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOutNotification {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Exportar globalmente
    window.showNotification = showNotification;
    
    console.log('✅ Sistema de notificaciones inicializado');
})();