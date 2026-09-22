// ============================================================
// ===== CONFIRM ORDER =====
// ============================================================
const confirmBtn = document.getElementById('confirmOrderBtn');

confirmBtn.addEventListener('click', async function() {
    console.log('🖱️ Confirm button clicked');

    const userInfo = document.getElementById('userInfoInput').value.trim();
    const userFieldLabel = document.getElementById('userInfoInput').dataset.fieldLabel || 'Information';

    if (!userInfo) {
        alert(`❌ Please enter your ${userFieldLabel}`);
        return;
    }

    if (!screenshotFile) {
        alert('❌ Please upload payment screenshot');
        return;
    }

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Step 1/3: Uploading...';

    try {
        // ===== STEP 1: Storage Check =====
        console.log('🔥 Step 1: Checking Firebase Storage...');
        
        if (typeof firebase.storage !== 'function') {
            throw new Error('Firebase Storage SDK not loaded! Add firebase-storage-compat.js script tag.');
        }
        
        const storage = firebase.storage();
        console.log('✅ Storage initialized');

        // ===== STEP 2: Upload Screenshot =====
        console.log('📤 Step 2: Uploading screenshot...');
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Step 2/3: Uploading...';
        
        const timestamp = Date.now();
        const fileName = `screenshots/${timestamp}_${screenshotFile.name}`;
        const storageRef = storage.ref(fileName);
        
        console.log('📤 Uploading to:', fileName);
        const uploadTask = await storageRef.put(screenshotFile);
        const screenshotUrl = await uploadTask.ref.getDownloadURL();
        console.log('✅ Screenshot uploaded:', screenshotUrl);

        // ===== STEP 3: Generate Order ID =====
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Step 3/3: Creating Invoice...';
        console.log('🆔 Generating Order ID...');
        const orderId = await generateOrderId();
        console.log('✅ Order ID:', orderId);

        // ===== STEP 4: Save Order =====
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
            screenshotUrl: screenshotUrl,
            paymentMethod: selectedCurrency === 'crypto' ? 'Crypto' : 'Nigeria Bank Transfer',
            status: 'pending',
            invoiceCreated: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('orders').add(orderData);
        console.log('✅ Order saved:', docRef.id);

        // ===== STEP 5: Save Invoice =====
        console.log('📄 Creating invoice...');
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
            paymentMethod: selectedCurrency === 'crypto' ? 'Crypto' : 'Nigeria Bank Transfer',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('invoices').add(invoiceData);
        console.log('✅ Invoice created');

        // ===== STEP 6: Redirect =====
        localStorage.setItem('lastInvoice', JSON.stringify(invoiceData));
        localStorage.removeItem('selectedProduct');

        console.log('🚀 Redirecting to invoice-link.html');
        window.location.href = 'invoice-link.html?orderId=' + orderId;

    } catch (error) {
        console.error('❌❌❌ ERROR OCCURRED ❌❌❌');
        console.error('Error Name:', error.name);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);

        let errorMsg = '❌ Error: ' + error.message;

        if (error.code === 'storage/unauthorized') {
            errorMsg = '❌ STORAGE RULES নেই!\n\nFirebase Console → Storage → Rules এ যান এবং এই Rules দিন:\n\nallow read, write: if true;';
        } else if (error.code === 'storage/unknown') {
            errorMsg = '❌ STORAGE ENABLE করা হয়নি!\n\nFirebase Console → Storage → Get Started ক্লিক করুন';
        } else if (error.code === 'storage/bucket-not-found') {
            errorMsg = '❌ STORAGE BUCKET পাওয়া যাচ্ছে না!\n\nFirebase Console → Storage Enable করুন';
        } else if (error.code === 'permission-denied') {
            errorMsg = '❌ FIRESTORE RULES নেই!\n\nFirebase Console → Firestore → Rules এ allow read, write: if true; দিন';
        } else if (error.message.includes('Storage SDK')) {
            errorMsg = '❌ STORAGE SDK লোড হয়নি!\n\npayment.html এ এই লাইন যোগ করুন:\n<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>';
        }

        alert(errorMsg);

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Order & Get Invoice';
    }
});
