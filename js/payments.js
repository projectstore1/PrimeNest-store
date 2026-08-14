document.addEventListener('DOMContentLoaded', async function() {
    async function loadPayments() {
        try {
            const doc = await db.collection('settings').doc('payments').get();
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('evmAddress').value = data.evm || '0x2711d473156609B418Fb41d340fF361A4297D278';
                document.getElementById('aptosAddress').value = data.aptos || '0x04290f34f95a759252a60b009fc81a2dd663b392fa9bfdfa736a52bf86545218';
                document.getElementById('solanaAddress').value = data.solana || 'H9fJSQFxMjYcWn48LmTkWtzMr7ZLFt2EXdKDNHsvyFDy';
                document.getElementById('palmPay').value = data.palmPay || '6669361510';
                document.getElementById('psbAccount').value = data.psbAccount || '6019315948';
                document.getElementById('accountName').value = data.accountName || 'BillStack / Nasfam_Pay – MD ABDULLAH';
            }
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    }

    document.getElementById('cryptoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await db.collection('settings').doc('payments').set({
            evm: document.getElementById('evmAddress').value,
            aptos: document.getElementById('aptosAddress').value,
            solana: document.getElementById('solanaAddress').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        alert('✅ Crypto settings saved!');
    });

    document.getElementById('nairaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await db.collection('settings').doc('payments').set({
            palmPay: document.getElementById('palmPay').value,
            psbAccount: document.getElementById('psbAccount').value,
            accountName: document.getElementById('accountName').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        alert('✅ Bank settings saved!');
    });

    loadPayments();
});
