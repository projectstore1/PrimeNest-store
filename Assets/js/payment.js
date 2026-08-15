document.addEventListener('DOMContentLoaded', function() {
    console.log('💳 Payment page loaded');

    // ===== GET PRODUCT DATA FROM LOCALSTORAGE =====
    let productData = localStorage.getItem('selectedProduct');
    let product = null;

    console.log('📦 Raw localStorage data:', productData);

    if (productData) {
        try {
            product = JSON.parse(productData);
            console.log('✅ Product loaded successfully:', product);
        } catch (e) {
            console.error('❌ Error parsing product data:', e);
        }
    }

    // If no product, go back to home
    if (!product) {
        console.log('❌ No product found, redirecting to home');
        window.location.href = 'PrimeNest.html';
        return;
    }

    // ===== DISPLAY PRODUCT SUMMARY =====
    const usdPrice = product.price || 0;
    const nairaPrice = usdPrice * 1440;
    const productName = product.name || 'Product';
    const itemName = product.itemName || 'Standard';

    document.getElementById('productName').textContent = productName;
    document.getElementById('itemName').textContent = itemName;
    document.getElementById('productPrice').textContent = usdPrice.toFixed(2);
    document.getElementById('nairaPrice').textContent = nairaPrice.toLocaleString();

    console.log('📊 Summary displayed:', { productName, itemName, usdPrice, nairaPrice });

    // ===== CURRENCY SELECTION =====
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
            console.log('🔄 Currency selected:', selectedCurrency);
        });
    });

    // ===== COPY ADDRESS =====
    const copyFeedback = document.getElementById('copyFeedback');

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const address = this.dataset.address;
            if (!address) return;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(address).then(() => {
                    showCopyFeedback();
                }).catch(() => {
                    fallbackCopy(address);
                });
            } else {
                fallbackCopy(address);
            }
        });
    });

    function showCopyFeedback() {
        copyFeedback.style.display = 'block';
        copyFeedback.innerHTML = '<i class="fas fa-check-circle"></i> Address copied!';
        setTimeout(() => {
            copyFeedback.style.display = 'none';
        }, 2000);
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showCopyFeedback();
    }

    // ===== GENERATE ORDER MESSAGE =====
    function generateOrderMessage(platform) {
        const now = new Date();
        const date = now.toLocaleDateString();
        const time = now.toLocaleTimeString();
        const orderId = 'ORD-' + Date.now().toString().slice(-8);

        const usdPrice = product.price || 0;
        const nairaPrice = usdPrice * 1440;
        const currencyLabel = selectedCurrency === 'crypto' ? '🪙 Crypto' : '🇳🇬 Naira';
        const currencyAmount = selectedCurrency === 'crypto' ? '$' + usdPrice.toFixed(2) : '₦' + nairaPrice.toLocaleString();

        let message = '';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        message += '🛍️ *NEW ORDER*\n';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        message += '📦 *Product:* ' + product.name + '\n';
        message += '📋 *Item:* ' + (product.itemName || 'Standard') + '\n';
        message += '💰 *Amount:* ' + currencyAmount + ' (' + currencyLabel + ')\n';
        message += '💵 *USD:* $' + usdPrice.toFixed(2) + '\n';
        message += '🇳🇬 *Naira:* ₦' + nairaPrice.toLocaleString() + '\n';
        message += '🆔 *Order ID:* ' + orderId + '\n';
        message += '📅 *Date:* ' + date + ' ' + time + '\n';
        message += '📱 *Platform:* ' + platform + '\n\n';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        message += '✅ *Payment Method:* ' + currencyLabel + '\n';

        if (selectedCurrency === 'crypto') {
            message += '\n📌 *Crypto Addresses:*\n';
            message += '🔹 EVM: 0x2711d473156609B418Fb41d340fF361A4297D278\n';
            message += '🔹 Aptos: 0x04290f34f95a759252a60b009fc81a2dd663b392fa9bfdfa736a52bf86545218\n';
            message += '🔹 Solana: H9fJSQFxMjYcWn48LmTkWtzMr7ZLFt2EXdKDNHsvyFDy\n';
        } else {
            message += '\n📌 *Bank Details:*\n';
            message += '🔹 PalmPay: 6669361510\n';
            message += '🔹 9PSB: 6019315948\n';
            message += '🔹 Account Name: BillStack / Nasfam_Pay – MD ABDULLAH\n';
            message += '🔹 Bybit UID: 151723688\n';
            message += '🔹 MEXC UID: 18127696\n';
        }

        message += '\n━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        message += '📤 *Please send payment screenshot here*';
        message += '\n━━━━━━━━━━━━━━━━━━━━━━━━━';

        return message;
    }

    // ===== TELEGRAM BUTTON =====
    document.getElementById('telegramBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const message = generateOrderMessage('Telegram');
        console.log('📤 Telegram message:', message);
        const encoded = encodeURIComponent(message);
        window.open('https://t.me/abdullha2?text=' + encoded, '_blank');
    });

    // ===== WHATSAPP BUTTON =====
    document.getElementById('whatsappBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const message = generateOrderMessage('WhatsApp');
        console.log('📤 WhatsApp message:', message);
        const encoded = encodeURIComponent(message);
        window.open('https://wa.me/message/NSIUKXADRUXJA1?text=' + encoded, '_blank');
    });

    // ===== DARK MODE TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    console.log('✅ Payment page ready');
});
