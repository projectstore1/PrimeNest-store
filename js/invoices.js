document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Invoices page loaded');

    const db = firebase.firestore();

    // ============================================================
    // ===== LOAD INVOICES =====
    // ============================================================
    async function loadInvoices() {
        const container = document.getElementById('invoicesContainer');
        container.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';

        try {
            const snapshot = await db.collection('invoices')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            if (snapshot.empty) {
                container.innerHTML = `
                    <div style="text-align:center;padding:60px;color:var(--text-muted);">
                        <i class="fas fa-file-invoice" style="font-size:3rem;display:block;margin-bottom:12px;color:var(--border-color);"></i>
                        <p>No invoices yet</p>
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate?.() || new Date();
                const status = data.status || 'pending';
                const statusClass = status === 'completed' ? 'status-completed' : 
                                   status === 'cancelled' ? 'status-cancelled' : 'status-pending';

                html += `
                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:16px 20px;margin-bottom:12px;">
                        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                            <div style="flex:1;min-width:200px;">
                                <div style="font-weight:700;color:var(--accent);font-size:1rem;">INV-${data.orderId || 'N/A'}</div>
                                <div style="font-weight:600;color:var(--text-primary);">${data.productName || 'Product'} - ${data.plan || 'Standard'}</div>
                                <div style="font-size:0.85rem;color:var(--text-muted);">👤 ${data.userInfo || 'No info'}</div>
                                <div style="font-size:0.8rem;color:var(--text-muted);">🕐 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
                                <div style="font-size:0.8rem;color:var(--text-muted);">💳 ${data.paymentMethod || 'N/A'}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:700;color:var(--accent);font-size:1.2rem;">$${(data.price || 0).toFixed(2)}</div>
                                <span class="status-badge ${statusClass}" style="display:inline-block;padding:4px 14px;border-radius:40px;font-size:0.75rem;font-weight:600;margin-top:6px;">${status}</span>
                                <div style="margin-top:8px;">
                                    ${data.screenshotUrl ? `<a href="${data.screenshotUrl}" target="_blank" style="color:var(--accent);font-size:0.8rem;text-decoration:none;"><i class="fas fa-image"></i> View Screenshot</a>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (error) {
            container.innerHTML = `<p style="color:var(--danger);">Error: ${error.message}</p>`;
        }
    }

    document.getElementById('refreshBtn').addEventListener('click', loadInvoices);
    loadInvoices();
});
