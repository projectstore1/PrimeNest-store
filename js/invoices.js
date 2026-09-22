// ============================================================
// ===== ADMIN INVOICES PAGE JAVASCRIPT =====
// ============================================================

(function() {
    'use strict';

    // ===== GLOBAL VARIABLES =====
    let allInvoices = [];
    let currentFilter = 'all';
    let db = null;

    // ============================================================
    // ===== INIT =====
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 Invoice Page Loaded');

        // Firebase
        db = firebase.firestore();

        // Setup
        setupThemeToggle();
        attachEventListeners();
        loadInvoices();
    });

    // ============================================================
    // ===== THEME TOGGLE =====
    // ============================================================
    function setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

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
    }

    // ============================================================
    // ===== ATTACH EVENT LISTENERS =====
    // ============================================================
    function attachEventListeners() {
        // Create Invoice Button
        const createBtn = document.getElementById('createInvoiceBtn');
        if (createBtn) {
            createBtn.addEventListener('click', openCreateModal);
        }

        // Refresh Button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                loadInvoices();
                showToast('✅ Refreshed!');
            });
        }

        // Filter Tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                displayInvoices();
            });
        });

        // Modal Controls
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeCreateModal);
        }

        const modalCancelBtn = document.getElementById('modalCancelBtn');
        if (modalCancelBtn) {
            modalCancelBtn.addEventListener('click', closeCreateModal);
        }

        const invoiceModal = document.getElementById('invoiceModal');
        if (invoiceModal) {
            invoiceModal.addEventListener('click', function(e) {
                if (e.target === this) closeCreateModal();
            });
        }

        // Product Change → Load Plans
        const productSelect = document.getElementById('invoiceProduct');
        if (productSelect) {
            productSelect.addEventListener('change', loadPlansForProduct);
        }

        // Plan Change → Auto Fill Price
        const planSelect = document.getElementById('invoicePlan');
        if (planSelect) {
            planSelect.addEventListener('change', function() {
                const selected = this.options[this.selectedIndex];
                if (selected && selected.dataset.price) {
                    document.getElementById('invoicePrice').value = selected.dataset.price;
                }
            });
        }

        // Form Submit
        const invoiceForm = document.getElementById('invoiceForm');
        if (invoiceForm) {
            invoiceForm.addEventListener('submit', submitInvoice);
        }
    }

    // ============================================================
    // ===== LOAD INVOICES =====
    // ============================================================
    async function loadInvoices() {
        const container = document.getElementById('invoicesContainer');
        container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';

        try {
            const snapshot = await db.collection('invoices')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();

            allInvoices = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                data.docId = doc.id;
                allInvoices.push(data);
            });

            console.log('✅ Loaded', allInvoices.length, 'invoices');
            displayInvoices();

        } catch (error) {
            console.error('❌ Error:', error);
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error: ${error.message}</p></div>`;
        }
    }

    // ============================================================
    // ===== DISPLAY INVOICES =====
    // ============================================================
    function displayInvoices() {
        const container = document.getElementById('invoicesContainer');
        const filtered = currentFilter === 'all' 
            ? allInvoices 
            : allInvoices.filter(inv => inv.status === currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <p>No invoices found</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(inv => {
            const date = inv.createdAt?.toDate?.() || new Date();
            const status = inv.status || 'pending';
            const price = inv.price || 0;
            const orderId = inv.orderId || 'N/A';
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);

            html += `
                <div class="invoice-card">
                    <div class="invoice-header">
                        <div>
                            <div class="invoice-id">INV-${orderId}</div>
                            <div class="invoice-product">${inv.productName || 'Product'} - ${inv.plan || 'Standard'}</div>
                            <div class="invoice-user">👤 ${inv.userInfo || 'No info'}</div>
                            <div class="invoice-date">🕐 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
                        </div>
                        <div style="text-align:right;">
                            <div class="invoice-price">$${price.toFixed(2)}</div>
                            <span class="status-badge-inv ${status}">${statusText}</span>
                        </div>
                    </div>
                    <div class="invoice-actions">
                        <a class="action-btn btn-view" href="../invoice.html?orderId=${orderId}" target="_blank">
                            <i class="fas fa-eye"></i> View
                        </a>
                        <button class="action-btn btn-copy" data-action="copy" data-orderid="${orderId}">
                            <i class="fas fa-link"></i> Copy Link
                        </button>
                        ${status !== 'delivered' ? `
                            <button class="action-btn btn-delivered" data-action="status" data-status="delivered" data-id="${inv.docId}">
                                <i class="fas fa-check-circle"></i> Delivered
                            </button>
                        ` : ''}
                        ${status !== 'pending' ? `
                            <button class="action-btn btn-pending" data-action="status" data-status="pending" data-id="${inv.docId}">
                                <i class="fas fa-clock"></i> Pending
                            </button>
                        ` : ''}
                        ${status !== 'cancelled' ? `
                            <button class="action-btn btn-cancel" data-action="status" data-status="cancelled" data-id="${inv.docId}">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                        <button class="action-btn btn-delete" data-action="delete" data-id="${inv.docId}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // ===== ATTACH ACTION BUTTON LISTENERS =====
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;

                if (action === 'copy') {
                    copyInvoiceLink(this.dataset.orderid);
                } else if (action === 'status') {
                    updateStatus(this.dataset.id, this.dataset.status);
                } else if (action === 'delete') {
                    deleteInvoice(this.dataset.id);
                }
            });
        });
    }

    // ============================================================
    // ===== COPY INVOICE LINK =====
    // ============================================================
    function copyInvoiceLink(orderId) {
        // Build URL: Remove 'admin/' from path and add 'invoice.html'
        const pathParts = window.location.pathname.split('/').filter(p => p !== '');
        // Remove last part (invoices.html)
        pathParts.pop();
        // Remove 'admin' folder if exists
        if (pathParts[pathParts.length - 1] === 'admin') {
            pathParts.pop();
        }
        
        const baseUrl = window.location.origin + '/' + pathParts.join('/') + (pathParts.length ? '/' : '') + 'invoice.html';
        const link = baseUrl + '?orderId=' + orderId;

        console.log('📋 Copying link:', link);

        const fallback = () => {
            const temp = document.createElement('textarea');
            temp.value = link;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            showToast('✅ Link copied!');
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link)
                .then(() => showToast('✅ Link copied!'))
                .catch(fallback);
        } else {
            fallback();
        }
    }

    // ============================================================
    // ===== UPDATE STATUS =====
    // ============================================================
    async function updateStatus(docId, newStatus) {
        if (!confirm('Change status to "' + newStatus + '"?')) return;

        try {
            await db.collection('invoices').doc(docId).update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Also update orders collection
            const inv = allInvoices.find(i => i.docId === docId);
            if (inv && inv.orderDocId) {
                await db.collection('orders').doc(inv.orderDocId).update({
                    status: newStatus,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(() => {});
            }

            showToast('✅ Status updated to ' + newStatus);
            loadInvoices();

        } catch (error) {
            showToast('❌ Error: ' + error.message, true);
        }
    }

    // ============================================================
    // ===== DELETE INVOICE =====
    // ============================================================
    async function deleteInvoice(docId) {
        if (!confirm('Delete this invoice permanently?')) return;

        try {
            await db.collection('invoices').doc(docId).delete();
            showToast('✅ Invoice deleted');
            loadInvoices();
        } catch (error) {
            showToast('❌ Error: ' + error.message, true);
        }
    }

    // ============================================================
    // ===== OPEN CREATE MODAL =====
    // ============================================================
    async function openCreateModal() {
        document.getElementById('invoiceForm').reset();
        document.getElementById('invoicePlan').innerHTML = '<option value="">-- Select Plan --</option>';
        
        const select = document.getElementById('invoiceProduct');
        try {
            const snapshot = await db.collection('products').get();
            select.innerHTML = '<option value="">-- Select Product --</option>';
            snapshot.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = data.name;
                select.appendChild(opt);
            });
        } catch (error) {
            console.error('Error:', error);
        }

        document.getElementById('invoiceModal').classList.add('show');
    }

    // ============================================================
    // ===== CLOSE CREATE MODAL =====
    // ============================================================
    function closeCreateModal() {
        document.getElementById('invoiceModal').classList.remove('show');
    }

    // ============================================================
    // ===== LOAD PLANS FOR PRODUCT =====
    // ============================================================
    async function loadPlansForProduct() {
        const productId = this.value;
        const planSelect = document.getElementById('invoicePlan');
        planSelect.innerHTML = '<option value="">-- Select Plan --</option>';
        document.getElementById('invoicePrice').value = '';

        if (!productId) return;

        try {
            const snapshot = await db.collection('products').doc(productId).collection('items').get();
            snapshot.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = data.name;
                opt.dataset.price = data.price || 0;
                planSelect.appendChild(opt);
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // ============================================================
    // ===== SUBMIT INVOICE =====
    // ============================================================
    async function submitInvoice(e) {
        e.preventDefault();

        const productId = document.getElementById('invoiceProduct').value;
        const planId = document.getElementById('invoicePlan').value;
        const userInfo = document.getElementById('invoiceUserInfo').value.trim();
        const price = parseFloat(document.getElementById('invoicePrice').value);
        const status = document.getElementById('invoiceStatus').value;

        if (!productId || !planId || !userInfo || isNaN(price)) {
            showToast('❌ Please fill all fields', true);
            return;
        }

        try {
            // Get product name
            const productDoc = await db.collection('products').doc(productId).get();
            const productName = productDoc.exists ? productDoc.data().name : 'Product';

            // Get plan name
            const planDoc = await db.collection('products').doc(productId).collection('items').doc(planId).get();
            const planName = planDoc.exists ? planDoc.data().name : 'Standard';

            // Generate Order ID
            const counterDoc = await db.collection('settings').doc('orderCounter').get();
            let counter = 1;
            if (counterDoc.exists) {
                counter = (counterDoc.data().counter || 0) + 1;
            }
            await db.collection('settings').doc('orderCounter').set({ counter }, { merge: true });

            const nairaPrice = price * 1440;

            // Save Order
            const orderData = {
                orderId: counter,
                productId: productId,
                productName: productName,
                planId: planId,
                plan: planName,
                userInfo: userInfo,
                userFieldLabel: 'User Info',
                price: price,
                nairaPrice: nairaPrice,
                currency: 'crypto',
                paymentMethod: 'Admin Created',
                status: status,
                invoiceCreated: true,
                createdBy: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const orderRef = await db.collection('orders').add(orderData);

            // Save Invoice
            const invoiceData = {
                invoiceId: 'INV-' + counter,
                orderId: counter,
                orderDocId: orderRef.id,
                productName: productName,
                plan: planName,
                userInfo: userInfo,
                userFieldLabel: 'User Info',
                price: price,
                nairaPrice: nairaPrice,
                currency: 'crypto',
                paymentMethod: 'Admin Created',
                status: status,
                createdBy: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('invoices').add(invoiceData);

            // Copy link
            const pathParts = window.location.pathname.split('/').filter(p => p !== '');
            pathParts.pop();
            if (pathParts[pathParts.length - 1] === 'admin') {
                pathParts.pop();
            }
            const baseUrl = window.location.origin + '/' + pathParts.join('/') + (pathParts.length ? '/' : '') + 'invoice.html';
            const link = baseUrl + '?orderId=' + counter;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(link).catch(() => {});
            }

            showToast('✅ Invoice #' + counter + ' created! Link copied.');
            closeCreateModal();
            loadInvoices();

        } catch (error) {
            console.error('Error:', error);
            showToast('❌ Error: ' + error.message, true);
        }
    }

    // ============================================================
    // ===== SHOW TOAST =====
    // ============================================================
    function showToast(msg, isError = false) {
        const toast = document.getElementById('toastMsg');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = 'toast-custom show' + (isError ? ' error' : '');
        setTimeout(() => {
            toast.className = 'toast-custom';
        }, 2500);
    }

})();
