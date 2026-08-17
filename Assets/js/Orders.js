document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Order History page loaded');

    // ============================================================
    // ===== THEME TOGGLE =====
    // ============================================================
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // ============================================================
    // ===== VARIABLES =====
    // ============================================================
    const ordersContainer = document.getElementById('ordersContainer');
    const feedbackContainer = document.getElementById('feedbackContainer');
    const starRating = document.getElementById('starRating');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackTwitter = document.getElementById('feedbackTwitter');
    const submitBtn = document.getElementById('submitFeedback');

    let selectedRating = 0;

    // ============================================================
    // ===== LOAD ORDERS =====
    // ============================================================
    async function loadOrders() {
        ordersContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';

        try {
            const snapshot = await db.collection('orders')
                .orderBy('createdAt', 'desc')
                .limit(30)
                .get();

            if (snapshot.empty) {
                ordersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>No Orders Yet</h3>
                        <p>Start shopping to see your orders here!</p>
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate?.() || new Date();
                const status = data.status || 'completed';
                const price = data.price || 0;

                const statusClass = status === 'completed' ? 'status-completed' : 
                                   status === 'cancelled' ? 'status-cancelled' : 'status-pending';

                html += `
                    <div class="order-item">
                        <div class="order-info">
                            <span class="order-id">#${data.orderId || 'N/A'}</span>
                            <span class="order-product">${data.productName || 'Product'}</span>
                            <span class="order-detail">
                                <i class="fas fa-calendar"></i> ${data.plan || 'Standard'}
                                ${data.userInfo ? `| <i class="fas fa-user"></i> ${data.userInfo}` : ''}
                            </span>
                            <span class="order-date">
                                <i class="far fa-calendar-alt"></i> 
                                ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                            </span>
                        </div>
                        <div class="order-right">
                            <span class="order-amount">$${price.toFixed(2)}</span>
                            <span class="order-status ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </div>
                    </div>
                `;
            });

            ordersContainer.innerHTML = html;

        } catch (error) {
            console.error('Error loading orders:', error);
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Orders</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // ============================================================
    // ===== ESCAPE HTML =====
    // ============================================================
    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/[&<>"]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
        });
    }

    // ============================================================
    // ===== STAR RATING =====
    // ============================================================
    if (starRating) {
        const stars = starRating.querySelectorAll('i');
        
        stars.forEach(star => {
            star.addEventListener('click', function() {
                selectedRating = parseInt(this.dataset.rating);
                stars.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.rating) <= selectedRating);
                });
            });

            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.dataset.rating);
                stars.forEach(s => {
                    s.style.color = parseInt(s.dataset.rating) <= rating ? '#eab308' : '';
                });
            });

            star.addEventListener('mouseleave', function() {
                stars.forEach(s => {
                    s.style.color = '';
                    if (selectedRating > 0) {
                        s.classList.toggle('active', parseInt(s.dataset.rating) <= selectedRating);
                    }
                });
            });
        });
    }

    // ============================================================
    // ===== SUBMIT FEEDBACK =====
    // ============================================================
    if (submitBtn) {
        submitBtn.addEventListener('click', async function() {
            const text = feedbackText.value.trim();
            const twitter = feedbackTwitter.value.trim() || 'Anonymous';

            if (!text) {
                alert('❌ Please write your review.');
                return;
            }

            if (selectedRating === 0) {
                alert('❌ Please select a rating.');
                return;
            }

            try {
                await db.collection('reviews').add({
                    text: text,
                    twitter: twitter,
                    rating: selectedRating,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                feedbackText.value = '';
                feedbackTwitter.value = '';
                selectedRating = 0;
                starRating.querySelectorAll('i').forEach(s => s.classList.remove('active'));
                
                alert('✅ Thank you for your feedback!');
                loadFeedback();

            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('❌ Error submitting feedback: ' + error.message);
            }
        });
    }

    // ============================================================
    // ===== LOAD FEEDBACK =====
    // ============================================================
    async function loadFeedback() {
        if (!feedbackContainer) return;

        try {
            const snapshot = await db.collection('reviews')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            if (snapshot.empty) {
                feedbackContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comment"></i>
                        <p>No reviews yet. Be the first!</p>
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.timestamp?.toDate?.() || new Date();
                const stars = '⭐'.repeat(Math.min(data.rating || 0, 5));
                const emptyStars = '☆'.repeat(Math.max(0, 5 - (data.rating || 0)));

                html += `
                    <div class="feedback-item">
                        <div class="fb-header">
                            <span class="fb-user">
                                <i class="fab fa-twitter" style="color:#1DA1F2;"></i> 
                                ${escapeHtml(data.twitter || 'Anonymous')}
                            </span>
                            <span class="fb-stars">${stars}${emptyStars}</span>
                        </div>
                        <div class="fb-text">${escapeHtml(data.text)}</div>
                        <div class="fb-date">
                            <i class="far fa-clock"></i> 
                            ${date.toLocaleDateString()}
                        </div>
                    </div>
                `;
            });

            feedbackContainer.innerHTML = html;

        } catch (error) {
            console.error('Error loading feedback:', error);
            feedbackContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading feedback: ${error.message}</p>
                </div>
            `;
        }
    }

    // ============================================================
    // ===== AUTO REFRESH =====
    // ============================================================
    setInterval(() => {
        loadOrders();
        loadFeedback();
    }, 30000);

    // ============================================================
    // ===== INIT =====
    // ============================================================
    loadOrders();
    loadFeedback();
});
