// ===== DOM Elements =====
const productGrid = document.getElementById('productGrid');
const slides = document.getElementById('slides');
const sliderDots = document.getElementById('sliderDots');
const themeToggle = document.getElementById('themeToggle');

// ===== Theme Toggle =====
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
themeToggle.addEventListener('click', toggleTheme);

// ===== Load Banners =====
async function loadBanners() {
    try {
        const snapshot = await db.collection('banners').orderBy('order', 'asc').get();
        if (snapshot.empty) {
            slides.innerHTML = `
                <div class="slide" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
                    <div class="slide-content"><i class="fas fa-bolt"></i><h2>Flash Sale 50% Off</h2><p>Limited time offer</p></div>
                </div>
                <div class="slide" style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);">
                    <div class="slide-content"><i class="fas fa-gem"></i><h2>Premium Deals</h2><p>Exclusive products</p></div>
                </div>
                <div class="slide" style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);">
                    <div class="slide-content"><i class="fas fa-rocket"></i><h2>New Arrivals</h2><p>Fresh collection</p></div>
                </div>
            `;
            sliderDots.innerHTML = `
                <button class="dot active" data-index="0"></button>
                <button class="dot" data-index="1"></button>
                <button class="dot" data-index="2"></button>
            `;
            initSlider();
            return;
        }

        let slidesHtml = '', dotsHtml = '';
        let index = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            slidesHtml += `
                <div class="slide" style="background:${data.bgColor || 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'};">
                    <div class="slide-content">
                        ${data.icon ? `<i class="${data.icon}"></i>` : ''}
                        <h2>${data.title || 'PremiumStore'}</h2>
                        <p>${data.subtitle || ''}</p>
                        ${data.link ? `<a href="${data.link}" target="_blank">Learn More →</a>` : ''}
                    </div>
                </div>
            `;
            dotsHtml += `<button class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`;
            index++;
        });

        slides.innerHTML = slidesHtml;
        sliderDots.innerHTML = dotsHtml;
        initSlider();
    } catch (error) {
        console.error('Error loading banners:', error);
    }
}

// ===== Slider Logic =====
function initSlider() {
    const slidesEl = document.getElementById('slides');
    const dots = document.querySelectorAll('.dot');
    if (!slidesEl || !dots.length) return;

    let current = 0;
    const total = dots.length;
    let interval;

    function goTo(index) {
        if (index < 0) index = total - 1;
        if (index >= total) index = 0;
        current = index;
        slidesEl.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            goTo(i);
            resetInterval();
        });
    });

    function startInterval() {
        interval = setInterval(() => goTo(current + 1), 5000);
    }

    function resetInterval() {
        clearInterval(interval);
        startInterval();
    }

    startInterval();
}

// ===== Load Products =====
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        if (snapshot.empty) {
            productGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;width:100%;">No products available.</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'available';
            const statusClass = status === 'available' ? 'status-available' : 'status-soldout';
            html += `
                <div class="product-card" data-id="${doc.id}">
                    <span class="status-badge ${statusClass}">${status}</span>
                    <img src="${data.image || 'https://picsum.photos/seed/' + doc.id + '/400/400'}" alt="${data.name}" loading="lazy">
                    <div class="product-name">${data.name}</div>
                    <div class="product-price">$${data.price?.toFixed(2) || '0.00'}</div>
                    <div class="badge-box">📦 box suto</div>
                </div>
            `;
        });

        productGrid.innerHTML = html;

        // Click to go to product details
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function() {
                const id = this.dataset.id;
                const status = this.querySelector('.status-badge').textContent.trim();
                if (status === 'soldout') {
                    alert('This product is sold out!');
                    return;
                }
                localStorage.setItem('selectedProductId', id);
                window.location.href = 'product-details.html';
            });
        });

    } catch (error) {
        console.error('Error loading products:', error);
        productGrid.innerHTML = '<p style="color:#dc2626;text-align:center;width:100%;">Error loading products.</p>';
    }
}

// ===== Load Notice =====
async function loadNotice() {
    try {
        const doc = await db.collection('settings').doc('notice').get();
        if (doc.exists) {
            document.getElementById('paymentMethods').textContent = doc.data().text || 'bkash, Nagad, Rocket, Visa, Mastercard';
        } else {
            document.getElementById('paymentMethods').textContent = 'bkash, Nagad, Rocket, Visa, Mastercard';
        }
    } catch (error) {
        console.error('Error loading notice:', error);
    }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    loadBanners();
    loadProducts();
    loadNotice();
});