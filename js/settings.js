document.addEventListener('DOMContentLoaded', async function() {
    async function loadSettings() {
        try {
            const noticeDoc = await db.collection('settings').doc('notice').get();
            if (noticeDoc.exists) {
                document.getElementById('noticeText').value = noticeDoc.data().text || '';
            }

            const supportDoc = await db.collection('settings').doc('support').get();
            if (supportDoc.exists) {
                const data = supportDoc.data();
                document.getElementById('telegramLink').value = data.telegram || 'https://t.me/abdullha2';
                document.getElementById('whatsappLink').value = data.whatsapp || 'https://wa.me/message/NSIUKXADRUXJA1';
            }

            const currencyDoc = await db.collection('settings').doc('currency').get();
            if (currencyDoc.exists) {
                document.getElementById('nairaRate').value = currencyDoc.data().rate || 1440;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    document.getElementById('noticeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await db.collection('settings').doc('notice').set({
            text: document.getElementById('noticeText').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Notice saved!');
    });

    document.getElementById('supportForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await db.collection('settings').doc('support').set({
            telegram: document.getElementById('telegramLink').value,
            whatsapp: document.getElementById('whatsappLink').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        alert('✅ Support links saved!');
    });

    document.getElementById('currencyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await db.collection('settings').doc('currency').set({
            rate: parseFloat(document.getElementById('nairaRate').value),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        alert('✅ Currency rate saved!');
    });

    loadSettings();
});
