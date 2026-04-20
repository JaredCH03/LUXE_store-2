// =====================================================
// SISTEMA DE RESEÑAS - CON NOTIFICACIONES ELEGANTES
// =====================================================

let reviewsProductId = null;
let userRating = 0;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📝 Inicializando sistema de reseñas...');
    
    reviewsProductId = getProductIdFromUrl();  // ← CORREGIDO
    console.log('Producto ID:', reviewsProductId);
    
    if (reviewsProductId) {
        loadReviews();
        if (typeof isLoggedIn === 'function' && isLoggedIn()) {
            console.log('✅ Usuario logueado');
            loadUserReview();
            initReviewForm();
        }
    }
});

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ============ NOTIFICACIÓN ============
function notify(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.warn('showNotification no disponible:', message);
        alert(message);
    }
}

// ============ CARGAR RESEÑAS ============
async function loadReviews() {
    try {
        const res = await fetch(`${API_URL}/reviews/product/${reviewsProductId}`);  // ← CORREGIDO
        const data = await res.json();
        
        if (data.success) {
            displayReviews(data.reviews);
            updateRatingSummary(data.reviews);
        }
    } catch (error) {
        console.error('Error cargando reseñas:', error);
    }
}

function updateRatingSummary(reviews) {
    const avgRatingEl = document.getElementById('avgRating');
    const totalReviewsEl = document.getElementById('totalReviews');
    
    if (!avgRatingEl || !totalReviewsEl) return;
    
    if (!reviews || reviews.length === 0) {
        avgRatingEl.textContent = '0.0';
        totalReviewsEl.textContent = '0 reseñas';
        renderStars('avgStars', 0);
        return;
    }
    
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    avgRatingEl.textContent = avg.toFixed(1);
    totalReviewsEl.textContent = `${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}`;
    
    renderStars('avgStars', avg);
}

function renderStars(containerId, rating) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const fullStars = Math.floor(rating);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= fullStars ? '★' : '☆';
    }
    container.textContent = html;
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<div class="empty-reviews-minimal">✨ Aún no hay reseñas. ¡Sé el primero!</div>';
        return;
    }
    
    container.innerHTML = reviews.map(r => `
        <div class="review-card-minimal">
            <div class="review-header-minimal">
                <div class="review-avatar-minimal">${(r.user_name || 'U').charAt(0).toUpperCase()}</div>
                <div class="review-meta-minimal">
                    <div class="review-user-minimal">${escapeHtml(r.user_name || 'Usuario')}</div>
                    <div class="review-date-minimal">${formatDate(r.created_at)}</div>
                </div>
                <div class="review-rating-minimal">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            </div>
            <div class="review-comment-minimal">${escapeHtml(r.comment) || '<span style="color: #aaa; font-style: italic;">Sin comentario</span>'}</div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

// ============ RESEÑA DEL USUARIO ============
async function loadUserReview() {
    try {
        const token = getTokenLocal();
        if (!token) return;
        
        const res = await fetch(`${API_URL}/reviews/my/${reviewsProductId}`, {  // ← CORREGIDO
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.success && data.review) {
            const commentEl = document.getElementById('reviewComment');
            if (commentEl) commentEl.value = data.review.comment || '';
            setRatingInput(data.review.rating);
        }
    } catch (error) {
        console.error('Error cargando reseña del usuario:', error);
    }
}

// ============ FORMULARIO ============
function initReviewForm() {
    const stars = document.querySelectorAll('.stars-input-minimal button');
    const submitBtn = document.getElementById('submitReviewBtn');
    
    if (stars.length === 0) return;
    
    stars.forEach(star => {
        const newStar = star.cloneNode(true);
        star.parentNode.replaceChild(newStar, star);
    });
    
    const freshStars = document.querySelectorAll('.stars-input-minimal button');
    
    freshStars.forEach(star => {
        star.addEventListener('click', function(e) {
            e.preventDefault();
            const rating = parseInt(this.dataset.rating);
            setRatingInput(rating);
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
    });
    
    const starsContainer = document.querySelector('.stars-input-minimal');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', () => highlightStars(userRating));
    }
    
    if (submitBtn) {
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        newSubmitBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const rating = parseInt(document.getElementById('reviewRating')?.value || '0');
            const comment = document.getElementById('reviewComment')?.value || '';
            
            if (rating === 0) {
                notify('Selecciona una calificación', 'warning');
                return;
            }
            
            this.disabled = true;
            this.textContent = 'Publicando...';
            
            try {
                const token = getTokenLocal();
                if (!token) throw new Error('No hay sesión activa');
                
                const res = await fetch(`${API_URL}/reviews/product/${reviewsProductId}`, {  // ← CORREGIDO
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating, comment })
                });
                
                const data = await res.json();
                
                if (data.success) {
                    notify('✅ ¡Gracias por tu reseña!', 'success');
                    await loadReviews();
                    await loadUserReview();
                    document.getElementById('reviewComment').value = '';
                    setRatingInput(0);
                } else {
                    notify(data.message || 'Error al guardar', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                notify('Error al guardar reseña', 'error');
            } finally {
                this.disabled = false;
                this.textContent = 'Publicar reseña';
            }
        });
    }
}

function setRatingInput(rating) {
    userRating = rating;
    const ratingInput = document.getElementById('reviewRating');
    if (ratingInput) ratingInput.value = rating;
    highlightStars(rating);
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.stars-input-minimal button');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.style.color = '#c9a03d';
        } else {
            star.textContent = '☆';
            star.style.color = '#ddd';
        }
    });
}

// ============ UTILIDADES ============
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function getTokenLocal() {
    if (typeof window.getToken === 'function') {
        const token = window.getToken();
        if (token) return token;
    }
    return localStorage.getItem('luxe_token');
}