// x-checker.js — X Gift Eligibility Checker (standalone, no imports)

// ============================================================
//  LOGO CONFIG — আপনার logo link এখানে
// ============================================================
const LOGO_URL = "https://www.image2url.com/r2/default/images/1786765708686-cd1cda4a-5889-437e-9768-20204165b150.jpg";

// ============================================================
//  APPLY LOGO (header)
// ============================================================
function applyLogo(){
  const el = document.getElementById('headerLogo');
  if (!el) return;

  el.innerHTML = 'A'; // default fallback

  if (!LOGO_URL || !LOGO_URL.trim()) return;

  const img = document.createElement('img');
  img.src = LOGO_URL;
  img.alt = 'Logo';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.display = 'block';
  img.style.borderRadius = 'inherit';

  img.onload = () => {
    el.innerHTML = '';
    el.appendChild(img);
    console.log('✅ Logo loaded');
  };

  img.onerror = () => {
    console.warn('❌ Logo failed:', LOGO_URL);
    el.textContent = 'A';
  };
}

// ============================================================
//  INIT
// ============================================================
(function init(){
  applyLogo();

  const inputEl  = document.getElementById('username');
  const btnEl    = document.getElementById('checkBtn');
  const resultEl = document.getElementById('result');

  if (!inputEl || !btnEl || !resultEl){
    console.warn('X Checker: required elements not found.');
    return;
  }

  // Enter key → check
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkGift();
  });

  // Button click → check
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

  function buildBanner(type, mainText, subText){
    const icon = type === 'eligible' ? '✓'
               : type === 'not-eligible' ? '✕'
               : '!';
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
          <div class="xc-info-row ${r.highlight ? 'highlight' : ''} ${r.reason ? 'reason' : ''}">
            <span class="xc-info-label">${esc(r.label)}</span>
            <span class="xc-info-value">${esc(r.value)}</span>
          </div>
        `).join('')}
      </div>`;
  }

  function buildProfileCard(profile, fallbackHandle){
    const name = profile?.name || 'Unknown';
    const screenName = profile?.screenName || fallbackHandle || 'unknown';
    const initial = (name || 'U').charAt(0).toUpperCase();
    const avatar = profile?.profileImageUrl
      ? `<img src="${esc(profile.profileImageUrl)}" alt="avatar"
              onerror="this.parentNode.textContent='${esc(initial)}';">`
      : esc(initial);

    return `
      <div class="xc-profile">
        <div class="xc-avatar">${avatar}</div>
        <div class="xc-profile-info">
          <div class="xc-profile-name">${esc(name)}</div>
          <div class="xc-profile-handle">@${esc(screenName)}</div>
        </div>
      </div>`;
  }

  // ============================================================
  //  MAIN CHECK FUNCTION
  // ============================================================
  async function checkGift(){
    const raw = inputEl.value.trim();
    const handle = cleanHandle(raw);

    if (!handle){
      resultEl.innerHTML = buildBanner('error', 'Enter a username', 'Please provide an X username to check.');
      inputEl.focus();
      return;
    }

    // Loading state
    btnEl.disabled = true;
    btnEl.innerHTML = '⏳ Checking...';
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
      try {
        data = await res.json();
      } catch (parseErr){
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
        { label: 'Reason',   value: check.reason  || '—', reason: !isEligible },
        { label: 'Message',  value: check.message || '—' },
        { label: 'Name',     value: profile.name       || 'Unknown' },
        { label: 'Username', value: '@' + (profile.screenName || handle) },
        { label: 'ID',       value: profile.id         || 'N/A' }
      ]);

      // ✅ Eligible → show "Order Now" button → home page
      if (isEligible){
        html += `
          <a href="index.html" class="xc-order-btn">
            🛒 Order Now
          </a>`;
      }

      resultEl.innerHTML = html;

    } catch (err) {
      console.error('Check gift error:', err);
      resultEl.innerHTML = buildBanner('error',
        'Connection Error',
        'Could not reach the eligibility server. Check your internet and try again.');
    } finally {
      btnEl.disabled = false;
      btnEl.innerHTML = '🔍 Check Eligibility';
    }
  }

  // Expose globally (optional)
  window.checkGift = checkGift;
})();
