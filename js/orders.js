document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Orders page loaded');

    // ===== THEME TOGGLE =====
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
    async function loadProductSelect() {
        const select = document.getElementById('orderProduct');
        try {
            const snapshot = await db.collection('products').get();
            select.innerHTML = '<option value="">Select Product</option>';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = data.name || 'Unnamed Product';
                select.appendChild(option);
            });

            select.addEventListener('change', function() {
                loadPlanSelect(this.value);
            });

        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    // ============================================================
    // ===== LOAD PLANS =====
    // ============================================================
    async function loadPlanSelect(productId) {
        const select = document.getElementById('orderPlan');
        select.innerHTML = '<option value="">Select Plan</option>';
        document.getElementById('orderPrice').value = '';

        if (!productId) return;

        try {
            const snapshot = await db.collection('products')
                .doc(productId)
                .collection('items')
                .get();

            snapshot.forEach(doc => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = data.name || 'Plan';
                option.dataset.price = data.price || 0;
                select.appendChild(option);
            });

            select.addEventListener('change', function() {
                const selected = this.options[this.selectedIndex];
                if (selected && selected.dataset.price) {
                    document.getElementById('orderPrice').value = selected.dataset.price;
                }
            });

        } catch (error) {
            console.error('Error loading plans:', error);
        }
    }

    // ============================================================
    // ===== LOAD ORDERS =====
    // ============================================================
    async function loadOrders() {
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i><p>Loading orders...</p></div>';

        try {
            const snapshot = await db.collection('orders')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-orders">
                        <i class="fas fa-box-open"></i>
                        <h3>No Orders</h3>
                        <p>Add your first order!</p>
                    </div>
                `;
                updateStats([]);
                return;
            }

            let orders = [];
            let html = '';
            let completed = 0, pending = 0, revenue = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                orders.push(data);

                const date = data.createdAt?.toDate?.() || new Date();
                const status = data.status || 'completed';
                const price = data.price || 0;

                if (status === 'completed') completed++;
                if (status === 'pending') pending++;
                if (status === 'completed') revenue += price;

                const statusClass = status === 'completed' ? 'status-completed' : 
                                   status === 'cancelled' ? 'status-cancelled' : 'status-pending';

                html += `
                    <div class="order-item" data-id="${doc.id}">
                        <div class="order-left">
                            <div class="order-id">#${data.orderId || 'N/A'}</div>
                            <div class="order-product">${data.productName || 'Product'}</div>
                            <div class="order-detail">
                                <i class="fas fa-calendar"></i> ${data.plan || 'Standard'}
                                ${data.userInfo ? `| <i class="fas fa-user"></i> ${data.userInfo}` : ''}
                            </div>
                        </div>
                        <div class="order-right">
                            <div class="order-amount">$${price.toFixed(2)}</div>
                            <div class="order-status ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</div>
                            <div class="order-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
                            <div>
                                <button class="btn-edit-order" data-id="${doc.id}" style="padding:4px 12px;font-size:0.75rem;border-radius:40px;border:none;cursor:pointer;background:var(--bg-primary);color:var(--accent);"><i class="fas fa-edit"></i></button>
                                <button class="btn-delete-order" data-id="${doc.id}" style="padding:4px 12px;font-size:0.75rem;border-radius:40px;border:none;cursor:pointer;background:#fef2f2;color:#dc2626;"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
            updateStats(orders);

            // Edit buttons
            document.querySelectorAll('.btn-edit-order').forEach(btn => {
                btn.addEventListener('click', function() {
                    openOrderModal(this.dataset.id);
                });
            });

            // Delete buttons
            document.querySelectorAll('.btn-delete-order').forEach(btn => {
                btn.addEventListener('click', async function() {
                    if (confirm('Delete this order?')) {
                        try {
                            await db.collection('orders').doc(this.dataset.id).delete();
                            alert('✅ Order deleted!');
                            loadOrders();
                        } catch (error) {
                            alert('❌ Error: ' + error.message);
                        }
                    }
                });
            });

        } catch (error) {
            container.innerHTML = `<p style="color:var(--danger);">Error: ${error.message}</p>`;
            console.error('Error loading orders:', error);
        }
    }

    // ============================================================
    // ===== UPDATE STATS =====
    // ============================================================
    function updateStats(orders) {
        let total = orders.length;
        let completed = 0, pending = 0, revenue = 0;

        orders.forEach(order => {
            const status = order.status || 'completed';
            const price = order.price || 0;
            if (status === 'completed') completed++;
            if (status === 'pending') pending++;
            if (status === 'completed') revenue += price;
        });

        document.getElementById('totalOrders').textContent = total;
        document.getElementById('totalCompleted').textContent = completed;
        document.getElementById('totalPending').textContent = pending;
        document.getElementById('totalRevenue').textContent = '$' + revenue.toFixed(2);
    }

    // ============================================================
    // ===== OPEN MODAL =====
    // ============================================================
    async function openOrderModal(orderId = null) {
        const modal = document.getElementById('orderModal');
        modal.style.display = 'flex';

        if (orderId) {
            document.querySelector('#orderModal h3').textContent = 'Edit Order';
            document.getElementById('editOrderId').value = orderId;

            try {
                const doc = await db.collection('orders').doc(orderId).get();
                const data = doc.data();

                document.getElementById('orderProduct').value = data.productId || '';
                await loadPlanSelect(data.productId);
                document.getElementById('orderPlan').value = data.planId || '';
                document.getElementById('orderUserInfo').value = data.userInfo || '';
                document.getElementById('orderPrice').value = data.price || '';
                document.getElementById('orderStatus').value = data.status || 'completed';

            } catch (error) {
                alert('Error loading order: ' + error.message);
            }
        } else {
            document.querySelector('#orderModal h3').textContent = 'Add Order';
            document.getElementById('editOrderId').value = '';
            document.getElementById('orderForm').reset();
            document.getElementById('orderPlan').innerHTML = '<option value="">Select Plan</option>';
            document.getElementById('orderPrice').value = '';
        }
    }

    // ============================================================
    // ===== SAVE ORDER =====
    // ============================================================
    document.getElementById('orderForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const editId = document.getElementById('editOrderId').value;
        const productSelect = document.getElementById('orderProduct');
        const planSelect = document.getElementById('orderPlan');

        const productId = productSelect.value;
        const productName = productSelect.options[productSelect.selectedIndex]?.text || 'Product';
        const planId = planSelect.value;
        const planName = planSelect.options[planSelect.selectedIndex]?.text || 'Plan';
        const userInfo = document.getElementById('orderUserInfo').value.trim();
        const price = parseFloat(document.getElementById('orderPrice').value);
        const status = document.getElementById('orderStatus').value;

        if (!productId || !planId || !userInfo || isNaN(price)) {
            alert('Please fill all fields.');
            return;
        }

        const data = {
            productId: productId,
            productName: productName,
            planId: planId,
            plan: planName,
            userInfo: userInfo,
            price: price,
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection('orders').doc(editId).update(data);
                alert('✅ Order updated!');
            } else {
                const countSnap = await db.collection('orders').get();
                const nextId = countSnap.size + 1;
                data.orderId = nextId;
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('orders').add(data);
                alert('✅ Order added!');
            }
            document.getElementById('orderModal').style.display = 'none';
            loadOrders();
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    });

    // ============================================================
    // ===== MODAL CONTROLS =====
    // ============================================================
    document.getElementById('addOrderBtn').addEventListener('click', function() {
        openOrderModal(null);
    });

    document.getElementById('refreshBtn').addEventListener('click', loadOrders);

    document.getElementById('orderModalClose').addEventListener('click', function() {
        document.getElementById('orderModal').style.display = 'none';
    });

    document.getElementById('orderModalCancel').addEventListener('click', function() {
        document.getElementById('orderModal').style.display = 'none';
    });

    document.getElementById('orderModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // ============================================================
    // ===== INIT =====
    // ============================================================
    loadProductSelect();
    loadOrders();
});
