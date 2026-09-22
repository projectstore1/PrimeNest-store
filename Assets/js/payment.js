document.addEventListener('DOMContentLoaded', function() {
    console.log('💳 Payment page loaded');

    // ===== FIREBASE =====
    const db = firebase.firestore();
    // Note: Storage আর লাগবে না

    // ============================================================
    // ===== GET PRODUCT FROM LOCALSTORAGE =====
    // ============================================================
    let productData = localStorage.getItem('selectedProduct');
    let product = null;

    if (productData) {
        try { product = JSON.parse(productData); } catch (e) { console.error(e); }
    }

    if (!product) {
        console.log('❌ No product, redirecting...');
        window.location.href = 'index.html';
        return;
    }

    console.log('✅ Product loaded:', product);

    // ============================================================
    // ===== DISPLAY PRODUCT =====
    // ============================================================
    const usdPrice = product.price || 0;
    const nairaPrice = usdPrice * 1440;

    document.getElementById('productName').textContent = product.name || 'Product';
    document.getElementById('itemName').textContent = product.itemName || 'Standard';
    document.getElementById('productPrice').textContent = usdPrice.toFixed(2);
    document.getElementById('nairaPrice').textContent = nairaPrice.toLocaleString();

    // ============================================================
    // ===== LOAD USER FIELD FROM PRODUCT =====
    // ============================================================
    async function loadUserField() {
        try {
            const doc = await db.collection('products').doc(product.id).get();
            if (doc.exists) {
                const data = doc.data();
                const label = data.userFieldLabel || 'Information';
                const placeholder = data.userFieldPlaceholder || 'Enter your info';
                const required = data.userFieldRequired !== false;

                document.getElementById('userFieldLabelText').innerHTML = 
                    label + (required ? ' <span class="required">*</span>' : '');
                document.getElementById('userInfoInput').placeholder = placeholder;
                document.getElementById('userInfoInput').dataset.fieldLabel = label;
                document.getElementById('userInfoInput').dataset.required = required;
            }
        } catch (error) {
            console.error('Error loading user field:', error);
        }
    }
    loadUserField();

    // ============================================================
    // ===== CURRENCY SELECTION =====
    // ============================================================
    let selectedCurrency = 'crypto';
    const currencyCards = document.querySelectorAll('.currency-card');
    const cryptoDetails = document.getElementById('cryptoDetails');
    const nairaDetails = document.getElementById('nairaDetails');

    currencyCards.forEach(card => {
        card.addEventListener('click', function() {
            currencyCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            selectedCurrency = this.dataset.currency;

            if (selectedCurrency === 'crypto') {
                cryptoDetails.style.display = 'block';
                nairaDetails.style.display = 'none';
            } else {
                cryptoDetails.style.display = 'none';
                nairaDetails.style.display = 'block';
            }
            console.log('💱 Currency:', selectedCurrency);
        });
    });

    // ============================================================
    // ===== COPY ADDRESS =====
    // ============================================================
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const address = this.dataset.address;
            const btnEl = this;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(address).then(() => {
                    btnEl.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => btnEl.innerHTML = '<i class="fas fa-copy"></i>', 1500);
                });
            } else {
                const temp = document.createElement('textarea');
                temp.value = address;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                document.body.removeChild(temp);
                btnEl.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => btnEl.innerHTML = '<i class="fas fa-copy"></i>', 1500);
            }
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
                console.log('🆔 Order ID:', next);
                return next;
            } else {
                const snap = await db.collection('orders').get();
                const start = snap.size + 1;
                await db.collection('settings').doc('orderCounter').set({ counter: start });
                console.log('🆔 Order ID (new):', start);
                return start;
            }
        } catch (error) {
            console.error('ID error:', error);
            return Date.now().toString().slice(-6);
        }
    }

    // ============================================================
    // ===== CONFIRM ORDER (Screenshot ছাড়া) =====
    // ============================================================
    const confirmBtn = document.getElementById('confirmOrderBtn');

    confirmBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('🚀 Confirm clicked');

        // ===== VALIDATION =====
        const userInfo = document.getElementById('userInfoInput').value.trim();
        const userFieldLabel = document.getElementById('userInfoInput').dataset.fieldLabel || 'Information';

        if (!userInfo) {
            alert(`❌ Please enter your ${userFieldLabel}`);
            document.getElementById('userInfoInput').focus();
            return;
        }

        // ===== DISABLE BUTTON =====
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Invoice...';

        try {
            // ===== STEP 1: GENERATE ID =====
            const orderId = await generateOrderId();

            // ===== STEP 2: SAVE ORDER =====
            console.log('💾 Saving order...');
            const orderData = {
                orderId: orderId,
                productId: product.id,
                productName: product.name,
                planId: product.itemId || '',
                plan: product.itemName || 'Standard',
                userInfo: userInfo,
                userFieldLabel: userFieldLabel,
                price: usdPrice,
                nairaPrice: nairaPrice,
                currency: selectedCurrency,
                paymentMethod: selectedCurrency === 'crypto' ? 'Crypto' : 'Nigeria Bank Transfer',
                status: 'pending',
                invoiceCreated: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const orderRef = await db.collection('orders').add(orderData);
            console.log('✅ Order saved:', orderRef.id);

            // ===== STEP 3: SAVE INVOICE =====
            console.log('📄 Creating invoice...');
            const invoiceData = {
                invoiceId: 'INV-' + orderId,
                orderId: orderId,
                orderDocId: orderRef.id,
                productName: product.name,
                plan: product.itemName || 'Standard',
                userInfo: userInfo,
                userFieldLabel: userFieldLabel,
                price: usdPrice,
                nairaPrice: nairaPrice,
                currency: selectedCurrency,
                paymentMethod: selectedCurrency === 'crypto' ? 'Crypto' : 'Nigeria Bank Transfer',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('invoices').add(invoiceData);
            console.log('✅ Invoice created');

            // ===== STEP 4: REDIRECT =====
            localStorage.setItem('lastInvoice', JSON.stringify(invoiceData));
            localStorage.removeItem('selectedProduct');

            console.log('🚀 Redirecting...');
            window.location.href = 'invoice-link.html?orderId=' + orderId;

        } catch (error) {
            console.error('❌ ERROR:', error);
            console.error('Code:', error.code);
            console.error('Message:', error.message);

            let msg = '❌ Error: ' + error.message;

            if (error.code === 'permission-denied') {
                msg = '❌ FIRESTORE RULES নেই!\n\nFirebase Console → Firestore → Rules:\n\nrules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}';
            }

            alert(msg);
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Order & Get Invoice';
        }
    });

    // ============================================================
    // ===== THEME TOGGLE =====
    // ============================================================
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    themeToggle.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        themeToggle.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    console.log('✅ Payment page ready!');
});
