document.addEventListener('DOMContentLoaded', async function() {
    async function loadBanners() {
        const container = document.getElementById('bannersList');
        try {
            const snapshot = await db.collection('banners').orderBy('order', 'asc').get();
            if (snapshot.empty) {
                container.innerHTML = '<p style="color:var(--text-muted);">No banners. Add your first banner!</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                html += `<div class="banner-item">
                    <div><strong>${data.title || 'Untitled'}</strong>
                    <span style="color:var(--text-muted);font-size:0.85rem;margin-left:12px;">${data.subtitle || ''}</span>
                    <span style="background:var(--border-color);padding:2px 10px;border-radius:20px;font-size:0.75rem;margin-left:8px;">Order: ${data.order || 0}</span></div>
                    <div>
                        <button class="btn-edit" data-id="${doc.id}" style="padding:4px 12px;font-size:0.85rem;"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" data-id="${doc.id}" style="padding:4px 12px;font-size:0.85rem;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;

            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => openBannerModal(btn.dataset.id));
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Delete this banner?')) {
                        await db.collection('banners').doc(btn.dataset.id).delete();
                        loadBanners();
                    }
                });
            });

        } catch (error) {
            container.innerHTML = `<p style="color:var(--danger);">Error: ${error.message}</p>`;
        }
    }

    async function openBannerModal(bannerId = null) {
        document.getElementById('bannerModal').style.display = 'flex';
        if (bannerId) {
            document.getElementById('bannerModalTitle').textContent = 'Edit Banner';
            const doc = await db.collection('banners').doc(bannerId).get();
            const data = doc.data();
            document.getElementById('editBannerId').value = bannerId;
            document.getElementById('bannerTitle').value = data.title || '';
            document.getElementById('bannerSubtitle').value = data.subtitle || '';
            document.getElementById('bannerIcon').value = data.icon || 'fas fa-image';
            document.getElementById('bannerBg').value = data.bgColor || 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
            document.getElementById('bannerLink').value = data.link || '';
            document.getElementById('bannerOrder').value = data.order || 0;
        } else {
            document.getElementById('bannerModalTitle').textContent = 'Add Banner';
            document.getElementById('bannerForm').reset();
            document.getElementById('editBannerId').value = '';
        }
    }

    document.getElementById('bannerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editBannerId').value;
        const data = {
            title: document.getElementById('bannerTitle').value,
            subtitle: document.getElementById('bannerSubtitle').value,
            icon: document.getElementById('bannerIcon').value,
            bgColor: document.getElementById('bannerBg').value,
            link: document.getElementById('bannerLink').value,
            order: parseInt(document.getElementById('bannerOrder').value) || 0
        };

        if (editId) {
            await db.collection('banners').doc(editId).update(data);
            alert('✅ Banner updated!');
        } else {
            await db.collection('banners').add(data);
            alert('✅ Banner added!');
        }
        document.getElementById('bannerModal').style.display = 'none';
        loadBanners();
    });

    document.getElementById('addBannerBtn').addEventListener('click', () => openBannerModal(null));
    document.getElementById('bannerModalClose').addEventListener('click', () => {
        document.getElementById('bannerModal').style.display = 'none';
    });
    document.getElementById('bannerModalCancel').addEventListener('click', () => {
        document.getElementById('bannerModal').style.display = 'none';
    });

    loadBanners();
});