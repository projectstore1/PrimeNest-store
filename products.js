document.addEventListener('DOMContentLoaded', async function() {
    let currentProductId = null;

    async function loadProducts() {
        const container = document.getElementById('productsContainer');
        container.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';

        try {
            const snapshot = await db.collection('products').get();
            if (snapshot.empty) {
                container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
                    <i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:12px;"></i>
                    <p>No products. Add your first product!</p></div>`;
                return;
            }

            let html = `<table class="product-table"><thead><tr>
                <th>Image</th><th>Name</th><th>Price</th><th>Status</th><th>Items</th><th>Actions</th>
            </tr></thead><tbody>`;

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const itemsSnap = await db.collection('products').doc(doc.id).collection('items').get();
                html += `<tr>
                    <td><img src="${data.image || 'https://via.placeholder.com/50x50?text=No+Img'}" alt="${data.name}"></td>
                    <td><strong>${data.name}</strong></td>
                    <td>$${data.price?.toFixed(2) || '0.00'}</td>
                    <td><span class="status-badge status-${data.status || 'available'}">${data.status || 'available'}</span></td>
                    <td>${itemsSnap.size} items</td>
                    <td>
                        <button class="btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-delete" data-id="${doc.id}"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                </tr>`;
            }

            html += '</tbody></table>';
            container.innerHTML = html;

            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => openProductModal(btn.dataset.id));
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Delete this product and all its items?')) {
                        const itemsSnap = await db.collection('products').doc(btn.dataset.id).collection('items').get();
                        for (const item of itemsSnap.docs) await item.ref.delete();
                        await db.collection('products').doc(btn.dataset.id).delete();
                        loadProducts();
                    }
                });
            });

        } catch (error) {
            container.innerHTML = `<p style="color:var(--danger);">Error: ${error.message}</p>`;
        }
    }

    async function openProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        modal.style.display = 'flex';
        currentProductId = productId;

        if (productId) {
            document.getElementById('modalTitle').textContent = 'Edit Product';
            const doc = await db.collection('products').doc(productId).get();
            const data = doc.data();
            document.getElementById('editProductId').value = productId;
            document.getElementById('productName').value = data.name || '';
            document.getElementById('productPrice').value = data.price || '';
            document.getElementById('productImage').value = data.image || '';
            document.getElementById('productDescription').value = data.description || '';
            document.getElementById('productStatus').value = data.status || 'available';
            loadItems(productId);
        } else {
            document.getElementById('modalTitle').textContent = 'Add Product';
            document.getElementById('productForm').reset();
            document.getElementById('editProductId').value = '';
            document.getElementById('itemsContainer').innerHTML = '<p style="color:var(--text-muted);">Save product first</p>';
        }
    }

    async function loadItems(productId) {
        const container = document.getElementById('itemsContainer');
        try {
            const snapshot = await db.collection('products').doc(productId).collection('items').get();
            if (snapshot.empty) {
                container.innerHTML = '<p style="color:var(--text-muted);">No items yet.</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                html += `<div class="item-row">
                    <div><span>${data.name}</span><span style="color:var(--accent);font-weight:700;margin-left:12px;">$${data.price?.toFixed(2) || '0.00'}</span></div>
                    <button class="btn-delete" data-id="${doc.id}" style="padding:4px 10px;font-size:0.8rem;"><i class="fas fa-times"></i></button>
                </div>`;
            });
            container.innerHTML = html;

            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Delete this item?')) {
                        await db.collection('products').doc(productId).collection('items').doc(btn.dataset.id).delete();
                        loadItems(productId);
                    }
                });
            });

        } catch (error) {
            container.innerHTML = '<p style="color:var(--danger);">Error loading items</p>';
        }
    }

    document.getElementById('addItemBtn').addEventListener('click', async () => {
        const productId = document.getElementById('editProductId').value;
        if (!productId) { alert('Save product first'); return; }

        const name = document.getElementById('itemNameInput').value.trim();
        const price = parseFloat(document.getElementById('itemPriceInput').value);
        if (!name || isNaN(price)) { alert('Enter name and price'); return; }

        await db.collection('products').doc(productId).collection('items').add({ name, price, icon: 'fas fa-box' });
        document.getElementById('itemNameInput').value = '';
        document.getElementById('itemPriceInput').value = '';
        loadItems(productId);
    });

    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editProductId').value;
        const data = {
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            image: document.getElementById('productImage').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            status: document.getElementById('productStatus').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editId) {
            await db.collection('products').doc(editId).update(data);
            alert('✅ Product updated!');
        } else {
            const doc = await db.collection('products').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            document.getElementById('editProductId').value = doc.id;
            alert('✅ Product added! Now add items.');
        }
        loadProducts();
        document.getElementById('productModal').style.display = 'none';
    });

    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal(null));
    document.getElementById('refreshBtn').addEventListener('click', loadProducts);

    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('productModal').style.display = 'none';
    });
    document.getElementById('modalCancel').addEventListener('click', () => {
        document.getElementById('productModal').style.display = 'none';
    });

    loadProducts();
});