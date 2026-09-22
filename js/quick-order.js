document.addEventListener('DOMContentLoaded', function() {
    console.log('⚡ Quick Order loaded');

    const db = firebase.firestore();

    // ============================================================
    // ===== BASE URL FOR INVOICE LINK =====
    // ============================================================
    const INVOICE_BASE_URL = 'https://projectstore1.github.io/PrimeNest-store/invoice.html?orderId=';

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
                const current = counterDoc.data().counter || 0;
                const next = current + 1;
                await db.collection('settings').doc('orderCounter').set({ counter: next }, { merge: true });
                return next;
            } else {
                const snap = await db.collection('orders').get();
                const start = snap.size + 1;
                await db.collection('settings').doc('orderCounter').set({ counter: start });
                return start;
            }
        } catch (error) {
            console.error('ID error:', error);
            return Date.now().toString().slice(-6);
        }
    }

    // ============================================================
    // ===== UPDATE STATS =====
    // ============================================================
    async function updateStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const snapshot = await db.collection('orders')
                .where('productId', '==', 'x-premium')
                .get();

            let total = 0;
            let completed = 0;
            let todayCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                total++;

                if (data.status === 'completed') completed++;

                if (data.createdAt) {
                    const orderDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    orderDate.setHours(0, 0, 0, 0);
                    if (orderDate.getTime() === today.getTime()) todayCount++;
                }
            });

            document.getElementById('todayCount').textContent = todayCount;
            document.getElementById('completedCount').textContent = completed;
            document.getElementById('totalCount').textContent = total;

        } catch (error) {
            console.error('Error updating stats:', error);
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
                .limit(20)
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-orders">📭 No orders yet</div>';
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

                let dateStr = 'Just now';
                if (data.createdAt) {
                    const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                html += `
                    <div class="order-item" data-id="${doc.id}">
                        <div class="order-info">
                            <div class="order-id">#${data.orderId || 'N/A'}</div>
                            <div class="order-plan">${data.plan || '3 Month'} - $${price.toFixed(2)}</div>
                            <div class="order-user">👤 ${data.userInfo || 'No user'}</div>
                            <div class="order-date">🕐 ${dateStr}</div>
                        </div>
                        <div class="order-right">
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
            container.innerHTML = '<div class="empty-orders">❌ Error loading orders</div>';
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
            updateStats();
        } catch (error) {
            console.error('❌ Error deleting:', error);
            alert('Error deleting order: ' + error.message);
        }
    };

    // ============================================================
    // ===== SHOW TOAST =====
    // ============================================================
    function showToast(msg) {
        const toast = document.getElementById('toastMsg');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ============================================================
    // ===== COPY INVOICE LINK =====
    // ============================================================
    document.getElementById('copyInvoiceLinkBtn').addEventListener('click', function() {
        const input = document.getElementById('invoiceLinkInput');
        const btn = this;

        const fallback = () => {
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand('copy');
            showCopiedState();
        };

        const showCopiedState = () => {
            btn.classList.add('copied');
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            showToast('✅ Invoice link copied!');

            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(input.value).then(showCopiedState).catch(fallback);
        } else {
            fallback();
        }
    });

    // ============================================================
    // ===== SUBMIT ORDER =====
    // ============================================================
    const form = document.getElementById('quickOrderForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');
    const invoiceLinkBox = document.getElementById('invoiceLinkBox');
    const invoiceLinkInput = document.getElementById('invoiceLinkInput');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const plan = document.getElementById('selectedPlan').value;
        const price = parseFloat(document.getElementById('orderPrice').value);
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
                userFieldLabel: 'X Username',
                price: price,
                nairaPrice: price * 1440,
                currency: 'crypto',
                paymentMethod: 'Admin Created',
                status: status,
                invoiceCreated: true,
                createdBy: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save order
            const orderRef = await db.collection('orders').add(data);

            // Save invoice
            const invoiceData = {
                invoiceId: 'INV-' + orderId,
                orderId: orderId,
                orderDocId: orderRef.id,
                productName: 'X Premium',
                plan: plan,
                userInfo: userInfo,
                userFieldLabel: 'X Username',
                price: price,
                nairaPrice: price * 1440,
                currency: 'crypto',
                paymentMethod: 'Admin Created',
                status: status,
                createdBy: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('invoices').add(invoiceData);

            // Generate Invoice Link
            const invoiceLink = INVOICE_BASE_URL + orderId;

            // Show link in box
            invoiceLinkInput.value = invoiceLink;
            invoiceLinkBox.classList.add('show');

            // Show success
            successMsg.classList.add('show');
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Order #' + orderId + ' added successfully!';

            // Auto-copy link
            if (navigator.clipboard) {
                navigator.clipboard.writeText(invoiceLink).catch(() => {});
            }

            // Clear input
            document.getElementById('userInfo').value = '';

            // Hide success after 3 seconds
            setTimeout(() => {
                successMsg.classList.remove('show');
            }, 3000);

            // Refresh lists
            await loadOrders();
            await updateStats();

            console.log('✅ Order added:', orderId);

        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ Error adding order: ' + error.message);
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-bolt"></i> Add Order';
    });

    // ============================================================
    // ===== INIT =====
    // ============================================================
    loadOrders();
    updateStats();

    // Auto refresh every 30 seconds
    setInterval(() => {
        loadOrders();
        updateStats();
    }, 30000);

    console.log('✅ Quick Order ready!');
});
