document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Order History page loaded');
    console.log('📋 Fetching ALL orders from Firebase (old + new)...');

    const ordersContainer = document.getElementById('ordersContainer');
    const feedbackContainer = document.getElementById('feedbackContainer');
    const starRating = document.getElementById('starRating');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackTwitter = document.getElementById('feedbackTwitter');
    const submitBtn = document.getElementById('submitFeedback');

    let selectedRating = 0;

    // ============================================================
    // ===== LOAD ALL ORDERS FROM FIREBASE (OLD + NEW) =====
    // ============================================================

    async function loadOrders() {
        ordersContainer.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--text-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
                <p>Loading orders...</p>
            </div>
        `;

        try {
            const snapshot = await db.collection('orders')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            console.log('📋 Total orders found (old + new):', snapshot.size);

            if (snapshot.empty) {
                ordersContainer.innerHTML = `
                    <div class="empty-orders" style="text-align:center;padding:60px 20px;color:var(--text-muted);">
                        <i class="fas fa-box-open" style="font-size:4rem;display:block;margin-bottom:16px;color:var(--border-color);"></i>
                        <h3 style="color:var(--text-primary);margin-bottom:8px;">No Orders Yet</h3>
                        <p>Start shopping to see your orders here!</p>
                        <a href="index.html" class="btn-primary" style="display:inline-block;margin-top:16px;">
                            <i class="fas fa-shopping-cart"></i> Browse Products
                        </a>
                    </div>
                `;
                return;
            }

            let html = '';
            let orderCount = 0;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                orderCount++;
                
                let date = new Date();
                if (data.createdAt && data.createdAt.toDate) {
                    date = data.createdAt.toDate();
                } else if (data.createdAt) {
                    date = new Date(data.createdAt);
                }

                const status = data.status || 'pending';
                const statusClass = status === 'completed' ? 'status-completed' : 
                                   status === 'cancelled' ? 'status-cancelled' : 'status-pending';

                const orderId = data.orderId || data.id || 'N/A';
                
                html += `
                    <div class="order-item">
                        <div class="order-info">
                            <span class="order-id">#${orderId}</span>
                            <span class="order-product">${data.product || 'Unknown Product'}</span>
                            <span class="order-date">
                                <i class="far fa-calendar-alt"></i> 
                                ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                            </span>
                            ${data.item ? `<span style="font-size:0.85rem;color:var(--text-muted);">Item: ${data.item}</span>` : ''}
                            ${data.paymentMethod ? `<span style="font-size:0.85rem;color:var(--text-muted);">Payment: ${data.paymentMethod}</span>` : ''}
                        </div>
                        <div class="order-right">
                            <span class="order-amount">$${data.amount?.toFixed(2) || '0.00'}</span>
                            <span class="order-status ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </div>
                    </div>
                `;
            });

            ordersContainer.innerHTML = html;
            console.log('✅ All orders loaded successfully:', orderCount, 'orders (old + new)');

            // ===== REAL-TIME LISTENER FOR NEW ORDERS =====
            setupRealtimeOrders();

        } catch (error) {
            console.error('❌ Error loading orders:', error);
            ordersContainer.innerHTML = `
                <div style="text-align:center;padding:40px;color:#dc2626;">
                    <i class="fas fa-exclamation-circle" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
                    <p>Error loading orders: ${error.message}</p>
                    <button onclick="location.reload()" class="btn-primary" style="margin-top:12px;">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    // ============================================================
    // ===== REAL-TIME LISTENER FOR NEW ORDERS =====
    // ============================================================

    function setupRealtimeOrders() {
        console.log('🔄 Setting up real-time listener for new orders...');

        db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .onSnapshot(function(snapshot) {
                snapshot.docChanges().forEach(function(change) {
                    if (change.type === 'added') {
                        console.log('🆕 New order added in real-time!');
                        loadOrders();
                    }
                });
            }, function(error) {
                console.error('❌ Real-time listener error:', error);
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
                console.log('⭐ Rating selected:', selectedRating);
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
                await db.collection('feedback').add({
                    text: text,
                    twitter: twitter,
                    rating: selectedRating,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                feedbackText.value = '';
                feedbackTwitter.value = '';
                selectedRating = 0;
                starRating.querySelectorAll('i').forEach(s => s.classList.remove('active'));
                
                alert('✅ Thank you for your feedback!');
                loadFeedback();

            } catch (error) {
                console.error('❌ Error submitting feedback:', error);
                alert('❌ Error submitting feedback: ' + error.message);
            }
        });
    }

    // ============================================================
    // ===== LOAD ALL FEEDBACK (OLD + NEW) =====
    // ============================================================

    async function loadFeedback() {
        if (!feedbackContainer) return;

        try {
            const snapshot = await db.collection('feedback')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            console.log('📋 Total feedback found (old + new):', snapshot.size);

            if (snapshot.empty) {
                feedbackContainer.innerHTML = `
                    <div style="text-align:center;padding:20px;color:var(--text-muted);">
                        <i class="fas fa-comment" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
                        <p>No reviews yet. Be the first!</p>
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate?.() || new Date();
                const stars = '⭐'.repeat(Math.min(data.rating || 0, 5));
                const emptyStars = '☆'.repeat(Math.max(0, 5 - (data.rating || 0)));

                html += `
                    <div class="feedback-item">
                        <div class="fb-header">
                            <span class="fb-user">
                                <i class="fab fa-twitter" style="color:#1DA1F2;"></i> 
                                ${data.twitter || 'Anonymous'}
                            </span>
                            <span class="fb-stars">${stars}${emptyStars}</span>
                        </div>
                        <div class="fb-text">${data.text}</div>
                        <div class="fb-date">
                            <i class="far fa-clock"></i> 
                            ${date.toLocaleDateString()}
                        </div>
                    </div>
                `;
            });

            feedbackContainer.innerHTML = html;
            console.log('✅ All feedback loaded successfully (old + new)');

            // ===== REAL-TIME LISTENER FOR NEW FEEDBACK =====
            setupRealtimeFeedback();

        } catch (error) {
            console.error('❌ Error loading feedback:', error);
            feedbackContainer.innerHTML = `
                <div style="text-align:center;padding:20px;color:#dc2626;">
                    <p>Error loading feedback: ${error.message}</p>
                </div>
            `;
        }
    }

    // ============================================================
    // ===== REAL-TIME LISTENER FOR NEW FEEDBACK =====
    // ============================================================

    function setupRealtimeFeedback() {
        console.log('🔄 Setting up real-time listener for new feedback...');

        db.collection('feedback')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .onSnapshot(function(snapshot) {
                snapshot.docChanges().forEach(function(change) {
                    if (change.type === 'added') {
                        console.log('🆕 New feedback added in real-time!');
                        loadFeedback();
                    }
                });
            }, function(error) {
                console.error('❌ Real-time listener error:', error);
            });
    }

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
    // ===== INIT =====
    // ============================================================

    console.log('🚀 Initializing Order History page...');
    loadOrders();
    loadFeedback();
});
