document.addEventListener('DOMContentLoaded', async function() {
    try {
        const productsSnap = await db.collection('products').get();
        document.getElementById('totalProducts').textContent = productsSnap.size;

        let totalItems = 0;
        for (const doc of productsSnap.docs) {
            const itemsSnap = await db.collection('products').doc(doc.id).collection('items').get();
            totalItems += itemsSnap.size;
        }
        document.getElementById('totalItems').textContent = totalItems;

        const ordersSnap = await db.collection('orders').get();
        document.getElementById('totalOrders').textContent = ordersSnap.size;

        let revenue = 0;
        ordersSnap.forEach(doc => { revenue += doc.data().amount || 0; });
        document.getElementById('totalRevenue').textContent = '$' + revenue.toFixed(2);

        const recentSnap = await db.collection('orders').orderBy('createdAt', 'desc').limit(5).get();
        const listEl = document.getElementById('recentOrdersList');
        if (recentSnap.empty) {
            listEl.innerHTML = '<p style="color:var(--text-muted);">No orders yet.</p>';
            return;
        }

        let html = '';
        recentSnap.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt?.toDate?.() || new Date();
            html += `<div class="order-row">
                <span class="order-id">#${data.orderId || 'N/A'}</span>
                <span>${data.product || 'Unknown'}</span>
                <span class="order-amount">$${data.amount?.toFixed(2) || '0.00'}</span>
                <span class="status-badge status-${data.status || 'pending'}">${data.status || 'pending'}</span>
                <span style="font-size:0.85rem;color:var(--text-muted);">${date.toLocaleDateString()}</span>
            </div>`;
        });
        listEl.innerHTML = html;
    } catch (error) {
        console.error('Dashboard error:', error);
    }
});