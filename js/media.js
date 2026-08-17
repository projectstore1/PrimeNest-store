document.addEventListener('DOMContentLoaded', function() {
    console.log('🖼️ Media page loaded');

    // ===== THEME TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');
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

    // ===== LOAD BANNERS =====
    async function loadBanners() {
        const container = document.getElementById('bannersList');
        container.innerHTML = '<p style="color:var(--text-muted);">Loading banners...</p>';

        try {
            const snapshot = await db.collection('banners').orderBy('order', 'asc').get();

            if (snapshot.empty) {
                container.innerHTML = `
                    <div style="text-align:center;padding:20px;color:var(--text-muted);">
                        <i class="fas fa-image" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
                        <p>No banners. Add your first banner!</p>
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const image = data.image || '';

                html += `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg-primary);border-radius:12px;margin-bottom:8px;border:1px solid var(--border-color);">
                        <div style="display:flex;align-items:center;gap:16px;flex:1;min-width:0;">
                            <div style="width:100px;height:50px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--bg-primary);border:1px solid var(--border-color);">
                                ${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--text-muted);font-size:0.7rem;"><i class="fas fa-image"></i></div>'}
                            </div>
                            <div style="min-width:0;">
                                <div style="font-weight:600;color:var(--text-primary);font-size:0.9rem;">Banner</div>
                                <div style="font-size:0.8rem;color:var(--text-muted);word-break:break-all;"><i class="fas fa-link" style="color:var(--accent);margin-right:4px;"></i> ${image || 'No image'}</div>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;flex-shrink:0;">
                            <button class="btn-edit" data-id="${doc.id}" style="padding:4px 12px;font-size:0.85rem;"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" data-id="${doc.id}" style="padding:4px 12px;font-size:0.85rem;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', function() {
                    openBannerModal(this.dataset.id);
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async function() {
                    if (confirm('Delete this banner?')) {
                        try {
                            await db.collection('banners').doc(this.dataset.id).delete();
                            alert('✅ Banner deleted!');
                            loadBanners();
                        } catch (error) {
                            alert('❌ Error: ' + error.message);
                        }
                    }
                });
            });

        } catch (error) {
            container.innerHTML = `<p style="color:var(--danger);">Error: ${error.message}</p>`;
            console.error('Error loading banners:', error);
        }
    }

    // ===== OPEN MODAL =====
    async function openBannerModal(bannerId = null) {
        const modal = document.getElementById('bannerModal');
        modal.style.display = 'flex';

        if (bannerId) {
            document.getElementById('bannerModalTitle').textContent = 'Edit Banner';
            try {
                const doc = await db.collection('banners').doc(bannerId).get();
                const data = doc.data();
                document.getElementById('editBannerId').value = bannerId;
                document.getElementById('bannerImage').value = data.image || '';
                updatePreview(data.image);
            } catch (error) {
                alert('Error loading banner: ' + error.message);
            }
        } else {
            document.getElementById('bannerModalTitle').textContent = 'Add Banner';
            document.getElementById('bannerForm').reset();
            document.getElementById('editBannerId').value = '';
            document.getElementById('bannerImage').value = '';
            updatePreview('');
        }
    }

    // ===== UPDATE PREVIEW =====
    function updatePreview(imageUrl) {
        const preview = document.getElementById('bannerPreview');
        if (imageUrl && imageUrl.trim() !== '') {
            preview.style.backgroundImage = `url('${imageUrl}')`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
            preview.innerHTML = `
                <div style="position:relative;z-index:1;text-shadow:0 2px 15px rgba(0,0,0,0.8);">
                    <h5 style="font-size:1.2rem;font-weight:700;">Banner Preview</h5>
                    <p style="font-size:0.85rem;opacity:0.9;">Image loaded</p>
                </div>
            `;
        } else {
            preview.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            preview.innerHTML = `
                <div style="position:relative;z-index:1;text-shadow:0 2px 15px rgba(0,0,0,0.5);">
                    <i class="fas fa-image" style="font-size:2.5rem;display:block;margin-bottom:6px;"></i>
                    <h5 style="font-size:1.2rem;font-weight:700;">Banner Preview</h5>
                    <p style="font-size:0.85rem;opacity:0.9;">Enter image URL to preview</p>
                </div>
            `;
        }
    }

    document.getElementById('bannerImage').addEventListener('input', function() {
        updatePreview(this.value);
    });

    // ===== SAVE BANNER =====
    document.getElementById('bannerForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const editId = document.getElementById('editBannerId').value;
        const image = document.getElementById('bannerImage').value.trim();

        if (!image) {
            alert('Please enter a banner image URL.');
            return;
        }

        const data = {
            image: image,
            title: 'Banner',
            link: '',
            order: 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection('banners').doc(editId).update(data);
                alert('✅ Banner updated!');
            } else {
                await db.collection('banners').add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('✅ Banner added!');
            }
            document.getElementById('bannerModal').style.display = 'none';
            loadBanners();
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    });

    // ===== MODAL CONTROLS =====
    document.getElementById('addBannerBtn').addEventListener('click', function() {
        openBannerModal(null);
    });

    document.getElementById('bannerModalClose').addEventListener('click', function() {
        document.getElementById('bannerModal').style.display = 'none';
    });

    document.getElementById('bannerModalCancel').addEventListener('click', function() {
        document.getElementById('bannerModal').style.display = 'none';
    });

    document.getElementById('bannerModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // ===== INIT =====
    loadBanners();
});
