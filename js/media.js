document.addEventListener('DOMContentLoaded', function() {
    console.log('🖼️ Media loaded');

    // ============================================================
    // ===== LOAD BANNERS =====
    // ============================================================

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
                const hasImage = data.image ? true : false;
                
                html += `
                    <div class="banner-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg-primary);border-radius:12px;margin-bottom:8px;border:1px solid var(--border-color);">
                        <div style="display:flex;align-items:center;gap:16px;flex:1;min-width:0;">
                            <div style="width:60px;height:40px;border-radius:8px;overflow:hidden;flex-shrink:0;background:${data.bgColor || '#667eea'};">
                                ${data.image ? `<img src="${data.image}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : ''}
                                ${!data.image && data.icon ? `<i class="${data.icon}" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:white;font-size:1.2rem;"></i>` : ''}
                            </div>
                            <div style="min-width:0;">
                                <strong style="color:var(--text-primary);">${data.title || 'Untitled'}</strong>
                                <span style="color:var(--text-muted);font-size:0.85rem;margin-left:8px;">${data.subtitle || ''}</span>
                                <span style="background:var(--border-color);padding:2px 10px;border-radius:20px;font-size:0.7rem;margin-left:8px;">Order: ${data.order || 0}</span>
                                ${data.link ? `<span style="background:var(--accent);color:white;padding:2px 10px;border-radius:20px;font-size:0.7rem;margin-left:8px;">🔗 Link</span>` : ''}
                                ${data.image ? `<span style="background:#22c55e;color:white;padding:2px 10px;border-radius:20px;font-size:0.7rem;margin-left:8px;">🖼️ Image</span>` : ''}
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

            // Edit buttons
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', function() {
                    openBannerModal(this.dataset.id);
                });
            });

            // Delete buttons
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

    // ============================================================
    // ===== OPEN BANNER MODAL =====
    // ============================================================

    async function openBannerModal(bannerId = null) {
        const modal = document.getElementById('bannerModal');
        modal.style.display = 'flex';

        if (bannerId) {
            document.getElementById('bannerModalTitle').textContent = 'Edit Banner';
            try {
                const doc = await db.collection('banners').doc(bannerId).get();
                const data = doc.data();
                document.getElementById('editBannerId').value = bannerId;
                document.getElementById('bannerTitle').value = data.title || '';
                document.getElementById('bannerSubtitle').value = data.subtitle || '';
                document.getElementById('bannerImage').value = data.image || '';
                document.getElementById('bannerBg').value = data.bgColor || '';
                document.getElementById('bannerLink').value = data.link || '';
                document.getElementById('bannerIcon').value = data.icon || '';
                document.getElementById('bannerOrder').value = data.order || 0;
                updatePreview();
            } catch (error) {
                alert('Error loading banner: ' + error.message);
            }
        } else {
            document.getElementById('bannerModalTitle').textContent = 'Add Banner';
            document.getElementById('bannerForm').reset();
            document.getElementById('editBannerId').value = '';
            document.getElementById('bannerBg').value = 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
            document.getElementById('bannerOrder').value = 0;
            updatePreview();
        }
    }

    // ============================================================
    // ===== UPDATE PREVIEW =====
    // ============================================================

    function updatePreview() {
        const preview = document.getElementById('bannerPreview');
        const title = document.getElementById('bannerTitle').value || 'Banner Title';
        const subtitle = document.getElementById('bannerSubtitle').value || 'Subtitle';
        const image = document.getElementById('bannerImage').value;
        const bg = document.getElementById('bannerBg').value || 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
        const icon = document.getElementById('bannerIcon').value || '';

        let style = '';
        if (image) {
            style = `background-image: url('${image}'); background-size: cover; background-position: center;`;
        } else {
            style = `background: ${bg};`;
        }

        preview.style.cssText = `
            min-height: 120px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            ${style}
            color: white;
            text-align: center;
            transition: all 0.3s ease;
        `;

        preview.innerHTML = `
            <div style="text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                ${icon ? `<i class="${icon}" style="font-size:2rem;display:block;margin-bottom:8px;"></i>` : ''}
                <strong style="font-size:1.2rem;">${title}</strong>
                <p style="font-size:0.9rem;opacity:0.9;margin-top:4px;">${subtitle}</p>
                ${document.getElementById('bannerLink').value ? `<span style="display:inline-block;margin-top:8px;background:rgba(255,255,255,0.2);padding:4px 16px;border-radius:20px;font-size:0.8rem;">Learn More →</span>` : ''}
            </div>
        `;
    }

    // ============================================================
    // ===== LIVE PREVIEW ON INPUT =====
    // ============================================================

    document.getElementById('bannerTitle').addEventListener('input', updatePreview);
    document.getElementById('bannerSubtitle').addEventListener('input', updatePreview);
    document.getElementById('bannerImage').addEventListener('input', updatePreview);
    document.getElementById('bannerBg').addEventListener('input', updatePreview);
    document.getElementById('bannerIcon').addEventListener('input', updatePreview);
    document.getElementById('bannerLink').addEventListener('input', updatePreview);

    // ============================================================
    // ===== SAVE BANNER =====
    // ============================================================

    document.getElementById('bannerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const editId = document.getElementById('editBannerId').value;
        const title = document.getElementById('bannerTitle').value.trim();
        
        if (!title) {
            alert('Please enter a title.');
            return;
        }

        const data = {
            title: title,
            subtitle: document.getElementById('bannerSubtitle').value.trim(),
            image: document.getElementById('bannerImage').value.trim(),
            bgColor: document.getElementById('bannerBg').value.trim(),
            link: document.getElementById('bannerLink').value.trim(),
            icon: document.getElementById('bannerIcon').value.trim(),
            order: parseInt(document.getElementById('bannerOrder').value) || 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection('banners').doc(editId).update(data);
                alert('✅ Banner updated successfully!');
            } else {
                await db.collection('banners').add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('✅ Banner added successfully!');
            }
            
            document.getElementById('bannerModal').style.display = 'none';
            loadBanners();
        } catch (error) {
            alert('❌ Error saving banner: ' + error.message);
        }
    });

    // ============================================================
    // ===== MODAL CONTROLS =====
    // ============================================================

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

    // ============================================================
    // ===== THEME TOGGLE =====
    // ============================================================

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

    // ============================================================
    // ===== INIT =====
    // ============================================================

    loadBanners();
});
