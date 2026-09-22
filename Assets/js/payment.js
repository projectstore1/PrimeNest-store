document.addEventListener('DOMContentLoaded', function() {
    console.log('💳 Payment page loaded');

    const db = firebase.firestore();
    const storage = firebase.storage();

    // ============================================================
    // ===== GET PRODUCT DATA =====
    // ============================================================
    let productData = localStorage.getItem('selectedProduct');
    let product = null;

    if (productData) {
        try { product = JSON.parse(productData); } catch (e) { console.error(e); }
    }

    if (!product) {
        window.location.href = 'index.html';
        return;
    }

    // Display Product
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
                document.getElementById('userInfoInput').required = required;
                document.getElementById('userInfoInput').dataset.fieldLabel = label;
            }
        } catch (error) {
            console.error('Error loading user field:', error);
        }
    }
    loadUserField();

    // ============================================================
    // ===== SCREENSHOT UPLOAD =====
    // ============================================================
    let screenshotFile = null;
    const screenshotUpload = document.getElementById('screenshotUpload');
    const screenshotInput = document.getElementById('screenshotInput');
    const screenshotPreview = document.getElementById('screenshotPreview');

    screenshotUpload.addEventListener('click', () => screenshotInput.click());

    screenshotInput.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('❌ File size must be less than 5MB');
            return;
        }

        screenshotFile = file;
        screenshotUpload.classList.add('has-file');

        const reader = new FileReader();
        reader.onload = (e) => {
            screenshotPreview.src = e.target.result;
            screenshotPreview.classList.add('show');
        };
        reader.readAsDataURL(file);
    });

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
        });
    });

    // ============================================================
    // ===== COPY ADDRESS =====
    // ============================================================
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const address = this.dataset.address;
            navigator.clipboard.writeText(address).then(() => {
                const original = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => this.innerHTML = original, 1500);
            });
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
                const startCounter = ordersSnap.size + 1;
                await db.collection('settings').doc('orderCounter').set({ counter: startCounter });
                return startCounter;
            }
        } catch (error) {
            return Date.now().toString().slice(-6);
        }
    }

    // ============================================================
    // ===== CONFIRM ORDER =====
    // ============================================================
    const confirmBtn = document.getElementById('confirmOrderBtn');

    confirmBtn.addEventListener('click', async function() {
        // Validation
        const userInfo = document.getElementById('userInfoInput').value.trim();
        const userFieldLabel = document.getElementById('userInfoInput').dataset.fieldLabel || 'Information';

        if (!userInfo) {
            alert(`❌ Please enter your ${userFieldLabel}`);
            document.getElementById('userInfoInput').focus();
            return;
        }

        if (!screenshotFile) {
            alert('❌ Please upload payment screenshot');
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            // 1. Upload Screenshot to Firebase Storage
            console.log('📤 Uploading screenshot...');
            const timestamp = Date.now();
            const fileName = `screenshots/${timestamp}_${screenshotFile.name}`;
            const storageRef = storage.ref(fileName);
            const uploadTask = await storageRef.put(screenshotFile);
            const screenshotUrl = await uploadTask.ref.getDownloadURL();
            console.log('✅ Screenshot uploaded:', screenshotUrl);

            // 2. Generate Order ID
            const orderId = await generateOrderId();

            // 3. Save Order to Firestore
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
                screenshotUrl: screenshotUrl,
                paymentMethod: selectedCurrency === 'crypto' ? 'Crypto' : 'Nigeria Bank Transfer',
                status: 'pending',
                invoiceCreated: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection('orders').add(orderData);
            console.log('✅ Order saved:', docRef.id);

            // 4. Save Invoice Data
            const invoiceData = {
                invoiceId: 'INV-' + orderId,
                orderId: orderId,
                orderDocId: docRef.id,
                productName: product.name,
                plan: product.itemName || 'Standard',
                userInfo: userInfo,
                userFieldLabel: userFieldLabel,
                price: usdPrice,
                nairaPrice: nairaPrice,
                currency: selectedCurrency,
                screenshotUrl: screenshotUrl,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('invoices').add(invoiceData);
            console.log('✅ Invoice created');

            // 5. Clear localStorage
            localStorage.removeItem('selectedProduct');

            // 6. Redirect to Invoice Page
            localStorage.setItem('lastInvoice', JSON.stringify(invoiceData));
            window.location.href = 'invoice.html?orderId=' + orderId;

        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ Error: ' + error.message);
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
});
