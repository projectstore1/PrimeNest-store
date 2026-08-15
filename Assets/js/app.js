// ===== DOM Elements =====
const productGrid = document.getElementById('productGrid');
const slides = document.getElementById('slides');
const sliderDots = document.getElementById('sliderDots');
const themeToggle = document.getElementById('themeToggle');

// ===== THEME TOGGLE =====
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

// ============================================================
// ===== BANNER SLIDER =====
// ============================================================

async function loadBanners() {
    console.log('📢 Loading banners...');
    
    try {
        const snapshot = await db.collection('banners').orderBy('order', 'asc').get();
        console.log('📢 Banners found:', snapshot.size);
        
        if (snapshot.empty) {
            console.log('📢 No banners found, showing default banners');
            showDefaultBanners();
            return;
        }

        let slidesHtml = '';
        let dotsHtml = '';
        let index = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`📢 Banner ${index + 1}:`, data.title || 'Untitled');
            console.log('📢 Image URL:', data.image || 'No image');
            console.log('📢 Link URL:', data.link || 'No link');
            
            // Build slide HTML with proper styling
            let style = '';
            if (data.image && data.image.trim() !== '') {
                // If image exists, use image as background
                style = `background-image: url('${data.image}'); background-size: cover; background-position: center;`;
            } else if (data.bgColor && data.bgColor.trim() !== '') {
                // If bgColor exists, use it
                style = `background: ${data.bgColor};`;
            } else {
                // Default gradient
                style = `background: linear-gradient(135deg,#667eea 0%,#764ba2 100%);`;
            }
            
            slidesHtml += `
                <div class="slide" style="${style}">
                    <div class="slide-content">
                        ${data.icon && !data.image ? `<i class="${data.icon}"></i>` : ''}
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
        console.log('✅ Banners loaded successfully');
        
        // Initialize slider after a small delay
        setTimeout(initSlider, 100);

    } catch (error) {
        console.error('❌ Error loading banners:', error);
        showDefaultBanners();
    }
}

// ===== DEFAULT BANNERS =====
function showDefaultBanners() {
    slides.innerHTML = `
        <div class="slide" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
            <div class="slide-content">
                <i class="fas fa-bolt"></i>
                <h2>Flash Sale 50% Off</h2>
                <p>Limited time offer</p>
            </div>
        </div>
        <div class="slide" style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);">
            <div class="slide-content">
                <i class="fas fa-gem"></i>
                <h2>Premium Deals</h2>
                <p>Exclusive products</p>
            </div>
        </div>
        <div class="slide" style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);">
            <div class="slide-content">
                <i class="fas fa-rocket"></i>
                <h2>New Arrivals</h2>
                <p>Fresh collection</p>
            </div>
        </div>
    `;
    sliderDots.innerHTML = `
        <button class="dot active" data-index="0"></button>
        <button class="dot" data-index="1"></button>
        <button class="dot" data-index="2"></button>
    `;
    setTimeout(initSlider, 100);
}

// ===== SLIDER LOGIC =====
function initSlider() {
    const slidesEl = document.getElementById('slides');
    const dots = document.querySelectorAll('.dot');
    
    if (!slidesEl || !dots.length) {
        console.log('⚠️ Slider elements not found');
        return;
    }

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
        dot.addEventListener('click', function() {
            goTo(i);
            resetInterval();
        });
    });

    function startInterval() {
        if (interval) clearInterval(interval);
        interval = setInterval(() => goTo(current + 1), 5000);
    }

    function resetInterval() {
        clearInterval(interval);
        startInterval();
    }

    startInterval();
    console.log('✅ Slider initialized with', total, 'slides');
}

// ============================================================
// ===== PRODUCTS =====
// ============================================================

async function loadProducts() {
    console.log('📦 Loading products...');
    
    try {
        const snapshot = await db.collection('products').get();
        console.log('📦 Products found:', snapshot.size);
        
        if (snapshot.empty) {
            productGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
                    <i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:12px;"></i>
                    <p>No products available. Add products from admin panel.</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'available';
            const statusClass = status === 'available' ? 'status-available' : 'status-soldout';
            const productId = doc.id;
            
            html += `
                <div class="product-card" data-id="${productId}" data-status="${status}">
                    <span class="status-badge ${statusClass}">${status}</span>
                    <img src="${data.image || 'https://picsum.photos/seed/' + productId + '/400/400'}" 
                         alt="${data.name}" 
                         loading="lazy"
                         onerror="this.src='https://picsum.photos/seed/fallback/400/400'">
                    <div class="product-name">${data.name}</div>
                    <div class="product-price">$${data.price?.toFixed(2) || '0.00'}</div>
                    <div class="badge-box">📦 box suto</div>
                </div>
            `;
        });

        productGrid.innerHTML = html;
        console.log('✅ Products loaded successfully');

        // ===== PRODUCT CLICK HANDLER =====
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function(e) {
                const productId = this.dataset.id;
                const status = this.dataset.status;
                
                console.log('🖱️ Product clicked:', productId, 'Status:', status);
                
                if (status === 'soldout') {
                    alert('❌ This product is sold out!');
                    return;
                }
                
                if (!productId) {
                    alert('❌ Error: Product ID not found!');
                    return;
                }
                
                localStorage.setItem('selectedProductId', productId);
                console.log('✅ Saved product ID to localStorage:', productId);
                window.location.href = 'product-details.html';
            });
        });

    } catch (error) {
        console.error('❌ Error loading products:', error);
        productGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px;color:#dc2626;">
                <i class="fas fa-exclamation-circle" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
                <p>Error loading products. Please try again.</p>
                <p style="font-size:0.85rem;color:var(--text-muted);">${error.message}</p>
            </div>
        `;
    }
}

// ============================================================
// ===== NOTICE LINE =====
// ============================================================

async function loadNotice() {
    console.log('📢 Loading notice...');
    
    try {
        const doc = await db.collection('settings').doc('notice').get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('paymentMethods').textContent = data.text || 'bkash, Nagad, Rocket, Visa, Mastercard';
            console.log('✅ Notice loaded:', data.text);
        } else {
            document.getElementById('paymentMethods').textContent = 'bkash, Nagad, Rocket, Visa, Mastercard';
            console.log('✅ Using default notice');
        }
    } catch (error) {
        console.error('❌ Error loading notice:', error);
        document.getElementById('paymentMethods').textContent = 'bkash, Nagad, Rocket, Visa, Mastercard';
    }
}

// ============================================================
// ===== INIT =====
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Home page loaded');
    loadBanners();
    loadProducts();
    loadNotice();
});
