document.addEventListener('DOMContentLoaded', function() {
    console.log('⚡ Quick Order loaded');

    // ============================================================
    // ===== FIREBASE =====
    // ============================================================
    const db = firebase.firestore();

    // ============================================================
    // ===== PLAN SELECTOR =====
    // ============================================================
    const planOptions = document.querySelectorAll('.plan-option');
    const selectedPlanInput = document.getElementById('selectedPlan');
    const selectedPriceInput = document.getElementById('selectedPrice');
    const orderPriceInput = document.getElementById('orderPrice');

    planOptions.forEach(option => {
        option.addEventListener('click', function() {
            planOptions.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            const plan = this.dataset.plan;
            const price = parseFloat(this.dataset.price);

            selectedPlanInput.value = plan;
            selectedPriceInput.value = price;
            orderPriceInput.value = price;
        });
    });

    // ============================================================
    // ===== GENERATE ORDER ID =====
    // ============================================================
    async function generateOrderId() {
        try {
            const counterDoc = await db.collection('settings').doc('orderCounter').get();

            if (counterDoc.exists) {
                const currentCounter = counterDoc.data().counter || 0;
                const newCounter = currentCounter + 1;
                await db.collection('settings').doc('orderCounter').set({ counter: newCounter }, { merge: true });
                return newCounter;
            } else {
                const ordersSnap = await db.collection('orders').get();
                const totalOrders = ordersSnap.size;
                const startCounter = totalOrders + 1;
                await db.collection('settings').doc('orderCounter').set({ counter: startCounter });
                return startCounter;
            }
        } catch (error) {
            console.error('Error generating order ID:', error);
            return Date.now().toString().slice(-6);
        }
    }

    // ============================================================
    // ===== LOAD ORDERS =====
    // ============================================================
    async function loadOrders() {
        const container = document.getElementById('ordersContainer');
        const countEl = document.getElementById('orderCount');

        try {
            const snapshot = await db.collection('orders')
                .where('productId', '==', 'x-premium')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-orders">No orders yet</div>';
                countEl.textContent = '0 orders';
                return;
            }

            let html = '';
            let count = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                count++;

                const status = data.status || 'completed';
                const price = data.price || 0;

                html += `
                    <div class="order-item" data-id="${doc.id}">
                        <div class="order-info">
                            <div class="order-id">#${data.orderId || 'N/A'}</div>
                            <div class="order-plan">${data.plan || '3 Month'} - $${price.toFixed(2)}</div>
                            <div class="order-user">${data.userInfo || 'No user'}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span class="order-status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                            <div class="order-actions">
                                <button class="btn-delete" onclick="deleteOrder('${doc.id}')" title="Delete Order">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
            countEl.textContent = count + ' orders';

        } catch (error) {
            console.error('Error loading orders:', error);
            container.innerHTML = '<div class="empty-orders">Error loading orders</div>';
        }
    }

    // ============================================================
    // ===== DELETE ORDER =====
    // ============================================================
    window.deleteOrder = async function(orderId) {
        if (!confirm('Delete this order?')) return;

        try {
            await db.collection('orders').doc(orderId).delete();
            console.log('✅ Order deleted:', orderId);
            loadOrders();
        } catch (error) {
            console.error('❌ Error deleting:', error);
            alert('Error deleting order: ' + error.message);
        }
    };

    // ============================================================
    // ===== SUBMIT ORDER =====
    // ============================================================
    const form = document.getElementById('quickOrderForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const plan = selectedPlanInput.value;
        const price = parseFloat(orderPriceInput.value);
        const userInfo = document.getElementById('userInfo').value.trim();
        const status = document.getElementById('orderStatus').value;

        if (!userInfo) {
            alert('❌ Please enter X username or profile link.');
            return;
        }

        if (isNaN(price) || price <= 0) {
            alert('❌ Please enter a valid price.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

        try {
            const orderId = await generateOrderId();

            const data = {
                orderId: orderId,
                productId: 'x-premium',
                productName: 'X Premium',
                planId: plan,
                plan: plan,
                userInfo: userInfo,
                price: price,
                status: status,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('orders').add(data);

            successMsg.classList.add('show');
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Order #' + orderId + ' added!';

            document.getElementById('userInfo').value = '';

            setTimeout(() => {
                successMsg.classList.remove('show');
            }, 3000);

            console.log('✅ Order added:', data);
            loadOrders();

        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ Error: ' + error.message);
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-bolt"></i> Add Order';
    });

    // ============================================================
    // ===== INIT =====
    // ============================================================
    loadOrders();

    console.log('✅ Quick Order ready!');
});
