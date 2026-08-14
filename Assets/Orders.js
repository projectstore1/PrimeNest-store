document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('ordersContainer');

    // ===== Load Orders =====
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(30)
            .get();

        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-muted);">
                    <i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:12px;"></i>
                    <p>No orders yet.</p>
                </div>
            `;
        } else {
            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate?.() || new Date();
                html += `
                    <div class="order-item">
                        <div class="order-info">
                            <strong>${data.product || 'Product'}</strong>
                            <span style="font-size:0.85rem;color:var(--text-muted);">
                                ${data.item || ''} • ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                            </span>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:700;color:var(--accent);">
                                $${data.amount?.toFixed(2) || '0.00'}
                            </div>
                            <span class="order-status status-${data.status || 'pending'}">
                                ${data.status || 'pending'}
                            </span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `<p style="color:#dc2626;">Error loading orders: ${error.message}</p>`;
    }

    // ===== Feedback System =====
    const starRating = document.getElementById('starRating');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackTwitter = document.getElementById('feedbackTwitter');
    const submitBtn = document.getElementById('submitFeedback');
    const feedbackContainer = document.getElementById('feedbackContainer');

    let selectedRating = 0;

    if (starRating) {
        starRating.querySelectorAll('i').forEach(star => {
            star.addEventListener('click', function() {
                selectedRating = parseInt(this.dataset.rating);
                starRating.querySelectorAll('i').forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.rating) <= selectedRating);
                });
            });

            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.dataset.rating);
                starRating.querySelectorAll('i').forEach(s => {
                    s.style.color = parseInt(s.dataset.rating) <= rating ? '#eab308' : '';
                });
            });

            star.addEventListener('mouseleave', function() {
                starRating.querySelectorAll('i').forEach(s => {
                    s.style.color = '';
                });
            });
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const text = feedbackText.value.trim();
            const twitter = feedbackTwitter.value.trim() || 'Anonymous';

            if (!text) {
                alert('Please write your review.');
                return;
            }

            if (selectedRating === 0) {
                alert('Please select a rating.');
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
                alert('Thank you for your feedback!');
                loadFeedback();
            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('Error submitting feedback. Please try again.');
            }
        });
    }

    async function loadFeedback() {
        if (!feedbackContainer) return;

        try {
            const snapshot = await db.collection('feedback')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            if (snapshot.empty) {
                feedbackContainer.innerHTML = '<p style="color:var(--text-muted);">No reviews yet. Be the first!</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate?.() || new Date();
                const stars = '⭐'.repeat(Math.min(data.rating || 0, 5));
                html += `
                    <div class="feedback-item">
                        <div class="fb-header">
                            <span class="fb-user">${data.twitter || 'Anonymous'}</span>
                            <span class="fb-stars">${stars}</span>
                        </div>
                        <div class="fb-text">${data.text}</div>
                        <div class="fb-date">${date.toLocaleDateString()}</div>
                    </div>
                `;
            });
            feedbackContainer.innerHTML = html;

        } catch (error) {
            console.error('Error loading feedback:', error);
        }
    }

    loadFeedback();

    // ===== Theme Toggle =====
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
});
