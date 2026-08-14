document.addEventListener('DOMContentLoaded', () => {
    const productData = localStorage.getItem('selectedProduct');
    const product = productData ? JSON.parse(productData) : null;

    if (!product) {
        window.location.href = 'PrimeNest.html';
        return;
    }

    // Display product
    document.getElementById('productName').textContent = product.name;
    document.getElementById('itemName').textContent = product.itemName || 'Standard';
    document.getElementById('productPrice').textContent = product.price.toFixed(2);

    const nairaPrice = product.price * 1440;
    document.getElementById('nairaPrice').textContent = nairaPrice.toLocaleString();

    // Currency selection
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

    // Copy address
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const address = this.dataset.address;
            navigator.clipboard.writeText(address).then(() => {
                const original = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    this.innerHTML = original;
                }, 2000);
            });
        });
    });

    // Order buttons
    document.querySelectorAll('.btn-order').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const orderData = {
                product: product.name,
                item: product.itemName || 'Standard',
                amount: product.price,
                currency: selectedCurrency === 'crypto' ? '🪙 Crypto' : '🇳🇬 Naira',
                nairaAmount: product.price * 1440,
                date: new Date().toISOString()
            };
            localStorage.setItem('lastOrder', JSON.stringify(orderData));
            window.open(this.href, '_blank');
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
});
