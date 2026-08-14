document.addEventListener('DOMContentLoaded', async function() {
    async function loadOrders() {
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';

        try {
            const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
            if (snapshot.empty) {
                container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
                    <i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:12px;"></i>
                    <p>No orders yet. Add your first order!</p></div>`;
                return;
            }

            let html = `<table class="product-table"><thead><tr>
                <th>Order ID</th><th>Product</th><th>Item</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th>
            </tr></thead><tbody>`;

            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate?.() || new Date();
                html += `<tr>
                    <td><strong>#${data.orderId || 'N/A'}</strong></td>
                    <td>${data.product || 'Unknown'}</td>
                    <td>${data.item || '-'}</td>
                    <td style="font-weight:700;color:var(--accent);">$${data.amount?.toFixed(2) || '0.00'}</td>
                    <td>
                        <select class="status-select" data-id="${doc.id}" style="padding:4px 8px;border-radius:8px;border:1px solid var(--border-color);background:var(--input-bg);color:var(--text-primary);">
                            <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${data.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td style="font-size:0.85rem;color:var(--text-muted);">${date.toLocaleDateString()}</td>
                    <td><button class="btn-delete" data-id="${doc.id}" style="padding:4px 10px;font-size:0.8rem;"><i class="fas fa-trash"></i></button></td>
                </tr>`;
            });

            html += '</tbody></table>';
            container.innerHTML = html;

            document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', async () => {
                    await db.collection('orders').doc(select.dataset.id).update({ status: select.value });
                    alert('✅ Status updated!');
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Delete this order?')) {
                        await db.collection('orders').doc(btn.dataset.id).delete();
                        loadOrders();
                    }
                });
            });

        } catch (error) {
            container.innerHTML = `<p style="color:var(--danger);">Error: ${error.message}</p>`;
        }
    }

    document.getElementById('addOrderBtn').addEventListener('click', () => {
        document.getElementById('orderModal').style.display = 'flex';
        document.getElementById('orderForm').reset();
        document.getElementById('orderId').value = 'ORD-' + Date.now().toString().slice(-8);
    });

    document.getElementById('orderModalClose').addEventListener('click', () => {
        document.getElementById('orderModal').style.display = 'none';
    });
    document.getElementById('orderModalCancel').addEventListener('click', () => {
        document.getElementById('orderModal').style.display = 'none';
    });

    document.getElementById('orderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            orderId: document.getElementById('orderId').value || 'ORD-' + Date.now().toString().slice(-8),
            product: document.getElementById('orderProduct').value.trim(),
            item: document.getElementById('orderItem').value.trim(),
            amount: parseFloat(document.getElementById('orderAmount').value),
            status: document.getElementById('orderStatus').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('orders').add(data);
        alert('✅ Order added!');
        document.getElementById('orderModal').style.display = 'none';
        loadOrders();
    });

    document.getElementById('refreshBtn').addEventListener('click', loadOrders);
    loadOrders();
});