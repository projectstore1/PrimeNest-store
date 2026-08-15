document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Product Details page loaded');

    // ===== GET PRODUCT ID FROM localStorage =====
    const productId = localStorage.getItem('selectedProductId');
    console.log('🆔 Product ID from localStorage:', productId);

    // If no product ID, go back to home
    if (!productId) {
        console.log('❌ No product ID found, redirecting to home');
        window.location.href = 'PrimeNest.html';
        return;
    }

    let selectedItemId = null;
    let productData = null;
    let itemsData = [];

    // ===== DOM Elements =====
    const detailImage = document.getElementById('detailImage');
    const detailName = document.getElementById('detailName');
    const detailPrice = document.getElementById('detailPrice');
    const detailNaira = document.getElementById('detailNaira');
    const detailStatus = document.getElementById('detailStatus');
    const detailDescription = document.getElementById('detailDescription');
    const itemsGrid = document.getElementById('itemsGrid');
    const noItemSelected = document.getElementById('noItemSelected');
    const buyNowBtn = document.getElementById('buyNowBtn');
    const similarGrid = document.getElementById('similarGrid');

    // ===== LOAD PRODUCT =====
    async function loadProduct() {
        try {
            console.log('⏳ Loading product:', productId);
            
            const doc = await db.collection('products').doc(productId).get();
            
            if (!doc.exists) {
                console.log('❌ Product not found in Firebase');
                window.location.href = 'index.html';
                return;
            }

            productData = { id: doc.id, ...doc.data() };
            console.log('✅ Product loaded:', productData);

            // ===== DISPLAY PRODUCT INFO =====
            // Image
            detailImage.src = productData.image || 'https://picsum.photos/seed/' + productId + '/600/600';
            detailImage.alt = productData.name || 'Product';
            
            // Name
            detailName.textContent = productData.name || 'Unknown Product';
            
            // Price
            const price = productData.price || 0;
            detailPrice.innerHTML = `$${price.toFixed(2)} <span>USD</span>`;
            
            // Naira Price (1 USD = 1440 Naira)
            const nairaPrice = price * 1440;
            detailNaira.textContent = `₦${nairaPrice.toLocaleString()}`;
            
            // Status
            const status = productData.status || 'available';
            detailStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            detailStatus.className = `product-details-status status-${status}`;
            
            // Description
            detailDescription.innerHTML = `
                <i class="fas fa-info-circle" style="color:var(--accent);margin-right:8px;"></i>
                ${productData.description || 'Premium digital product with instant delivery. Secure payment and 24/7 support.'}
            `;

            // ===== LOAD ITEMS =====
            await loadItems();

            // ===== LOAD SIMILAR PRODUCTS =====
            await loadSimilarProducts();

        } catch (error) {
            console.error('❌ Error loading product:', error);
            detailName.textContent = 'Error loading product';
        }
    }

    // ===== LOAD ITEMS =====
    async function loadItems() {
        itemsGrid.innerHTML = '<div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:10px;">Loading items...</div>';

        try {
            console.log('⏳ Loading items for product:', productId);
            
            const snapshot = await db.collection('products')
                .doc(productId)
                .collection('items')
                .get();

            itemsData = [];
            snapshot.forEach(doc => {
                itemsData.push({ id: doc.id, ...doc.data() });
            });

            console.log('✅ Items loaded:', itemsData.length, 'items');

            if (itemsData.length === 0) {
                itemsGrid.innerHTML = `
                    <div style="color:var(--text-muted);text-align:center;padding:20px;grid-column:1/-1;">
                        <i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
                        No items available for this product.
                    </div>
                `;
                buyNowBtn.disabled = true;
                return;
            }

            // Build items HTML
            let html = '';
            itemsData.forEach((item, index) => {
                const isActive = index === 0 ? 'active' : '';
                if (index === 0) {
                    selectedItemId = item.id;
                    console.log('🎯 First item selected:', item.name);
                }
                html += `
                    <div class="item-option ${isActive}" data-id="${item.id}">
                        <span class="item-icon"><i class="${item.icon || 'fas fa-box'}"></i></span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">$${item.price?.toFixed(2) || '0.00'}</span>
                    </div>
                `;
            });

            itemsGrid.innerHTML = html;

            // ===== ADD CLICK LISTENERS TO ITEMS =====
            document.querySelectorAll('.item-option').forEach(el => {
                el.addEventListener('click', function() {
                    // Remove active from all
                    document.querySelectorAll('.item-option').forEach(e => e.classList.remove('active'));
                    // Add active to clicked
                    this.classList.add('active');
                    // Save selected item ID
                    selectedItemId = this.dataset.id;
                    noItemSelected.style.display = 'none';
                    buyNowBtn.disabled = false;
                    console.log('🔄 Item selected:', selectedItemId);
                });
            });

            buyNowBtn.disabled = false;

        } catch (error) {
            console.error('❌ Error loading items:', error);
            itemsGrid.innerHTML = '<div style="color:#dc2626;grid-column:1/-1;text-align:center;padding:10px;">Error loading items</div>';
        }
    }

    // ===== LOAD SIMILAR PRODUCTS =====
    async function loadSimilarProducts() {
        similarGrid.innerHTML = '<p style="color:var(--text-muted);">Loading similar products...</p>';

        try {
            const snapshot = await db.collection('products')
                .where('category', '==', productData?.category || '')
                .limit(4)
                .get();

            if (snapshot.empty) {
                similarGrid.innerHTML = '<p style="color:var(--text-muted);">No similar products found.</p>';
                return;
            }

            let html = '';
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (doc.id === productId) return;
                count++;
                html += `
                    <div class="similar-card" data-id="${doc.id}">
                        <img src="${data.image || 'https://picsum.photos/seed/' + doc.id + '/200/200'}" alt="${data.name}">
                        <div class="similar-name">${data.name}</div>
                        <div class="similar-price">$${data.price?.toFixed(2) || '0.00'}</div>
                    </div>
                `;
            });

            similarGrid.innerHTML = html || '<p style="color:var(--text-muted);">No similar products found.</p>';

            // Click to view similar product
            document.querySelectorAll('.similar-card').forEach(card => {
                card.addEventListener('click', function() {
                    const id = this.dataset.id;
                    console.log('🔄 Loading similar product:', id);
                    localStorage.setItem('selectedProductId', id);
                    window.location.reload();
                });
            });

        } catch (error) {
            console.error('Error loading similar products:', error);
            similarGrid.innerHTML = '<p style="color:var(--text-muted);">No similar products found.</p>';
        }
    }

    // ===== BUY NOW BUTTON =====
    buyNowBtn.addEventListener('click', function() {
        console.log('🛒 Buy Now clicked');

        // Check if item selected
        if (!selectedItemId) {
            noItemSelected.style.display = 'block';
            console.log('❌ No item selected');
            return;
        }

        // Find selected item
        const selectedItem = itemsData.find(item => item.id === selectedItemId);
        if (!selectedItem) {
            console.error('❌ Selected item not found in itemsData');
            return;
        }

        console.log('✅ Selected item:', selectedItem);

        // Prepare data for payment page
        const orderData = {
            id: productId,
            name: productData.name,
            price: selectedItem.price || productData.price,
            itemName: selectedItem.name,
            itemId: selectedItem.id,
            image: productData.image || ''
        };

        // Save to localStorage
        localStorage.setItem('selectedProduct', JSON.stringify(orderData));
        console.log('✅ Saved to localStorage:', orderData);

        // Verify saved data
        const saved = localStorage.getItem('selectedProduct');
        console.log('📦 Verified saved data:', saved);

        // Redirect to payment page
        console.log('🚀 Redirecting to payment.html');
        window.location.href = 'payment.html';
    });

    // ===== THEME TOGGLE =====
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

    // ===== START =====
    loadProduct();
});
