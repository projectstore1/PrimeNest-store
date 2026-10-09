// x-checker.js — X Gift Eligibility Checker
(function(){
  'use strict';

  // ============================================================
  //  ⚙️ CONFIG — এখানে আপনার banner image link বসান
  // ============================================================
  const CONFIG = {
    // 🖼️ Banner image URL (hero section-এ background হিসেবে দেখাবে)
    // খালি রাখলে ডিফল্ট নীল gradient দেখাবে
    BANNER_URL: "https://plain-apac-prod-public.komododecks.com/202610/09/fh9ppEP84bJyDVLjyamd/image.png",

    // 🖼️ Fallback avatar (যদি Twitter থেকে photo load না হয়)
    FALLBACK_AVATAR: "" // খালি রাখলে initial letter দেখাবে
  };

  // ============================================================
  //  APPLY BANNER
  // ============================================================
  function applyBanner(){
    const hero = document.getElementById('heroBanner');
    if (!hero) return;

    if (CONFIG.BANNER_URL && CONFIG.BANNER_URL.trim()){
      hero.style.backgroundImage = `url('${CONFIG.BANNER_URL}')`;
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';
    }
  }

  // ============================================================
  //  THEME TOGGLE
  // ============================================================
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function updateThemeIcon(){
    if (!themeToggle) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }

  if (themeToggle){
    updateThemeIcon();
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcon();
    });
  }

  // ============================================================
  //  ELEMENTS
  // ============================================================
  const inputEl  = document.getElementById('username');
  const btnEl    = document.getElementById('checkBtn');
  const resultEl = document.getElementById('result');

  if (!inputEl || !btnEl || !resultEl){
    console.warn('X Checker: elements not found');
    return;
  }

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkGift();
  });

  btnEl.addEventListener('click', checkGift);

  // ============================================================
  //  HELPERS
  // ============================================================
  function cleanHandle(raw){
    if (!raw) return '';
    let s = raw.trim();
    s = s.replace(/^https?:\/\/(www\.)?/i, '');
    s = s.replace(/^(x\.com|twitter\.com)\//i, '');
    s = s.replace(/^@/, '');
    s = s.replace(/\/.*$/, '');
    return s.trim();
  }

  function esc(str){
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 🖼️ Build avatar URL from multiple sources
  function buildAvatarUrl(profile, handle){
    // 1. API থেকে profileImageUrl এলে
    if (profile?.profileImageUrl){
      // Twitter URL গুলো _normal থেকে _400x400 করা ভালো
      return profile.profileImageUrl
        .replace('_normal.', '_400x400.')
        .replace('_bigger.', '_400x400.');
    }
    // 2. API থেকে avatar / profile_image_url এলে
    if (profile?.avatar) return profile.avatar;
    if (profile?.profile_image_url) {
      return profile.profile_image_url.replace('_normal.', '_400x400.');
    }
    // 3. Fallback: unavatar.io service (Twitter avatar pull করে)
    if (handle){
      return `https://unavatar.io/twitter/${encodeURIComponent(handle)}`;
    }
    return '';
  }

  function buildBanner(type, mainText, subText){
    const icon = type === 'eligible'
      ? '<i class="fa-solid fa-check"></i>'
      : type === 'not-eligible'
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-triangle-exclamation"></i>';

    const cls = type === 'eligible' ? 'eligible'
              : type === 'not-eligible' ? 'not-eligible'
              : 'error';

    return `
      <div class="xc-banner ${cls}">
        <div class="xc-banner-icon">${icon}</div>
        <div>
          <div class="xc-banner-main">${esc(mainText)}</div>
          ${subText ? `<div class="xc-banner-sub">${esc(subText)}</div>` : ''}
        </div>
      </div>`;
  }

  function buildInfoTable(rows){
    return `
      <div class="xc-info-table">
        ${rows.map(r => `
          <div class="xc-info-row ${r.highlight ? 'highlight' : ''}">
            <span class="xc-info-label">${esc(r.label)}</span>
            <span class="xc-info-value">${esc(r.value)}</span>
          </div>
        `).join('')}
      </div>`;
  }

  // 🖼️ PROFILE CARD with working avatar
  function buildProfileCard(profile, handle){
    const name = profile?.name || 'Unknown';
    const screenName = profile?.screenName || handle || 'unknown';
    const initial = (name || 'U').charAt(0).toUpperCase();
    const avatarUrl = buildAvatarUrl(profile, handle);

    let avatarHTML;

    if (avatarUrl){
      // Image with multi-level fallback
      avatarHTML = `
        <img
          src="${esc(avatarUrl)}"
          alt="${esc(name)}"
          onerror="
            this.onerror=null;
            this.src='https://unavatar.io/twitter/${esc(handle)}';
          "
          data-fallback="1">
      `;
      // Additional fallback if even unavatar fails
      setTimeout(() => {
        const img = document.querySelector('.xc-avatar img[data-fallback="1"]');
        if (img && (img.naturalWidth === 0 || img.complete === false)){
          img.onerror = function(){
            this.parentNode.textContent = '${esc(initial)}';
          };
        }
      }, 500);
    } else {
      avatarHTML = esc(initial);
    }

    return `
      <div class="xc-profile">
        <div class="xc-avatar">${avatarHTML}</div>
        <div class="xc-profile-info">
          <div class="xc-profile-name">${esc(name)}</div>
          <div class="xc-profile-handle">@${esc(screenName)}</div>
        </div>
      </div>`;
  }

  // ============================================================
  //  MAIN
  // ============================================================
  async function checkGift(){
    const raw = inputEl.value.trim();
    const handle = cleanHandle(raw);

    if (!handle){
      resultEl.innerHTML = buildBanner('error', 'Enter a username', 'Please provide an X username to check.');
      inputEl.focus();
      return;
    }

    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
    resultEl.innerHTML = `
      <div class="xc-loading">
        <div class="xc-spinner"></div>
        Checking eligibility for <strong>@${esc(handle)}</strong>…
      </div>`;

    try {
      const res = await fetch(
        `https://d3al.xyz/api/gift-eligibility?handle=${encodeURIComponent(handle)}`
      );

      let data;
      try { data = await res.json(); }
      catch (e){
        resultEl.innerHTML = buildBanner('error', 'Invalid response', 'Server returned an invalid response.');
        return;
      }

      if (!res.ok || !data.ok){
        resultEl.innerHTML = buildBanner('error',
          data.error || 'API Error',
          'Could not check this account right now.');
        return;
      }

      const check = data.check || {};
      const profile = check.profile || {};
      const isEligible = !!check.giftEligible;

      let html = buildBanner(
        isEligible ? 'eligible' : 'not-eligible',
        isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
        isEligible
          ? 'This account can receive X gifts.'
          : 'This account is not eligible to receive gifts.'
      );

      html += buildProfileCard(profile, handle);

      html += buildInfoTable([
        { label: 'Status',   value: check.status  || '—', highlight: isEligible },
        { label: 'Reason',   value: check.reason  || '—' },
        { label: 'Message',  value: check.message || '—' },
        { label: 'Name',     value: profile.name       || 'Unknown' },
        { label: 'Username', value: '@' + (profile.screenName || handle) },
        { label: 'ID',       value: profile.id         || 'N/A' }
      ]);

      if (isEligible){
        html += `
          <a href="index.html" class="xc-order-btn">
            <i class="fa-solid fa-cart-shopping"></i>
            Order Now
          </a>`;
      }

      resultEl.innerHTML = html;

    } catch (err){
      console.error('Check gift error:', err);
      resultEl.innerHTML = buildBanner('error',
        'Connection Error',
        'Could not reach the eligibility server. Check your internet and try again.');
    } finally {
      btnEl.disabled = false;
      btnEl.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Check Eligibility';
    }
  }

  // ============================================================
  //  INIT
  // ============================================================
  applyBanner();
  window.checkGift = checkGift;
})();
