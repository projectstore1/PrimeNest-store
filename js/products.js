document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Products page loaded');

    const db = firebase.firestore();

    // ============================================================
    // ===== THEME TOGGLE =====
    // ============================================================
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('adminTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('adminTheme', next);
        themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // ============================================================
    // ===== LOAD PRODUCTS =====
    // ============================================================
    async function loadProducts() {
        const container = document.getElementById('productsContainer');
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';

        try {
            const snapshot = await db.collection('products').get();

            if (snapshot.empty) {
                container.innerHTML = `
                    <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
                        <i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:12px;color:var(--border-color);"></i>
                        <p>No products yet. Add your first product!</p>
                    </div>
                `;
                return;
            }

            let html = `<table class="product-table"><thead><tr>
                <th>Image</th><th>Name</th><th>Price</th><th>User Field</th><th>Status</th><th>Actions</th>
            </tr></thead><tbody>`;

            snapshot.forEach(doc => {
                const data = doc.data();
                html += `
                    <tr>
                        <td><img src="${data.image || 'https://via.placeholder.com/50x50?text=No+Img'}" alt="${data.name}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></td>
                        <td><strong>${data.name || 'Unnamed'}</strong></td>
                        <td>$${data.price?.toFixed(2) || '0.00'}</td>
                        <td><span style="font-size:0.8rem;color:var(--accent);">${data.userFieldLabel || 'Not Set'}</span></td>
                        <td><span class="status-badge status-${data.status || 'available'}">${data.status || 'available'}</span></td>
                        <td>
                            <button class="btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i> Edit</button>
                            <button class="btn-delete" data-id="${doc.id}"><i class="fas fa-trash"></i> Delete</button>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;

            // Edit Buttons
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', function() {
                    openProductModal(this.dataset.id);
                });
            });

            // Delete Buttons
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async function() {
                    if (confirm('Delete this product and all its items?')) {
                        try {
                            // Delete items first
                            const itemsSnap = await db.collection('products').doc(this.dataset.id).collection('items').get();
                            for (const item of itemsSnap.docs) {
                                await item.ref.delete();
                            }
                            // Delete product
                            await db.collection('products').doc(this.dataset.id).delete();
                            alert('✅ Product deleted!');
                            loadProducts();
                        } catch (error) {
                            alert('❌ Error: ' + error.message);
                        }
                    }
                });
            });

            console.log('✅ Loaded', snapshot.size, 'products');

        } catch (error) {
            console.error('❌ Error:', error);
            container.innerHTML = `<p style="color:var(--danger);text-align:center;padding:40px;">Error: ${error.message}</p>`;
        }
    }

    // ============================================================
    // ===== OPEN PRODUCT MODAL =====
    // ============================================================
    async function openProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        modal.style.display = 'flex';

        if (productId) {
            document.getElementById('modalTitle').textContent = 'Edit Product';
            try {
                const doc = await db.collection('products').doc(productId).get();
                if (doc.exists) {
                    const data = doc.data();
                    document.getElementById('editProductId').value = productId;
                    document.getElementById('productName').value = data.name || '';
                    document.getElementById('productPrice').value = data.price || '';
                    document.getElementById('productImage').value = data.image || '';
                    document.getElementById('productDescription').value = data.description || '';
                    document.getElementById('userFieldLabel').value = data.userFieldLabel || '';
                    document.getElementById('userFieldPlaceholder').value = data.userFieldPlaceholder || '';
                    document.getElementById('userFieldRequired').value = data.userFieldRequired !== false ? 'true' : 'false';
                    document.getElementById('productStatus').value = data.status || 'available';
                    loadItems(productId);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error loading product');
            }
        } else {
            document.getElementById('modalTitle').textContent = 'Add Product';
            document.getElementById('productForm').reset();
            document.getElementById('editProductId').value = '';
            document.getElementById('itemsContainer').innerHTML = '<p style="color:var(--text-muted);">Save product first to add items.</p>';
        }
    }

    // ============================================================
    // ===== LOAD ITEMS =====
    // ============================================================
    async function loadItems(productId) {
        const container = document.getElementById('itemsContainer');
        try {
            const snapshot = await db.collection('products').doc(productId).collection('items').get();
            
            if (snapshot.empty) {
                container.innerHTML = '<p style="color:var(--text-muted);">No items yet. Add items below.</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                html += `
                    <div class="item-row" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-primary);border-radius:12px;margin-bottom:6px;border:1px solid var(--border-color);">
                        <span>
                            <strong>${data.name}</strong> 
                            <span style="color:var(--accent);font-weight:700;margin-left:8px;">$${data.price?.toFixed(2) || '0.00'}</span>
                        </span>
                        <button class="btn-delete-item" data-id="${doc.id}" style="padding:4px 10px;font-size:0.8rem;background:#fef2f2;color:#dc2626;border:none;border-radius:40px;cursor:pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
            container.innerHTML = html;

            // Delete item buttons
            container.querySelectorAll('.btn-delete-item').forEach(btn => {
                btn.addEventListener('click', async function() {
                    if (confirm('Delete this item?')) {
                        try {
                            await db.collection('products').doc(productId).collection('items').doc(this.dataset.id).delete();
                            loadItems(productId);
                        } catch (error) {
                            alert('Error: ' + error.message);
                        }
                    }
                });
            });

        } catch (error) {
            container.innerHTML = '<p style="color:var(--danger);">Error loading items</p>';
        }
    }

    // ============================================================
    // ===== ADD ITEM =====
    // ============================================================
    document.getElementById('addItemBtn').addEventListener('click', async function() {
        const productId = document.getElementById('editProductId').value;
        
        if (!productId) {
            alert('⚠️ Please save the product first before adding items.');
            return;
        }

        const name = document.getElementById('itemNameInput').value.trim();
        const price = parseFloat(document.getElementById('itemPriceInput').value);

        if (!name || isNaN(price)) {
            alert('Please enter item name and price.');
            return;
        }

        try {
            await db.collection('products').doc(productId).collection('items').add({
                name: name,
                price: price,
                icon: 'fas fa-box'
            });
            
            document.getElementById('itemNameInput').value = '';
            document.getElementById('itemPriceInput').value = '';
            loadItems(productId);
            console.log('✅ Item added:', name);
        } catch (error) {
            alert('Error adding item: ' + error.message);
        }
    });

    // ============================================================
    // ===== SAVE PRODUCT =====
    // ============================================================
    document.getElementById('productForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const editId = document.getElementById('editProductId').value;
        
        const data = {
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            image: document.getElementById('productImage').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            userFieldLabel: document.getElementById('userFieldLabel').value.trim(),
            userFieldPlaceholder: document.getElementById('userFieldPlaceholder').value.trim() || 'Enter info',
            userFieldRequired: document.getElementById('userFieldRequired').value === 'true',
            status: document.getElementById('productStatus').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection('products').doc(editId).update(data);
                alert('✅ Product updated!');
            } else {
                const doc = await db.collection('products').add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                document.getElementById('editProductId').value = doc.id;
                alert('✅ Product added! Now you can add items below.');
            }
            
            loadProducts();
            
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    });

    // ============================================================
    // ===== BUTTONS =====
    // ============================================================
    document.getElementById('addProductBtn').addEventListener('click', function() {
        openProductModal(null);
    });

    document.getElementById('refreshBtn').addEventListener('click', loadProducts);

    document.getElementById('modalClose').addEventListener('click', function() {
        document.getElementById('productModal').style.display = 'none';
    });

    document.getElementById('modalCancel').addEventListener('click', function() {
        document.getElementById('productModal').style.display = 'none';
    });

    // Close modal on outside click
    document.getElementById('productModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // ============================================================
    // ===== INIT =====
    // ============================================================
    loadProducts();
    console.log('✅ Products page ready!');
});
