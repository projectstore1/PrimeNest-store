document.addEventListener('DOMContentLoaded', async () => {
    const productId = localStorage.getItem('selectedProductId');
    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    let selectedItemId = null;
    let productData = null;
    let itemsData = [];

    // ===== Load Product =====
    async function loadProduct() {
        try {
            const doc = await db.collection('products').doc(productId).get();
            if (!doc.exists) {
                window.location.href = 'index.html';
                return;
            }

            productData = { id: doc.id, ...doc.data() };

            // Display product info
            document.getElementById('detailImage').src = productData.image || 'https://picsum.photos/seed/' + productId + '/600/600';
            document.getElementById('detailName').textContent = productData.name;
            document.getElementById('detailPrice').innerHTML = `$${productData.price?.toFixed(2) || '0.00'} <span>USD</span>`;
            
            const nairaPrice = (productData.price || 0) * 1440;
            document.getElementById('detailNaira').textContent = `₦${nairaPrice.toLocaleString()}`;

            const statusEl = document.getElementById('detailStatus');
            const status = productData.status || 'available';
            statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusEl.className = `product-details-status status-${status}`;

            document.getElementById('detailDescription').innerHTML = `
                <i class="fas fa-info-circle" style="color:var(--accent);margin-right:8px;"></i>
                ${productData.description || 'Premium digital product with instant delivery. Secure payment and 24/7 support.'}
            `;

            // Load items
            await loadItems();

            // Load similar products
            await loadSimilarProducts();

        } catch (error) {
            console.error('Error loading product:', error);
        }
    }

    // ===== Load Items =====
    async function loadItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        itemsGrid.innerHTML = '<div style="color:var(--text-muted);">Loading items...</div>';

        try {
            const snapshot = await db.collection('products')
                .doc(productId)
                .collection('items')
                .get();

            itemsData = [];
            snapshot.forEach(doc => {
                itemsData.push({ id: doc.id, ...doc.data() });
            });

            if (itemsData.length === 0) {
                itemsGrid.innerHTML = `
                    <div style="color:var(--text-muted);text-align:center;padding:20px;grid-column:1/-1;">
                        <i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
                        No items available for this product.
                    </div>
                `;
                document.getElementById('buyNowBtn').disabled = true;
                return;
            }

            let html = '';
            itemsData.forEach((item, index) => {
                const isActive = index === 0 ? 'active' : '';
                html += `
                    <div class="item-option ${isActive}" data-id="${item.id}">
                        <span class="item-icon"><i class="${item.icon || 'fas fa-box'}"></i></span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">$${item.price?.toFixed(2) || '0.00'}</span>
                    </div>
                `;
            });

            itemsGrid.innerHTML = html;

            // Set first item as selected
            if (itemsData.length > 0) {
                selectedItemId = itemsData[0].id;
            }

            // Add click listeners
            document.querySelectorAll('.item-option').forEach(el => {
                el.addEventListener('click', function() {
                    document.querySelectorAll('.item-option').forEach(e => e.classList.remove('active'));
                    this.classList.add('active');
                    selectedItemId = this.dataset.id;
                    document.getElementById('noItemSelected').style.display = 'none';
                    document.getElementById('buyNowBtn').disabled = false;
                });
            });

            document.getElementById('buyNowBtn').disabled = false;

        } catch (error) {
            console.error('Error loading items:', error);
            itemsGrid.innerHTML = '<div style="color:#dc2626;">Error loading items.</div>';
        }
    }

    // ===== Load Similar Products =====
    async function loadSimilarProducts() {
        const similarGrid = document.getElementById('similarGrid');

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
            snapshot.forEach(doc => {
                const data = doc.data();
                if (doc.id === productId) return;
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
                    localStorage.setItem('selectedProductId', this.dataset.id);
                    window.location.reload();
                });
            });

        } catch (error) {
            console.error('Error loading similar products:', error);
        }
    }

    // ===== Buy Now =====
    document.getElementById('buyNowBtn').addEventListener('click', function() {
        if (!selectedItemId) {
            document.getElementById('noItemSelected').style.display = 'block';
            return;
        }

        const selectedItem = itemsData.find(item => item.id === selectedItemId);
        if (!selectedItem) return;

        localStorage.setItem('selectedProduct', JSON.stringify({
            id: productId,
            name: productData.name,
            price: selectedItem.price || productData.price,
            itemName: selectedItem.name,
            itemId: selectedItem.id
        }));

        window.location.href = 'payment.html';
    });

    // ===== Theme Toggle =====
    const themeToggle = document.getElementById('themeToggle');
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

    // ===== Init =====
    loadProduct();
});
